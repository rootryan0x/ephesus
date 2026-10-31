import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Bell, AlertTriangle, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.getAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !message) return;

    setSubmitting(true);
    try {
      await api.createAnnouncement({
        title,
        message,
        priority,
        target_audience: targetAudience
      });
      setFeedback('Announcement broadcasted to hostel students.');
      setTitle('');
      setMessage('');
      fetchAnnouncements();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Announcements & Emergency Broadcasts
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Publish hostel notices, leave deadlines, maintenance bulletins, and urgent emergency alerts
        </p>
      </div>

      {feedback && (
        <div className="alert badge-in-hostel" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Create Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Bell size={18} color="var(--primary)" /> Broadcast New Announcement
            </h3>
          </div>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Headline / Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Internet Maintenance Tonight / Bus Timing Changed"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Priority Level *</label>
                <select
                  className="form-control"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="IMPORTANT">Important (Yellow Banner)</option>
                  <option value="EMERGENCY">Emergency (Red Flash Alert)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Audience *</label>
                <select
                  className="form-control"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                >
                  <option value="ALL">All Hostel Students</option>
                  <option value="First Year">First Year Only</option>
                  <option value="Second Year">Second Year Only</option>
                  <option value="Third Year">Third Year Only</option>
                  <option value="Fourth Year">Fourth Year Only</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notice Message *</label>
              <textarea
                className="form-control"
                placeholder="Write detailed hostel announcement..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </form>
        </div>

        {/* Existing Announcements List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShieldAlert size={18} color="var(--primary)" /> Active Announcements ({announcements.length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 420, overflowY: 'auto' }}>
            {announcements.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                No announcements published.
              </div>
            ) : (
              announcements.map(a => (
                <div
                  key={a.id}
                  style={{
                    background: a.priority === 'EMERGENCY' ? '#fef2f2' : a.priority === 'IMPORTANT' ? '#fffbeb' : '#f8fafc',
                    border: `1px solid ${a.priority === 'EMERGENCY' ? '#fecaca' : a.priority === 'IMPORTANT' ? '#fde68a' : 'var(--border-light)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${
                          a.priority === 'EMERGENCY' ? 'badge-overdue' :
                          a.priority === 'IMPORTANT' ? 'badge-at-college' : 'badge-in-hostel'
                        }`}>
                          {a.priority}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {a.title}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.375rem 0' }}>
                        {a.message}
                      </p>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Target: <strong>{a.target_audience}</strong> • By {a.author_name} • {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(a.id)}
                      style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
