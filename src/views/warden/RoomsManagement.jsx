import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Home, Users, AlertCircle, Wrench, X, ShieldCheck } from 'lucide-react';

export function RoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('ALL'); // 'ALL' | 1 | 2
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await api.getRooms();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(r => {
    if (selectedFloor === 'ALL') return true;
    return r.floor === parseInt(selectedFloor);
  });

  const getOccupancyColor = (occ, cap) => {
    if (occ === cap) return '#10b981';
    if (occ > 0) return '#f59e0b';
    return '#94a3b8';
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Hostel Rooms & Occupancy Grid
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            30 residential rooms across Ground and First Floors • Ephesus Main Block
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${selectedFloor === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedFloor('ALL')}
          >
            All Floors (30 Rooms)
          </button>
          <button
            className={`btn btn-sm ${selectedFloor === 1 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedFloor(1)}
          >
            Floor 1 (E101-E115)
          </button>
          <button
            className={`btn btn-sm ${selectedFloor === 2 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedFloor(2)}
          >
            Floor 2 (E201-E215)
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="rooms-grid">
        {filteredRooms.map(r => {
          const occColor = getOccupancyColor(r.occupiedCount, r.capacity);
          const hasComplaints = r.activeComplaints > 0;

          return (
            <div
              key={r.room_number}
              className="room-card-cell"
              onClick={() => setSelectedRoom(r)}
              style={{
                borderTop: `4px solid ${occColor}`,
                position: 'relative'
              }}
            >
              {hasComplaints && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  color: 'var(--danger)', display: 'flex', alignItems: 'center'
                }} title={`${r.activeComplaints} active complaint(s)`}>
                  <Wrench size={13} />
                </div>
              )}

              <div className="room-num">{r.room_number}</div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Floor {r.floor}
              </div>

              <span
                className="room-occ-badge"
                style={{
                  background: `${occColor}15`,
                  color: occColor,
                  border: `1px solid ${occColor}30`
                }}
              >
                {r.occupiedCount} / {r.capacity} Beds
              </span>

              {/* Status Dots for occupants */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                {r.occupants.map(occ => (
                  <span
                    key={occ.id}
                    title={`${occ.full_name}: ${occ.current_status}`}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background:
                        occ.current_status === 'IN_HOSTEL' ? 'var(--success)' :
                        occ.current_status === 'AT_COLLEGE' ? 'var(--warning)' :
                        occ.current_status === 'ON_WEEKEND_LEAVE' ? 'var(--purple)' :
                        occ.current_status === 'ON_OUTPASS' ? 'var(--info)' : 'var(--danger)'
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Home size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    Room {selectedRoom.room_number}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Floor {selectedRoom.floor} • Capacity: {selectedRoom.capacity} Students
                  </p>
                </div>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRoom(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)',
                textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em'
              }}>
                Current Occupants ({selectedRoom.occupants.length} / {selectedRoom.capacity})
              </div>

              {selectedRoom.occupants.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.85rem' }}>
                  No occupants currently assigned to this room.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedRoom.occupants.map(s => (
                    <div key={s.id} style={{
                      background: '#f8fafc',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem 1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {s.full_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {s.year} • {s.department}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Phone: {s.phone || 'N/A'} • {s.email}
                          </div>
                        </div>

                        <StatusBadge status={s.current_status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Room Maintenance History */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Wrench size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    Maintenance & Facility Status
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedRoom.activeComplaints > 0
                    ? `⚠️ ${selectedRoom.activeComplaints} active maintenance ticket(s) currently registered for this room.`
                    : '✓ All electrical, plumbing, and Wi-Fi systems reported operational.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
