const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden, requireStudent } = require('../middleware/auth');

// POST /api/outpass/apply (Student applies)
router.post('/apply', authenticate, requireStudent, (req, res) => {
  const {
    purpose,
    destination,
    date,
    expected_out_time,
    expected_in_time,
    student_contact,
    parent_contact
  } = req.body;

  if (!purpose || !destination || !date || !expected_out_time || !expected_in_time || !parent_contact) {
    return res.status(400).json({ error: 'Please provide purpose, destination, date, out time, return time, and parent contact.' });
  }

  const sContact = student_contact || req.user.phone || '';

  // Check if student already has active outpass
  const existingActive = db.prepare(`
    SELECT * FROM outpasses
    WHERE student_id = ? AND status IN ('WARDEN_PENDING', 'APPROVED', 'ACTIVE')
  `).get(req.student.id);

  if (existingActive) {
    return res.status(400).json({
      error: `You already have an ${existingActive.status.toLowerCase()} outpass. You cannot submit multiple outpasses concurrently.`
    });
  }

  const result = db.prepare(`
    INSERT INTO outpasses (
      student_id, purpose, destination, date,
      expected_out_time, expected_in_time, student_contact, parent_contact,
      parent_confirmation_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'WARDEN_PENDING')
  `).run(
    req.student.id,
    purpose,
    destination,
    date,
    expected_out_time,
    expected_in_time,
    sContact,
    parent_contact
  );

  res.json({
    success: true,
    message: 'Outpass request submitted to Warden. You can scan Outpass OUT once approved.',
    outpassId: result.lastInsertRowid
  });
});

// GET /api/outpass/my
router.get('/my', authenticate, requireStudent, (req, res) => {
  const outpasses = db.prepare(`
    SELECT * FROM outpasses
    WHERE student_id = ?
    ORDER BY created_at DESC
  `).all(req.student.id);

  res.json({ outpasses });
});

// POST /api/outpass/:id/cancel (Student cancels pending or approved outpass before departure)
router.post('/:id/cancel', authenticate, (req, res) => {
  const outpassId = req.params.id;

  const outpass = db.prepare(`
    SELECT o.*, u.full_name
    FROM outpasses o
    JOIN students s ON o.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE o.id = ?
  `).get(outpassId);

  if (!outpass) {
    return res.status(404).json({ error: 'Outpass not found.' });
  }

  // Security: only student owner or warden
  if (req.user.role === 'STUDENT') {
    if (!req.student || req.student.id !== outpass.student_id) {
      return res.status(403).json({ error: 'Unauthorized to cancel this outpass.' });
    }
  } else if (req.user.role !== 'WARDEN') {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  // Cancellation allowed before physical departure (WARDEN_PENDING, SUBMITTED, APPROVED)
  if (!['SUBMITTED', 'WARDEN_PENDING', 'APPROVED'].includes(outpass.status)) {
    return res.status(400).json({
      error: `Cannot cancel outpass with status "${outpass.status}". Only pending or approved outpasses prior to departure can be cancelled.`
    });
  }

  const cancelTx = db.transaction(() => {
    db.prepare(`
      UPDATE outpasses
      SET status = 'CANCELLED'
      WHERE id = ?
    `).run(outpassId);

    db.prepare(`
      INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
      VALUES (?, 'OUTPASS_CANCELLED', 'OUTPASS', ?, ?, ?, ?)
    `).run(
      req.user.id,
      String(outpassId),
      JSON.stringify({ previous_status: outpass.status }),
      JSON.stringify({ new_status: 'CANCELLED' }),
      `${req.user.full_name} (${req.user.role}) cancelled outpass #${outpassId} (previous status: ${outpass.status})`
    );
  });

  cancelTx();

  res.json({
    success: true,
    message: 'Outpass application cancelled successfully.'
  });
});

// GET /api/outpass/all (Warden)
router.get('/all', authenticate, requireWarden, (req, res) => {
  const { status, search } = req.query;

  let query = `
    SELECT o.*, s.room_number, s.department, s.year, s.current_status,
           u.full_name, u.email, u.phone
    FROM outpasses o
    JOIN students s ON o.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND o.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (u.full_name LIKE ? OR s.room_number LIKE ? OR o.destination LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY o.created_at DESC`;

  const outpasses = db.prepare(query).all(...params);
  res.json({ outpasses });
});

// POST /api/outpass/:id/action (Warden APPROVE / REJECT)
router.post('/:id/action', authenticate, requireWarden, (req, res) => {
  const { action, remarks } = req.body;
  const outpassId = req.params.id;

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVE or REJECT.' });
  }

  const outpass = db.prepare(`
    SELECT o.*, u.full_name
    FROM outpasses o
    JOIN students s ON o.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE o.id = ?
  `).get(outpassId);

  if (!outpass) {
    return res.status(404).json({ error: 'Outpass not found.' });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  db.prepare(`
    UPDATE outpasses
    SET status = ?, warden_remarks = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newStatus, remarks || null, req.user.id, outpassId);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
    VALUES (?, ?, 'OUTPASS', ?, ?, ?, ?)
  `).run(
    req.user.id,
    action === 'APPROVE' ? 'OUTPASS_APPROVED' : 'OUTPASS_REJECTED',
    String(outpassId),
    JSON.stringify({ previous_status: outpass.status }),
    JSON.stringify({ new_status: newStatus, remarks }),
    `Warden ${req.user.full_name} ${action.toLowerCase()}d outpass for ${outpass.full_name}`
  );

  res.json({
    success: true,
    message: `Outpass application ${newStatus.toLowerCase()} successfully.`
  });
});

module.exports = router;
