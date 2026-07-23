import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.username, form.password); navigate('/'); }
    catch { setError('Invalid username or password. Please try again.'); }
    finally { setLoading(false); }
  };
  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}><div style={s.brandIcon}>✓</div><span style={s.brandName}>TaskFlow Pro</span></div>
        <h2 style={s.tagline}>Everything your team needs to ship faster.</h2>
        <div style={s.features}>
          {['Drag & drop Kanban boards','Smart deadline tracking','Analytics & insights','Team collaboration'].map(f=>(
            <div key={f} style={s.feat}><span style={s.featIcon}>✓</span><span style={{color:'rgba(255,255,255,0.85)',fontSize:14}}>{f}</span></div>
          ))}
        </div>
      </div>
      <div style={s.right}>
        <div style={s.formCard}>
          <div style={s.formHeader}><h1 style={s.title}>Welcome back</h1><p style={s.subtitle}>Sign in to your TaskFlow Pro account</p></div>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" value={form.username} onChange={e=>set('username',e.target.value)} placeholder="Enter your username" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Enter your password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',marginTop:6}} disabled={loading}>
              {loading?<><span className="spinner" style={{width:16,height:16}}/> Signing in…</>:'Sign in →'}
            </button>
          </form>
          <p style={s.switchLink}>Don't have an account? <Link to="/register" style={{color:'var(--brand-500)',fontWeight:600}}>Create one free</Link></p>
        </div>
      </div>
    </div>
  );
}
const s = {
  page:{ display:'flex', minHeight:'100vh' },
  left:{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px 56px', background:'linear-gradient(145deg,#312e81,#4f46e5,#7c3aed)', color:'#fff' },
  brand:{ display:'flex', alignItems:'center', gap:12, marginBottom:48 },
  brandIcon:{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800 },
  brandName:{ fontSize:20, fontWeight:800 },
  tagline:{ fontSize:30, fontWeight:800, lineHeight:1.25, marginBottom:32, maxWidth:400 },
  features:{ display:'flex', flexDirection:'column', gap:14 },
  feat:{ display:'flex', alignItems:'center', gap:12 },
  featIcon:{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 },
  right:{ width:460, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px', background:'var(--bg)' },
  formCard:{ width:'100%', maxWidth:380 },
  formHeader:{ marginBottom:28 },
  title:{ fontSize:24, fontWeight:800, color:'var(--text-1)', marginBottom:6 },
  subtitle:{ fontSize:14, color:'var(--text-3)' },
  error:{ background:'var(--red-bg)', border:'1.5px solid var(--red-border)', color:'var(--red)', borderRadius:'var(--r)', padding:'11px 14px', marginBottom:18, fontSize:13, fontWeight:500 },
  switchLink:{ textAlign:'center', marginTop:22, fontSize:13.5, color:'var(--text-3)' },
};
