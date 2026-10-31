import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Zap, Bus, Settings, CheckCircle2, ShieldCheck, Plus, Trash2, Clock, Cpu } from 'lucide-react';

export function FacilitiesBusManager() {
  const [facilities, setFacilities] = useState([]);
  const [buses, setBuses] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // New Bus Trip Form
  const [newRoute, setNewRoute] = useState('Hostel -> College');
  const [newTime, setNewTime] = useState('08:15 AM');
  const [newBusNumber, setNewBusNumber] = useState('KL-30-E-4102');
  const [newNotes, setNewNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, bRes, cRes] = await Promise.all([
        api.getFacilities(),
        api.getBusSchedules(),
        api.getConfig()
      ]);
      setFacilities(fRes.facilities || []);
      setBuses(bRes.schedules || []);
      setConfig(cRes.config || {});
    } catch (err) {
      console.error('Failed to load facility/bus/config data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateFacility = async (key, status, status_level, description) => {
    try {
      await api.updateFacility(key, { status, status_level, description });
      setFeedback('Facility status updated.');
      fetchData();
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await api.updateConfig(config);
      setFeedback('Hostel & Warden configuration saved.');
      fetchData();
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      await api.addBusSchedule({
        route: newRoute,
        departure_time: newTime,
        bus_number: newBusNumber,
        notes: newNotes
      });
      setFeedback('New college bus schedule added.');
      setNewNotes('');
      fetchData();
    } catch (err) {
      setFeedback(err.message);
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Remove this bus schedule?')) return;
    try {
      await api.deleteBusSchedule(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Hostel Facilities, Bus Service & Warden Settings
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Manage hostel utilities, bus dispatch, in-charge handover, and leave deadlines
        </p>
      </div>

      {feedback && (
        <div className="alert badge-in-hostel" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Facilities Manager Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Zap size={18} color="var(--primary)" /> Live Hostel Facilities Status
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {facilities.map(f => (
              <div key={f.key} style={{
                background: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.875rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {f.name}
                  </span>
                  <select
                    className="form-control"
                    style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    value={f.status_level}
                    onChange={e => handleUpdateFacility(f.key, f.status, e.target.value, f.description)}
                  >
                    <option value="NORMAL">Normal (Green)</option>
                    <option value="WARNING">Warning (Amber)</option>
                    <option value="CRITICAL">Critical (Red)</option>
                  </select>
                </div>

                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}
                  defaultValue={f.status}
                  onBlur={e => {
                    if (e.target.value !== f.status) {
                      handleUpdateFacility(f.key, e.target.value, f.status_level, f.description);
                    }
                  }}
                  placeholder="Status headline (e.g. KSEB Mains Active, Generator Running...)"
                />

                <input
                  type="text"
                  className="form-control"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', color: 'var(--text-secondary)' }}
                  defaultValue={f.description}
                  onBlur={e => {
                    if (e.target.value !== f.description) {
                      handleUpdateFacility(f.key, f.status, f.status_level, e.target.value);
                    }
                  }}
                  placeholder="Detail notes..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Warden Duty & Hostel Configuration */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShieldCheck size={18} color="var(--primary)" /> Warden Status & Handover
            </h3>
          </div>

          <form onSubmit={handleSaveConfig}>
            <div className="form-group">
              <label className="form-label">Chief Warden Status</label>
              <select
                className="form-control"
                value={config.warden_status || 'ON_DUTY'}
                onChange={e => setConfig({ ...config, warden_status: e.target.value })}
              >
                <option value="ON_DUTY">On Duty (Warden Present)</option>
                <option value="ON_LEAVE">Warden on Leave (In-Charge Active)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Chief Warden Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.warden_name || ''}
                  onChange={e => setConfig({ ...config, warden_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warden Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.warden_phone || ''}
                  onChange={e => setConfig({ ...config, warden_phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Assistant Warden / In-Charge</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.incharge_name || ''}
                  onChange={e => setConfig({ ...config, incharge_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">In-Charge Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.incharge_phone || ''}
                  onChange={e => setConfig({ ...config, incharge_phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Weekend Leave Deadline</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.weekend_leave_deadline || '10:00 PM'}
                  onChange={e => setConfig({ ...config, weekend_leave_deadline: e.target.value })}
                  placeholder="e.g. 10:00 PM previous day"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Return Confirm Deadline</label>
                <input
                  type="text"
                  className="form-control"
                  value={config.return_confirmation_deadline || 'Sunday 1:00 PM'}
                  onChange={e => setConfig({ ...config, return_confirmation_deadline: e.target.value })}
                  placeholder="e.g. Sunday 1:00 PM"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Save Configuration Updates
            </button>
          </form>
        </div>
      </div>

      {/* College Bus Schedules Manager */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Bus size={18} color="var(--primary)" /> Providence College Bus Service Schedules
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Current Bus Trips
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {buses.map(b => (
                <div key={b.id} style={{
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {b.departure_time} • {b.route}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Bus: {b.bus_number} • {b.notes}
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDeleteBus(b.id)}
                    style={{ padding: '0.3rem 0.5rem', color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Bus Schedule Form */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Add New Bus Departure
            </h4>

            <form onSubmit={handleAddBus}>
              <div className="form-group">
                <label className="form-label">Route</label>
                <select className="form-control" value={newRoute} onChange={e => setNewRoute(e.target.value)}>
                  <option value="Hostel -> College">Hostel → Providence College</option>
                  <option value="College -> Hostel">Providence College → Hostel</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Departure Time</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="08:15 AM"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bus Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="KL-30-E-4102"
                    value={newBusNumber}
                    onChange={e => setNewBusNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Purpose</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Regular morning trip / Late lab return"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '0.25rem' }}>
                <Plus size={14} /> Add Bus Trip
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
