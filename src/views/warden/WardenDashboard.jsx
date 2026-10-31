import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Users, Home, GraduationCap, MapPin, Compass, AlertTriangle,
  Clock, Utensils, CheckCircle2, QrCode, ArrowRight, ShieldCheck, Sparkles, AlertCircle,
  Phone, X, RefreshCw, ShieldAlert
} from 'lucide-react';

export function WardenDashboard({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState(null);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const [overdueStudents, setOverdueStudents] = useState([]);

  const fetchStats = async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        api.getWardenStats(),
        api.getActiveSession()
      ]);
      setStats(sRes);
      setActiveSession(mRes.session);
    } catch (err) {
      console.error('Error fetching warden dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCurfewAudit = async () => {
    setAuditing(true);
    setAuditMessage(null);
    try {
      const res = await api.runOverdueCheck();
      setAuditMessage(res.message || 'Curfew audit completed.');
      await fetchStats();
      setTimeout(() => setAuditMessage(null), 5000);
    } catch (err) {
      console.error('Curfew audit error:', err);
      setAuditMessage('Failed to run curfew audit: ' + (err.message || ''));
    } finally {
      setAuditing(false);
    }
  };

  const handleOpenOverdueModal = async () => {
    try {
      const res = await api.getOverdueStudents();
      setOverdueStudents(res.students || []);
      setOverdueModalOpen(true);
    } catch (err) {
      console.error('Error fetching overdue students:', err);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
        Loading Ephesus Hostel Command Center...
      </div>
    );
  }

  return (
    <div>
      {/* Headline & Quick Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
            COMMAND & MONITORING CENTER
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
            What is happening in Ephesus Hostel right now?
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time verified student movement, leave planning, mess population & facilities
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleTriggerCurfewAudit}
            disabled={auditing}
            style={{ fontWeight: 700 }}
            title="Runs the automated background worker audit on outpasses & curfew immediately"
          >
            <Clock size={16} className={auditing ? 'spin' : ''} />
            {auditing ? 'Auditing Curfew...' : 'Audit Curfew Now'}
          </button>

          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab('sessions')}
            style={{ fontWeight: 700 }}
          >
            <QrCode size={16} /> Movement Sessions & QR
          </button>
        </div>
      </div>

      {/* Audit Feedback Toast */}
      {auditMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--success)',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>{auditMessage}</span>
          </div>
          <button onClick={() => setAuditMessage(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Attention Required Banner (Alerts that save manual monitoring!) */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {stats.pendingLeaves > 0 && (
            <div
              onClick={() => onNavigateTab('leaves')}
              style={{
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1rem' }}>🟠</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--warning)' }}>
                  {stats.pendingLeaves} Leave applications pending approval
                </span>
              </div>
              <ArrowRight size={15} color="var(--warning)" />
            </div>
          )}

          {stats.pendingOutpasses > 0 && (
            <div
              onClick={() => onNavigateTab('leaves')}
              style={{
                background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1rem' }}>🔵</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--info)' }}>
                  {stats.pendingOutpasses} Outpasses pending review
                </span>
              </div>
              <ArrowRight size={15} color="var(--info)" />
            </div>
          )}

          {stats.pendingReturnConfirmations > 0 && (
            <div
              onClick={() => onNavigateTab('mess')}
              style={{
                background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1rem' }}>🟣</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--purple)' }}>
                  {stats.pendingReturnConfirmations} Students pending return confirmation
                </span>
              </div>
              <ArrowRight size={15} color="var(--purple)" />
            </div>
          )}

          {stats.unresolvedComplaints > 0 && (
            <div
              onClick={() => onNavigateTab('complaints')}
              style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1rem' }}>🔴</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)' }}>
                  {stats.unresolvedComplaints} Facility complaints unresolved
                </span>
              </div>
              <ArrowRight size={15} color="var(--danger)" />
            </div>
          )}

          {(stats.overdue || 0) > 0 && (
            <div
              onClick={handleOpenOverdueModal}
              style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', gridColumn: '1 / -1'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🚨</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--danger)' }}>
                  {stats.overdue} Student(s) have EXCEEDED curfew & are currently OVERDUE! Click to view & call parents.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem' }}>
                <span>Take Action</span>
                <ArrowRight size={15} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Movement Session Banner */}
      {activeSession ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(49, 46, 129, 0.9) 100%)',
          color: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-in-hostel" style={{ background: '#10b981', color: 'white' }}>
                ACTIVE LIVE QR SESSION
              </span>
              <span style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
                Started at {new Date(activeSession.started_at).toLocaleTimeString()}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.35rem 0' }}>
              {activeSession.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#e0e7ff', margin: 0 }}>
              Completed scans: <strong>{activeSession.completedCount} / {stats?.totalStudents || 75}</strong> students verified
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab('sessions')}
            style={{
              background: '#ffffff', color: '#1e1b4b', fontWeight: 800,
              padding: '0.75rem 1.5rem', fontSize: '0.95rem'
            }}
          >
            <QrCode size={18} color="var(--primary)" /> View Live QR Broadcast
          </button>
        </div>
      ) : (
        <div className="card" style={{
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                No Active QR Movement Session
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Ready to initiate Morning College OUT, Evening College IN, or Leave/Outpass sessions.
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('sessions')}
            style={{ fontWeight: 700 }}
          >
            Open Sessions Manager
          </button>
        </div>
      )}

      {/* Headline Real-time Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-label">Total Registered Students</div>
          <div className="stat-value">{stats?.totalStudents || 75}</div>
          <div className="stat-sub">Ephesus Hostel capacity: 75</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-label">Currently In Hostel</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.inHostel || 0}</div>
          <div className="stat-sub">Verified on premises</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-label">At College Campus</div>
          <div className="stat-value" style={{ color: '#d97706' }}>{stats?.atCollege || 0}</div>
          <div className="stat-sub">College OUT active</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div className="stat-label">On Weekend / Home Leave</div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{stats?.onWeekendLeave || 0}</div>
          <div className="stat-sub">Approved home leaves</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-label">On Outpass</div>
          <div className="stat-value" style={{ color: 'var(--info)' }}>{stats?.onOutpass || 0}</div>
          <div className="stat-sub">Town / Market permissions</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="stat-label">Tomorrow's Expected Mess Population</div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>{stats?.tomorrowExpectedPopulation || 0}</div>
          <div className="stat-sub">Includes confirmed returns</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Yesterday's Food Waste</div>
          <div className="stat-value">{stats?.yesterdayWasteKg || 8.4} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg</span></div>
          <div className="stat-sub">Logged by mess manager</div>
        </div>

        <div
          className="stat-card"
          onClick={handleOpenOverdueModal}
          style={{
            borderLeft: `4px solid ${(stats?.overdue || 0) > 0 ? 'var(--danger)' : '#94a3b8'}`,
            cursor: 'pointer'
          }}
          title="Click to view full overdue list & parent contacts"
        >
          <div className="stat-label">Overdue Returns</div>
          <div className="stat-value" style={{ color: (stats?.overdue || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {stats?.overdue || 0}
          </div>
          <div className="stat-sub">
            {(stats?.overdue || 0) > 0 ? '🚨 Click to review & call' : 'Exceeded return time'}
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <div
          className="card"
          onClick={() => onNavigateTab('rooms')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'var(--primary-subtle)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Home size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Room-wise Grid (E101-E215)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                View 30 rooms across 2 floors with occupant statuses
              </div>
            </div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => onNavigateTab('students')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)', color: '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Year-wise Student Directory
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Filter 1st, 2nd, 3rd, 4th Year with manual status override
              </div>
            </div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => onNavigateTab('mess')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(168, 85, 247, 0.1)', color: '#8b5cf6',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Utensils size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Mess Planning & Food Waste
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Meal-wise headcounts and daily food waste logging
              </div>
            </div>
          </div>
        </div>

        <div
          className="card"
          onClick={() => onNavigateTab('reports')}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Hostel Reports & CSV Export
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Daily, weekly, monthly trends & audit logs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Students Modal Popup */}
      {overdueModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(239, 68, 68, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <ShieldAlert size={22} color="var(--danger)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>
                  Overdue Students ({overdueStudents.length})
                </h3>
              </div>
              <button
                onClick={() => setOverdueModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {overdueStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>No students are currently overdue!</p>
                  <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>All students outside the hostel are within their approved return limits.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {overdueStudents.map(student => (
                    <div
                      key={student.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{student.full_name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            Room {student.room_number} • {student.admission_id}
                          </span>
                        </div>
                        <span className="badge badge-overdue">OVERDUE</span>
                      </div>

                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <div>
                          <strong>Expected Return:</strong> {student.outpass_expected_time || student.leave_expected_date || 'Past Curfew'}
                        </div>
                        {student.outpass_destination && (
                          <div>
                            <strong>Destination:</strong> {student.outpass_destination}
                          </div>
                        )}
                      </div>

                      <div style={{
                        marginTop: '0.35rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Parent: <strong>{student.parent_name || 'Guardian'}</strong> ({student.parent_phone})
                        </div>
                        <a
                          href={`tel:${student.student_phone || student.parent_phone}`}
                          className="btn btn-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={14} /> Call Student: {student.student_phone || student.parent_phone}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              padding: '0.875rem 1.5rem',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--bg-secondary)'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setOverdueModalOpen(false)}
                style={{ fontWeight: 700 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
