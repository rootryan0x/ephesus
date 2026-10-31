import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Wrench, CheckCircle2, Clock, Image, AlertCircle } from 'lucide-react';

export function ComplaintsCenter() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getAllComplaints({
        status: statusFilter,
        category: categoryFilter
      });
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      await api.updateComplaintStatus(selectedComplaint.id, newStatus, adminNotes);
      setFeedback('Complaint status updated successfully.');
      setSelectedComplaint(null);
      setAdminNotes('');
      fetchComplaints();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setUpdating(false);
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
            Maintenance & Complaints Resolution
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Track and resolve electrical, Wi-Fi, plumbing, and room issues raised by students
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Wi-Fi">Wi-Fi</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Water">Water</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Room">Room</option>
            <option value="Furniture">Furniture</option>
            <option value="Mess/Food">Mess/Food</option>
          </select>
        </div>
      </div>

      {feedback && (
        <div className="alert badge-in-hostel" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {complaints.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            No complaints found matching current filters.
          </div>
        ) : (
          complaints.map(c => (
            <div key={c.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: 800, fontSize: '0.9rem',
                      background: 'var(--primary-subtle)', color: 'var(--primary)',
                      padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)'
                    }}>
                      {c.category}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                      Room {c.room_number} • {c.student_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({c.department})
                    </span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                    {c.description}
                  </p>

                  {c.admin_notes && (
                    <div style={{
                      background: '#f8fafc',
                      borderLeft: '3px solid var(--primary)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong>Resolution Note:</strong> {c.admin_notes}
                    </div>
                  )}

                  {c.photo_url && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={c.photo_url}
                        alt="Complaint Attachment"
                        style={{ maxWidth: 200, maxHeight: 130, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${
                    c.status === 'RESOLVED' || c.status === 'CLOSED' ? 'badge-in-hostel' :
                    c.status === 'IN_PROGRESS' ? 'badge-at-college' : 'badge-on-leave'
                  }`}>
                    {c.status}
                  </span>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedComplaint(c);
                      setNewStatus(c.status);
                      setAdminNotes(c.admin_notes || '');
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Modal */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Update Maintenance Status • Room {selectedComplaint.room_number}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedComplaint(null)}>✕</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleUpdateStatus}>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-control"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="PENDING">Pending Parts / Technician</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved (Repaired)</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin / Maintenance Note</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Electrician replaced ceiling fixture and confirmed power restoration..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={updating} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {updating ? 'Saving...' : 'Save Resolution'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
