import React, { useState, useMemo, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import Topbar from '../components/layout/Topbar';
import TaskModal from '../components/modals/TaskModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO, isSameMonth } from 'date-fns';
import { PRIORITY_COLORS } from '../utils/helpers';
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export default function Calendar() {
  const { tasks, projects, fetchTasks } = useTask();
  const [current,setCurrent] = useState(new Date());
  const [editTask,setEditTask] = useState(null);
  const [modalOpen,setModalOpen] = useState(false);
  useEffect(()=>{ fetchTasks(); },[]);
  const days    = eachDayOfInterval({start:startOfMonth(current),end:endOfMonth(current)});
  const startPad = startOfMonth(current).getDay();
  const allCells = [...Array(startPad).fill(null),...days];
  const tasksByDay = useMemo(()=>{
    const m={};
    tasks.forEach(t=>{ if(!t.deadline) return; try { const d=format(parseISO(t.deadline),'yyyy-MM-dd'); if(!m[d])m[d]=[]; m[d].push(t); } catch{} });
    return m;
  },[tasks]);
  const prev = ()=>setCurrent(d=>new Date(d.getFullYear(),d.getMonth()-1,1));
  const next = ()=>setCurrent(d=>new Date(d.getFullYear(),d.getMonth()+1,1));
  return (
    <div>
      <Topbar title="📅 Calendar" subtitle={format(current,'MMMM yyyy')}/>
      <div className="page-content">
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <button className="btn btn-secondary btn-sm" onClick={prev}>‹ Prev</button>
          <h2 style={{fontSize:18,fontWeight:700,flex:1,textAlign:'center'}}>{format(current,'MMMM yyyy')}</h2>
          <button className="btn btn-secondary btn-sm" onClick={next}>Next ›</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setCurrent(new Date())}>Today</button>
        </div>
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--bg-2)',borderBottom:'1px solid var(--border)'}}>
            {WD.map(d=><div key={d} style={{padding:'10px 0',textAlign:'center',fontSize:11.5,fontWeight:700,color:'var(--text-4)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
            {allCells.map((day,i)=>{
              if(!day) return <div key={i} style={{borderRight:'1px solid var(--border)',borderBottom:'1px solid var(--border)',minHeight:100,background:'var(--bg-2)'}}/>;
              const key=format(day,'yyyy-MM-dd');
              const dayTasks=tasksByDay[key]||[];
              const today=isToday(day);
              const inMonth=isSameMonth(day,current);
              return (
                <div key={key} style={{borderRight:'1px solid var(--border)',borderBottom:'1px solid var(--border)',minHeight:100,padding:8,overflow:'hidden',background:today?'var(--brand-50)':'var(--surface)',opacity:inMonth?1:0.4}}>
                  <div style={{fontSize:12.5,fontWeight:600,color:today?'#fff':'var(--text-3)',marginBottom:4,width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:today?'var(--brand-500)':'transparent'}}>{format(day,'d')}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:3}}>
                    {dayTasks.slice(0,3).map(t=>{
                      const pc=PRIORITY_COLORS[t.priority]||{};
                      return <div key={t.id} onClick={()=>{setEditTask(t);setModalOpen(true);}} style={{fontSize:10.5,fontWeight:600,padding:'2px 6px',borderRadius:4,cursor:'pointer',border:'1px solid transparent',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',background:pc.bg,color:pc.text,borderColor:pc.border}} title={t.title}>{t.title.length>16?t.title.slice(0,16)+'…':t.title}</div>;
                    })}
                    {dayTasks.length>3 && <div style={{fontSize:10,color:'var(--text-4)',fontWeight:500}}>+{dayTasks.length-3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{display:'flex',gap:18,marginTop:14,justifyContent:'center'}}>
          {[['High','#ef4444','#fef2f2'],['Medium','#f59e0b','#fffbeb'],['Low','#10b981','#ecfdf5']].map(([label,color,bg])=>(
            <div key={label} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-3)'}}>
              <span style={{width:10,height:10,borderRadius:2,background:bg,border:`1px solid ${color}30`,display:'inline-block'}}/> {label} priority
            </div>
          ))}
        </div>
      </div>
      {modalOpen && <TaskModal task={editTask} projects={projects} onClose={()=>setModalOpen(false)}/>}
    </div>
  );
}
