import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard  from './pages/Dashboard';
import Board      from './pages/Board';
import Tasks      from './pages/Tasks';
import Calendar   from './pages/Calendar';
import Analytics  from './pages/Analytics';
import Activity   from './pages/Activity';
import Profile    from './pages/Profile';
import Login      from './pages/Login';
import Register   from './pages/Register';
import './styles/global.css';

/* ── Route guards ─────────────────────────────── */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:36, height:36 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

/* ── App shell (sidebar + content) ───────────── */
function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="main-content" style={{ marginLeft: collapsed ? 64 : 240 }}>
        {children}
      </div>
    </div>
  );
}

/* ── Root ─────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Protected */}
              <Route path="/" element={
                <PrivateRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </PrivateRoute>
              } />
              <Route path="/board" element={
                <PrivateRoute><AppShell><Board /></AppShell></PrivateRoute>
              } />
              <Route path="/tasks" element={
                <PrivateRoute><AppShell><Tasks /></AppShell></PrivateRoute>
              } />
              <Route path="/calendar" element={
                <PrivateRoute><AppShell><Calendar /></AppShell></PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute><AppShell><Analytics /></AppShell></PrivateRoute>
              } />
              <Route path="/activity" element={
                <PrivateRoute><AppShell><Activity /></AppShell></PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute><AppShell><Profile /></AppShell></PrivateRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--surface)',
                color: 'var(--text-1)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '500',
                boxShadow: 'var(--shadow-lg)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
