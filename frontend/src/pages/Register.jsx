import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', first_name:'', last_name:'', password:'', confirm:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try { await register({ username:form.username, email:form.email, first_name:form.first_name, last_name:form.last_name, password:form.password }); navigate('/'); }
    catch(err) { const d=err.response?.data; setError(d?Object.values(d).flat().join(' '):'Registration failed.'); }
    finally { setLoading(false); }
  };
  return (
    <div style={s.page}>
      <div style={s.card} className="scale-in">
        <div style={s.logoRow}><div style={s.logo}>✓</div><span style={{fontSize:17,fontWeight:800}}>TaskFlow Pro</span></div>
        <h1 style={s.title}>Create your account</h1>
        <p style={s.sub}>Start managing tasks like a pro. Free forever.</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div className="form-group"><label className="form-label">First name</label><input className="form-control" value={form.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="John" /></div>
            <div className="form-group"><label className="form-label">Last name</label><input className="form-control" value={form.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Doe" /></div>
          </div>
          <div className="form-group"><label className="form-label">Username *</label><input className="form-control" value={form.username} onChange={e=>set('username',e.target.value)} placeholder="johndoe" required autoFocus /></div>
          <div className="form-group"><label className="form-label">Email address</label><input className="form-control" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="john@example.com" /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div className="form-group"><label className="form-label">Password *</label><input className="form-control" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 8 chars" required /></div>
            <div className="form-group"><label className="form-label">Confirm *</label><input className="form-control" type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} placeholder="Repeat" required /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center',marginTop:4}} disabled={loading}>
            {loading?<><span className="spinner" style={{width:16,height:16}}/> Creating…</>:'Create account →'}
          </button>
        </form>
        <p style={s.switchLink}>Already have an account? <Link to="/login" style={{color:'var(--brand-500)',fontWeight:600}}>Sign in</Link></p>
      </div>
    </div>
  );
}
const s = {
  page:{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 },
  card:{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'36px 32px', width:'100%', maxWidth:480, boxShadow:'var(--shadow-xl)' },
  logoRow:{ display:'flex', alignItems:'center', gap:10, marginBottom:24 },
  logo:{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:800 },
  title:{ fontSize:22, fontWeight:800, color:'var(--text-1)', marginBottom:5 },
  sub:{ fontSize:13.5, color:'var(--text-3)', marginBottom:24 },
  error:{ background:'var(--red-bg)', border:'1.5px solid var(--red-border)', color:'var(--red)', borderRadius:'var(--r)', padding:'11px 14px', marginBottom:18, fontSize:13, fontWeight:500 },
  switchLink:{ textAlign:'center', marginTop:20, fontSize:13.5, color:'var(--text-3)' },
};
