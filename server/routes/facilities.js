const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden } = require('../middleware/auth');

// GET /api/facilities
router.get('/', authenticate, (req, res) => {
  const facilities = db.prepare('SELECT * FROM facilities ORDER BY name ASC').all();
  res.json({ facilities });
});

// PUT /api/facilities/:key (Warden updates status)
router.put('/:key', authenticate, requireWarden, (req, res) => {
  const { key } = req.params;
  const { status, status_level, description } = req.body;

  const validLevels = ['NORMAL', 'WARNING', 'CRITICAL'];
  if (!status || !validLevels.includes(status_level)) {
    return res.status(400).json({ error: 'Status and valid status level (NORMAL, WARNING, CRITICAL) are required.' });
  }

  const facility = db.prepare('SELECT * FROM facilities WHERE key = ?').get(key);
  if (!facility) {
    return res.status(404).json({ error: 'Facility not found.' });
  }

  db.prepare(`
    UPDATE facilities
    SET status = ?, status_level = ?, description = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE key = ?
  `).run(status, status_level, description || facility.description, req.user.id, key);

  db.prepare(`
    INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
    VALUES (?, 'FACILITY_STATUS_CHANGE', 'FACILITY', ?, ?, ?, ?)
  `).run(
    req.user.id,
    key,
    JSON.stringify({ status: facility.status, status_level: facility.status_level }),
    JSON.stringify({ status, status_level }),
    `Facility ${facility.name} status updated to ${status}`
  );

  res.json({ success: true, message: `${facility.name} status updated.` });
});

module.exports = router;
