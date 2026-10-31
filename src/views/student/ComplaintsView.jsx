import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Wrench, Plus, CheckCircle2, Clock, Camera, AlertCircle } from 'lucide-react';

export function ComplaintsView() {
  const { student } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [category, setCategory] = useState('Wi-Fi');
  const [description, setDescription] = useState('');
  const [roomNumber, setRoomNumber] = useState(student?.room_number || 'E101');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const categories = [
    'Wi-Fi', 'Electrical', 'Plumbing', 'Water',
    'Cleaning', 'Room', 'Furniture', 'Mess/Food', 'Bathroom', 'Other'
  ];

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getMyComplaints();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.room_number) {
      setRoomNumber(student.room_number);
    }
  }, [student?.room_number]);

  useEffect(() => {
    fetchComplaints();
  }, [student?.id]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('room_number', roomNumber);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await api.submitComplaint(formData);
      setFeedback('Complaint submitted successfully. Assigned for maintenance.');
      setShowModal(false);
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchComplaints();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'badge-in-hostel';
      case 'IN_PROGRESS':
        return 'badge-at-college';
      case 'PENDING':
        return 'badge-on-leave';
      default:
        return 'badge-on-outpass';
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
            Maintenance & Complaints
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Report issues regarding Wi-Fi, electricity, plumbing, water, or room maintenance
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Raise Complaint
        </button>
      </div>

      {feedback && (
        <div className="alert badge-in-hostel" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <Wrench size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No active complaints</p>
          <p style={{ fontSize: '0.8rem' }}>All facilities in your room and block are currently reported normal.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {complaints.map(c => (
            <div key={c.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: 800, fontSize: '0.95rem',
                      background: 'var(--primary-subtle)', color: 'var(--primary)',
                      padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)'
                    }}>
                      {c.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Room {c.room_number} • {new Date(c.created_at).toLocaleDateString()}
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
                      <strong>Warden Note:</strong> {c.admin_notes}
                    </div>
                  )}

                  {c.photo_url && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={c.photo_url}
                        alt="Complaint Attachment"
                        style={{ maxWidth: 180, maxHeight: 120, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                <span className={`badge ${getStatusColor(c.status)}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Register Room / Facility Complaint
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Room Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={roomNumber}
                      onChange={e => setRoomNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description *</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe the issue accurately..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attach Photo (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handlePhotoChange}
                  />
                  {photoPreview && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
