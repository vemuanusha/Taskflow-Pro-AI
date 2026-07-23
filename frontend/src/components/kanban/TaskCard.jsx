import React from 'react';
import { fmtShortDate, isOverdue, isDueToday, cap } from '../../utils/helpers';
import RiskBadge from '../dashboard/RiskBadge';
const PDOT = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };
export default function TaskCard({ task, onClick, provided, snapshot }) {
  const overdue  = isOverdue(task);
  const dueToday = isDueToday(task);
  const isDone   = task.status === 'done';
  return (
    <div ref={provided?.innerRef} {...provided?.draggableProps} {...provided?.dragHandleProps}
      onClick={onClick}
      style={{ ...s.card, ...(snapshot?.isDragging?s.dragging:{}), ...(overdue?s.overdueCard:{}), opacity:isDone?0.7:1, ...provided?.draggableProps?.style }}>
      <div style={s.top}>
        <div style={s.prio}>
          <span style={{ ...s.dot, background:PDOT[task.priority] }} />
          <span style={s.prioLabel}>{cap(task.priority)}</span>
        </div>
        {overdue  && <span style={s.overdueChip}>Overdue</span>}
        {dueToday && !overdue && <span style={s.todayChip}>Due today</span>}
      </div>
      <p style={{ ...s.title, textDecoration:isDone?'line-through':'none', color:isDone?'var(--text-4)':'var(--text-1)' }}>{task.title}</p>
      {task.description && <p style={s.desc}>{task.description.length>75?task.description.slice(0,75)+'…':task.description}</p>}
      {task.tags?.length>0 && (
        <div style={s.tags}>
          {task.tags.slice(0,3).map(tag=><span key={tag} className="tag">{tag}</span>)}
          {task.tags.length>3 && <span style={{fontSize:10,color:'var(--text-4)'}}>+{task.tags.length-3}</span>}
        </div>
      )}
      {task.risk_level && task.risk_level !== 'low' && !isDone && (
        <div style={{ marginBottom:8 }}>
          <RiskBadge level={task.risk_level} reason={task.risk_reason} score={task.risk_score} />
        </div>
      )}
      <div style={s.footer}>
        {task.deadline && (
          <span style={{ ...s.deadline, color:overdue?'var(--red)':dueToday?'var(--amber)':'var(--text-4)' }}>
            {overdue?'⚠ ':dueToday?'⏰ ':'📅 '}{fmtShortDate(task.deadline)}
          </span>
        )}
        <div style={s.indicators}>
          {task.comments_count>0  && <span style={s.ind}>💬 {task.comments_count}</span>}
          {task.attachments_count>0 && <span style={s.ind}>📎 {task.attachments_count}</span>}
        </div>
      </div>
    </div>
  );
}
const s = {
  card:{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'13px 14px', cursor:'pointer', transition:'all 0.15s', marginBottom:8, userSelect:'none' },
  dragging:{ boxShadow:'var(--shadow-lg)', transform:'rotate(1deg)', border:'1px solid var(--brand-400)' },
  overdueCard:{ borderLeft:'3px solid var(--red)' },
  top:{ display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  prio:{ display:'flex', alignItems:'center', gap:5 },
  dot:{ width:7, height:7, borderRadius:'50%', display:'inline-block', flexShrink:0 },
  prioLabel:{ fontSize:10.5, fontWeight:600, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'0.05em' },
  overdueChip:{ fontSize:10, fontWeight:700, color:'var(--red)', background:'var(--red-bg)', padding:'1px 7px', borderRadius:99, border:'1px solid var(--red-border)', marginLeft:'auto' },
  todayChip:{  fontSize:10, fontWeight:700, color:'var(--amber)', background:'var(--amber-bg)', padding:'1px 7px', borderRadius:99, border:'1px solid var(--amber-border)', marginLeft:'auto' },
  title:{ fontSize:13.5, fontWeight:600, lineHeight:1.4, marginBottom:5 },
  desc:{ fontSize:12, color:'var(--text-3)', lineHeight:1.5, marginBottom:8 },
  tags:{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 },
  footer:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 },
  deadline:{ fontSize:11.5, fontWeight:500 },
  indicators:{ display:'flex', gap:8 },
  ind:{ fontSize:11, color:'var(--text-4)' },
};
