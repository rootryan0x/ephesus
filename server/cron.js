/**
 * Automated Curfew & Overdue Audit Cron Worker for Ephesus Hostel
 * 
 * Periodically audits active student movements against approved return times
 * and automatically flags students exceeding curfew as OVERDUE.
 */

const { db } = require('./database');

/**
 * Runs a comprehensive curfew audit across all outpass and leave movements.
 * Returns an audit summary report.
 */
function runCurfewAudit() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`; // HH:mm in local time

  let newlyOverdueCount = 0;
  const overdueRecords = [];

  const auditTx = db.transaction(() => {
    // 1. Audit Outpasses for students currently ON_OUTPASS
    const outpassStudents = db.prepare(`
      SELECT s.id as student_id, s.admission_id, s.room_number, s.current_status,
             u.full_name, u.phone as student_phone, s.parent_phone,
             o.id as outpass_id, o.date, o.expected_in_time, o.destination, o.purpose
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN outpasses o ON o.student_id = s.id
      WHERE s.current_status = 'ON_OUTPASS'
        AND o.status IN ('ACTIVE', 'APPROVED')
    `).all();

    for (const record of outpassStudents) {
      // Check if outpass date is earlier than today, OR today and time has passed
      const isPastDate = record.date < currentDateStr;
      const isTodayAndPastTime = (record.date === currentDateStr && currentTimeStr > record.expected_in_time);

      if (isPastDate || isTodayAndPastTime) {
        // Mark student as OVERDUE
        db.prepare(`
          UPDATE students SET current_status = 'OVERDUE' WHERE id = ?
        `).run(record.student_id);

        // Update outpass status
        db.prepare(`
          UPDATE outpasses SET status = 'OVERDUE' WHERE id = ?
        `).run(record.outpass_id);

        // Record in audit log
        db.prepare(`
          INSERT INTO audit_logs (performed_by, action, target_type, target_id, new_data, reason)
          VALUES (NULL, 'AUTOMATED_CURFEW_ALERT', 'STUDENT', ?, ?, ?)
        `).run(
          record.student_id,
          JSON.stringify({
            student: record.full_name,
            admissionId: record.admission_id,
            outpassId: record.outpass_id,
            expectedReturn: `${record.date} ${record.expected_in_time}`,
            flaggedAt: now.toISOString()
          }),
          `System auto-detected student exceeded outpass return time (${record.expected_in_time}) without scanning back.`
        );

        newlyOverdueCount++;
        overdueRecords.push({
          type: 'OUTPASS',
          studentId: record.student_id,
          name: record.full_name,
          admissionId: record.admission_id,
          expectedReturn: `${record.date} ${record.expected_in_time}`
        });

        console.log(`[CURFEW CRON] ⚠️ Student ${record.full_name} (${record.admission_id}) marked OVERDUE. Expected return was ${record.expected_in_time}.`);
      }
    }

    // 2. Audit Weekend & Home Leaves for students currently ON_WEEKEND_LEAVE
    const leaveStudents = db.prepare(`
      SELECT s.id as student_id, s.admission_id, s.room_number, s.current_status,
             u.full_name, u.phone as student_phone, s.parent_phone,
             l.id as leave_id, l.expected_return_date, l.leave_type, l.purpose
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN leave_applications l ON l.student_id = s.id
      WHERE s.current_status = 'ON_WEEKEND_LEAVE'
        AND l.status IN ('ACTIVE', 'APPROVED')
    `).all();

    for (const record of leaveStudents) {
      // General hostel evening curfew for Sunday/Return is 21:00 (9:00 PM)
      const isPastDate = record.expected_return_date < currentDateStr;
      const isTodayAndPastCurfew = (record.expected_return_date === currentDateStr && currentTimeStr > '21:00');

      if (isPastDate || isTodayAndPastCurfew) {
        // Check if there is an approved extension
        const hasExtension = db.prepare(`
          SELECT * FROM leave_extensions
          WHERE leave_id = ? AND status = 'APPROVED' AND requested_return_date >= ?
        `).get(record.leave_id, currentDateStr);

        if (!hasExtension) {
          // Mark student as OVERDUE
          db.prepare(`
            UPDATE students SET current_status = 'OVERDUE' WHERE id = ?
          `).run(record.student_id);

          db.prepare(`
            UPDATE leave_applications SET status = 'OVERDUE' WHERE id = ?
          `).run(record.leave_id);

          db.prepare(`
            INSERT INTO audit_logs (performed_by, action, target_type, target_id, new_data, reason)
            VALUES (NULL, 'AUTOMATED_CURFEW_ALERT', 'STUDENT', ?, ?, ?)
          `).run(
            record.student_id,
            JSON.stringify({
              student: record.full_name,
              admissionId: record.admission_id,
              leaveId: record.leave_id,
              expectedReturn: record.expected_return_date,
              flaggedAt: now.toISOString()
            }),
            `System auto-detected student exceeded home leave return date (${record.expected_return_date}) past curfew (21:00).`
          );

          newlyOverdueCount++;
          overdueRecords.push({
            type: 'LEAVE',
            studentId: record.student_id,
            name: record.full_name,
            admissionId: record.admission_id,
            expectedReturn: record.expected_return_date
          });

          console.log(`[CURFEW CRON] ⚠️ Student ${record.full_name} (${record.admission_id}) marked OVERDUE for home leave.`);
        }
      }
    }
  });

  auditTx();

  return {
    timestamp: now.toISOString(),
    newlyOverdueCount,
    overdueRecords
  };
}

/**
 * Starts the background cron worker interval.
 * Runs every 60 seconds.
 */
let cronInterval = null;

function startCronWorker() {
  if (cronInterval) return;

  console.log('[CRON] 🕒 Ephesus Hostel Curfew Background Worker initialized (running every 60s).');

  // Initial immediate run on server start
  try {
    runCurfewAudit();
  } catch (err) {
    console.error('[CRON ERROR] Initial audit error:', err);
  }

  // Periodic ticker every 60 seconds (1 minute)
  cronInterval = setInterval(() => {
    try {
      runCurfewAudit();
    } catch (err) {
      console.error('[CRON ERROR] Periodic audit error:', err);
    }
  }, 60 * 1000);
}

function stopCronWorker() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[CRON] Stopped Curfew Background Worker.');
  }
}

module.exports = {
  startCronWorker,
  stopCronWorker,
  runCurfewAudit
};
