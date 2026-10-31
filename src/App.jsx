import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { QuickRoleSwitch } from './components/QuickRoleSwitch';

// Student Views
import { StudentDashboard } from './views/student/StudentDashboard';
import { LeaveOutpassView } from './views/student/LeaveOutpassView';
import { ComplaintsView } from './views/student/ComplaintsView';
import { FacilitiesBusView } from './views/student/FacilitiesBusView';
import { ProfileView } from './views/student/ProfileView';

// Warden Views
import { WardenDashboard } from './views/warden/WardenDashboard';
import { MovementSessionsControl } from './views/warden/MovementSessionsControl';
import { StudentDirectory } from './views/warden/StudentDirectory';
import { RoomsManagement } from './views/warden/RoomsManagement';
import { LeaveOutpassManager } from './views/warden/LeaveOutpassManager';
import { MessFoodWasteCenter } from './views/warden/MessFoodWasteCenter';
import { ComplaintsCenter } from './views/warden/ComplaintsCenter';
import { FacilitiesBusManager } from './views/warden/FacilitiesBusManager';
import { AnnouncementsManager } from './views/warden/AnnouncementsManager';
import { ReportsAnalytics } from './views/warden/ReportsAnalytics';
import { AuditLogsView } from './views/warden/AuditLogsView';

// Icons
import {
  Building2, Home, QrCode, Users, Compass, Utensils, Wrench,
  Zap, Bell, BarChart3, ShieldAlert, LogIn, Lock, Mail, ArrowRight, CheckCircle2
} from 'lucide-react';

