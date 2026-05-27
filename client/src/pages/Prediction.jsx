import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Prediction() {
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState({ commodity: '', state: '', market: '', date: new Date().toISOString().split('T')[0] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Exact lists to prevent any faulty data
    const exactAICrops = ['Onion', 'Potato', 'Rice', 'Tomato', 'Wheat'];
    const exactAIStates = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Nagaland', 'Orissa', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Tripura', 'Uttar Pradesh', 'Uttrakhand', 'West Bengal'];
    
    setCommodities(exactAICrops.sort());
    setStates(exactAIStates.sort());
  }, []);

  const handlePredict = async () => {
    if (!form.commodity || !form.state || !form.date) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    setResult(null); // Clear previous result
    try {
      // Hit the original /predict endpoint for a single answer
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: form.state,
          commodity: form.commodity,
          market: form.market || 'Unknown',
          district: 'Unknown',
          date: form.date
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Prediction failed');
      setResult(data.predicted_price);
    } catch (err) {
      toast.error(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="page-title" style={{ fontSize: '32px' }}>Price Predictor</h1>
        <p className="page-subtitle">Get the exact price for any specific date.</p>
      </div>

      <div className="glass-card animate-fade-in" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 600 }}>Select Crop</label>
            <select value={form.commodity} onChange={e => setForm({...form, commodity: e.target.value})} className="input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)' }}>
              <option value="">-- Choose Crop --</option>
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 600 }}>Select State</label>
            <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)' }}>
              <option value="">-- Choose State --</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 600 }}>Market / Mandi</label>
            <input type="text" placeholder="e.g. Lasalgaon" value={form.market} onChange={e => setForm({...form, market: e.target.value})} className="input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: 600 }}>Target Date</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)' }} />
          </div>

          <button onClick={handlePredict} disabled={loading} className="btn" style={{ width: '100%', marginTop: '10px', padding: '16px', fontSize: '16px', fontWeight: 'bold', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {loading ? 'Calculating...' : 'Get Final Price'}
          </button>
        </div>
      </div>

      {result !== null && (
        <div className="glass-card animate-slide-up" style={{ marginTop: '24px', padding: '40px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
            Predicted price for <strong style={{color: 'var(--text-primary)'}}>{form.commodity}</strong> in <strong style={{color: 'var(--text-primary)'}}>{form.market || form.state}</strong> on <br/>
            <span style={{ color: 'var(--text-primary)', fontSize: '18px', marginTop: '4px', display: 'block' }}>{formatDate(form.date)}</span>
          </div>
          <div style={{ fontSize: '72px', fontWeight: 800, color: '#10b981', lineHeight: 1, margin: '20px 0' }}>
            ₹{result.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>per quintal</div>
        </div>
      )}
    </div>
  );
}
