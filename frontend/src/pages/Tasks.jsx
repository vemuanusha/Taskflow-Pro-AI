import React, { useEffect, useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import Topbar from '../components/layout/Topbar';
import TaskModal from '../components/modals/TaskModal';
import { sortTasks, filterTasks, fmtDate, isOverdue, isDueToday, cap, exportToCSV } from '../utils/helpers';
import { useDebounce } from '../hooks/useHelpers';
export default function Tasks() {
  const { tasks, projects, fetchTasks, fetchProjects, loading } = useTask();
  const [search,setSearch]     = useState('');
  const [status,setStatus]     = useState('');
  const [priority,setPriority] = useState('');
  const [projectId,setProjectId] = useState('');
  const [sortBy,setSortBy]     = useState('created_at');
  const [modalOpen,setModalOpen] = useState(false);
  const [editTask,setEditTask]  = useState(null);
  const debSearch = useDebounce(search,300);
  useEffect(()=>{ fetchTasks(); fetchProjects(); },[]);
  useEffect(()=>{
    const h=()=>{ setEditTask(null); setModalOpen(true); };
    document.addEventListener('open-task-modal',h);
    return ()=>document.removeEventListener('open-task-modal',h);
  },[]);
  const filtered = useMemo(()=>sortTasks(filterTasks(tasks,{search:debSearch,status,priority,projectId}),sortBy),[tasks,debSearch,status,priority,projectId,sortBy]);
  const clearFilters=()=>{ setSearch('');setStatus('');setPriority('');setProjectId(''); };
  const hasFilters = search||status||priority||projectId;
  return (
    <div>
      <Topbar title="All Tasks" subtitle={`${filtered.length} of ${tasks.length} tasks`}/>
      <div className="page-content">
        <div style={s.toolbar}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,pointerEvents:'none',zIndex:1}}>🔍</span>
            <input className="form-control" style={{paddingLeft:34,width:240}} placeholder="Search tasks…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="form-control" style={s.sel} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All statuses</option><option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="inreview">In Review</option><option value="done">Done</option>
          </select>
          <select className="form-control" style={s.sel} value={priority} onChange={e=>setPriority(e.target.value)}>
            <option value="">All priorities</option><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
          </select>
          {projects.length>0 && (
            <select className="form-control" style={s.sel} value={projectId} onChange={e=>setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <select className="form-control" style={s.sel} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="created_at">Newest first</option><option value="deadline">By deadline</option><option value="priority">By priority</option><option value="title">Alphabetical</option>
          </select>
          {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button className="btn btn-secondary btn-sm" onClick={()=>exportToCSV(filtered)}>↓ Export</button>
            <button className="btn btn-primary btn-sm" onClick={()=>{setEditTask(null);setModalOpen(true);}}>+ New Task</button>
          </div>
        </div>
        {loading ? <div style={{textAlign:'center',padding:60}}><div className="spinner" style={{width:30,height:30,margin:'0 auto'}}/></div> : (
          <div className="card" style={{overflow:'hidden'}}>
            <table style={s.table}>
              <thead><tr style={{background:'var(--bg-2)'}}>
                {['Task','Status','Priority','Deadline','Tags','Project',''].map(h=><th key={h} style={s.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.length===0 && <tr><td colSpan={7} style={{textAlign:'center',padding:'48px 24px',color:'var(--text-4)',fontSize:14}}>{hasFilters?'🔍 No tasks match your filters.':'📋 No tasks yet. Create your first task!'}</td></tr>}
                {filtered.map(task=>{
                  const overdue=isOverdue(task); const dueToday=isDueToday(task); const isDone=task.status==='done';
                  return (
                    <tr key={task.id} style={s.row} onClick={()=>{setEditTask(task);setModalOpen(true);}}>
                      <td style={s.td}>
                        <div style={{fontWeight:500,fontSize:13.5,textDecoration:isDone?'line-through':'none',color:isDone?'var(--text-4)':'var(--text-1)'}}>{task.title}</div>
                        {task.description && <div style={{fontSize:11.5,color:'var(--text-4)',marginTop:2}}>{task.description.slice(0,55)}{task.description.length>55?'…':''}</div>}
                      </td>
                      <td style={s.td}><span className={`badge badge-${task.status}`}>{task.status==='inprogress'?'In Progress':task.status==='inreview'?'In Review':cap(task.status)}</span></td>
                      <td style={s.td}><span className={`badge badge-${task.priority}`}>{cap(task.priority)}</span></td>
                      <td style={{...s.td,color:overdue?'var(--red)':dueToday?'var(--amber)':'var(--text-3)',fontSize:12.5,fontWeight:overdue||dueToday?600:400}}>{overdue?'⚠ ':dueToday?'⏰ ':''}{fmtDate(task.deadline)}</td>
                      <td style={s.td}><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{(task.tags||[]).slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}</div></td>
                      <td style={{...s.td,fontSize:12,color:'var(--text-4)'}}>{projects.find(p=>p.id===task.project)?.name||'—'}</td>
                      <td style={{...s.td,textAlign:'right'}}><button className="btn btn-ghost btn-sm" style={{fontSize:12}} onClick={e=>{e.stopPropagation();setEditTask(task);setModalOpen(true);}}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && <TaskModal task={editTask} projects={projects} onClose={()=>setModalOpen(false)}/>}
    </div>
  );
}
const s = {
  toolbar:{ display:'flex', alignItems:'center', gap:10, marginBottom:18, flexWrap:'wrap' },
  sel:{ width:'auto', minWidth:130, cursor:'pointer' },
  table:{ width:'100%', borderCollapse:'collapse' },
  th:{ padding:'11px 16px', textAlign:'left', fontSize:11.5, fontWeight:700, color:'var(--text-4)', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' },
  row:{ cursor:'pointer', transition:'background 0.1s', borderBottom:'1px solid var(--border)' },
  td:{ padding:'13px 16px', verticalAlign:'middle' },
};
