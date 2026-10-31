const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden, requireStudent } = require('../middleware/auth');

// POST /api/leave/apply (Student applies for leave)
router.post('/apply', authenticate, requireStudent, (req, res) => {
  const {
    leave_type = 'WEEKEND',
    purpose,
    leave_start_date,
    expected_return_date,
    departure_route = 'Hostel → Home directly',
    return_route = 'Home → Hostel directly',
    route_type,
    student_contact,
    parent_contact
  } = req.body;

  if (!purpose || !leave_start_date || !expected_return_date || !parent_contact) {
    return res.status(400).json({ error: 'Please provide purpose, start date, expected return date, and parent contact.' });
  }

  const sContact = student_contact || req.user.phone || '';
  let effectiveRouteType = 'HOSTEL_HOME';
  if (departure_route && departure_route.includes('College')) {
    effectiveRouteType = 'HOSTEL_COLLEGE_HOME';
  } else if (return_route && return_route.includes('Bus')) {
    effectiveRouteType = 'HOME_COLLEGE_HOSTEL_BUS';
  } else if (return_route && return_route.includes('Hostel directly')) {
    effectiveRouteType = 'HOME_HOSTEL_DIRECT';
  }

  // Check if student already has an active or pending leave
  const existing = db.prepare(`
    SELECT * FROM leave_applications
    WHERE student_id = ? AND status IN ('SUBMITTED', 'WARDEN_PENDING', 'APPROVED', 'ACTIVE')
  `).get(req.student.id);

  if (existing) {
    return res.status(400).json({
      error: 'You already have an active or pending leave application. Please check your existing leave status.'
    });
  }

  // Calculate return confirmation deadline: default to Sunday 1:00 PM before expected return or 24h prior
  const returnDate = new Date(expected_return_date);
  const deadline = new Date(returnDate);
  // Default deadline: day before return date at 13:00 (1:00 PM)
  deadline.setDate(returnDate.getDate() - 1);
  deadline.setHours(13, 0, 0, 0);

  const applyTx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO leave_applications (
        student_id, leave_type, purpose, leave_start_date, expected_return_date,
        route_type, departure_route, return_route, student_contact, parent_contact,
        parent_confirmation_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'WARDEN_PENDING')
    `).run(
      req.student.id,
      leave_type,
      purpose,
      leave_start_date,
      expected_return_date,
      effectiveRouteType,
      departure_route,
      return_route,
      sContact,
      parent_contact
    );

    const leaveId = result.lastInsertRowid;

    // Create corresponding return confirmation entry
    db.prepare(`
      INSERT INTO return_confirmations (
        leave_id, student_id, scheduled_return_date, status, deadline_time
      ) VALUES (?, ?, ?, 'PENDING', ?)
    `).run(
      leaveId,
      req.student.id,
      expected_return_date,
      deadline.toISOString()
    );

    return leaveId;
  });

  const leaveId = applyTx();

  res.json({
    success: true,
    message: 'Weekend leave application submitted successfully. Awaiting Warden approval.',
    leaveId
  });
});

// GET /api/leave/my (Student's own leaves)
router.get('/my', authenticate, requireStudent, (req, res) => {
  const leaves = db.prepare(`
    SELECT l.*, rc.status as return_confirm_status, rc.confirmed_intention, rc.new_return_date
    FROM leave_applications l
    LEFT JOIN return_confirmations rc ON l.id = rc.leave_id
    WHERE l.student_id = ?
    ORDER BY l.created_at DESC
  `).all(req.student.id);

  res.json({ leaves });
});

// POST /api/leave/:id/cancel (Student cancels pending or approved leave before departure)
router.post('/:id/cancel', authenticate, (req, res) => {
  const leaveId = req.params.id;

  const leave = db.prepare(`
    SELECT l.*, u.full_name
    FROM leave_applications l
    JOIN students s ON l.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE l.id = ?
  `).get(leaveId);

  if (!leave) {
    return res.status(404).json({ error: 'Leave application not found.' });
  }

  // Security: only student owner or warden
  if (req.user.role === 'STUDENT') {
    if (!req.student || req.student.id !== leave.student_id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this leave application.' });
    }
  } else if (req.user.role !== 'WARDEN') {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  // Cancellation allowed before physical departure (WARDEN_PENDING, SUBMITTED, APPROVED)
  if (!['SUBMITTED', 'WARDEN_PENDING', 'APPROVED'].includes(leave.status)) {
    return res.status(400).json({
      error: `Cannot cancel leave application with status "${leave.status}". Only pending or approved leaves prior to departure can be cancelled.`
    });
  }

  const cancelTx = db.transaction(() => {
    // 1. Update leave application status to CANCELLED
    db.prepare(`
      UPDATE leave_applications
      SET status = 'CANCELLED'
      WHERE id = ?
    `).run(leaveId);

    // 2. Mark any linked return confirmations as CANCELLED so mess count & prompts clear immediately
    db.prepare(`
      UPDATE return_confirmations
      SET status = 'CANCELLED'
      WHERE leave_id = ?
    `).run(leaveId);

    // 3. Log into audit trail
    db.prepare(`
      INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
      VALUES (?, 'LEAVE_CANCELLED', 'LEAVE_APPLICATION', ?, ?, ?, ?)
    `).run(
      req.user.id,
      String(leaveId),
      JSON.stringify({ previous_status: leave.status }),
      JSON.stringify({ new_status: 'CANCELLED' }),
      `${req.user.full_name} (${req.user.role}) cancelled leave application #${leaveId} (previous status: ${leave.status})`
    );
  });

  cancelTx();

  res.json({
    success: true,
    message: 'Leave application cancelled successfully. Hostel and mess records have been updated.'
  });
});

