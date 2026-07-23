import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/layout/Topbar';
import TaskModal from '../components/modals/TaskModal';
import WorkloadCard from '../components/dashboard/WorkloadCard';
import SmartScheduleCard from '../components/dashboard/SmartScheduleCard';
import TopRisksCard from '../components/dashboard/TopRisksCard';
import { isOverdue, isDueToday, fmtDate, fmtRelative } from '../utils/helpers';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const { tasks, projects, fetchTasks, fetchProjects, loading } = useTask();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── NEW TASK MODAL STATE ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask]   = useState(null);

  useEffect(() => { fetchTasks(); fetchProjects(); }, []);

  // ── Listen for the "+ New Task" button fired from Topbar ─────────
  useEffect(() => {
    const h = () => { setEditTask(null); setModalOpen(true); };
    document.addEventListener('open-task-modal', h);
    return () => document.removeEventListener('open-task-modal', h);
  }, []);

  const stats = useMemo(() => ({
    total:      tasks.length,
    done:       tasks.filter(t=>t.status==='done').length,
    inprogress: tasks.filter(t=>t.status==='inprogress').length,
    todo:       tasks.filter(t=>t.status==='todo').length,
    overdue:    tasks.filter(isOverdue).length,
    dueToday:   tasks.filter(isDueToday).length,
  }), [tasks]);
  const completionRate = stats.total ? Math.round((stats.done/stats.total)*100) : 0;

  const activityData = useMemo(() => Array.from({length:7},(_,i)=>{
    const d = subDays(new Date(),6-i);
    const key = format(d,'yyyy-MM-dd');
    return { day:format(d,'EEE'), created:tasks.filter(t=>t.created_at?.startsWith(key)).length, completed:tasks.filter(t=>t.status==='done'&&t.updated_at?.startsWith(key)).length };
  }), [tasks]);

  const priorityData = useMemo(()=>[
    { name:'High',   value:tasks.filter(t=>t.priority==='high').length,   color:'#ef4444' },
    { name:'Medium', value:tasks.filter(t=>t.priority==='medium').length, color:'#f59e0b' },
    { name:'Low',    value:tasks.filter(t=>t.priority==='low').length,    color:'#10b981' },
  ],[tasks]);

  const recent      = useMemo(()=>[...tasks].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5),[tasks]);
  const overdueList = tasks.filter(isOverdue).slice(0,4);

  const greeting = ()=>{ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };
  const name = user?.first_name || user?.username || 'there';

  const CARDS = [
    { key:'total',      label:'Total Tasks',  emoji:'📋', accent:'#6366f1' },
    { key:'done',       label:'Completed',    emoji:'✅', accent:'#10b981' },
    { key:'inprogress', label:'In Progress',  emoji:'⚡', accent:'#3b82f6' },
    { key:'overdue',    label:'Overdue',      emoji:'⚠️', accent:'#ef4444' },
  ];

  const TT = ({active,payload,label})=>{
    if(!active||!payload?.length) return null;
    return <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',fontSize:12}}>
      <p style={{fontWeight:600,marginBottom:4}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color}}>{p.name}: {p.value}</p>)}
    </div>;
  };

  return (
    <div>
      <Topbar title={`${greeting()}, ${name} 👋`} subtitle={`${stats.dueToday} tasks due today${stats.overdue>0?` · ${stats.overdue} overdue`:''}`} />
      <div className="page-content">
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px 0'}}><div className="spinner" style={{width:32,height:32}}/></div>
        ) : (<>
          <div style={s.statsGrid}>
            {CARDS.map(c=>(
              <div key={c.key} className="stat-card fade-in" style={{'--card-accent':c.accent}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <span style={{fontSize:24}}>{c.emoji}</span>
                  {c.key==='done' && <div style={{fontSize:11,fontWeight:700,color:c.accent,background:c.accent+'15',padding:'3px 10px',borderRadius:99}}>{completionRate}%</div>}
                </div>
                <div style={{fontSize:32,fontWeight:800,color:'var(--text-1)',lineHeight:1}}>{stats[c.key]}</div>
                <div style={{fontSize:13,color:'var(--text-3)',marginTop:5,fontWeight:500}}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={s.intelRow}>
            <WorkloadCard />
            <SmartScheduleCard />
            <TopRisksCard onTaskClick={(id)=>{ const t = tasks.find(x=>x.id===id); if (t) { setEditTask(t); setModalOpen(true); } }} />
          </div>

          <div style={s.chartsRow}>
            <div className="card" style={s.chartCard}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={s.chartTitle}>7-Day Activity</h3>
                <div style={{display:'flex',alignItems:'center',gap:12,fontSize:11.5,color:'var(--text-3)'}}>
                  <span>🟣 Created</span><span>🟢 Completed</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={activityData} margin={{top:5,right:10,bottom:0,left:-20}}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.18}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.18}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{fontSize:11,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} tick={{fontSize:11,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Area type="monotone" dataKey="created" name="Created" stroke="#6366f1" fill="url(#gc)" strokeWidth={2}/>
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="url(#gg)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card" style={{...s.chartCard,minWidth:220,flex:'0 0 240px'}}>
              <h3 style={{...s.chartTitle,marginBottom:16}}>By Priority</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart><Pie data={priorityData} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={3} dataKey="value">
                  {priorityData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie>
                  <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',justifyContent:'center',gap:14,marginTop:8}}>
                {priorityData.map(p=>(
                  <div key={p.name} style={{display:'flex',alignItems:'center',gap:5,fontSize:11}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block'}}/>
                    <span style={{color:'var(--text-3)'}}>{p.name}</span>
                    <span style={{fontWeight:700}}>{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={s.bottomRow}>
            <div className="card" style={s.listCard}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <h3 style={s.chartTitle}>Recent Tasks</h3>
                <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/tasks')}>View all →</button>
              </div>
              {recent.map(task=>(
                <div key={task.id} style={s.taskRow}
                  onClick={()=>{ setEditTask(task); setModalOpen(true); }}
                  title="Click to edit">
                  <div style={{flex:1}}>
                    <div style={{fontSize:13.5,fontWeight:500}}>{task.title}</div>
                    <div style={{fontSize:11.5,color:'var(--text-4)',marginTop:2}}>{fmtRelative(task.created_at)}</div>
                  </div>
                  <span className={`badge badge-${task.status}`}>{task.status==='inprogress'?'In Progress':task.status==='inreview'?'In Review':task.status.charAt(0).toUpperCase()+task.status.slice(1)}</span>
                </div>
              ))}
              {recent.length===0 && <div style={s.emptyMsg}>No tasks yet. Create your first task!</div>}
            </div>
            <div className="card" style={s.listCard}>
              <h3 style={{...s.chartTitle,color:overdueList.length>0?'var(--red)':'var(--text-1)',marginBottom:14}}>
                {overdueList.length>0?'⚠ Overdue Tasks':'✅ No Overdue Tasks'}
              </h3>
              {overdueList.length===0 && <div style={s.emptyMsg}>You're all caught up! Great work. 🎉</div>}
              {overdueList.map(task=>(
                <div key={task.id} style={{...s.taskRow,borderLeft:'3px solid var(--red)',paddingLeft:12,cursor:'pointer'}}
                  onClick={()=>{ setEditTask(task); setModalOpen(true); }}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13.5,fontWeight:500}}>{task.title}</div>
                    <div style={{fontSize:11.5,color:'var(--red)',marginTop:2}}>Was due {fmtDate(task.deadline)}</div>
                  </div>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>
        </>)}
      </div>

      {/* ── Task Modal — handles both create and edit ── */}
      {modalOpen && (
        <TaskModal
          task={editTask}
          projects={projects}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
        />
      )}
    </div>
  );
}

const s = {
  statsGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
  intelRow:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:16, marginBottom:24 },
  chartsRow:{ display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' },
  chartCard:{ flex:1, padding:'20px 20px 14px', minWidth:260 },
  chartTitle:{ fontSize:14.5, fontWeight:700, color:'var(--text-1)' },
  bottomRow:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  listCard:{ padding:'18px 20px' },
  taskRow:{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' },
  emptyMsg:{ textAlign:'center', color:'var(--text-4)', fontSize:13, padding:'24px 0' },
};
