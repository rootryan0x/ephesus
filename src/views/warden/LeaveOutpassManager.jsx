import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Calendar, Compass, CheckCircle2, XCircle, Search, Filter, Clock } from 'lucide-react';

export function LeaveOutpassManager() {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'outpasses'
  const [leaves, setLeaves] = useState([]);
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [remarks, setRemarks] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lData, oData] = await Promise.all([
        api.getAllLeaves({ status: statusFilter, search }),
        api.getAllOutpasses({ status: statusFilter, search })
      ]);
      setLeaves(lData.leaves || []);
      setOutpasses(oData.outpasses || []);
    } catch (err) {
      console.error('Error fetching leave/outpass approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, search]);

  const handleLeaveAction = async (id, action) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.actionLeave(id, action, remarks[id] || '');
      setFeedback({ type: 'success', text: `Leave application ${action.toLowerCase()}d successfully.` });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOutpassAction = async (id, action) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.actionOutpass(id, action, remarks[id] || '');
      setFeedback({ type: 'success', text: `Outpass ${action.toLowerCase()}d successfully.` });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application? Mess headcount and attendance will update immediately.')) {
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.cancelLeave(id);
      setFeedback({ type: 'success', text: 'Leave application cancelled successfully.' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOutpass = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this outpass?')) {
      return;
    }
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.cancelOutpass(id);
      setFeedback({ type: 'success', text: 'Outpass cancelled successfully.' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
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
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Leave & Outpass Approvals
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Review, authorize, and monitor student weekend travel and town outpasses
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="WARDEN_PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active (Student Departed)</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
          </select>
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
          Town Outpasses ({outpasses.length})
        </button>
      </div>

      {/* Leaves View */}
      {activeTab === 'leaves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaves.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No leave applications matching selected status.
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
                {/* 1. Header */}
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
                          {l.full_name}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                          Room {l.room_number}
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
                        {l.leave_type === 'WEEKEND' ? 'Weekend Home Leave' : 'Official Home Leave'} • Leave #{l.id} • Dept: {l.department} ({l.year})
                      </div>
                    </div>
                  </div>

                  {l.status === 'APPROVED' && (
                    <button
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.8rem',
                        color: '#ef4444',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                      disabled={actionLoading}
                      onClick={() => handleCancelLeave(l.id)}
                    >
                      <XCircle size={14} />
                      Cancel Approval
                    </button>
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

                {/* 3. Details Grid */}
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
                      Departure
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {l.leave_start_date}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {l.departure_route || l.route_type || 'Hostel → Home'}
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
                      Student Contact
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {l.student_contact || l.phone || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {l.email}
                    </div>
                  </div>
                </div>

                {l.warden_remarks && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(99,102,241,0.06)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Warden Remarks:</strong> {l.warden_remarks}
                  </div>
                )}

                {/* 4. Action Row */}
                {l.status === 'WARDEN_PENDING' && (
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
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <input
                        type="text"
                        placeholder="Remarks / conditions for approval..."
                        className="form-control"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                        value={remarks[l.id] || ''}
                        onChange={e => setRemarks({ ...remarks, [l.id]: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-success btn-sm"
                        style={{ padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleLeaveAction(l.id, 'APPROVE')}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={14} /> Approve Leave
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleLeaveAction(l.id, 'REJECT')}
                        disabled={actionLoading}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Outpasses View */}
      {activeTab === 'outpasses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {outpasses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No outpasses matching selected status.
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
                {/* 1. Header */}
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
                          {o.full_name}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                          Room {o.room_number}
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
                        Town Outpass #{o.id} • Destination: {o.destination} • Date: {o.date}
                      </div>
                    </div>
                  </div>

                  {o.status === 'APPROVED' && (
                    <button
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.4rem 0.8rem',
                        color: '#ef4444',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                      disabled={actionLoading}
                      onClick={() => handleCancelOutpass(o.id)}
                    >
                      <XCircle size={14} />
                      Cancel Approval
                    </button>
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

                {/* 3. Details Grid */}
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
                      Date & Destination
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {o.destination}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {o.date}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Timings
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {o.expected_out_time} - {o.expected_in_time}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Same-day outpass
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
                      {o.student_contact || o.phone || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Verified mobile
                    </div>
                  </div>
                </div>

                {/* 4. Action Row */}
                {o.status === 'WARDEN_PENDING' && (
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
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <input
                        type="text"
                        placeholder="Remarks / timing limit for outpass..."
                        className="form-control"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                        value={remarks[o.id] || ''}
                        onChange={e => setRemarks({ ...remarks, [o.id]: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-success btn-sm"
                        style={{ padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleOutpassAction(o.id, 'APPROVE')}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 size={14} /> Approve Outpass
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleOutpassAction(o.id, 'REJECT')}
                        disabled={actionLoading}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
