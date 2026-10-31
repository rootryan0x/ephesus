import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Utensils, Trash2, Calendar, TrendingDown, CheckCircle2, Clock, Plus, BarChart2 } from 'lucide-react';

export function MessFoodWasteCenter() {
  const [messData, setMessData] = useState(null);
  const [foodWasteData, setFoodWasteData] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Waste Form
  const [wasteDate, setWasteDate] = useState(new Date().toISOString().split('T')[0]);
  const [wasteKg, setWasteKg] = useState('');
  const [breakfastKg, setBreakfastKg] = useState('');
  const [lunchKg, setLunchKg] = useState('');
  const [dinnerKg, setDinnerKg] = useState('');
  const [wasteNotes, setWasteNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, wRes] = await Promise.all([
        api.getMessDashboard(),
        api.getFoodWaste()
      ]);
      setMessData(mRes);
      setFoodWasteData(wRes);
    } catch (err) {
      console.error('Error fetching mess/waste data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogWaste = async (e) => {
    e.preventDefault();
    if (!wasteDate || !wasteKg) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await api.logFoodWaste({
        date: wasteDate,
        waste_kg: parseFloat(wasteKg),
        breakfast_kg: breakfastKg ? parseFloat(breakfastKg) : null,
        lunch_kg: lunchKg ? parseFloat(lunchKg) : null,
        dinner_kg: dinnerKg ? parseFloat(dinnerKg) : null,
        notes: wasteNotes
      });
      setFeedback('Daily food waste logged successfully.');
      setWasteKg('');
      setBreakfastKg('');
      setLunchKg('');
      setDinnerKg('');
      setWasteNotes('');
      fetchData();
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
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
            Mess Population Planning & Food Waste Monitoring
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Data-driven culinary planning based on confirmed student returns and daily food waste audit
          </p>
        </div>
      </div>

      {feedback && (
        <div className="alert badge-in-hostel" style={{ marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} /> {feedback}
        </div>
      )}

      {/* Tomorrow's Population Calculation Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
        color: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '1.75rem',
        marginBottom: '1.75rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7d2fe', fontWeight: 700 }}>
          TOMORROW'S CALCULATED HOSTEL POPULATION
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0.5rem 0 1rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {messData?.tomorrowForecast?.expectedPopulation || 0}
          </span>
          <span style={{ fontSize: '1.1rem', color: '#c7d2fe' }}>
            Expected students to dine and stay
          </span>
        </div>

        {/* Breakdown Row avoiding double count */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700 }}>
              Confirmed Returning
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {messData?.tomorrowForecast?.confirmedReturning || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#c7d2fe' }}>Confirmed via App</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#fde68a', textTransform: 'uppercase', fontWeight: 700 }}>
              Return Confirmation Pending
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fef08a', marginTop: '0.2rem' }}>
              {messData?.tomorrowForecast?.returnConfirmationPending || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#fde68a' }}>Awaiting Sunday confirmation</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#ddd6fe', textTransform: 'uppercase', fontWeight: 700 }}>
              Continuing on Leave
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e9d5ff', marginTop: '0.2rem' }}>
              {messData?.tomorrowForecast?.continuingLeave || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#ddd6fe' }}>Excluded from prep</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>
              Present in Hostel / College
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a7f3d0', marginTop: '0.2rem' }}>
              {(messData?.currentBreakdown?.inHostel || 0) + (messData?.currentBreakdown?.atCollege || 0)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>Base population</div>
          </div>
        </div>
      </div>

      {/* Meal-wise Estimations Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
          Meal-wise Headcount & Menu Forecast
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem'
        }}>
          {messData?.mealEstimates && Object.entries(messData.mealEstimates).map(([mealKey, meal]) => (
            <div key={mealKey} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                  {mealKey}
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, background: 'var(--primary-subtle)',
                  color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)'
                }}>
                  {meal.headcount} Plates
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={13} /> {meal.timing}
              </div>

              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                background: '#f8fafc',
                padding: '0.625rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                <strong>Menu:</strong> {meal.menu}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Food Waste Logger & Historical Records */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Log Waste Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Trash2 size={18} color="var(--primary)" /> Log Daily Food Waste
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mess Register</span>
          </div>

          <form onSubmit={handleLogWaste}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={wasteDate}
                  onChange={e => setWasteDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Waste (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="e.g. 8.4"
                  value={wasteKg}
                  onChange={e => setWasteKg(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Breakfast (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="1.8"
                  value={breakfastKg}
                  onChange={e => setBreakfastKg(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Lunch (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="3.2"
                  value={lunchKg}
                  onChange={e => setLunchKg(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Dinner (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  placeholder="2.9"
                  value={dinnerKg}
                  onChange={e => setDinnerKg(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mess Manager Notes</label>
              <textarea
                className="form-control"
                placeholder="e.g. Optimal consumption, rice surplus from unexpected late leaves..."
                value={wasteNotes}
                onChange={e => setWasteNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving Waste Record...' : 'Record Daily Food Waste'}
            </button>
          </form>
        </div>

        {/* Waste Trend & History Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BarChart2 size={18} color="var(--primary)" /> Food Waste History & Trends
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Avg: <strong>{foodWasteData?.stats?.averageWasteKg || 8.1} kg/day</strong>
            </span>
          </div>

          <div className="table-container" style={{ maxHeight: 330, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Waste</th>
                  <th>Meal Breakdown</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {foodWasteData?.records?.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.date}</td>
                    <td style={{ fontWeight: 800, color: r.waste_kg > 9 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {r.waste_kg} kg
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      B: {r.breakfast_kg || '-'} | L: {r.lunch_kg || '-'} | D: {r.dinner_kg || '-'}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
