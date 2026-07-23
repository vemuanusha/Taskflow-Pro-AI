import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTask } from '../../context/TaskContext';
import { initials, avatarGradient } from '../../utils/helpers';

const NAV = [
  { to:'/',          icon:'⊞', label:'Dashboard'   },
  { to:'/board',     icon:'🗂', label:'Kanban Board' },
  { to:'/tasks',     icon:'☰', label:'All Tasks'    },
  { to:'/calendar',  icon:'📅', label:'Calendar'    },
  { to:'/analytics', icon:'📊', label:'Analytics'   },
  { to:'/activity',  icon:'🕐', label:'Activity'    },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { projects, createProject } = useTask();
  const navigate = useNavigate();
  const [newProj, setNewProj] = useState('');
  const [showProjInput, setShowProjInput] = useState(false);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProj.trim()) return;
    await createProject({ name: newProj.trim() });
    setNewProj(''); setShowProjInput(false);
  };

  const name = `${user?.first_name||''} ${user?.last_name||''}`.trim() || user?.username || 'User';

  return (
    <aside style={{ ...s.sidebar, width: collapsed ? 64 : 240 }}>
      <div style={s.logoWrap}>
        <div style={s.logoIcon}>✓</div>
        {!collapsed && <span style={s.logoText}>TaskFlow Pro</span>}
        <button onClick={onToggle} style={s.collapseBtn}>{collapsed ? '▶' : '◀'}</button>
      </div>
      <nav style={s.nav}>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to==='/'} style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}>
            <span style={s.navIcon}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionLabel}>Projects</span>
            <button onClick={() => setShowProjInput(v=>!v)} style={s.addBtn}>+</button>
          </div>
          {showProjInput && (
            <form onSubmit={handleAddProject} style={{ padding:'6px 0' }}>
              <input className="form-control" style={{ fontSize:12, padding:'6px 10px' }} value={newProj} onChange={e=>setNewProj(e.target.value)} placeholder="Project name…" autoFocus />
            </form>
          )}
          {projects.map(p => (
            <NavLink key={p.id} to={`/board?project=${p.id}`} style={({ isActive }) => ({ ...s.projItem, ...(isActive ? s.projActive : {}) })}>
              <span style={{ ...s.projDot, background: p.color||'#6366f1' }} />
              <span style={s.projName}>{p.name}</span>
            </NavLink>
          ))}
          {projects.length===0 && !showProjInput && <p style={{ fontSize:11, color:'var(--text-4)', padding:'4px 10px' }}>No projects yet</p>}
        </div>
      )}
      <div style={s.bottom}>
        <button onClick={toggleTheme} style={s.themeBtn}>
          {theme==='dark' ? '☀️' : '🌙'}
          {!collapsed && <span style={{ fontSize:12, color:'var(--text-3)' }}>{theme==='dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <div style={s.userRow} onClick={() => navigate('/profile')}>
          <div className="avatar avatar-sm" style={{ background: avatarGradient(user?.username||'U') }}>{initials(name)}</div>
          {!collapsed && (
            <div style={s.userInfo}>
              <div style={s.userName}>{name}</div>
              <div style={s.userEmail}>{user?.email||''}</div>
            </div>
          )}
        </div>
        {!collapsed && <button onClick={logout} style={s.logoutBtn}>Sign out</button>}
      </div>
    </aside>
  );
}

const s = {
  sidebar:{ position:'fixed', top:0, left:0, bottom:0, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', transition:'width 0.25s ease', zIndex:200, overflowX:'hidden', overflowY:'auto' },
  logoWrap:{ display:'flex', alignItems:'center', gap:10, padding:'18px 14px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 },
  logoIcon:{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:17, fontWeight:700, flexShrink:0 },
  logoText:{ fontSize:15, fontWeight:800, color:'var(--text-1)', flex:1, whiteSpace:'nowrap' },
  collapseBtn:{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', fontSize:11, padding:4, marginLeft:'auto', flexShrink:0 },
  nav:{ padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 },
  navItem:{ display:'flex', alignItems:'center', gap:11, padding:'9px 10px', borderRadius:9, fontSize:13.5, fontWeight:500, color:'var(--text-3)', textDecoration:'none', transition:'all 0.15s', whiteSpace:'nowrap' },
  navActive:{ background:'var(--brand-50)', color:'var(--brand-600)', fontWeight:600 },
  navIcon:{ fontSize:16, flexShrink:0, width:20, textAlign:'center' },
  section:{ padding:'4px 8px 8px', borderTop:'1px solid var(--border)', marginTop:4 },
  sectionHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 4px 6px' },
  sectionLabel:{ fontSize:10.5, fontWeight:700, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'0.08em' },
  addBtn:{ background:'none', border:'none', cursor:'pointer', color:'var(--brand-500)', fontSize:18, lineHeight:1 },
  projItem:{ display:'flex', alignItems:'center', gap:9, padding:'7px 8px', borderRadius:7, fontSize:13, color:'var(--text-3)', textDecoration:'none', transition:'all 0.15s' },
  projActive:{ background:'var(--bg-2)', color:'var(--text-1)', fontWeight:500 },
  projDot:{ width:8, height:8, borderRadius:'50%', flexShrink:0 },
  projName:{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  bottom:{ marginTop:'auto', borderTop:'1px solid var(--border)', padding:'10px 8px', display:'flex', flexDirection:'column', gap:4 },
  themeBtn:{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:'8px 10px', borderRadius:8, width:'100%', textAlign:'left' },
  userRow:{ display:'flex', alignItems:'center', gap:10, padding:'8px 6px', borderRadius:9, cursor:'pointer' },
  userInfo:{ flex:1, overflow:'hidden' },
  userName:{ fontSize:13, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userEmail:{ fontSize:11, color:'var(--text-4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  logoutBtn:{ width:'100%', background:'none', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', fontSize:12.5, color:'var(--text-3)', cursor:'pointer', textAlign:'center' },
};
