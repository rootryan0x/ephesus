# Ephesus Hostel Management System
### Providence College of Engineering, Chengannur

A comprehensive, production-quality digital hostel management platform replacing paper-based movement registers, leave applications, outpasses, return confirmation WhatsApp messages, manual mess estimations, facility communications, and complaints.

---

## 🏛️ System Architecture & Highlights

1. **Hardware-Free Dynamic QR Movement System**:
   - Eliminates GPS, biometric machines, and specialized scanners.
   - The Warden displays a short-lived, rotating dynamic QR on any screen, laptop, or tablet.
   - All 75 students scan the active dynamic QR using their smartphone cameras.
   - Built-in **anti-replay and token rotation** (20s interval configurable).
   - Strict server-side state machine preventing illegal transitions (e.g., cannot scan College IN unless marked AT_COLLEGE; duplicate scans within the same session rejected with 409 Conflict).

2. **6 Movement Categories**:
   - `College OUT` (Hostel → Providence College)
   - `College IN` (Providence College → Hostel)
   - `Outpass OUT` (Approved town/errands departure)
   - `Outpass IN` (Return from outpass)
   - `Weekend Leave OUT` (Hostel/College → Home)
   - `Weekend Leave IN` (Home/Bus → Hostel return)

3. **Friday Direct Travel & Route Edge Cases**:
   - Supports **Route B**: Hostel → College (Morning College OUT) → Home (Friday evening Leave OUT directly without requiring College IN).
   - Supports **Route D**: Home → College → Hostel via College Bus (remains ON_WEEKEND_LEAVE until actual return scan at Ephesus).

4. **Sunday Return Confirmation & Advance Mess Planning**:
   - Prompts students on approved leave before Sunday 1:00 PM:
     - `[ YES, I'M RETURNING ]`
     - `[ EXTEND MY LEAVE ]` (Captures new return date and reason, preserves audit history).
   - Expected vs Actual return tracked independently.
   - **Real-Time Deduplicated Mess Population Engine**: Calculates tomorrow's exact headcount (in hostel + confirmed returning - departing) avoiding double counting, with meal-wise plate estimations (Breakfast, Lunch, Evening Snacks, Dinner).

5. **Daily Food Waste Tracker**:
   - Log daily food waste in kg (with meal breakdowns and notes).
   - Displays hostel-wide waste transparency on student dashboards (e.g. "Yesterday's food waste: 8.4 kg").
   - 7-day trend metrics and statistics.

6. **Hostel Facilities, Bus & Warden Status**:
   - Live status for Electricity (KSEB Mains / Generator Running / Outage), Generator standby, Wi-Fi fiber, Water tanks, and Mess operations.
   - Providence College bus schedules and real-time status.
   - Warden duty status and handover to In-Charge.

7. **Complaints System**:
   - Student complaints with categories (Electrical, Wi-Fi, Plumbing, Water, Cleaning, Room, Mess, Bathroom, Other).
   - Photo attachment uploads.
   - Warden resolution workflow with tracking states (Submitted → In Progress → Resolved → Closed).

8. **Year-Wise & Room-Wise Warden Control Center**:
   - Filter students by 1st, 2nd, 3rd, 4th Year.
   - Interactive 30-room layout across Ground & First Floor (E101 to E215).
   - **Administrative Status Override** with mandatory audit reason logging.
   - CSV Export for Student Register, Movement Audit Trail, and Leave History.

---

## 🚀 Running the Application

The server is currently running at:
**http://localhost:5050**

### Available Scripts:
- `npm run dev`: Runs Express backend on port 5050 and Vite client concurrently.
- `npm run build`: Compiles production frontend bundle to `dist/`.
- `node test_workflow.js`: Executes the complete 11-step integration test suite verifying QR rotation, duplicate scan rejection, Friday route transitions, mess calculations, and audit logging.

---

## 🔑 Pre-Seeded Accounts (Password: `ephesus123`)

| Role | Name | Email | Initial Status / Room |
|---|---|---|---|
| **Chief Warden** | Prof. K. Abraham | `warden@providence.edu.in` | Staff Portal |
| **Assistant Warden** | Asst. Prof. Mathew Varghese | `incharge@providence.edu.in` | In-Charge Portal |
| **Student (4th Yr)** | Rahul Krishna | `rahul.k@providence.edu.in` | Room E101 • `IN_HOSTEL` |
| **Student (3rd Yr)** | Cyril Benny | `cyril.b@providence.edu.in` | Room E205 • `AT_COLLEGE` |
| **Student (1st Yr)** | Tony Augustine | `tony.a@providence.edu.in` | Room E214 • `ON_WEEKEND_LEAVE` (Return Confirm Due) |
| **Student (2nd Yr)** | Jeffin Jacob | `jeffin.j@providence.edu.in` | Room E215 • `ON_OUTPASS` |

*Note: Use the **"Switch Role"** button in the top navigation bar to switch between any of these accounts with a single click.*
