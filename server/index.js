const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./database');
const { seed } = require('./seed');
const { startCronWorker } = require('./cron');

const app = express();
const PORT = process.env.PORT || 5050;

// Ensure database and initial data exist
initDatabase();
seed()
  .then(() => startCronWorker())
  .catch(err => {
    console.error('Seed error:', err);
    startCronWorker();
  });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movement', require('./routes/movement'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/outpass', require('./routes/outpass'));
app.use('/api/return-confirm', require('./routes/returnConfirm'));
app.use('/api/mess', require('./routes/mess'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/bus', require('./routes/bus'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/warden', require('./routes/warden'));
app.use('/api/reports', require('./routes/reports'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    hostel: 'Ephesus Hostel, Providence College of Engineering',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build in production if available
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏛️  Ephesus Hostel Management System Server Online`);
  console.log(`📍 Providence College of Engineering, Chengannur`);
  console.log(`🚀 API Server running on: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
