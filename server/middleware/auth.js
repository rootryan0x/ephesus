const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'ephesus-hostel-pce-secure-secret-key-2026';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, full_name, phone, status FROM users WHERE id = ?').get(decoded.id);

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is inactive or not found.' });
    }

    req.user = user;

    if (user.role === 'STUDENT') {
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
      req.student = student;
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

function requireWarden(req, res, next) {
  if (!req.user || !['WARDEN', 'ASSISTANT_WARDEN', 'IN_CHARGE', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: Warden or administrator privileges required.' });
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.user || req.user.role !== 'STUDENT' || !req.student) {
    return res.status(403).json({ error: 'Access denied: Student access only.' });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  authenticate,
  requireWarden,
  requireStudent
};
