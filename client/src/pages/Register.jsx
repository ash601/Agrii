import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const STATES = [
  'Andhra Pradesh', 'Gujarat', 'Haryana', 'Karnataka', 'Madhya Pradesh',
  'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'West Bengal',
];

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'FARMER', phone: '', state: '', district: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to AgriTrade AI');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1a2332 50%, #0F172A 100%)',
      padding: '20px',
    }}>
      <div style={{
        position: 'absolute', top: '15%', right: '15%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
      }} />

      <div className="glass-card animate-slide-up" style={{
        width: '100%', maxWidth: '480px', padding: '36px', position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #059669, #D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
          }}>🌾</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: 800 }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Join AgriTrade AI — India's smartest agri platform
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Role Toggle */}
          <div style={{
            display: 'flex', background: 'var(--surface)', borderRadius: '12px',
            padding: '4px', border: '1px solid var(--border)',
          }}>
            {['FARMER', 'BUYER'].map(role => (
              <button key={role} type="button" onClick={() => update('role', role)} style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                background: form.role === role ? 'var(--primary)' : 'transparent',
                color: form.role === role ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
                {role === 'FARMER' ? '🌾' : '🛒'} {role}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={form.name} onChange={e => update('name', e.target.value)}
                  className="input" placeholder="Rajesh Kumar" style={{ paddingLeft: '34px' }} required />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                  className="input" placeholder="+91 98765 43210" style={{ paddingLeft: '34px' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="input" placeholder="you@example.com" style={{ paddingLeft: '34px' }} required />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                className="input" placeholder="Min 6 characters" style={{ paddingLeft: '34px' }} required minLength={6} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>State</label>
              <select value={form.state} onChange={e => update('state', e.target.value)} className="input">
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>District</label>
              <input value={form.district} onChange={e => update('district', e.target.value)}
                className="input" placeholder="Your district" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{
            width: '100%', padding: '12px', fontSize: '15px', marginTop: '8px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
