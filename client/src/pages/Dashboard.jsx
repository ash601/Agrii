import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Calendar, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [prices, setPrices] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [filters, setFilters] = useState({ commodity: '', state: '' });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (commodities.length > 0 || states.length > 0) {
      loadPrices();
    }
  }, [filters.commodity, filters.state]);

  const loadMetadata = async () => {
    // FIX: The AI was literally only trained on 5 specific crops in the dataset.
    const exactAICrops = ['Onion', 'Potato', 'Rice', 'Tomato', 'Wheat'];
    const exactAIStates = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Nagaland', 'Orissa', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Tripura', 'Uttar Pradesh', 'Uttrakhand', 'West Bengal'];
    
    setCommodities(exactAICrops.sort());
    setStates(exactAIStates.sort());
    setFilters(f => ({ ...f, commodity: 'Onion', state: 'Maharashtra' }));
  };

  const loadPrices = async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 10 };
      if (filters.commodity) params.commodity = filters.commodity;
      if (filters.state) params.state = filters.state;
      const res = await api.get('/prices', { params });
      setPrices(res.data.prices);
    } catch (err) {
      toast.error('Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/prices/sync');
      toast.success(res.data.message);
      loadPrices();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleAIPredict = async () => {
    if (!latestPrice) return;
    setPredicting(true);
    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: latestPrice.state,
          district: latestPrice.district || 'Unknown',
          market: latestPrice.market,
          commodity: latestPrice.commodity,
          date: targetDate
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPrediction(data.predicted_price);
        toast.success('AI Prediction complete!');
      } else {
        toast.error('AI Error: ' + (data.detail || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Could not connect to Python AI Server. Is it running?');
    } finally {
      setPredicting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'Unknown';
    const date = new Date(d);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const latestPrice = prices.length > 0 ? prices[0] : null;

  return (
    <div className="page-container" style={{ maxWidth: '700px', margin: '0 auto', paddingTop: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '28px' }}>🌾 Crop Price</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>Latest market rates</p>
        </div>
        <button onClick={handleSync} className="btn btn-ghost" disabled={syncing} style={{ fontSize: '13px' }}>
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Prices'}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
            <Search size={16} /> Select Crop & Region
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <select value={filters.commodity} onChange={e => setFilters(f => ({ ...f, commodity: e.target.value }))}
              className="input" style={{ flex: '1 1 200px' }}>
              <option value="">All Commodities</option>
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))}
              className="input" style={{ flex: '1 1 200px' }}>
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Price Display & Other Markets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card animate-fade-in stagger-1" style={{ padding: '50px 20px', textAlign: 'center' }}>
          {loading ? (
            <div className="skeleton" style={{ height: '100px', width: '250px', margin: '0 auto', borderRadius: '16px' }} />
          ) : latestPrice ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
                Latest price for <strong style={{ color: 'var(--text-primary)' }}>{latestPrice.commodity}</strong>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <div style={{ 
                  fontFamily: 'var(--font-heading)', 
                  fontSize: '76px', 
                  fontWeight: 800, 
                  color: 'var(--primary-light)', 
                  lineHeight: 1,
                  textShadow: '0 0 40px rgba(16, 185, 129, 0.2)'
                }}>
                  ₹{latestPrice.modalPrice?.toLocaleString('en-IN') || 0}
                </div>
                <div style={{ fontSize: '18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  / quintal
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', fontSize: '15px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '30px', marginTop: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Min: <strong style={{ color: 'var(--text-primary)' }}>₹{latestPrice.minPrice?.toLocaleString('en-IN')}</strong></span>
                <span>Max: <strong style={{ color: 'var(--text-primary)' }}>₹{latestPrice.maxPrice?.toLocaleString('en-IN')}</strong></span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--text-muted)', marginTop: '16px' }}>
                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                <span>Recorded on: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(latestPrice.arrivalDate)}</strong></span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--text-muted)' }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
                <span>Location: <strong style={{ color: 'var(--text-secondary)' }}>{latestPrice.market}, {latestPrice.state}</strong></span>
              </div>
              
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
                <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600, textAlign: 'center' }}>
                  🤖 XGBoost AI Predictor
                </div>
                <input 
                  type="date" 
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="input" 
                  style={{ width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}
                />
                <button 
                  onClick={handleAIPredict} 
                  disabled={predicting}
                  style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {predicting ? 'Calculating Math...' : 'Predict Future Price'}
                </button>
                
                {prediction !== null && (
                  <div className="animate-fade-in" style={{ marginTop: '10px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI Predicted Price for {targetDate}</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>₹{prediction.toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '48px' }}>🤷‍♂️</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600 }}>Price Not Available</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                No current market data found for the selected crop and region.
              </div>
            </div>
          )}
        </div>

        {/* Other Markets List */}
        {!loading && prices.length > 1 && (
          <div className="glass-card animate-fade-in stagger-2" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} /> Other markets in {latestPrice.state}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {prices.slice(1).map((p, i) => (
                <div key={p.id || i} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)' 
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{p.market}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Min: ₹{p.minPrice?.toLocaleString('en-IN')} • Max: ₹{p.maxPrice?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '18px' }}>
                      ₹{p.modalPrice?.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>/ quintal</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
