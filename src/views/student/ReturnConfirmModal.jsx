import React, { useState } from 'react';
import { api } from '../../api/client';
import { Bell, CheckCircle2, Calendar, Clock, AlertCircle, X } from 'lucide-react';

export function ReturnConfirmModal({ isOpen, onClose, pendingData, onConfirmed }) {
  const [extending, setExtending] = useState(false);
  const [newReturnDate, setNewReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen || !pendingData) return null;

  const handleConfirmYes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.submitReturnConfirm({
        confirmation_id: pendingData.id,
        intention: 'CONFIRMED_RETURNING'
      });
      onConfirmed();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExtension = async (e) => {
    e.preventDefault();
    if (!newReturnDate || !reason) {
      setErrorMsg('Please select a new return date and state the reason.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.submitReturnConfirm({
        confirmation_id: pendingData.id,
        intention: 'EXTENDING_LEAVE',
        new_return_date: newReturnDate,
        extension_reason: reason
      });
      onConfirmed();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: '#fef3c7', color: '#b45309',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                Return Confirmation Required
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#b45309', margin: 0 }}>
                Ephesus Mess & Hostel Planning
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.25rem 0.5rem' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Scheduled Return Date:
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {pendingData.scheduled_return_date}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Purpose: {pendingData.purpose}
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            To ensure correct food preparation and reduce food wastage, please confirm if you will be returning to Ephesus Hostel as scheduled.
          </p>

          {!extending ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-success btn-lg"
                onClick={handleConfirmYes}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
              >
                <CheckCircle2 size={18} /> YES, I'M RETURNING AS SCHEDULED
              </button>

              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setExtending(true)}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--border-light)' }}
              >
                <Calendar size={18} /> EXTEND MY LEAVE
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmExtension}>
              <div className="form-group">
                <label className="form-label">Current Return Date</label>
                <input
                  type="text"
                  className="form-control"
                  value={pendingData.scheduled_return_date}
                  disabled
                  style={{ background: '#f1f5f9' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Proposed Return Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={newReturnDate}
                  onChange={e => setNewReturnDate(e.target.value)}
                  min={pendingData.scheduled_return_date}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Extension *</label>
                <textarea
                  className="form-control"
                  placeholder="e.g. Travel delay, family commitment, health reason..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>

              {errorMsg && (
                <div className="alert alert-warning" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setExtending(false)}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  Submit Extension
                </button>
              </div>
            </form>
          )}

          {errorMsg && !extending && (
            <div className="alert alert-warning" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
              <AlertCircle size={15} /> {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
