import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Mock logged-in user for demonstration
  const [user, setUser] = useState({
    id: 1,
    name: 'Demo Farmer',
    email: 'farmer@demo.com',
    role: 'FARMER'
  });
  const loading = false; // Never loading

  const login = async (email, password) => {
    return { token: 'mock-token', user };
  };

  const register = async (data) => {
    return { token: 'mock-token', user };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

