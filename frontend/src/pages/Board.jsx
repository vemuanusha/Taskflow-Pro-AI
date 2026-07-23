import React, { useEffect, useState, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import KanbanColumn from '../components/kanban/KanbanColumn';
import TaskModal from '../components/modals/TaskModal';
import Topbar from '../components/layout/Topbar';
import toast from 'react-hot-toast';
const COLUMNS = ['todo','inprogress','inreview','done'];
export default function Board() {
  const { tasks, projects, fetchTasks, fetchProjects, patchTask } = useTask();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [initStatus, setInitStatus] = useState('todo');
  useEffect(() => { fetchTasks(projectId?{project:projectId}:{}); fetchProjects(); }, [projectId]);
  useEffect(() => {
    const h = () => { setEditTask(null); setInitStatus('todo'); setModalOpen(true); };
    document.addEventListener('open-task-modal', h);
    return () => document.removeEventListener('open-task-modal', h);
  }, []);
  const filtered = useMemo(() => projectId ? tasks.filter(t=>String(t.project)===projectId) : tasks, [tasks,projectId]);
  const byStatus = useMemo(() => { const m={}; COLUMNS.forEach(c=>{m[c]=filtered.filter(t=>t.status===c);}); return m; }, [filtered]);
  const onDragEnd = async ({source,destination,draggableId}) => {
    if (!destination) return;
    if (source.droppableId===destination.droppableId && source.index===destination.index) return;
    try {
      await patchTask(Number(draggableId), {status:destination.droppableId});
      const labels={todo:'To Do',inprogress:'In Progress',inreview:'In Review',done:'Done'};
      toast.success(`Moved to ${labels[destination.droppableId]}`);
    } catch { toast.error('Failed to move task'); }
  };
  const openAdd  = status => { setEditTask(null); setInitStatus(status); setModalOpen(true); };
  const openEdit = task   => { setEditTask(task); setModalOpen(true); };
  const currentProject = projects.find(p=>String(p.id)===projectId);
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <Topbar title={currentProject?`📂 ${currentProject.name}`:'🗂 Kanban Board'} subtitle={`${filtered.length} tasks across ${COLUMNS.length} columns`}/>
      {projects.length>0 && (
        <div style={s.projBar}>
          <a href="/board" style={{...s.chip,...(!projectId?s.chipActive:{})}}>All Tasks</a>
          {projects.map(p=>(
            <a key={p.id} href={`/board?project=${p.id}`} style={{...s.chip,...(projectId===String(p.id)?s.chipActive:{})}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:p.color||'#6366f1',display:'inline-block'}}/>
              {p.name}
            </a>
          ))}
        </div>
      )}
      <div style={s.boardWrap}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={s.board}>
            {COLUMNS.map(col=>(
              <KanbanColumn key={col} id={col} tasks={byStatus[col]||[]} onCardClick={openEdit} onAddTask={openAdd}/>
            ))}
          </div>
        </DragDropContext>
      </div>
      {modalOpen && <TaskModal task={editTask} initialStatus={initStatus} projects={projects} onClose={()=>setModalOpen(false)}/>}
    </div>
  );
}
const s = {
  projBar:{ display:'flex', alignItems:'center', gap:8, padding:'10px 28px', background:'var(--surface)', borderBottom:'1px solid var(--border)', overflowX:'auto' },
  chip:{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:'var(--r-full)', fontSize:12.5, fontWeight:500, color:'var(--text-3)', border:'1px solid var(--border)', cursor:'pointer', textDecoration:'none', whiteSpace:'nowrap' },
  chipActive:{ background:'var(--brand-50)', color:'var(--brand-600)', border:'1px solid var(--brand-200)' },
  boardWrap:{ flex:1, overflowX:'auto', padding:'24px 28px' },
  board:{ display:'flex', gap:20, alignItems:'flex-start', minWidth:'max-content' },
};
