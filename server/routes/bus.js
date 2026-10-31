const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireWarden } = require('../middleware/auth');

// GET /api/bus
router.get('/', authenticate, (req, res) => {
  const schedules = db.prepare('SELECT * FROM bus_schedules ORDER BY route ASC, departure_time ASC').all();
  res.json({ schedules });
});

// POST /api/bus (Warden adds bus timing)
router.post('/', authenticate, requireWarden, (req, res) => {
  const { route, departure_time, bus_number, status = 'ON_TIME', notes } = req.body;

  if (!route || !departure_time || !bus_number) {
    return res.status(400).json({ error: 'Route, departure time, and bus number are required.' });
  }

  const result = db.prepare(`
    INSERT INTO bus_schedules (route, departure_time, bus_number, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(route, departure_time, bus_number, status, notes || null);

  res.json({ success: true, scheduleId: result.lastInsertRowid });
});

// PUT /api/bus/:id (Warden updates status/timing)
router.put('/:id', authenticate, requireWarden, (req, res) => {
  const { id } = req.params;
  const { departure_time, status, notes } = req.body;

  const bus = db.prepare('SELECT * FROM bus_schedules WHERE id = ?').get(id);
  if (!bus) {
    return res.status(404).json({ error: 'Bus schedule not found.' });
  }

  db.prepare(`
    UPDATE bus_schedules
    SET departure_time = COALESCE(?, departure_time),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(departure_time, status, notes, id);

  res.json({ success: true, message: 'Bus schedule updated.' });
});

// DELETE /api/bus/:id (Warden removes bus schedule)
router.delete('/:id', authenticate, requireWarden, (req, res) => {
  db.prepare('DELETE FROM bus_schedules WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Bus schedule removed.' });
});

module.exports = router;
