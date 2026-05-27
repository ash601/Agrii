import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3, TrendingUp, Thermometer, MessageSquare,
  LogIn, LogOut, Menu, X, User
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/prediction', label: 'Prediction', icon: TrendingUp },
  { path: '/waste-risk', label: 'Risk', icon: Thermometer },
  { path: '/chat', label: 'AI Chat', icon: MessageSquare },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
        background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 40, display: 'flex', alignItems: 'center',
        padding: '0 20px', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #059669, #D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>🌾</div>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: '20px', color: 'var(--text-primary)',
          }}>
            Agri<span style={{ color: 'var(--primary-light)' }}>Trade</span>
            <span style={{ color: 'var(--accent)', fontSize: '13px', marginLeft: '4px', fontWeight: 500 }}>AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '2px',
        }} className="hidden-mobile">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px',
                fontSize: '13px', fontWeight: 500, textDecoration: 'none',
                color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(5, 150, 105, 0.1)' : 'transparent',
                transition: 'all 0.2s',
              }}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth + Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 12px', borderRadius: '10px',
                background: 'var(--glass)', border: '1px solid var(--border)',
              }} className="hidden-mobile">
                <User size={14} />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.name}</span>
                <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ fontSize: '10px' }}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '13px' }}>
                <LogOut size={14} /> <span className="hidden-mobile">Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              <LogIn size={14} /> Login
            </Link>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-only"
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)',
          zIndex: 39, padding: '20px',
          animation: 'slideUp 0.3s ease',
        }}>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '12px', marginBottom: '4px',
                  fontSize: '16px', fontWeight: 500, textDecoration: 'none',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(5, 150, 105, 0.1)' : 'transparent',
                }}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .hidden-mobile { display: flex; }
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-only { display: block !important; }
        }
      `}</style>
    </>
  );
}
