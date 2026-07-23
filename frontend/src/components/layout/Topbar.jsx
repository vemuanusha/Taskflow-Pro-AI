import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../../context/TaskContext';
import { useDebounce } from '../../hooks/useHelpers';
import { filterTasks, isOverdue, isDueToday } from '../../utils/helpers';
import AIAssistant from '../ai/AIAssistant';

export default function Topbar({ title, subtitle }) {
  const { tasks } = useTask();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const debounced = useDebounce(search, 250);

  const results = debounced ? filterTasks(tasks, { search: debounced }).slice(0, 6) : [];
  const overdueCount = tasks.filter(isOverdue).length;
  const todayCount   = tasks.filter(isDueToday).length;
  const badgeCount   = overdueCount + todayCount;
  const notifications = [
    ...tasks.filter(isOverdue).map(t => ({ type:'overdue', msg:`"${t.title}" is overdue` })),
    ...tasks.filter(isDueToday).map(t => ({ type:'today',  msg:`"${t.title}" is due today` })),
  ].slice(0, 8);

  return (
    <>
      <header style={s.header}>
        <div>
          <h1 style={s.title}>{title}</h1>
          {subtitle && <p style={s.subtitle}>{subtitle}</p>}
        </div>
        <div style={s.right}>
          <div style={{ position:'relative' }}>
            <span style={s.searchIcon}>🔍</span>
            <input style={s.searchInput} placeholder="Search tasks…" value={search}
              onChange={e=>{setSearch(e.target.value);setShowResults(true)}}
              onFocus={()=>setShowResults(true)}
              onBlur={()=>setTimeout(()=>setShowResults(false),200)} />
            {showResults && results.length>0 && (
              <div style={s.searchDrop}>
                {results.map(t=>(
                  <div key={t.id} style={s.searchItem} onMouseDown={()=>{navigate('/tasks');setSearch('');setShowResults(false)}}>
                    <span style={{fontSize:13}}>{t.title}</span>
                    <span style={s.searchBadge}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* AI Button */}
          <button style={{...s.iconBtn, background:'linear-gradient(135deg,var(--brand-500),var(--accent))', color:'#fff', border:'none', gap:5, display:'flex', alignItems:'center', padding:'7px 13px', fontSize:12.5, fontWeight:600, borderRadius:'var(--r)'}}
            onClick={() => setShowAI(true)}>
            🤖 AI
          </button>
          <div style={{position:'relative'}}>
            <button style={s.iconBtn} onClick={()=>setShowNotif(v=>!v)}>
              🔔
              {badgeCount>0 && <span style={s.badge}>{badgeCount}</span>}
            </button>
            {showNotif && (
              <div style={s.notifDrop}>
                <div style={s.notifHeader}>
                  <span style={{fontWeight:600,fontSize:13}}>Notifications</span>
                  <button onClick={()=>setShowNotif(false)} style={s.notifClose}>✕</button>
                </div>
                {notifications.length===0 ? <div style={s.notifEmpty}>All caught up! 🎉</div>
                  : notifications.map((n,i)=>(
                    <div key={i} style={{...s.notifItem,borderLeft:`3px solid ${n.type==='overdue'?'var(--red)':'var(--amber)'}`}}>
                      <span style={{fontSize:14}}>{n.type==='overdue'?'⚠️':'⏰'}</span>
                      <span style={{fontSize:12,color:'var(--text-2)'}}>{n.msg}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>document.dispatchEvent(new CustomEvent('open-task-modal'))}>+ New Task</button>
        </div>
      </header>
      {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
    </>
  );
}

const s = {
  header:{ position:'sticky', top:0, zIndex:100, background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 },
  title:{ fontSize:20, fontWeight:700, color:'var(--text-1)', lineHeight:1.2 },
  subtitle:{ fontSize:12.5, color:'var(--text-3)', marginTop:2 },
  right:{ display:'flex', alignItems:'center', gap:10 },
  searchIcon:{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, pointerEvents:'none' },
  searchInput:{ border:'1.5px solid var(--border)', borderRadius:'var(--r)', padding:'8px 14px 8px 34px', fontSize:13, width:220, background:'var(--bg-2)', color:'var(--text-1)', outline:'none' },
  searchDrop:{ position:'absolute', top:'110%', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', boxShadow:'var(--shadow-lg)', zIndex:300, overflow:'hidden' },
  searchItem:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)' },
  searchBadge:{ fontSize:10, color:'var(--text-4)', background:'var(--bg-2)', padding:'1px 7px', borderRadius:99 },
  iconBtn:{ position:'relative', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'8px 10px', cursor:'pointer', fontSize:15, lineHeight:1 },
  badge:{ position:'absolute', top:-5, right:-5, background:'var(--red)', color:'#fff', fontSize:9, fontWeight:700, width:16, height:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' },
  notifDrop:{ position:'absolute', top:'110%', right:0, width:320, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', boxShadow:'var(--shadow-lg)', zIndex:300, overflow:'hidden' },
  notifHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)' },
  notifClose:{ background:'none', border:'none', cursor:'pointer', color:'var(--text-4)', fontSize:13 },
  notifItem:{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)' },
  notifEmpty:{ padding:'24px 16px', textAlign:'center', color:'var(--text-3)', fontSize:13 },
};
