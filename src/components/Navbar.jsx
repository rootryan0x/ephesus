import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from './StatusBadge';
import { QuickRoleSwitch } from './QuickRoleSwitch';
import { Building2, UserCircle, LogOut, RefreshCw, Clock, ShieldCheck, Sun, Moon } from 'lucide-react';
import { api } from '../api/client';

export function Navbar({ onOpenSwitcher }) {
  const { user, student, logout, isWarden } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [time, setTime] = useState('');
  const [hostelConfig, setHostelConfig] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.getConfig()
      .then(res => setHostelConfig(res.config))
      .catch(() => {});
  }, []);

  const isWardenOnDuty = hostelConfig?.warden_status === 'ON_DUTY';

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-icon-box">
              <Building2 size={22} />
            </div>
            <div className="brand-titles">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="brand-title">EPHESUS HOSTEL</span>
                <div className="brand-live-badge" title="Ephesus Campus Online">
                  <span className="beacon-ping"></span>
                  <span className="beacon-core"></span>
                  <span className="beacon-text">LIVE</span>
                </div>
              </div>
              <span className="brand-subtitle">Providence College of Engineering</span>
            </div>
          </div>

          <div className="nav-actions">
            {/* Live Clock */}
            <div className="desktop-time" style={{
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)'
            }}>
              <Clock size={13} color="var(--primary)" />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{time}</span>
            </div>

            {/* Warden On Duty Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isWardenOnDuty ? 'var(--success-bg)' : 'var(--warning-bg)',
              color: isWardenOnDuty ? 'var(--success-text)' : 'var(--warning-text)',
              border: `1px solid ${isWardenOnDuty ? 'var(--success-border)' : 'var(--warning-border)'}`,
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)'
            }}>
              <ShieldCheck size={14} />
              <span>
                {isWardenOnDuty
                  ? `Warden: ${hostelConfig?.warden_name?.split(' ')[1] || 'Abraham'}`
                  : `In-Charge: ${hostelConfig?.incharge_name?.split(' ')[1] || 'Mathew'}`}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {isDark ? (
                <>
                  <Sun size={14} color="#f59e0b" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} color="#6366f1" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Dark</span>
                </>
              )}
            </button>

            {/* User Pill & Quick Switch */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSwitchModal(true)}
                  title="Switch between Warden and Student accounts for evaluation"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  <RefreshCw size={13} />
                  <span style={{ fontWeight: 600 }}>Switch Role</span>
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.5rem 0.25rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {user.fullName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {isWarden ? user.role : `Room ${student?.room_number || ''}`}
                    </div>
                  </div>
                  {student && <StatusBadge status={student.current_status} />}
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={logout}
                  title="Sign out"
                  style={{ padding: '0.45rem 0.6rem' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <QuickRoleSwitch
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
      />

      <style>{`
        @media (min-width: 768px) {
          .desktop-time { display: flex !important; }
        }
      `}</style>
    </>
  );
}
