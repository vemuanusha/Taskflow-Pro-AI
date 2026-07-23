import React from 'react';
import Topbar from '../components/layout/Topbar';
import { useTask } from '../context/TaskContext';
import { fmtRelative, cap } from '../utils/helpers';
const META = {
  created:  { emoji:'✅', color:'#10b981', label:'Created'   },
  updated:  { emoji:'✏️', color:'#3b82f6', label:'Updated'   },
  completed:{ emoji:'🎉', color:'#10b981', label:'Completed'  },
};
export default function Activity() {
  const { tasks } = useTask();
  const events = [...tasks]
    .sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at))
    .slice(0,30)
    .map(t=>({ type:t.status==='done'?'completed':t.created_at===t.updated_at?'created':'updated', task:t, time:t.updated_at||t.created_at }));
  return (
    <div>
      <Topbar title="🕐 Activity" subtitle="Recent task history"/>
      <div className="page-content" style={{maxWidth:680}}>
        <div className="card" style={{padding:'6px 0'}}>
          {events.length===0 && <div style={{textAlign:'center',padding:'48px 0',color:'var(--text-4)',fontSize:14}}>No activity yet. Start creating tasks!</div>}
          {events.map((ev,i)=>{
            const meta=META[ev.type]||META.updated;
            return (
              <div key={`${ev.id}-${i}`} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:38,height:38,borderRadius:'50%',background:meta.color+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:16}}>{meta.emoji}</span></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13.5,color:'var(--text-2)',marginBottom:6}}>
                    <span style={{fontWeight:600,color:meta.color}}>{meta.label}</span>{' '}
                    <span style={{color:'var(--text-1)',fontWeight:500}}>"{ev.task.title}"</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span className={`badge badge-${ev.task.priority}`}>{cap(ev.task.priority)}</span>
                    <span style={{fontSize:11.5,color:'var(--text-4)'}}>{fmtRelative(ev.time)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
