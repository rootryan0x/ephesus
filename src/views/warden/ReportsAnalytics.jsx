import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BarChart3, Download, Calendar, Activity, CheckCircle2, FileText, ArrowDownToLine } from 'lucide-react';

export function ReportsAnalytics() {
  const [period, setPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReportsSummary(period);
      setReport(data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExport = (type) => {
    window.open(api.getExportUrl(type), '_blank');
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
            Hostel Intelligence & Administrative Reports
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Comprehensive analytics on student movement, food conservation, leave frequency, and complaints
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('students')}
          >
            <ArrowDownToLine size={14} /> Export Students CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('movements')}
          >
            <ArrowDownToLine size={14} /> Export Movements CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('leaves')}
          >
            <ArrowDownToLine size={14} /> Export Leaves CSV
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${period === 'daily' ? 'active' : ''}`}
          onClick={() => setPeriod('daily')}
        >
          <Calendar size={16} /> Daily Report
        </button>
        <button
          className={`tab-btn ${period === 'weekly' ? 'active' : ''}`}
          onClick={() => setPeriod('weekly')}
        >
          <BarChart3 size={16} /> Weekly Summary
        </button>
        <button
          className={`tab-btn ${period === 'monthly' ? 'active' : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          <Activity size={16} /> Monthly Aggregates
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Movements by Type */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity size={18} color="var(--primary)" /> Movement Breakdown
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Scans</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {report?.movementsByType?.map(m => (
              <div key={m.movement_type} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.625rem 0.875rem', background: '#f8fafc', borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {m.movement_type.replace(/_/g, ' ')}
                </span>
                <span style={{
                  fontWeight: 800, fontFamily: 'var(--font-mono)',
                  background: 'var(--primary-subtle)', color: 'var(--primary)',
                  padding: '0.15rem 0.5rem', borderRadius: 9999
                }}>
                  {m.count} records
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Food Waste Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={18} color="var(--success)" /> Food Waste Analytics
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conservation KPI</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Daily Average Waste
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {report?.foodWasteStats?.avgWasteKg || 8.1} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Across logged dates</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Recorded Waste
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {report?.foodWasteStats?.totalWasteKg || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>kg</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cumulative mess record</div>
            </div>
          </div>
        </div>

        {/* Complaints Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} color="var(--primary)" /> Complaints by Category
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hostel Services</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report?.complaintsByCategory?.map(c => (
              <div key={c.category} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}>
                <span style={{ fontWeight: 600 }}>{c.category}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.count} tickets</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
