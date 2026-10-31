const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden, requireStudent } = require('../middleware/auth');

// GET /api/return-confirm/pending (Checks if current student has an active return confirmation)
router.get('/pending', authenticate, requireStudent, (req, res) => {
  const pending = db.prepare(`
    SELECT rc.*, l.leave_type, l.leave_start_date, l.purpose, l.route_type
    FROM return_confirmations rc
    JOIN leave_applications l ON rc.leave_id = l.id
    WHERE rc.student_id = ? AND rc.status = 'PENDING'
    ORDER BY rc.deadline_time ASC
    LIMIT 1
  `).get(req.student.id);

  res.json({ pendingNotification: pending || null });
});

// POST /api/return-confirm/submit (Student confirms returning or requests extension)
router.post('/submit', authenticate, requireStudent, (req, res) => {
  const { confirmation_id, intention, new_return_date, extension_reason } = req.body;

  if (!confirmation_id || !intention) {
    return res.status(400).json({ error: 'Confirmation ID and intention are required.' });
  }

  const record = db.prepare(`
    SELECT rc.*, l.expected_return_date as original_date
    FROM return_confirmations rc
    JOIN leave_applications l ON rc.leave_id = l.id
    WHERE rc.id = ? AND rc.student_id = ?
  `).get(confirmation_id, req.student.id);

  if (!record) {
    return res.status(404).json({ error: 'Return confirmation record not found.' });
  }

  if (intention === 'CONFIRMED_RETURNING') {
    db.prepare(`
      UPDATE return_confirmations
      SET confirmed_intention = 'CONFIRMED_RETURNING', status = 'CONFIRMED', submitted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(confirmation_id);

    return res.json({
      success: true,
      message: 'Return intention confirmed! The mess manager has logged your presence for tomorrow.'
    });
  } else if (intention === 'EXTENDING_LEAVE') {
    if (!new_return_date || !extension_reason) {
      return res.status(400).json({ error: 'Please specify the new return date and valid reason for leave extension.' });
    }

    const extendTx = db.transaction(() => {
      // 1. Update return_confirmations
      db.prepare(`
        UPDATE return_confirmations
        SET confirmed_intention = 'EXTENDING_LEAVE',
            new_return_date = ?,
            extension_reason = ?,
            status = 'EXTENDED',
            submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(new_return_date, extension_reason, confirmation_id);

      // 2. Insert into leave_extensions audit table
      db.prepare(`
        INSERT INTO leave_extensions (
          leave_id, student_id, original_return_date, requested_return_date, reason, status
        ) VALUES (?, ?, ?, ?, ?, 'APPROVED')
      `).run(
        record.leave_id,
        req.student.id,
        record.scheduled_return_date,
        new_return_date,
        extension_reason
      );

      // 3. Update the leave application's expected return date
      db.prepare(`
        UPDATE leave_applications
        SET expected_return_date = ?
        WHERE id = ?
      `).run(new_return_date, record.leave_id);

      // 4. Create audit log
      db.prepare(`
        INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
        VALUES (?, 'LEAVE_EXTENSION_SUBMITTED', 'LEAVE_APPLICATION', ?, ?, ?, ?)
      `).run(
        req.user.id,
        String(record.leave_id),
        JSON.stringify({ original_return_date: record.scheduled_return_date }),
        JSON.stringify({ new_return_date }),
        `Student requested leave extension: ${extension_reason}`
      );
    });

    extendTx();

    return res.json({
      success: true,
      message: `Leave extended to ${new_return_date}. Expected population and mess counts updated.`
    });
  } else {
    return res.status(400).json({ error: 'Invalid intention.' });
  }
});

// GET /api/return-confirm/warden-overview (Warden tracking return confirmations)
router.get('/warden-overview', authenticate, requireWarden, (req, res) => {
  const records = db.prepare(`
    SELECT rc.*,
           l.leave_type, l.leave_start_date, l.actual_out_time, l.actual_in_time,
           s.room_number, s.department, s.year, s.current_status,
           u.full_name, u.email, u.phone
    FROM return_confirmations rc
    JOIN leave_applications l ON rc.leave_id = l.id
    JOIN students s ON rc.student_id = s.id
    JOIN users u ON s.user_id = u.id
    ORDER BY rc.scheduled_return_date ASC, rc.status ASC
  `).all();

  const summary = {
    totalPending: records.filter(r => r.status === 'PENDING').length,
    totalConfirmed: records.filter(r => r.status === 'CONFIRMED').length,
    totalExtended: records.filter(r => r.status === 'EXTENDED').length
  };

  res.json({ records, summary });
});

module.exports = router;