export function App() {
  const { user, loading, isWarden, isStudent, login, switchDemoUser } = useAuth();

  // Navigation tabs
  const [wardenTab, setWardenTab] = useState('overview'); // overview, sessions, students, rooms, leaves, mess, complaints, facilities, announcements, reports, audit
  const [studentTab, setStudentTab] = useState('dashboard'); // dashboard, leaves, complaints, facilities, profile

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white'
      }}>
        <div className="brand-icon-box" style={{ width: 60, height: 60, marginBottom: '1rem' }}>
          <Building2 size={32} />
        </div>
        <h2 style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Ephesus Hostel</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Providence College of Engineering</p>
      </div>
    );
  }

  // Login Screen if unauthenticated
  if (!user) {
    const handleLoginSubmit = async (e) => {
      e.preventDefault();
      setLoginError(null);
      setLoggingIn(true);
      try {
        await login(email, password);
      } catch (err) {
        setLoginError(err.message);
      } finally {
        setLoggingIn(false);
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
            color: 'white',
            padding: '2rem 1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-lg)',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem', color: '#ffffff'
            }}>
              <Building2 size={28} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              EPHESUS HOSTEL
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#c7d2fe', margin: '0.25rem 0 0' }}>
              Providence College of Engineering, Chengannur
            </p>
          </div>

          <div style={{ padding: '1.75rem 1.5rem' }}>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Official College Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="student@providence.edu.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="alert alert-warning" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loggingIn}
                style={{ width: '100%', fontWeight: 700 }}
              >
                {loggingIn ? 'Authenticating...' : 'Sign In with College ID'}
              </button>
            </form>

            {/* 1-Click Portals */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.75rem'
              }}>
                Instant Portal Access
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => switchDemoUser('warden@providence.edu.in')}
                  style={{
                    textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '0.75rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-light)'
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>🏛️ Warden Portal</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Prof. K. Abraham</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => switchDemoUser('rahul.k@providence.edu.in')}
                  style={{
                    textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    padding: '0.75rem 0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-light)'
                  }}
                >
                  <strong style={{ fontSize: '0.85rem', color: 'var(--success)' }}>🎓 Student Portal</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Rahul Krishna (Student)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar />

      <main className="main-content">
        {/* Navigation Tabs for Warden */}
        {isWarden && (
          <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
            <button
              className={`tab-btn ${wardenTab === 'overview' ? 'active' : ''}`}
              onClick={() => setWardenTab('overview')}
            >
              <Home size={16} /> Command Center
            </button>
            <button
              className={`tab-btn ${wardenTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setWardenTab('sessions')}
            >
              <QrCode size={16} /> Movement Sessions & QR
            </button>
            <button
              className={`tab-btn ${wardenTab === 'students' ? 'active' : ''}`}
              onClick={() => setWardenTab('students')}
            >
              <Users size={16} /> Students Directory
            </button>
            <button
              className={`tab-btn ${wardenTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setWardenTab('rooms')}
            >
              <Building2 size={16} /> Room-wise Grid
            </button>
            <button
              className={`tab-btn ${wardenTab === 'leaves' ? 'active' : ''}`}
              onClick={() => setWardenTab('leaves')}
            >
              <Compass size={16} /> Leaves & Outpasses
            </button>
            <button
              className={`tab-btn ${wardenTab === 'mess' ? 'active' : ''}`}
              onClick={() => setWardenTab('mess')}
            >
              <Utensils size={16} /> Mess & Food Waste
            </button>
            <button
              className={`tab-btn ${wardenTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setWardenTab('complaints')}
            >
              <Wrench size={16} /> Maintenance
            </button>
            <button
              className={`tab-btn ${wardenTab === 'facilities' ? 'active' : ''}`}
              onClick={() => setWardenTab('facilities')}
            >
              <Zap size={16} /> Facilities & Bus
            </button>
            <button
              className={`tab-btn ${wardenTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setWardenTab('announcements')}
            >
              <Bell size={16} /> Announcements
            </button>
            <button
              className={`tab-btn ${wardenTab === 'reports' ? 'active' : ''}`}
              onClick={() => setWardenTab('reports')}
            >
              <BarChart3 size={16} /> Reports & CSV
            </button>
            <button
              className={`tab-btn ${wardenTab === 'audit' ? 'active' : ''}`}
              onClick={() => setWardenTab('audit')}
            >
              <ShieldAlert size={16} /> Audit Logs
            </button>
          </div>
        )}

        {/* Navigation Tabs for Student */}
        {isStudent && (
          <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
            <button
              className={`tab-btn ${studentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setStudentTab('dashboard')}
            >
              <Home size={16} /> Home Dashboard
            </button>
            <button
              className={`tab-btn ${studentTab === 'leaves' ? 'active' : ''}`}
              onClick={() => setStudentTab('leaves')}
            >
              <Compass size={16} /> Leave & Outpass Passes
            </button>
            <button
              className={`tab-btn ${studentTab === 'complaints' ? 'active' : ''}`}
              onClick={() => setStudentTab('complaints')}
            >
              <Wrench size={16} /> Maintenance Complaints
            </button>
            <button
              className={`tab-btn ${studentTab === 'facilities' ? 'active' : ''}`}
              onClick={() => setStudentTab('facilities')}
            >
              <Zap size={16} /> Facilities & Bus
            </button>
            <button
              className={`tab-btn ${studentTab === 'profile' ? 'active' : ''}`}
              onClick={() => setStudentTab('profile')}
            >
              <Users size={16} /> Student Profile
            </button>
          </div>
        )}

        {/* Warden Views Router */}
        {isWarden && (
          <>
            {wardenTab === 'overview' && <WardenDashboard onNavigateTab={setWardenTab} />}
            {wardenTab === 'sessions' && <MovementSessionsControl />}
            {wardenTab === 'students' && <StudentDirectory />}
            {wardenTab === 'rooms' && <RoomsManagement />}
            {wardenTab === 'leaves' && <LeaveOutpassManager />}
            {wardenTab === 'mess' && <MessFoodWasteCenter />}
            {wardenTab === 'complaints' && <ComplaintsCenter />}
            {wardenTab === 'facilities' && <FacilitiesBusManager />}
            {wardenTab === 'announcements' && <AnnouncementsManager />}
            {wardenTab === 'reports' && <ReportsAnalytics />}
            {wardenTab === 'audit' && <AuditLogsView />}
          </>
        )}

        {/* Student Views Router */}
        {isStudent && (
          <>
            {studentTab === 'dashboard' && <StudentDashboard onNavigateTab={setStudentTab} />}
            {studentTab === 'leaves' && <LeaveOutpassView />}
            {studentTab === 'complaints' && <ComplaintsView />}
            {studentTab === 'facilities' && <FacilitiesBusView />}
            {studentTab === 'profile' && <ProfileView />}
          </>
        )}
      </main>
    </div>
  );
}
