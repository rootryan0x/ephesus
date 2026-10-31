import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { MovementActions } from './MovementActions';
import { QRScannerModal } from '../../components/QRScannerModal';
import { ReturnConfirmModal } from './ReturnConfirmModal';
import {
  Zap, Wifi, Utensils, Bus, Bell, AlertTriangle, ArrowRight,
  Clock, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';

export function StudentDashboard({ onNavigateTab }) {
  const { user, student, refreshProfile } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [buses, setBuses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [messData, setMessData] = useState(null);
  const [pendingReturnConfirm, setPendingReturnConfirm] = useState(null);
  const [recentMovements, setRecentMovements] = useState([]);

  // QR Scanner Modal State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [targetMovement, setTargetMovement] = useState('COLLEGE_OUT');

  // Return Confirm Modal State
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [fRes, bRes, aRes, mRes, rRes, hRes] = await Promise.all([
        api.getFacilities(),
        api.getBusSchedules(),
        api.getAnnouncements(),
        api.getMessDashboard(),
        api.getPendingReturnConfirm(),
        api.getMovementHistory({ limit: 5 })
      ]);

      setFacilities(fRes.facilities || []);
      setBuses(bRes.schedules || []);
      setAnnouncements(aRes.announcements || []);
      setMessData(mRes);
      setPendingReturnConfirm(rRes.pendingNotification || null);
      setRecentMovements(hRes.records || []);
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [student?.id, student?.current_status]);

  const handleSelectMovement = (type) => {
    setTargetMovement(type);
    setScannerOpen(true);
  };

  const handleScanSuccess = async () => {
    await refreshProfile();
    await fetchDashboardData();
  };

  if (!user || !student) return null;

  return (
    <div>
      {/* 1. Hero Status Banner */}
      <div className="student-hero-banner">
        <div className="hero-profile-row">
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7d2fe', fontWeight: 700 }}>
              EPHESUS HOSTEL • PROVIDENCE COLLEGE
            </div>
            <h1 className="hero-name">{user.fullName}</h1>
            <div className="hero-details">
              <span>Room <strong>{student.room_number}</strong></span>
              <span>•</span>
              <span>{student.department}</span>
              <span>•</span>
              <span>{student.year}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '0.72rem', background: 'rgba(255,255,255,0.18)',
              padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)',
              color: '#ffffff', fontFamily: 'var(--font-mono)'
            }}>
              {student.admission_id}
            </span>
          </div>
        </div>

        <div className="hero-status-box">
          <div>
            <div className="status-label">Your Live Hostel Status</div>
            <div className="status-current">
              <StatusBadge status={student.current_status} />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => {
              // Smart default movement based on status
              const nextType =
                student.current_status === 'IN_HOSTEL' ? 'COLLEGE_OUT' :
                student.current_status === 'AT_COLLEGE' ? 'COLLEGE_IN' :
                student.current_status === 'ON_WEEKEND_LEAVE' ? 'LEAVE_IN' : 'COLLEGE_OUT';
              handleSelectMovement(nextType);
            }}
            style={{
              background: '#ffffff',
              color: '#1e1b4b',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Sparkles size={16} color="var(--primary)" /> Scan QR Now
          </button>
        </div>
      </div>

      {/* 2. Sunday Return Confirmation Alert Banner (if due) */}
      {pendingReturnConfirm && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-lg)',
          backdropFilter: 'blur(16px)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--warning)' }}>
                Return Confirmation Deadline Required!
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                You are scheduled to return on <strong>{pendingReturnConfirm.scheduled_return_date}</strong>. Please confirm your intention for mess planning before the deadline.
              </p>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setReturnConfirmOpen(true)}
            style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 700 }}
          >
            Confirm Intention Now
          </button>
        </div>
      )}

      {/* 3. Emergency / Important Announcements */}
      {announcements.filter(a => a.priority === 'EMERGENCY' || a.priority === 'IMPORTANT').map(ann => (
        <div key={ann.id} className={ann.priority === 'EMERGENCY' ? 'alert alert-emergency' : 'alert alert-warning'}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>{ann.title}: </strong>
            <span>{ann.message}</span>
          </div>
        </div>
      ))}

      {/* 4. Movement Actions Section */}
      <MovementActions
        currentStatus={student.current_status}
        onSelectMovement={handleSelectMovement}
      />

      {/* 5. Mess & Food Planning Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* Food Waste Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Hostel Food Conservation
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {messData?.yesterdayFoodWaste || 8.4} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Yesterday's recorded food waste
            </div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-md)',
            background: 'var(--primary-subtle)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Utensils size={24} />
          </div>
        </div>

        {/* Bus Timings Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              College Bus Timings
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bus size={18} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            {buses.length > 0 ? (
              buses.slice(0, 3).map((b, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{b.route}</span>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {b.departure_time}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Morning: 08:15 AM, 08:40 AM | Evening: 04:15 PM</div>
            )}
          </div>
        </div>

        {/* Facilities Snapshot */}
        <div className="card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
            Hostel Facilities Status
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {facilities.map(f => (
              <span
                key={f.key}
                className={`badge ${f.status_level === 'NORMAL' ? 'badge-in-hostel' : 'badge-at-college'}`}
                style={{ fontSize: '0.7rem' }}
              >
                {f.name.split('/')[0].trim()}: {f.status}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Attendance Register (renamed from Recent Movement Records) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={18} color="var(--primary)" /> Your Attendance Register
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Verified attendance & movement ledger
          </span>
        </div>

        {recentMovements.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
            No movement records logged yet today.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Movement Type</th>
                  <th>Direction</th>
                  <th>Verification Source</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {new Date(r.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                      })}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {r.movement_type.replace(/_/g, ' ')}
                    </td>
                    <td>
                      <span className={`badge ${r.direction === 'OUT' ? 'badge-at-college' : 'badge-in-hostel'}`}>
                        {r.direction}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.source === 'WARDEN_OVERRIDE' ? 'Manual Override (Warden)' : 'Verified QR Scan'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        targetMovementType={targetMovement}
        onSuccess={handleScanSuccess}
      />

      {/* Return Confirmation Modal */}
      <ReturnConfirmModal
        isOpen={returnConfirmOpen}
        onClose={() => setReturnConfirmOpen(false)}
        pendingData={pendingReturnConfirm}
        onConfirmed={fetchDashboardData}
      />
    </div>
  );
}
