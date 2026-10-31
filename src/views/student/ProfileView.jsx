import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Home, BookOpen, Calendar, ShieldCheck, HeartHandshake } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export function ProfileView() {
  const { user, student } = useAuth();

  if (!user || !student) return null;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Student Digital Profile
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Official registration records at Ephesus Hostel, Providence College of Engineering
        </p>
      </div>

      <div className="card" style={{ padding: '1.75rem' }}>
        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary) 0%, #1e1b4b 100%)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {user.fullName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {student.admission_id} • {student.year}
              </p>
            </div>
          </div>

          <StatusBadge status={student.current_status} />
        </div>

        {/* Profile Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
              <Home size={15} /> Room Number
            </label>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Room {student.room_number} (Ephesus Main)
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
              <BookOpen size={15} /> Department
            </label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {student.department}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
              <Mail size={15} /> College Email ID
            </label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {user.email}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
              <Phone size={15} /> Student Phone
            </label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {user.phone || 'N/A'}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
              <HeartHandshake size={15} /> Parent / Guardian Name
            </label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {student.parent_name}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)' }}>
              <Phone size={15} /> Parent Contact Number
            </label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {student.parent_phone}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldCheck size={20} color="var(--primary)" />
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Student profile is verified by the Providence College Academic Directorate. Privacy protection is enabled: personal leave and movement records are strictly visible only to you and authorized hostel wardens.
          </div>
        </div>
      </div>
    </div>
  );
}
