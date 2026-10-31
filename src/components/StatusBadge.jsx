import React from 'react';
import { Home, GraduationCap, MapPin, Compass, AlertTriangle } from 'lucide-react';

export function StatusBadge({ status }) {
  switch (status) {
    case 'IN_HOSTEL':
      return (
        <span className="badge badge-in-hostel">
          <Home size={13} />
          In Hostel
        </span>
      );
    case 'AT_COLLEGE':
      return (
        <span className="badge badge-at-college">
          <GraduationCap size={13} />
          At College
        </span>
      );
    case 'ON_WEEKEND_LEAVE':
      return (
        <span className="badge badge-on-leave">
          <MapPin size={13} />
          On Weekend Leave
        </span>
      );
    case 'ON_OUTPASS':
      return (
        <span className="badge badge-on-outpass">
          <Compass size={13} />
          On Outpass
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="badge badge-overdue">
          <AlertTriangle size={13} />
          Overdue
        </span>
      );
    default:
      return (
        <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
          {status || 'Unknown'}
        </span>
      );
  }
}
