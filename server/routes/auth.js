const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid college email or credentials.' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'This user account has been deactivated. Please contact the hostel office.' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid college email or credentials.' });
  }

  let studentProfile = null;
  if (user.role === 'STUDENT') {
    studentProfile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      phone: user.phone
    },
    student: studentProfile
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  let studentProfile = null;
  if (req.user.role === 'STUDENT') {
    studentProfile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(req.user.id);
  }

  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.full_name,
      phone: req.user.phone
    },
    student: studentProfile
  });
});

// GET /api/auth/demo-users (for easy demonstration and evaluation without typing passwords)
router.get('/demo-users', (req, res) => {
  const staff = db.prepare(`
    SELECT id, email, role, full_name, phone FROM users
    WHERE role IN ('WARDEN', 'IN_CHARGE')
    ORDER BY role DESC
  `).all();

  const students = db.prepare(`
    SELECT u.id as user_id, u.email, u.role, u.full_name, s.id as student_id,
           s.room_number, s.department, s.year, s.current_status
    FROM users u
    JOIN students s ON u.id = s.user_id
    WHERE u.email IN ('rahul.k@providence.edu.in', 'cyril.b@providence.edu.in', 'tony.a@providence.edu.in', 'jeffin.j@providence.edu.in')
    ORDER BY s.room_number ASC
  `).all();

  res.json({
    staff,
    students,
    defaultPassword: 'ephesus123'
  });
});

module.exports = router;
