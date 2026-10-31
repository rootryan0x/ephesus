const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

async function seed() {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Database already seeded. Skipping initial seed.');
    return;
  }

  console.log('Seeding Ephesus Hostel database with 75 students, warden accounts, rooms, and initial records...');

  const defaultPasswordHash = bcrypt.hashSync('ephesus123', 8);

  // 1. Insert Warden & Staff
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, full_name, phone, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const wardenRes = insertUser.run(
    'warden@providence.edu.in',
    defaultPasswordHash,
    'WARDEN',
    'Prof. K. Abraham',
    '+91 94471 23456',
    'ACTIVE'
  );
  const wardenUserId = wardenRes.lastInsertRowid;

  const inchargeRes = insertUser.run(
    'incharge@providence.edu.in',
    defaultPasswordHash,
    'IN_CHARGE',
    'Asst. Prof. Mathew Varghese',
    '+91 98462 78901',
    'ACTIVE'
  );
  const inchargeUserId = inchargeRes.lastInsertRowid;

  // 2. Insert Rooms (30 rooms, 2-3 capacity each, totaling 75 beds)
  const insertRoom = db.prepare(`
    INSERT INTO rooms (room_number, block, floor, capacity)
    VALUES (?, ?, ?, ?)
  `);

  // Floor 1: E101 - E115 (15 rooms * 2-3 beds = 38 beds)
  for (let i = 1; i <= 15; i++) {
    const rNum = `E1${i < 10 ? '0' + i : i}`;
    const cap = (i <= 8) ? 3 : 2;
    insertRoom.run(rNum, 'Ephesus Main Block', 1, cap);
  }
  // Floor 2: E201 - E215 (15 rooms * 2-3 beds = 37 beds)
  for (let i = 1; i <= 15; i++) {
    const rNum = `E2${i < 10 ? '0' + i : i}`;
    const cap = (i <= 7) ? 3 : 2;
    insertRoom.run(rNum, 'Ephesus Main Block', 2, cap);
  }

  // 3. Prepare 75 realistic Kerala engineering student profiles
  const departments = [
    'Computer Science & Engineering',
    'Civil Engineering',
    'Mechanical Engineering',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering'
  ];

  const years = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

  const studentNames = [
    'Rahul Krishna', 'Arjun Nair', 'Adithya S. Kumar', 'Sidharth Menon', 'Vivek Rajan',
    'Abhishek P.', 'Midhun Mohan', 'Gokul Chandran', 'Naveen Joseph', 'Basil Paul',
    'Rohan George', 'Alen Thomas', 'Kiran Varghese', 'Vishnu Prasad', 'Rohit Alex',
    'Jerin Joy', 'Akash S.', 'Devadathan R.', 'Nikhil Mathew', 'Pranav Anand',
    'Suraj Pillai', 'Joel K. Samuel', 'Manu Krishnan', 'Deepak Nambiar', 'Jithin Raj',
    'Ananthan M.', 'Sreehari S.', 'Roshan Zachariah', 'Ebin Roy', 'Sanju Simon',
    'Farhan Ali', 'Anoop Kurian', 'Justin Jacob', 'Gautham Suresh', 'Aravind K.',
    'Harikrishnan G.', 'Sarath Kumar', 'Bipin Balan', 'Amal Joy', 'Dhanush Babu',
    'Nandagopal V.', 'Sanjay Sankar', 'Riyaz Mohammed', 'Ajith Mohan', 'Sharon K. Shaji',
    'Christo George', 'Ashwin B.', 'Vyshak S.', 'Abhiram P.', 'Kailas Nath',
    'Cyril Benny', 'Alan Kuruvilla', 'George Kutty', 'Shine Shibu', 'Milan Manoj',
    'Jobin Jose', 'Akhil Dev', 'Shyam Shankar', 'Govind R.', 'Karthik V.',
    'Tony Augustine', 'Anson John', 'Blessen George', 'Deepu Philip', 'Roshith R.',
    'Adarsh Nair', 'Sreeraj S.', 'Vimal Vijayan', 'Mithun Joy', 'Robin Philip',
    'Vineeth V.', 'Subin Sunny', 'Dona Alex', 'Kevin Thomas', 'Jeffin Jacob'
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (
      user_id, admission_id, room_number, department, year,
      parent_name, parent_phone, current_status, last_movement_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Build exact bed slots matching each room's capacity (75 total beds for 75 students)
  const roomBedSlots = [];
  for (let i = 1; i <= 15; i++) {
    const rNum = `E1${i < 10 ? '0' + i : i}`;
    const cap = (i <= 8) ? 3 : 2;
    for (let c = 0; c < cap; c++) roomBedSlots.push(rNum);
  }
  for (let i = 1; i <= 15; i++) {
    const rNum = `E2${i < 10 ? '0' + i : i}`;
    const cap = (i <= 7) ? 3 : 2;
    for (let c = 0; c < cap; c++) roomBedSlots.push(rNum);
  }

  // Pre-allocate slots for the 4 featured demo students
  const featuredRooms = {
    'Rahul Krishna': 'E101',
    'Cyril Benny': 'E205',
    'Tony Augustine': 'E214',
    'Jeffin Jacob': 'E215'
  };

  // Remove one slot of each featured room from the general pool
  for (const name in featuredRooms) {
    const targetRoom = featuredRooms[name];
    const idx = roomBedSlots.indexOf(targetRoom);
    if (idx !== -1) {
      roomBedSlots.splice(idx, 1);
    }
  }

  let generalPoolIdx = 0;
  const insertedStudentIds = [];

  for (let i = 0; i < studentNames.length; i++) {
    const fullName = studentNames[i];
    const nameParts = fullName.toLowerCase().replace(/[^a-z ]/g, '').split(' ');
    const emailPrefix = nameParts.length > 1 ? `${nameParts[0]}.${nameParts[1][0]}` : nameParts[0];
    let email = `${emailPrefix}${i > 25 ? i : ''}@providence.edu.in`;

    // Explicit overrides for the 4 featured demo accounts
    if (fullName === 'Rahul Krishna') email = 'rahul.k@providence.edu.in';
    if (fullName === 'Cyril Benny') email = 'cyril.b@providence.edu.in';
    if (fullName === 'Tony Augustine') email = 'tony.a@providence.edu.in';
    if (fullName === 'Jeffin Jacob') email = 'jeffin.j@providence.edu.in';

    const uRes = insertUser.run(
      email,
      defaultPasswordHash,
      'STUDENT',
      fullName,
      `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      'ACTIVE'
    );
    const userId = uRes.lastInsertRowid;

    // Room assignment guaranteed not to exceed capacity
    const assignedRoom = featuredRooms[fullName] || roomBedSlots[generalPoolIdx++];

    let year = years[i % 4];
    const dept = departments[i % departments.length];
    const admYear = 2026 - parseInt(year === 'First Year' ? 0 : year === 'Second Year' ? 1 : year === 'Third Year' ? 2 : 3);
    const admId = `PRC/EPH/${admYear}/${String(i + 1).padStart(3, '0')}`;

    // Status distribution for realistic hostel state:
    // ~58 IN_HOSTEL, ~10 AT_COLLEGE, ~5 ON_WEEKEND_LEAVE, ~2 ON_OUTPASS
    let status = 'IN_HOSTEL';
    if (i >= 58 && i < 68) {
      status = 'AT_COLLEGE';
    } else if (i >= 68 && i < 73) {
      status = 'ON_WEEKEND_LEAVE';
    } else if (i >= 73) {
      status = 'ON_OUTPASS';
    }

    // Role-specific accounts matching QuickRoleSwitch & README
    if (fullName === 'Rahul Krishna') {
      year = 'Fourth Year';
      status = 'IN_HOSTEL';
    } else if (fullName === 'Cyril Benny') {
      year = 'Third Year';
      status = 'AT_COLLEGE';
    } else if (fullName === 'Tony Augustine') {
      year = 'First Year';
      status = 'ON_WEEKEND_LEAVE';
    } else if (fullName === 'Jeffin Jacob') {
      year = 'Second Year';
      status = 'ON_OUTPASS';
    }

    const sRes = insertStudent.run(
      userId,
      admId,
      assignedRoom,
      dept,
      year,
      `Parent of ${fullName.split(' ')[0]}`,
      `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      status,
      new Date().toISOString()
    );

    insertedStudentIds.push({
      studentId: sRes.lastInsertRowid,
      userId,
      fullName,
      email,
      room: assignedRoom,
      status
    });
  }

  // 4. Insert Hostel Configuration
  const insertConfig = db.prepare(`INSERT OR REPLACE INTO hostel_config (key, value) VALUES (?, ?)`);
  insertConfig.run('warden_name', 'Prof. K. Abraham');
  insertConfig.run('warden_phone', '+91 94471 23456');
  insertConfig.run('warden_status', 'ON_DUTY');
  insertConfig.run('incharge_name', 'Asst. Prof. Mathew Varghese');
  insertConfig.run('incharge_phone', '+91 98462 78901');
  insertConfig.run('qr_validity_seconds', '20');
  insertConfig.run('weekend_leave_deadline', '10:00 PM');
  insertConfig.run('return_confirmation_deadline', 'Sunday 1:00 PM');
  insertConfig.run('hostel_name', 'Ephesus Hostel');
  insertConfig.run('college_name', 'Providence College of Engineering, Chengannur');

  // 5. Insert Facilities
  const insertFacility = db.prepare(`
    INSERT INTO facilities (key, name, status, status_level, icon, description, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertFacility.run('electricity', 'Electricity / Power Grid', 'KSEB Mains Active', 'NORMAL', 'Zap', 'Kerala State Electricity Board feeder stable. No scheduled load shedding.', wardenUserId);
  insertFacility.run('generator', 'Backup Diesel Generator', 'Auto-Standby Ready', 'NORMAL', 'Cpu', 'Diesel tank at 85%. Automated changeover within 10 seconds of grid failure.', wardenUserId);
  insertFacility.run('wifi', 'Hostel Wi-Fi Network', 'High-Speed Fiber Online', 'NORMAL', 'Wifi', 'High-speed campus fiber active across all floor APs.', wardenUserId);
  insertFacility.run('water', 'Water Supply & Heaters', 'Tanks Full (92%)', 'NORMAL', 'Droplets', 'Borewell and municipal water pump operational. Solar water heaters active.', wardenUserId);
  insertFacility.run('mess', 'Mess & Dining Hall', 'Open & Operational', 'NORMAL', 'Utensils', 'Breakfast: 7:30-9:00 AM | Lunch: 12:30-2:00 PM | Dinner: 7:30-9:00 PM', wardenUserId);

  // 6. Insert Bus Schedules
  const insertBus = db.prepare(`
    INSERT INTO bus_schedules (route, departure_time, bus_number, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertBus.run('Hostel -> College', '08:15 AM', 'KL-30-E-4102 (Trip 1)', 'ON_TIME', 'Departs Ephesus front porch to main campus block');
  insertBus.run('Hostel -> College', '08:40 AM', 'KL-30-E-4102 (Trip 2)', 'ON_TIME', 'Final morning college departure');
  insertBus.run('College -> Hostel', '04:15 PM', 'KL-30-E-4102 (Trip 1)', 'ON_TIME', 'Evening return after regular classes');
  insertBus.run('College -> Hostel', '05:00 PM', 'KL-30-E-4105 (Late Trip)', 'ON_TIME', 'Evening return for lab/library students');

  // 7. Insert Announcements
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, message, priority, target_audience, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertAnnouncement.run(
    'Weekend Leave Application Window Open',
    'All students planning to travel home this weekend must submit leave applications before Thursday 10:00 PM. Return confirmations for Monday must be submitted by Sunday 1:00 PM via this app.',
    'IMPORTANT',
    'ALL',
    wardenUserId
  );

  insertAnnouncement.run(
    'Generator Maintenance Schedule',
    'Routine maintenance for the Ephesus auxiliary 65kVA generator will occur on Saturday from 2:00 PM to 4:00 PM. KSEB power will remain active.',
    'NORMAL',
    'ALL',
    wardenUserId
  );

  insertAnnouncement.run(
    'Library Extended Hours Notice',
    'Providence Central Library will remain open until 8:00 PM for project submissions. Students using late bus Trip 2 please note.',
    'NORMAL',
    'Third Year, Fourth Year',
    wardenUserId
  );

  // 8. Insert Daily Food Waste for the past 7 days
  const insertWaste = db.prepare(`
    INSERT INTO daily_food_waste (date, waste_kg, breakfast_kg, lunch_kg, dinner_kg, notes, logged_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const pastWaste = [
    { offset: 6, waste: 7.2, b: 1.8, l: 2.8, d: 2.6, notes: 'Good estimation, negligible wastage.' },
    { offset: 5, waste: 8.5, b: 2.1, l: 3.5, d: 2.9, notes: 'Rice surplus at dinner.' },
    { offset: 4, waste: 6.8, b: 1.5, l: 2.6, d: 2.7, notes: 'Optimal consumption.' },
    { offset: 3, waste: 9.1, b: 2.4, l: 3.8, d: 2.9, notes: 'Extra students stayed out without notification.' },
    { offset: 2, waste: 7.9, b: 1.9, l: 3.1, d: 2.9, notes: 'Standard average.' },
    { offset: 1, waste: 8.4, b: 2.0, l: 3.4, d: 3.0, notes: 'Yesterday food waste logged by mess manager.' },
  ];

  for (const item of pastWaste) {
    const d = new Date(today);
    d.setDate(d.getDate() - item.offset);
    const dateStr = d.toISOString().split('T')[0];
    insertWaste.run(dateStr, item.waste, item.b, item.l, item.d, item.notes, wardenUserId);
  }

  // 9. Insert Active/Pending Leave Applications for the students on leave (index 68 to 72)
  const insertLeave = db.prepare(`
    INSERT INTO leave_applications (
      student_id, leave_type, purpose, leave_start_date, expected_return_date,
      route_type, parent_contact, parent_confirmation_status, status,
      warden_remarks, approved_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReturnConfirm = db.prepare(`
    INSERT INTO return_confirmations (
      leave_id, student_id, scheduled_return_date, confirmed_intention,
      new_return_date, extension_reason, status, deadline_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Target upcoming Monday date
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  const mondayDateStr = nextMonday.toISOString().split('T')[0];

  const lastFriday = new Date(nextMonday);
  lastFriday.setDate(nextMonday.getDate() - 3);
  const fridayDateStr = lastFriday.toISOString().split('T')[0];

  // Sunday 1PM deadline
  const sundayDeadline = new Date(nextMonday);
  sundayDeadline.setDate(nextMonday.getDate() - 1);
  sundayDeadline.setHours(13, 0, 0, 0);

  for (let j = 68; j < 73; j++) {
    const s = insertedStudentIds[j];
    const lRes = insertLeave.run(
      s.studentId,
      'WEEKEND',
      'Visiting home in Kottayam / Alappuzha for weekend',
      fridayDateStr,
      mondayDateStr,
      j % 2 === 0 ? 'HOSTEL_COLLEGE_HOME' : 'HOSTEL_HOME',
      '+91 94470 11223',
      'CONFIRMED',
      'APPROVED',
      'Approved for regular weekend home visit.',
      wardenUserId
    );
    const leaveId = lRes.lastInsertRowid;

    // Student 68 & 69 already confirmed return
    // Student 70 requested leave extension to Tuesday
    // Student 71 & 72 are pending return confirmation
    if (j === 68 || j === 69) {
      insertReturnConfirm.run(
        leaveId,
        s.studentId,
        mondayDateStr,
        'CONFIRMED_RETURNING',
        null,
        null,
        'CONFIRMED',
        sundayDeadline.toISOString()
      );
    } else if (j === 70) {
      const nextTuesday = new Date(nextMonday);
      nextTuesday.setDate(nextMonday.getDate() + 1);
      const tuesdayDateStr = nextTuesday.toISOString().split('T')[0];

      insertReturnConfirm.run(
        leaveId,
        s.studentId,
        mondayDateStr,
        'EXTENDING_LEAVE',
        tuesdayDateStr,
        'Family function on Monday evening; returning Tuesday morning before 8:30 AM.',
        'EXTENDED',
        sundayDeadline.toISOString()
      );

      db.prepare(`
        INSERT INTO leave_extensions (leave_id, student_id, original_return_date, requested_return_date, reason, status, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(leaveId, s.studentId, mondayDateStr, tuesdayDateStr, 'Family function on Monday evening', 'APPROVED', wardenUserId);
    } else {
      insertReturnConfirm.run(
        leaveId,
        s.studentId,
        mondayDateStr,
        null,
        null,
        null,
        'PENDING',
        sundayDeadline.toISOString()
      );
    }
  }

  // Tony Augustine - Explicit Weekend Leave with Sunday Return Confirmation Pending
  const tonyStudent = insertedStudentIds.find(s => s.fullName === 'Tony Augustine');
  if (tonyStudent) {
    const lRes = insertLeave.run(
      tonyStudent.studentId,
      'WEEKEND',
      'Weekend family visit in Kottayam (Sunday Return Confirmation Due)',
      fridayDateStr,
      mondayDateStr,
      'HOSTEL_COLLEGE_HOME',
      '+91 94470 11223',
      'CONFIRMED',
      'APPROVED',
      'Approved for regular weekend home visit.',
      wardenUserId
    );
    const leaveId = lRes.lastInsertRowid;
    insertReturnConfirm.run(
      leaveId,
      tonyStudent.studentId,
      mondayDateStr,
      null,
      null,
      null,
      'PENDING',
      sundayDeadline.toISOString()
    );
  }

  // 10. Insert Outpasses for students 73 and 74 (ON_OUTPASS) and 1 pending outpass
  const insertOutpass = db.prepare(`
    INSERT INTO outpasses (
      student_id, purpose, destination, date,
      expected_out_time, expected_in_time, actual_out_time,
      parent_contact, parent_confirmation_status, status,
      warden_remarks, approved_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = today.toISOString().split('T')[0];
  insertOutpass.run(
    insertedStudentIds[73].studentId,
    'Purchasing academic project components and textbooks',
    'Chengannur Town Market',
    todayStr,
    '04:30 PM',
    '07:30 PM',
    new Date(Date.now() - 3600000).toISOString(),
    '+91 94472 99881',
    'CONFIRMED',
    'ACTIVE',
    'Approved. Be back before night roll-call.',
    wardenUserId
  );

  insertOutpass.run(
    insertedStudentIds[74].studentId,
    'Medical appointment at Century Hospital',
    'Century Hospital, Mulakuzha',
    todayStr,
    '05:00 PM',
    '08:00 PM',
    new Date(Date.now() - 1800000).toISOString(),
    '+91 98471 22334',
    'CONFIRMED',
    'ACTIVE',
    'Medical visit permitted.',
    wardenUserId
  );

  // A pending outpass from student 0 (Rahul Krishna)
  insertOutpass.run(
    insertedStudentIds[0].studentId,
    'Laptop repair and software installation at service center',
    'Chengannur Railway Station road',
    todayStr,
    '05:30 PM',
    '08:00 PM',
    null,
    '+91 94475 33441',
    'CONFIRMED',
    'WARDEN_PENDING',
    null,
    null
  );

  // 11. Insert Sample Complaints
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (student_id, room_number, category, description, status, admin_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertComplaint.run(
    insertedStudentIds[0].studentId,
    'E101',
    'Wi-Fi',
    'Room E101 corner desk has weak Wi-Fi signal drop during late evenings.',
    'IN_PROGRESS',
    'Assigned to campus network technician for ceiling AP realignment.',
    new Date(Date.now() - 86400000).toISOString()
  );

  insertComplaint.run(
    insertedStudentIds[5].studentId,
    'E103',
    'Plumbing',
    'Slow drainage in bathroom sink basin.',
    'SUBMITTED',
    null,
    new Date(Date.now() - 43200000).toISOString()
  );

  insertComplaint.run(
    insertedStudentIds[12].studentId,
    'E106',
    'Electrical',
    'Study lamp tube flickering after power surge.',
    'RESOLVED',
    'Replaced ballast and tube lamp with 20W LED fixture.',
    new Date(Date.now() - 172800000).toISOString()
  );

  // 12. Insert Sample Past Movement Records
  const insertMovement = db.prepare(`
    INSERT INTO movement_records (
      student_id, movement_type, direction, timestamp,
      source, qr_token
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 20; i++) {
    const s = insertedStudentIds[i];
    // Yesterday morning College OUT
    insertMovement.run(
      s.studentId,
      'COLLEGE_OUT',
      'OUT',
      new Date(Date.now() - 86400000 + (i * 30000)).toISOString(),
      'QR_SCAN',
      'QR_COLLEGE_OUT_PREV'
    );
    // Yesterday evening College IN
    insertMovement.run(
      s.studentId,
      'COLLEGE_IN',
      'IN',
      new Date(Date.now() - 57600000 + (i * 45000)).toISOString(),
      'QR_SCAN',
      'QR_COLLEGE_IN_PREV'
    );
  }

  // Cyril Benny - Morning College OUT movement record today so status is verified AT_COLLEGE
  const cyrilStudent = insertedStudentIds.find(s => s.fullName === 'Cyril Benny');
  if (cyrilStudent) {
    insertMovement.run(
      cyrilStudent.studentId,
      'COLLEGE_OUT',
      'OUT',
      new Date(Date.now() - 14400000).toISOString(),
      'QR_SCAN',
      'QR_COLLEGE_OUT_TODAY'
    );
  }

  // 13. Insert Initial Audit Log
  db.prepare(`
    INSERT INTO audit_logs (performed_by, action, target_type, target_id, original_data, new_data, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    wardenUserId,
    'SYSTEM_INITIALIZATION',
    'SYSTEM',
    'EPHESUS',
    null,
    JSON.stringify({ total_students: 75, version: '1.0' }),
    'System deployment for Ephesus Hostel, Providence College of Engineering'
  );

  console.log('Seeding complete! 75 students, 30 rooms, initial logs, leave, and outpass data generated.');
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
}

module.exports = { seed };
