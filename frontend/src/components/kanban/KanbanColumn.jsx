import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
const META = {
  todo:       { label:'To Do',       color:'#64748b', emoji:'📋' },
  inprogress: { label:'In Progress', color:'#3b82f6', emoji:'⚡' },
  inreview:   { label:'In Review',   color:'#8b5cf6', emoji:'👁' },
  done:       { label:'Done',        color:'#10b981', emoji:'✅' },
};
export default function KanbanColumn({ id, tasks, onCardClick, onAddTask }) {
  const meta = META[id] || { label:id, color:'#64748b', emoji:'📋' };
  return (
    <div style={s.column}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={{fontSize:15}}>{meta.emoji}</span>
          <span style={s.label}>{meta.label}</span>
          <span style={{ ...s.count, background:meta.color+'20', color:meta.color }}>{tasks.length}</span>
        </div>
        <button onClick={()=>onAddTask(id)} style={s.addBtn} title={`Add to ${meta.label}`}>+</button>
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} style={{ ...s.drop, background:snapshot.isDraggingOver?meta.color+'10':'transparent', borderColor:snapshot.isDraggingOver?meta.color:'transparent' }}>
            {tasks.length===0 && !snapshot.isDraggingOver && (
              <div style={s.empty}><span style={{fontSize:28}}>📭</span><span>No tasks here</span></div>
            )}
            {tasks.map((task,i) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={i}>
                {(prov,snap) => <TaskCard task={task} onClick={()=>onCardClick(task)} provided={prov} snapshot={snap} />}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
const s = {
  column:{ width:275, flexShrink:0, display:'flex', flexDirection:'column' },
  header:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'0 2px' },
  headerLeft:{ display:'flex', alignItems:'center', gap:8 },
  label:{ fontSize:13.5, fontWeight:700, color:'var(--text-1)' },
  count:{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:99 },
  addBtn:{ background:'none', border:'1.5px dashed var(--border)', borderRadius:'var(--r)', color:'var(--text-4)', width:26, height:26, cursor:'pointer', fontSize:17, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' },
  drop:{ flex:1, minHeight:200, borderRadius:'var(--r-md)', padding:'6px', border:'2px dashed transparent', transition:'background 0.2s,border-color 0.2s' },
  empty:{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'40px 16px', color:'var(--text-4)', fontSize:12.5, fontWeight:500 },
};
