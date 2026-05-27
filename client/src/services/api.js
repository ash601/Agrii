import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agritrade_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TEMPORARILY DISABLED FOR PRESENTATION DEMO
      /*
      localStorage.removeItem('agritrade_token');
      localStorage.removeItem('agritrade_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      */
    }
    return Promise.reject(error);
  }
);

export default api;
