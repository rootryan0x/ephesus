const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden } = require('../middleware/auth');

// GET /api/announcements
router.get('/', authenticate, (req, res) => {
  let announcements;
  if (req.user.role === 'STUDENT' && req.student) {
    const studentYear = req.student.year;
    announcements = db.prepare(`
      SELECT a.*, u.full_name as author_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.target_audience = 'ALL' OR a.target_audience LIKE ?
      ORDER BY
        CASE a.priority
          WHEN 'EMERGENCY' THEN 1
          WHEN 'IMPORTANT' THEN 2
          ELSE 3
        END,
        a.created_at DESC
      LIMIT 20
    `).all(`%${studentYear}%`);
  } else {
    announcements = db.prepare(`
      SELECT a.*, u.full_name as author_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      ORDER BY
        CASE a.priority
          WHEN 'EMERGENCY' THEN 1
          WHEN 'IMPORTANT' THEN 2
          ELSE 3
        END,
        a.created_at DESC
      LIMIT 30
    `).all();
  }

  res.json({ announcements });
});

// POST /api/announcements (Warden creates announcement)
router.post('/', authenticate, requireWarden, (req, res) => {
  const { title, message, priority = 'NORMAL', target_audience = 'ALL' } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message content are required.' });
  }

  const result = db.prepare(`
    INSERT INTO announcements (title, message, priority, target_audience, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, message, priority, target_audience, req.user.id);

  // Audit log for emergency announcements
  if (priority === 'EMERGENCY') {
    db.prepare(`
      INSERT INTO audit_logs (performed_by, action, target_type, target_id, new_data, reason)
      VALUES (?, 'EMERGENCY_BROADCAST', 'ANNOUNCEMENT', ?, ?, 'Emergency notification broadcast')
    `).run(req.user.id, String(result.lastInsertRowid), JSON.stringify({ title, priority }));
  }

  res.json({
    success: true,
    announcementId: result.lastInsertRowid,
    message: 'Announcement published successfully.'
  });
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, requireWarden, (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Announcement deleted.' });
});

module.exports = router;
