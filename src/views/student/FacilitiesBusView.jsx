import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Zap, Wifi, Droplets, Utensils, Bus, Clock, ShieldCheck, AlertCircle, Cpu } from 'lucide-react';

export function FacilitiesBusView() {
  const [facilities, setFacilities] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFacilities(),
      api.getBusSchedules()
    ])
      .then(([fRes, bRes]) => {
        setFacilities(fRes.facilities || []);
        setBuses(bRes.schedules || []);
      })
      .catch(err => console.error('Error fetching facilities/bus:', err))
      .finally(() => setLoading(false));
  }, []);

  const getFacilityIcon = (key) => {
    switch (key) {
      case 'electricity': return <Zap size={20} color="#f59e0b" />;
      case 'generator': return <Cpu size={20} color="#3b82f6" />;
      case 'wifi': return <Wifi size={20} color="#10b981" />;
      case 'water': return <Droplets size={20} color="#06b6d4" />;
      case 'mess': return <Utensils size={20} color="#8b5cf6" />;
      default: return <Zap size={20} />;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Hostel Facilities & Bus Schedules
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Live utility statuses and official Providence bus schedule
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Facilities Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Zap size={18} color="var(--primary)" /> Live Hostel Facilities
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Updated by Warden Desk</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {facilities.map(f => (
              <div
                key={f.key}
                className={`facility-pill status-${f.status_level.toLowerCase()}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-md)',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {getFacilityIcon(f.key)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {f.description}
                    </div>
                  </div>
                </div>

                <span className={`badge ${
                  f.status_level === 'NORMAL' ? 'badge-in-hostel' :
                  f.status_level === 'WARNING' ? 'badge-at-college' : 'badge-overdue'
                }`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bus Schedules Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Bus size={18} color="var(--primary)" /> Providence College Bus Service
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Route: Ephesus ↔ Main Campus</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {buses.map(b => (
              <div key={b.id} style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: 800, fontSize: '0.95rem',
                      fontFamily: 'var(--font-mono)', color: 'var(--primary)'
                    }}>
                      {b.departure_time}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {b.route}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Bus No: <strong>{b.bus_number}</strong> • {b.notes}
                  </div>
                </div>

                <span className={`badge ${b.status === 'ON_TIME' ? 'badge-in-hostel' : 'badge-at-college'}`}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
