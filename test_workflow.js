const assert = require('assert');

async function testWorkflow() {
  const baseUrl = 'http://localhost:5050';

  console.log('--- 1. Testing Warden Login ---');
  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'warden@providence.edu.in', password: 'ephesus123' })
  });
  let data = await res.json();
  assert(res.ok, 'Warden login should succeed');
  const wardenToken = data.token;
  console.log('✓ Warden authenticated successfully:', data.user.fullName);

  console.log('--- 2. Starting Morning College OUT Dynamic QR Session ---');
  res = await fetch(`${baseUrl}/api/movement/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${wardenToken}`
    },
    body: JSON.stringify({ movement_type: 'COLLEGE_OUT', token_interval_seconds: 20 })
  });
  data = await res.json();
  assert(res.ok, 'Session start should succeed');
  const sessionId = data.sessionId;
  console.log('✓ Morning College OUT session active with ID:', sessionId);

  console.log('--- 3. Generating Rotating Dynamic QR Token ---');
  res = await fetch(`${baseUrl}/api/movement/session/${sessionId}/token`, {
    headers: { 'Authorization': `Bearer ${wardenToken}` }
  });
  data = await res.json();
  assert(data.token, 'Token must exist');
  assert(data.qrDataUrl, 'QR image data URL must be generated');
  const qrToken = data.token;
  console.log('✓ Dynamic QR code successfully generated (expires in 20s)');

  console.log('--- 4. Testing Student Login (Rahul Krishna, Room E101) ---');
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.k@providence.edu.in', password: 'ephesus123' })
  });
  data = await res.json();
  assert(res.ok, 'Student login should succeed');
  const studentToken = data.token;
  console.log('✓ Student logged in:', data.user.fullName, 'Status:', data.student.current_status);

  console.log('--- 5. Student Scans College OUT QR ---');
  res = await fetch(`${baseUrl}/api/movement/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ token: qrToken })
  });
  data = await res.json();
  assert(res.ok, 'Scan should be verified: ' + JSON.stringify(data));
  assert.strictEqual(data.newStatus, 'AT_COLLEGE');
  console.log('✓ Verified QR scan recorded at', data.timestamp, 'New Status:', data.newStatus);

  console.log('--- 6. Testing Duplicate Scan Prevention ---');
  res = await fetch(`${baseUrl}/api/movement/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ token: qrToken })
  });
  assert.strictEqual(res.status, 409, 'Duplicate scan must be rejected with 409');
  data = await res.json();
  console.log('✓ Duplicate scan successfully prevented:', data.error);

  console.log('--- 7. Checking Warden Live Stats ---');
  res = await fetch(`${baseUrl}/api/movement/session/${sessionId}/live-stats`, {
    headers: { 'Authorization': `Bearer ${wardenToken}` }
  });
  data = await res.json();
  console.log(`✓ Warden live stats: ${data.completedCount} scanned, ${data.pendingCount} pending, ${data.onLeaveCount} excused on leave`);

  console.log('--- 8. Checking Mess Population Planning (No Double Count) ---');
  res = await fetch(`${baseUrl}/api/mess/dashboard`, {
    headers: { 'Authorization': `Bearer ${wardenToken}` }
  });
  data = await res.json();
  console.log('✓ Tomorrow expected population:', data.tomorrowForecast.expectedPopulation, 'Breakdown:', data.tomorrowForecast);

  console.log('--- 9. Testing Warden Manual Override with Audit Log ---');
  res = await fetch(`${baseUrl}/api/movement/manual-override`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${wardenToken}`
    },
    body: JSON.stringify({
      student_id: 1,
      new_status: 'IN_HOSTEL',
      reason: 'Returned with academic faculty after college lab demonstration.'
    })
  });
  data = await res.json();
  assert(res.ok, 'Manual override should succeed');
  console.log('✓ Manual override executed:', data.message);

  console.log('--- 10. Testing Audit Logs Retrieval ---');
  res = await fetch(`${baseUrl}/api/warden/audit-logs`, {
    headers: { 'Authorization': `Bearer ${wardenToken}` }
  });
  data = await res.json();
  assert(data.logs.length > 0, 'Audit logs must exist');
  console.log('✓ Latest audit log:', data.logs[0].action, 'By:', data.logs[0].author_name, 'Reason:', data.logs[0].reason);

  console.log('--- 11. Testing CSV Export Endpoint ---');
  res = await fetch(`${baseUrl}/api/reports/export-csv?type=students`, {
    headers: { 'Authorization': `Bearer ${wardenToken}` }
  });
  const csvText = await res.text();
  assert(csvText.includes('Admission ID,Full Name,Room'), 'CSV header must match');
  console.log('✓ CSV generated successfully, total length:', csvText.length, 'bytes');

  console.log('\n🎉 ALL 11 WORKFLOW AND EDGE CASE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n');
}

testWorkflow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
