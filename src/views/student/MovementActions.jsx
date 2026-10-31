import React from 'react';
import { GraduationCap, Compass, MapPin, ArrowUpRight, ArrowDownLeft, Sparkles } from 'lucide-react';

export function MovementActions({ currentStatus, onSelectMovement }) {
  // Logic for smart recommendation based on current status
  const isEligible = (type) => {
    switch (type) {
      case 'COLLEGE_OUT':
        return currentStatus === 'IN_HOSTEL';
      case 'COLLEGE_IN':
        return currentStatus === 'AT_COLLEGE';
      case 'OUTPASS_OUT':
        return currentStatus === 'IN_HOSTEL';
      case 'OUTPASS_IN':
        return currentStatus === 'ON_OUTPASS';
      case 'LEAVE_OUT':
        // Both Route A (IN_HOSTEL) and Route B (AT_COLLEGE on Friday) are allowed!
        return currentStatus === 'IN_HOSTEL' || currentStatus === 'AT_COLLEGE';
      case 'LEAVE_IN':
        return currentStatus === 'ON_WEEKEND_LEAVE';
      default:
        return false;
    }
  };

  const actions = [
    {
      type: 'COLLEGE_OUT',
      title: 'College OUT',
      subtitle: 'Hostel → College',
      category: 'College',
      icon: GraduationCap,
      arrow: ArrowUpRight,
      direction: 'OUT'
    },
    {
      type: 'COLLEGE_IN',
      title: 'College IN',
      subtitle: 'College → Hostel',
      category: 'College',
      icon: GraduationCap,
      arrow: ArrowDownLeft,
      direction: 'IN'
    },
    {
      type: 'OUTPASS_OUT',
      title: 'Outpass OUT',
      subtitle: 'Town / Market Visit',
      category: 'Outpass',
      icon: Compass,
      arrow: ArrowUpRight,
      direction: 'OUT'
    },
    {
      type: 'OUTPASS_IN',
      title: 'Outpass IN',
      subtitle: 'Return from Outpass',
      category: 'Outpass',
      icon: Compass,
      arrow: ArrowDownLeft,
      direction: 'IN'
    },
    {
      type: 'LEAVE_OUT',
      title: 'Leave OUT',
      subtitle: 'Hostel/College → Home',
      category: 'Leave',
      icon: MapPin,
      arrow: ArrowUpRight,
      direction: 'OUT'
    },
    {
      type: 'LEAVE_IN',
      title: 'Leave IN',
      subtitle: 'Return to Ephesus',
      category: 'Leave',
      icon: MapPin,
      arrow: ArrowDownLeft,
      direction: 'IN'
    }
  ];

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.875rem'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          QR Movement Actions
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Scan dynamic QR on hostel display
        </span>
      </div>

      <div className="movement-grid">
        {actions.map((act) => {
          const eligible = isEligible(act.type);
          const Icon = act.icon;
          const Arrow = act.arrow;

          return (
            <div
              key={act.type}
              className={`action-card-btn ${act.direction === 'OUT' ? 'action-out' : 'action-in'} ${eligible ? 'active-match' : ''}`}
              onClick={() => onSelectMovement(act.type)}
            >
              {eligible && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: 9999,
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Sparkles size={10} /> READY
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="action-icon-wrap">
                  <Icon size={22} />
                </div>
                <Arrow size={18} style={{ opacity: eligible ? 1 : 0.4 }} />
              </div>

              <div>
                <div className="action-title">{act.title}</div>
                <div className="action-subtitle">{act.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
