const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden } = require('../middleware/auth');

// GET /api/mess/dashboard (Calculates population and meal estimates without double counting)
router.get('/dashboard', authenticate, (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;

  // Current statuses
  const inHostelCount = db.prepare(`SELECT COUNT(*) as count FROM students WHERE current_status = 'IN_HOSTEL'`).get().count;
  const atCollegeCount = db.prepare(`SELECT COUNT(*) as count FROM students WHERE current_status = 'AT_COLLEGE'`).get().count;
  const onLeaveCount = db.prepare(`SELECT COUNT(*) as count FROM students WHERE current_status = 'ON_WEEKEND_LEAVE'`).get().count;
  const onOutpassCount = db.prepare(`SELECT COUNT(*) as count FROM students WHERE current_status = 'ON_OUTPASS'`).get().count;

  // Active leaves and return intentions
  const leaves = db.prepare(`
    SELECT l.id, l.student_id, l.expected_return_date, l.status,
           rc.confirmed_intention, rc.new_return_date, rc.status as rc_status
    FROM leave_applications l
    LEFT JOIN return_confirmations rc ON l.id = rc.leave_id
    WHERE l.status IN ('APPROVED', 'ACTIVE')
  `).all();

  // Tomorrow calculation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let confirmedReturningTomorrow = 0;
  let returnPendingTomorrow = 0;
  let continuingLeaveTomorrow = 0;

  leaves.forEach(l => {
    const effectiveReturnDate = l.new_return_date || l.expected_return_date;
    if (effectiveReturnDate === tomorrowStr) {
      if (l.rc_status === 'CONFIRMED' || l.confirmed_intention === 'CONFIRMED_RETURNING') {
        confirmedReturningTomorrow++;
      } else {
        returnPendingTomorrow++;
      }
    } else {
      continuingLeaveTomorrow++;
    }
  });

  // Base students currently in hostel or at college (they will sleep in hostel tonight)
  const currentlyPresent = inHostelCount + atCollegeCount + onOutpassCount; // outpasses return same day
  const tomorrowExpectedTotal = currentlyPresent + confirmedReturningTomorrow;

  // Meal estimations
  const mealEstimates = {
    breakfast: {
      timing: '07:30 AM - 09:00 AM',
      headcount: inHostelCount,
      menu: 'Kerala Idli, Sambar, Coconut Chutney & Tea/Coffee'
    },
    lunch: {
      timing: '12:30 PM - 02:00 PM',
      // On college days, students at college either eat college mess or pack lunch
      headcount: Math.round(inHostelCount * 0.95),
      menu: 'Kerala Rice, Moru Curry, Aviyal, Thoran & Curd'
    },
    snacks: {
      timing: '04:30 PM - 05:30 PM',
      headcount: inHostelCount + atCollegeCount,
      menu: 'Pazham Pori (Banana Fritters) / Sukhiyan & Hot Tea'
    },
    dinner: {
      timing: '07:30 PM - 09:00 PM',
      headcount: inHostelCount + atCollegeCount + onOutpassCount,
      menu: 'Malabar Chappathi, Veg Kurma / Egg Roast & Hot Milk'
    }
  };

  // Yesterday's food waste
  const yesterdayRecord = db.prepare(`
    SELECT * FROM daily_food_waste
    ORDER BY date DESC LIMIT 1
  `).get();

  res.json({
    totalStudents,
    currentBreakdown: {
      inHostel: inHostelCount,
      atCollege: atCollegeCount,
      onLeave: onLeaveCount,
      onOutpass: onOutpassCount
    },
    tomorrowForecast: {
      date: tomorrowStr,
      expectedPopulation: tomorrowExpectedTotal,
      confirmedReturning: confirmedReturningTomorrow,
      returnConfirmationPending: returnPendingTomorrow,
      continuingLeave: continuingLeaveTomorrow
    },
    mealEstimates,
    yesterdayFoodWaste: yesterdayRecord ? yesterdayRecord.waste_kg : 8.4
  });
});

// GET /api/mess/food-waste (Food waste history and trend data)
router.get('/food-waste', authenticate, (req, res) => {
  const records = db.prepare(`
    SELECT * FROM daily_food_waste
    ORDER BY date DESC LIMIT 30
  `).all();

  const totalWaste = records.reduce((acc, r) => acc + r.waste_kg, 0);
  const averageWaste = records.length > 0 ? (totalWaste / records.length).toFixed(1) : 0;
  const yesterday = records[0] ? records[0].waste_kg : 0;

  res.json({
    records,
    stats: {
      averageWasteKg: parseFloat(averageWaste),
      yesterdayWasteKg: yesterday,
      totalLoggedDays: records.length
    }
  });
});

// POST /api/mess/food-waste (Warden logs daily food waste)
router.post('/food-waste', authenticate, requireWarden, (req, res) => {
  const { date, waste_kg, breakfast_kg, lunch_kg, dinner_kg, notes } = req.body;

  if (!date || waste_kg === undefined) {
    return res.status(400).json({ error: 'Date and waste weight in kg are required.' });
  }

  const existing = db.prepare('SELECT id FROM daily_food_waste WHERE date = ?').get(date);

  if (existing) {
    db.prepare(`
      UPDATE daily_food_waste
      SET waste_kg = ?, breakfast_kg = ?, lunch_kg = ?, dinner_kg = ?, notes = ?, logged_by = ?
      WHERE date = ?
    `).run(waste_kg, breakfast_kg || null, lunch_kg || null, dinner_kg || null, notes || null, req.user.id, date);
  } else {
    db.prepare(`
      INSERT INTO daily_food_waste (date, waste_kg, breakfast_kg, lunch_kg, dinner_kg, notes, logged_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(date, waste_kg, breakfast_kg || null, lunch_kg || null, dinner_kg || null, notes || null, req.user.id);
  }

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (performed_by, action, target_type, target_id, new_data, reason)
    VALUES (?, 'FOOD_WASTE_LOGGED', 'MESS', ?, ?, 'Daily food waste update')
  `).run(req.user.id, date, JSON.stringify({ date, waste_kg, notes }));

  res.json({ success: true, message: 'Daily food waste recorded successfully.' });
});

module.exports = router;
