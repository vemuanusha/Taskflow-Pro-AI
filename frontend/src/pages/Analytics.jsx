import React, { useEffect, useMemo, useState } from 'react';
import { useTask } from '../context/TaskContext';
import { taskAPI } from '../api/taskAPI';
import Topbar from '../components/layout/Topbar';
import { isOverdue } from '../utils/helpers';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, parseISO, getWeek, startOfWeek } from 'date-fns';
export default function Analytics() {
  const { tasks, fetchTasks } = useTask();
  const [period, setPeriod] = useState('7d');
  const [prod, setProd] = useState(null);
  const [prodLoading, setProdLoading] = useState(true);
  useEffect(()=>{ fetchTasks(); },[]);
  useEffect(()=>{
    (async () => {
      try { const r = await taskAPI.productivity(); setProd(r.data); }
      catch { /* insights are supplementary — fail silently */ }
      finally { setProdLoading(false); }
    })();
  },[]);
  const stats = useMemo(()=>({
    total:tasks.length, done:tasks.filter(t=>t.status==='done').length,
    inprogress:tasks.filter(t=>t.status==='inprogress').length,
    inreview:tasks.filter(t=>t.status==='inreview').length,
    todo:tasks.filter(t=>t.status==='todo').length,
    overdue:tasks.filter(isOverdue).length,
    high:tasks.filter(t=>t.priority==='high').length,
    medium:tasks.filter(t=>t.priority==='medium').length,
    low:tasks.filter(t=>t.priority==='low').length,
    rate:tasks.length?Math.round((tasks.filter(t=>t.status==='done').length/tasks.length)*100):0,
  }),[tasks]);
  const statusData = [
    {name:'To Do',value:stats.todo,color:'#64748b'},{name:'In Progress',value:stats.inprogress,color:'#3b82f6'},
    {name:'In Review',value:stats.inreview,color:'#8b5cf6'},{name:'Done',value:stats.done,color:'#10b981'},
  ].filter(d=>d.value>0);
  const priorityData = [{name:'High',count:stats.high,fill:'#ef4444'},{name:'Medium',count:stats.medium,fill:'#f59e0b'},{name:'Low',count:stats.low,fill:'#10b981'}];
  const days = period==='7d'?7:period==='30d'?30:90;
  const trendData = useMemo(()=>{
    if(period==='3m') return Array.from({length:12},(_,i)=>{
      const d=subDays(new Date(),(11-i)*7); const week=`W${getWeek(d)}`;
      const ws=startOfWeek(d); const we=new Date(ws); we.setDate(we.getDate()+6);
      return { label:week, created:tasks.filter(t=>{try{const td=parseISO(t.created_at);return td>=ws&&td<=we;}catch{return false;}}).length, completed:tasks.filter(t=>{try{const td=parseISO(t.updated_at);return t.status==='done'&&td>=ws&&td<=we;}catch{return false;}}).length };
    });
    return Array.from({length:days},(_,i)=>{ const d=subDays(new Date(),days-1-i); const key=format(d,'yyyy-MM-dd');
      return { label:format(d,days<=7?'EEE':'MM/dd'), created:tasks.filter(t=>t.created_at?.startsWith(key)).length, completed:tasks.filter(t=>t.status==='done'&&t.updated_at?.startsWith(key)).length };
    });
  },[tasks,period,days]);
  const tagMap={}; tasks.forEach(t=>(t.tags||[]).forEach(tag=>{tagMap[tag]=(tagMap[tag]||0)+1;}));
  const topTags=Object.entries(tagMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const TT=({active,payload,label})=>{
    if(!active||!payload?.length) return null;
    return <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',fontSize:12}}>
      <p style={{fontWeight:600,marginBottom:4}}>{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color||p.fill}}>{p.name||p.dataKey}: {p.value}</p>)}</div>;
  };
  return (
    <div>
      <Topbar title="📊 Analytics" subtitle="Track your productivity and task trends"/>
      <div className="page-content">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {[{label:'Total Tasks',val:stats.total,color:'#6366f1',emoji:'📋'},{label:'Completed',val:stats.done,color:'#10b981',emoji:'✅'},{label:'Completion Rate',val:`${stats.rate}%`,color:'#3b82f6',emoji:'📈'},{label:'Overdue',val:stats.overdue,color:'#ef4444',emoji:'⚠️'}]
            .map(c=><div key={c.label} className="stat-card" style={{'--card-accent':c.color}}><div style={{fontSize:26,marginBottom:10}}>{c.emoji}</div><div style={{fontSize:30,fontWeight:800,color:c.color}}>{c.val}</div><div style={{fontSize:13,color:'var(--text-3)',marginTop:4}}>{c.label}</div></div>)}
        </div>
        <div className="card" style={{padding:'20px 22px',marginBottom:20}}>
          <h3 style={{fontSize:14.5,fontWeight:700,marginBottom:16}}>🧠 Productivity Intelligence</h3>
          {prodLoading && <div style={{display:'flex',justifyContent:'center',padding:'20px 0'}}><div className="spinner" style={{width:22,height:22}}/></div>}
          {!prodLoading && prod && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:16}}>
                {[
                  {label:'Weekly Completion Rate',val:`${prod.weekly_completion_rate}%`,emoji:'📈'},
                  {label:'Avg. Completion Time',val:prod.average_completion_time_hours!=null?`${prod.average_completion_time_hours}h`:'—',emoji:'⏱️'},
                  {label:'Most Productive Day',val:prod.most_productive_day||'—',emoji:'📅'},
                  {label:'Most Productive Hour',val:prod.most_productive_hour||'—',emoji:'🕐'},
                ].map(c=>(
                  <div key={c.label} style={{background:'var(--bg-2)',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{fontSize:18,marginBottom:6}}>{c.emoji}</div>
                    <div style={{fontSize:18,fontWeight:800,color:'var(--text-1)'}}>{c.val}</div>
                    <div style={{fontSize:11,color:'var(--text-4)',marginTop:2}}>{c.label}</div>
                  </div>
                ))}
              </div>
              {prod.ai_insights?.length > 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {prod.ai_insights.map((insight,i)=>(
                    <div key={i} style={{fontSize:12.5,color:'var(--text-2)',lineHeight:1.5,background:'var(--brand-50)',border:'1px solid var(--brand-100)',borderRadius:8,padding:'9px 12px'}}>
                      💡 {insight}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="card" style={{padding:'20px 22px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{fontSize:14.5,fontWeight:700}}>Task Trends</h3>
            <div style={{display:'flex',gap:6}}>
              {[['7d','Last 7 days'],['30d','Last 30 days'],['3m','Last 3 months']].map(([v,l])=>(
                <button key={v} onClick={()=>setPeriod(v)} className={period===v?'btn btn-primary btn-sm':'btn btn-secondary btn-sm'}>{l}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{top:5,right:20,bottom:5,left:-10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="label" tick={{fontSize:11,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{fontSize:11,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:12}}/>
              <Line type="monotone" dataKey="created" name="Created" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          <div className="card" style={{padding:'20px 22px'}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:16}}>Status Distribution</h3>
            <div style={{display:'flex',alignItems:'center',gap:20}}>
              <ResponsiveContainer width={150} height={150}><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={3} dataKey="value">{statusData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={<TT/>}/></PieChart></ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {statusData.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:2,background:d.color,display:'inline-block',flexShrink:0}}/><span style={{fontSize:13,color:'var(--text-2)'}}>{d.name}</span><span style={{fontSize:13,fontWeight:700,marginLeft:'auto',color:'var(--text-1)'}}>{d.value}</span></div>)}
              </div>
            </div>
          </div>
          <div className="card" style={{padding:'20px 22px'}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:4}}>Priority Breakdown</h3>
            <ResponsiveContainer width="100%" height={180} style={{marginTop:16}}>
              <BarChart data={priorityData} margin={{left:-10}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/><XAxis dataKey="name" tick={{fontSize:12,fill:'var(--text-3)'}} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11,fill:'var(--text-4)'}} axisLine={false} tickLine={false}/><Tooltip content={<TT/>}/><Bar dataKey="count" radius={[6,6,0,0]}>{priorityData.map((d,i)=><Cell key={i} fill={d.fill}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:'20px 22px'}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>Top Tags</h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {topTags.length===0 && <div style={{color:'var(--text-4)',fontSize:13}}>No tags yet.</div>}
              {topTags.map(([tag,count])=>(
                <div key={tag} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12.5,color:'var(--text-2)',minWidth:70}}>{tag}</span>
                  <div style={{flex:1,height:6,background:'var(--bg-2)',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${(count/(topTags[0][1]||1))*100}%`,background:'var(--brand-500)',borderRadius:99}}/></div>
                  <span style={{fontSize:12,fontWeight:700,color:'var(--text-3)',minWidth:20,textAlign:'right'}}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
