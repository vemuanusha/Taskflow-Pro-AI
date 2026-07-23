import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
const AuthContext = createContext(null);
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers['Authorization'] = `Bearer ${token}`;
  return cfg;
});
axios.interceptors.response.use(r => r, async err => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true;
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) throw new Error('no refresh');
      const r = await axios.post('/api/auth/refresh/', { refresh });
      localStorage.setItem('access_token', r.data.access);
      if (r.data.refresh) localStorage.setItem('refresh_token', r.data.refresh);
      orig.headers['Authorization'] = `Bearer ${r.data.access}`;
      return axios(orig);
    } catch {
      localStorage.clear();
      window.location.href = '/login';
    }
  }
  return Promise.reject(err);
});
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchMe = useCallback(async () => {
    try { const r = await axios.get('/api/users/me'); setUser(r.data); }
    catch { localStorage.clear(); }
  }, []);
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) fetchMe().finally(() => setLoading(false));
    else setLoading(false);
  }, [fetchMe]);
  const login = async (username, password) => {
    const r = await axios.post('/api/auth/login', { username, password });
    localStorage.setItem('access_token', r.data.access);
    localStorage.setItem('refresh_token', r.data.refresh);
    setUser(r.data.user);
    toast.success('Welcome back! 👋');
  };
  const register = async (data) => {
    const r = await axios.post('/api/auth/register', data);
    localStorage.setItem('access_token', r.data.access);
    localStorage.setItem('refresh_token', r.data.refresh);
    setUser(r.data.user);
    toast.success('Account created! 🎉');
  };
  const logout = () => {
    const refresh = localStorage.getItem('refresh_token');
    axios.post('/api/auth/logout', { refresh }).catch(() => {});
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Signed out successfully.');
  };
  const updateProfile = async (data) => {
    const r = await axios.patch('/api/users/me/', data);
    setUser(r.data); toast.success('Profile updated!');
    return r.data;
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
