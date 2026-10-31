import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ShieldAlert, Clock, Search, FileText } from 'lucide-react';

export function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.author_name && l.author_name.toLowerCase().includes(term)) ||
      (l.reason && l.reason.toLowerCase().includes(term)) ||
      (l.target_type && l.target_type.toLowerCase().includes(term))
    );
  });

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
            Centralized Immutable Audit Trail
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Tamper-evident logs of manual status overrides, session lifecycles, approvals, and system adjustments
          </p>
        </div>

        <div style={{ minWidth: 260 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search audit actions, warden name, reasons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Target</th>
              <th>Reason & Audit Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                    })}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800, fontSize: '0.78rem',
                      background: l.action.includes('OVERRIDE') ? '#fef2f2' : 'var(--primary-subtle)',
                      color: l.action.includes('OVERRIDE') ? 'var(--danger)' : 'var(--primary)',
                      padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)'
                    }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {l.author_name || 'System / Auto'}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {l.author_role}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {l.target_type} ({l.target_id || '-'})
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-primary)', maxWidth: 380 }}>
                    {l.reason || '-'}
                    {l.new_data && (
                      <div style={{
                        fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                        marginTop: '0.25rem', wordBreak: 'break-all'
                      }}>
                        {l.new_data}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
