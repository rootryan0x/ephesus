const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden } = require('../middleware/auth');

// GET /api/reports/summary (Daily, weekly, monthly aggregated hostel reports)
router.get('/summary', authenticate, requireWarden, (req, res) => {
  const { period = 'daily' } = req.query;

  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;

  // Movement counts by type
  const movementsByType = db.prepare(`
    SELECT movement_type, COUNT(*) as count
    FROM movement_records
    GROUP BY movement_type
  `).all();

  // Leaves summary
  const leavesSummary = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM leave_applications
    GROUP BY status
  `).all();

  // Outpasses summary
  const outpassesSummary = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM outpasses
    GROUP BY status
  `).all();

  // Food waste stats
  const foodWasteStats = db.prepare(`
    SELECT COUNT(*) as days,
           AVG(waste_kg) as avg_kg,
           SUM(waste_kg) as total_kg,
           MAX(waste_kg) as max_kg,
           MIN(waste_kg) as min_kg
    FROM daily_food_waste
  `).get();

  // Complaints stats
  const complaintsStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM complaints
    GROUP BY status
  `).all();

  // Category breakdown for complaints
  const complaintsByCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM complaints
    GROUP BY category
    ORDER BY count DESC
  `).all();

  res.json({
    period,
    totalStudents,
    movementsByType,
    leavesSummary,
    outpassesSummary,
    foodWasteStats: {
      days: foodWasteStats.days || 0,
      avgWasteKg: foodWasteStats.avg_kg ? parseFloat(foodWasteStats.avg_kg.toFixed(1)) : 0,
      totalWasteKg: foodWasteStats.total_kg ? parseFloat(foodWasteStats.total_kg.toFixed(1)) : 0,
      maxWasteKg: foodWasteStats.max_kg || 0,
      minWasteKg: foodWasteStats.min_kg || 0
    },
    complaintsStats,
    complaintsByCategory
  });
});

// GET /api/reports/export-csv (Generates downloadable CSV for movements, students, leave)
router.get('/export-csv', authenticate, requireWarden, (req, res) => {
  const { type = 'students' } = req.query;

  let csvContent = '';
  let filename = `ephesus_${type}_report.csv`;

  if (type === 'students') {
    const students = db.prepare(`
      SELECT s.admission_id, u.full_name, s.room_number, s.department, s.year,
             s.current_status, u.email, u.phone, s.parent_name, s.parent_phone
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.room_number ASC
    `).all();

    csvContent = 'Admission ID,Full Name,Room,Department,Year,Status,Email,Phone,Parent Name,Parent Phone\n';
    students.forEach(s => {
      csvContent += `"${s.admission_id}","${s.full_name}","${s.room_number}","${s.department}","${s.year}","${s.current_status}","${s.email}","${s.phone}","${s.parent_name}","${s.parent_phone}"\n`;
    });
  } else if (type === 'movements') {
    const records = db.prepare(`
      SELECT mr.id, mr.timestamp, mr.movement_type, mr.direction, mr.source,
             s.admission_id, s.room_number, u.full_name
      FROM movement_records mr
      JOIN students s ON mr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY mr.timestamp DESC
      LIMIT 500
    `).all();

    csvContent = 'Record ID,Timestamp,Movement Type,Direction,Source,Admission ID,Room,Student Name\n';
    records.forEach(r => {
      csvContent += `"${r.id}","${r.timestamp}","${r.movement_type}","${r.direction}","${r.source}","${r.admission_id}","${r.room_number}","${r.full_name}"\n`;
    });
  } else if (type === 'leaves') {
    const leaves = db.prepare(`
      SELECT l.id, u.full_name, s.room_number, l.leave_type, l.purpose,
             l.leave_start_date, l.expected_return_date, l.route_type, l.status, l.created_at
      FROM leave_applications l
      JOIN students s ON l.student_id = s.id
      JOIN users u ON s.user_id = u.id
      ORDER BY l.created_at DESC
    `).all();

    csvContent = 'Leave ID,Student Name,Room,Type,Purpose,Start Date,Expected Return,Route,Status,Applied At\n';
    leaves.forEach(l => {
      csvContent += `"${l.id}","${l.full_name}","${l.room_number}","${l.leave_type}","${l.purpose.replace(/"/g, '""')}","${l.leave_start_date}","${l.expected_return_date}","${l.route_type}","${l.status}","${l.created_at}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

module.exports = router;