// GET /api/leave/all (Warden manages all leaves)
router.get('/all', authenticate, requireWarden, (req, res) => {
  const { status, year, search } = req.query;

  let query = `
    SELECT l.*, s.room_number, s.department, s.year, s.current_status,
           u.full_name, u.email, u.phone,
           rc.status as return_confirm_status, rc.confirmed_intention, rc.new_return_date
    FROM leave_applications l
    JOIN students s ON l.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN return_confirmations rc ON l.id = rc.leave_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND l.status = ?`;
    params.push(status);
  }

  if (year && year !== 'ALL') {
    query += ` AND s.year = ?`;
    params.push(year);
  }

  if (search) {
    query += ` AND (u.full_name LIKE ? OR s.room_number LIKE ? OR s.admission_id LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY l.created_at DESC`;

  const leaves = db.prepare(query).all(...params);
  res.json({ leaves });
});

// POST /api/leave/:id/action (Warden approves or rejects)
router.post('/:id/action', authenticate, requireWarden, (req, res) => {
  const { action, remarks } = req.body;
  const leaveId = req.params.id;

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVE or REJECT.' });
  }

  const leave = db.prepare(`
    SELECT l.*, u.full_name, s.user_id
    FROM leave_applications l
    JOIN students s ON l.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE l.id = ?
  `).get(leaveId);

  if (!leave) {
    return res.status(404).json({ error: 'Leave application not found.' });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  db.prepare(`
    UPDATE leave_applications
    SET status = ?, warden_remarks = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, remarks || null, req.user.id, leaveId);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
    VALUES (?, ?, 'LEAVE_APPLICATION', ?, ?, ?, ?)
  `).run(
    req.user.id,
    action === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    String(leaveId),
    JSON.stringify({ previous_status: leave.status }),
    JSON.stringify({ new_status: newStatus, remarks }),
    `Warden ${req.user.full_name} ${action.toLowerCase()}d leave application for ${leave.full_name}`
  );

  res.json({
    success: true,
    message: `Leave application ${newStatus.toLowerCase()} successfully.`
  });
});

module.exports = router;
