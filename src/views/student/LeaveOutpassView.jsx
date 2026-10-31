import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Compass, Plus, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, XCircle } from 'lucide-react';

export function LeaveOutpassView() {
  const { user, student } = useAuth();
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'outpasses'
  const [leaves, setLeaves] = useState([]);
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyType, setApplyType] = useState('LEAVE'); // 'LEAVE' | 'OUTPASS'

  // Leave Form State
  const [leaveType, setLeaveType] = useState('WEEKEND');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departureRoute, setDepartureRoute] = useState('Route A: Hostel → Home directly');
  const [returnRoute, setReturnRoute] = useState('Route C: Home → Hostel directly on return');
  const [studentContact, setStudentContact] = useState(user?.phone || '+91 98470 12345');
  const [parentContact, setParentContact] = useState(student?.parent_phone || '+91 94470 11223');

  useEffect(() => {
    if (user?.phone) setStudentContact(user.phone);
    if (student?.parent_phone) setParentContact(student.parent_phone);
  }, [user?.phone, student?.parent_phone]);

  // Outpass Form State
  const [outpassPurpose, setOutpassPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [outpassDate, setOutpassDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedOutTime, setExpectedOutTime] = useState('04:30 PM');
  const [expectedInTime, setExpectedInTime] = useState('07:30 PM');

  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lData, oData] = await Promise.all([
        api.getMyLeaves(),
        api.getMyOutpasses()
      ]);
      setLeaves(lData.leaves || []);
      setOutpasses(oData.outpasses || []);
    } catch (err) {
      console.error('Failed to load leave/outpass data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [student?.id]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      await api.applyLeave({
        leave_type: leaveType,
        purpose,
        leave_start_date: startDate,
        expected_return_date: returnDate,
        departure_route: departureRoute,
        return_route: returnRoute,
        route_type: `${departureRoute} | Return: ${returnRoute}`,
        student_contact: studentContact,
        parent_contact: parentContact
      });
      setFeedback({ type: 'success', text: 'Leave application submitted to Warden!' });
      setShowApplyModal(false);
      setPurpose('');
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application? Attendance and mess headcount will be updated immediately.')) {
      return;
    }
    setCancellingId(id);
    setFeedback(null);
    try {
      const res = await api.cancelLeave(id);
      setFeedback({ type: 'success', text: res.message || 'Leave application cancelled successfully.' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setCancellingId(null);
    }
  };

  const handleApplyOutpass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      await api.applyOutpass({
        purpose: outpassPurpose,
        destination,
        date: outpassDate,
        expected_out_time: expectedOutTime,
        expected_in_time: expectedInTime,
        student_contact: studentContact,
        parent_contact: parentContact
      });
      setFeedback({ type: 'success', text: 'Outpass application submitted to Warden!' });
      setShowApplyModal(false);
      setOutpassPurpose('');
      setDestination('');
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOutpass = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this town outpass request?')) {
      return;
    }
    setCancellingId(id);
    setFeedback(null);
    try {
      const res = await api.cancelOutpass(id);
      setFeedback({ type: 'success', text: res.message || 'Outpass cancelled successfully.' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Leave & Outpass Passes
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Digital movement approvals for Ephesus Hostel
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setApplyType('OUTPASS'); setShowApplyModal(true); }}
          >
            <Compass size={15} /> Apply Outpass
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setApplyType('LEAVE'); setShowApplyModal(true); }}
          >
            <Plus size={15} /> Apply Weekend Leave
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'badge-in-hostel' : 'alert-warning'}`} style={{ marginBottom: '1rem' }}>
          {feedback.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <Calendar size={16} />
          Weekend / Home Leaves ({leaves.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'outpasses' ? 'active' : ''}`}
          onClick={() => setActiveTab('outpasses')}
        >
          <Compass size={16} />
          Outpass Requests ({outpasses.length})
        </button>
      </div>

      {/* Leaves Tab Content */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaves.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>No leave applications submitted yet.</p>
            </div>
          ) : (
            leaves.map(l => (
              <div
                key={l.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)'
                }}
              >
                {/* 1. Card Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 'var(--radius-md)',
                      background: l.leave_type === 'WEEKEND' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                      color: l.leave_type === 'WEEKEND' ? 'var(--primary)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {l.leave_type === 'WEEKEND' ? 'Weekend Home Leave' : 'Official Home Leave'}
                        </span>
                        <span className={`badge ${
                          l.status === 'APPROVED' ? 'badge-in-hostel' :
                          l.status === 'ACTIVE' ? 'badge-on-leave' :
                          l.status === 'RETURNED' ? 'badge-in-hostel' :
                          l.status === 'CANCELLED' ? 'badge-cancelled' :
                          l.status === 'REJECTED' ? 'badge-overdue' : 'badge-at-college'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Leave Application #{l.id} • Submitted on {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {l.status === 'APPROVED' && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success-border)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--success-text)',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={14} />
                      Approved. Scan Leave OUT when departing.
                    </div>
                  )}
                </div>

                {/* 2. Purpose */}
                {l.purpose && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--primary)',
                    lineHeight: 1.4
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Purpose: </strong>
                    {l.purpose}
                  </div>
                )}

                {/* 3. Structured Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Departure Date
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {l.leave_start_date}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {l.departure_route || 'Hostel → Home'}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Expected Return
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: l.new_return_date ? 'var(--purple)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {l.new_return_date || l.expected_return_date}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {l.return_route || 'Home → Hostel'}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Parent Contact
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {l.parent_contact}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--success-text)', marginTop: '0.15rem' }}>
                      ✓ Emergency contact
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Student Phone
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {l.student_contact || user?.phone || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Verified mobile
                    </div>
                  </div>
                </div>

                {/* 4. Footer Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {l.status === 'WARDEN_PENDING' && (
                      <span style={{ color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> Application is awaiting Warden approval.
                      </span>
                    )}
                    {l.status === 'APPROVED' && (
                      <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Valid for departure on {l.leave_start_date}.
                      </span>
                    )}
                    {l.status === 'CANCELLED' && (
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertCircle size={14} /> Application was cancelled by student.
                      </span>
                    )}
                    {l.status === 'ACTIVE' && (
                      <span style={{ color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={14} /> Currently active — student is on leave.
                      </span>
                    )}
                    {l.status === 'RETURNED' && (
                      <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Student has returned and checked in.
                      </span>
                    )}
                  </div>

                  {['WARDEN_PENDING', 'SUBMITTED', 'APPROVED'].includes(l.status) && (
                    <button
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.45rem 0.95rem',
                        color: '#ef4444',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      disabled={cancellingId === l.id}
                      onClick={() => handleCancelLeave(l.id)}
                    >
                      <XCircle size={14} />
                      {cancellingId === l.id ? 'Cancelling...' : 'Cancel Application'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Outpasses Tab Content */}
      {activeTab === 'outpasses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {outpasses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Compass size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p>No outpasses applied yet.</p>
            </div>
          ) : (
            outpasses.map(o => (
              <div
                key={o.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)'
                }}
              >
                {/* 1. Card Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(14, 165, 233, 0.12)',
                      color: 'var(--info)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Compass size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          Destination: {o.destination}
                        </span>
                        <span className={`badge ${
                          o.status === 'APPROVED' ? 'badge-in-hostel' :
                          o.status === 'ACTIVE' ? 'badge-on-outpass' :
                          o.status === 'RETURNED' ? 'badge-in-hostel' :
                          o.status === 'CANCELLED' ? 'badge-cancelled' :
                          o.status === 'REJECTED' ? 'badge-overdue' : 'badge-at-college'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Town Outpass #{o.id} • Scheduled for {o.date}
                      </div>
                    </div>
                  </div>

                  {o.status === 'APPROVED' && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'var(--info-bg)',
                      border: '1px solid var(--info-border)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      color: 'var(--info-text)',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={14} />
                      Approved. Scan Outpass OUT to leave.
                    </div>
                  )}
                </div>

                {/* 2. Purpose */}
                {o.purpose && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--info)',
                    lineHeight: 1.4
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Purpose: </strong>
                    {o.purpose}
                  </div>
                )}

                {/* 3. Structured Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Date of Visit
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {o.date}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {o.destination}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Expected Timings
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {o.expected_out_time} - {o.expected_in_time}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Same-day return
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Parent Contact
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {o.parent_contact}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--success-text)', marginTop: '0.15rem' }}>
                      ✓ Emergency contact
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Student Phone
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {o.student_contact || user?.phone || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Verified mobile
                    </div>
                  </div>
                </div>

                {/* 4. Footer Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {o.status === 'WARDEN_PENDING' && (
                      <span style={{ color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} /> Outpass request is awaiting Warden approval.
                      </span>
                    )}
                    {o.status === 'APPROVED' && (
                      <span style={{ color: 'var(--info-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Approved for travel on {o.date}.
                      </span>
                    )}
                    {o.status === 'CANCELLED' && (
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertCircle size={14} /> Outpass was cancelled by student.
                      </span>
                    )}
                    {o.status === 'ACTIVE' && (
                      <span style={{ color: 'var(--info-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Compass size={14} /> Currently out in town. Return by {o.expected_in_time}.
                      </span>
                    )}
                    {o.status === 'RETURNED' && (
                      <span style={{ color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> Student has returned to hostel.
                      </span>
                    )}
                  </div>

                  {['WARDEN_PENDING', 'SUBMITTED', 'APPROVED'].includes(o.status) && (
                    <button
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.45rem 0.95rem',
                        color: '#ef4444',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      disabled={cancellingId === o.id}
                      onClick={() => handleCancelOutpass(o.id)}
                    >
                      <XCircle size={14} />
                      {cancellingId === o.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                {applyType === 'LEAVE' ? 'Apply for Weekend / Home Leave' : 'Apply for Town Outpass'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {applyType === 'LEAVE' ? (
                <form onSubmit={handleApplyLeave}>
                  <div className="form-group">
                    <label className="form-label">Leave Category</label>
                    <select className="form-control" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                      <option value="WEEKEND">Weekend Leave</option>
                      <option value="HOME">Official Home Leave</option>
                    </select>
                  </div>

                  {/* Two separate route selectors as requested */}
                  <div className="form-group">
                    <label className="form-label">Going / Departure Route *</label>
                    <select
                      className="form-control"
                      value={departureRoute}
                      onChange={e => setDepartureRoute(e.target.value)}
                    >
                      <option value="Route A: Hostel → Home directly">Route A: Hostel → Home directly</option>
                      <option value="Route B: Hostel → College → Home">Route B: Hostel → College → Home (departing after classes)</option>
                    </select>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Select how you depart Ephesus Hostel for home.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Coming / Return Route *</label>
                    <select
                      className="form-control"
                      value={returnRoute}
                      onChange={e => setReturnRoute(e.target.value)}
                    >
                      <option value="Route C: Home → Hostel directly on return">Route C: Home → Hostel directly on return</option>
                      <option value="Route D: Home → College → Hostel (using College Bus)">Route D: Home → College → Hostel (using College Bus)</option>
                    </select>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Select how you return to Ephesus Hostel.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Leave Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expected Return Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={returnDate}
                        onChange={e => setReturnDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purpose of Travel *</label>
                    <textarea
                      className="form-control"
                      placeholder="e.g. Weekend home visit, family occasion..."
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Student Contact Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={studentContact}
                        onChange={e => setStudentContact(e.target.value)}
                        placeholder="+91 98470 12345"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Parent / Guardian Contact *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={parentContact}
                        onChange={e => setParentContact(e.target.value)}
                        placeholder="+91 94470 11223"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '0.75rem' }}>
                    {submitting ? 'Submitting...' : 'Submit Leave Application'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleApplyOutpass}>
                  <div className="form-group">
                    <label className="form-label">Destination *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Chengannur Town Market / Medical Store"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purpose *</label>
                    <textarea
                      className="form-control"
                      placeholder="e.g. Purchase project stationery and medical supplies"
                      value={outpassPurpose}
                      onChange={e => setOutpassPurpose(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Expected OUT Time *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={expectedOutTime}
                        onChange={e => setExpectedOutTime(e.target.value)}
                        placeholder="04:30 PM"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expected IN Time *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={expectedInTime}
                        onChange={e => setExpectedInTime(e.target.value)}
                        placeholder="07:30 PM"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Student Contact *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={studentContact}
                        onChange={e => setStudentContact(e.target.value)}
                        placeholder="+91 98470 12345"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Parent Contact *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={parentContact}
                        onChange={e => setParentContact(e.target.value)}
                        placeholder="+91 94470 11223"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '0.75rem' }}>
                    {submitting ? 'Submitting...' : 'Submit Outpass Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
