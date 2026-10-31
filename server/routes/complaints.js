const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { authenticate, requireWarden, requireStudent } = require('../middleware/auth');

// Setup upload directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `complaint_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed.'));
    }
  }
});

// POST /api/complaints (Student submits complaint)
router.post('/', authenticate, requireStudent, upload.single('photo'), (req, res) => {
  const { category, description, room_number } = req.body;
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.photo_base64 || null;

  const validCategories = [
    'Electrical', 'Wi-Fi', 'Plumbing', 'Water',
    'Cleaning', 'Room', 'Furniture', 'Mess/Food', 'Bathroom', 'Other'
  ];

  if (!category || !description) {
    return res.status(400).json({ error: 'Category and description are required.' });
  }

  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid complaint category.' });
  }

  const room = room_number || req.student.room_number;

  const result = db.prepare(`
    INSERT INTO complaints (student_id, room_number, category, description, photo_url, status)
    VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
  `).run(req.student.id, room, category, description, photoUrl);

  res.json({
    success: true,
    complaintId: result.lastInsertRowid,
    message: 'Complaint registered successfully. Maintenance staff will review shortly.'
  });
});

// GET /api/complaints/my (Student views their complaints)
router.get('/my', authenticate, requireStudent, (req, res) => {
  const complaints = db.prepare(`
    SELECT * FROM complaints
    WHERE student_id = ?
    ORDER BY created_at DESC
  `).all(req.student.id);

  res.json({ complaints });
});

// GET /api/complaints/all (Warden manages all complaints)
router.get('/all', authenticate, requireWarden, (req, res) => {
  const { status, category, room } = req.query;

  let query = `
    SELECT c.*, s.room_number as student_room, s.department, s.year,
           u.full_name as student_name, u.phone as student_phone
    FROM complaints c
    JOIN students s ON c.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ` AND c.status = ?`;
    params.push(status);
  }

  if (category && category !== 'ALL') {
    query += ` AND c.category = ?`;
    params.push(category);
  }

  if (room) {
    query += ` AND (c.room_number = ? OR s.room_number = ?)`;
    params.push(room, room);
  }

  query += ` ORDER BY c.created_at DESC`;

  const complaints = db.prepare(query).all(...params);
  res.json({ complaints });
});

// PUT /api/complaints/:id/status (Warden updates status and resolution notes)
router.put('/:id/status', authenticate, requireWarden, (req, res) => {
  const { status, admin_notes } = req.body;
  const complaintId = req.params.id;

  const validStatuses = ['SUBMITTED', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid complaint status.' });
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const resolvedAt = (status === 'RESOLVED' || status === 'CLOSED') ? new Date().toISOString() : null;

  db.prepare(`
    UPDATE complaints
    SET status = ?, admin_notes = COALESCE(?, admin_notes), resolved_at = COALESCE(?, resolved_at)
    WHERE id = ?
  `).run(status, admin_notes, resolvedAt, complaintId);

  res.json({ success: true, message: `Complaint status updated to ${status}.` });
});

module.exports = router;
