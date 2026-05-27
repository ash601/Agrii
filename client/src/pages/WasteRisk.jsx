import { useState, useEffect } from 'react';
import api from '../services/api';
import { Thermometer, Droplets, BarChart3, AlertTriangle, ShieldCheck, ShieldAlert, CloudRain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WasteRisk() {
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState({ commodity: '', state: '', district: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [comRes, stRes] = await Promise.all([
        api.get('/waste-risk/commodities'),
        api.get('/prices/states'),
      ]);
      setCommodities(comRes.data);
      setStates(stRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  const handleCheck = async () => {
    if (!form.commodity || !form.state) {
      toast.error('Select a commodity and state');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/waste-risk', { params: form });
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to check risk');
    } finally {
      setLoading(false);
    }
  };

  const getRiskEmoji = (level) => {
    if (level === 'LOW') return '🟢';
    if (level === 'MEDIUM') return '🟡';
    return '🔴';
  };

  return (
    <div className="page-container">
      <div>
        <h1 className="page-title">⚠️ Waste Risk Scorer</h1>
        <p className="page-subtitle">Should you sell now or wait? Based on weather, spoilage risk & market surplus</p>
      </div>

      {/* Input Card */}
      <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Commodity</label>
            <select value={form.commodity} onChange={e => setForm(f => ({ ...f, commodity: e.target.value }))} className="input">
              <option value="">Select Crop</option>
              {commodities.map(c => <option key={c.name} value={c.name}>{c.name} ({c.category})</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>State</label>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input">
              <option value="">Select State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={handleCheck} className="btn btn-accent" disabled={loading} style={{ padding: '10px 28px', fontSize: '14px' }}>
            {loading ? (
              <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              <><AlertTriangle size={16} /> Check Risk</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-slide-up">
          {/* Main Risk Card */}
          <div className="glass-card" style={{
            padding: '32px', marginBottom: '20px', textAlign: 'center',
            borderTop: `3px solid ${result.color}`,
          }}>
            {/* Risk Gauge */}
            <div style={{ position: 'relative', width: '220px', height: '120px', margin: '0 auto 20px' }}>
              <svg viewBox="0 0 220 120" style={{ width: '100%', height: '100%' }}>
                {/* Background arc */}
                <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="16" strokeLinecap="round" />
                {/* Colored arc segments */}
                <path d="M 20 110 A 90 90 0 0 1 80 25" fill="none" stroke="#10B981" strokeWidth="16" strokeLinecap="round" />
                <path d="M 80 25 A 90 90 0 0 1 140 25" fill="none" stroke="#F59E0B" strokeWidth="16" strokeLinecap="round" />
                <path d="M 140 25 A 90 90 0 0 1 200 110" fill="none" stroke="#EF4444" strokeWidth="16" strokeLinecap="round" />
                {/* Needle */}
                <line
                  x1="110" y1="110"
                  x2={110 + 70 * Math.cos(Math.PI - (result.riskScore / 100) * Math.PI)}
                  y2={110 - 70 * Math.sin(Math.PI - (result.riskScore / 100) * Math.PI)}
                  stroke={result.color} strokeWidth="3" strokeLinecap="round"
                />
                <circle cx="110" cy="110" r="6" fill={result.color} />
              </svg>
            </div>

            <div style={{ fontSize: '48px', marginBottom: '4px' }}>{getRiskEmoji(result.riskLevel)}</div>
            <div style={{
              fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-heading)',
              color: result.color, marginBottom: '4px',
            }}>
              {result.riskLevel} RISK
            </div>
            <div style={{
              fontSize: '16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
              marginBottom: '16px',
            }}>
              Score: {result.riskScore}/100
            </div>

            {/* Recommendation */}
            <div style={{
              padding: '16px 24px', borderRadius: '12px', maxWidth: '500px', margin: '0 auto',
              background: `${result.color}15`, border: `1px solid ${result.color}30`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '6px' }}>
                {result.riskLevel === 'LOW' ? <ShieldCheck size={18} style={{ color: result.color }} /> : <ShieldAlert size={18} style={{ color: result.color }} />}
                <span style={{ fontWeight: 600, fontSize: '14px', color: result.color }}>Recommendation</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{result.recommendation}</p>
            </div>
          </div>

          {/* Factor Cards */}
          <div className="grid-stats" style={{ marginBottom: '20px' }}>
            {/* Temperature */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Thermometer size={18} style={{ color: result.factors.temperature.status === 'EXCEEDS' ? 'var(--danger)' : 'var(--success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Temperature</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {result.factors.temperature.current}°C
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Threshold: {result.factors.temperature.threshold}°C</span>
                <span className={`badge ${result.factors.temperature.status === 'EXCEEDS' ? 'badge-danger' : 'badge-success'}`}>
                  {result.factors.temperature.status}
                </span>
              </div>
              {/* Score bar */}
              <div style={{ marginTop: '8px', width: '100%', height: '4px', background: 'var(--surface)', borderRadius: '2px' }}>
                <div style={{ width: `${result.factors.temperature.score}%`, height: '100%', background: result.factors.temperature.status === 'EXCEEDS' ? 'var(--danger)' : 'var(--success)', borderRadius: '2px', transition: 'width 1s' }} />
              </div>
            </div>

            {/* Humidity */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Droplets size={18} style={{ color: result.factors.humidity.status === 'EXCEEDS' ? 'var(--danger)' : 'var(--success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Humidity</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {result.factors.humidity.current}%
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Threshold: {result.factors.humidity.threshold}%</span>
                <span className={`badge ${result.factors.humidity.status === 'EXCEEDS' ? 'badge-danger' : 'badge-success'}`}>
                  {result.factors.humidity.status}
                </span>
              </div>
              <div style={{ marginTop: '8px', width: '100%', height: '4px', background: 'var(--surface)', borderRadius: '2px' }}>
                <div style={{ width: `${result.factors.humidity.score}%`, height: '100%', background: result.factors.humidity.status === 'EXCEEDS' ? 'var(--danger)' : 'var(--success)', borderRadius: '2px', transition: 'width 1s' }} />
              </div>
            </div>

            {/* Market Surplus */}
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <BarChart3 size={18} style={{ color: result.factors.marketSurplus.status === 'HIGH_SURPLUS' ? 'var(--danger)' : 'var(--success)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Market Surplus</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {result.factors.marketSurplus.ratio}x
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>vs 30-day average</span>
                <span className={`badge ${result.factors.marketSurplus.status === 'HIGH_SURPLUS' ? 'badge-danger' : result.factors.marketSurplus.status === 'MODERATE' ? 'badge-warning' : 'badge-success'}`}>
                  {result.factors.marketSurplus.status}
                </span>
              </div>
              <div style={{ marginTop: '8px', width: '100%', height: '4px', background: 'var(--surface)', borderRadius: '2px' }}>
                <div style={{ width: `${result.factors.marketSurplus.score}%`, height: '100%', background: result.factors.marketSurplus.status !== 'NORMAL' ? 'var(--warning)' : 'var(--success)', borderRadius: '2px', transition: 'width 1s' }} />
              </div>
            </div>
          </div>

          {/* Shelf Life + Weather */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', marginBottom: '12px' }}>📦 Shelf Life</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Normal</span>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{result.shelfLife.normal} days</div>
                </div>
                <div style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Adjusted</span>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: result.shelfLife.adjusted < result.shelfLife.normal / 2 ? 'var(--danger)' : 'var(--warning)' }}>
                    {result.shelfLife.adjusted} days
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CloudRain size={14} /> Weather
              </h4>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                <strong>{result.weather.city}</strong> — {result.weather.condition}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                🌡️ {result.weather.temperature}°C &nbsp;&nbsp; 💧 {result.weather.humidity}% humidity
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <div className="glass-card animate-fade-in" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧊</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', marginBottom: '8px' }}>Check Spoilage Risk</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Select a crop and location to get a real-time spoilage risk assessment based on current weather and market conditions.
          </p>
        </div>
      )}
    </div>
  );
}
