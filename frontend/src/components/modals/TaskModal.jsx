import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../../context/TaskContext';
import { isOverdue } from '../../utils/helpers';
import { taskAPI } from '../../api/taskAPI';
import toast from 'react-hot-toast';

const EMPTY = { title:'', description:'', status:'todo', priority:'medium', deadline:'', tags:'', project:'', estimated_hours:1, completion_percentage:0 };

export default function TaskModal({ task, initialStatus, onClose, projects=[] }) {
  const { createTask, updateTask, deleteTask } = useTask();
  const isEdit = !!task?.id;
  const [form, setForm]   = useState(EMPTY);
  const [tab, setTab]     = useState('details');
  const [saving, setSaving]   = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [aiLoading, setAiLoading] = useState('');  // 'priority' | 'improve' | ''
  const [aiHint, setAiHint] = useState(null);

  useEffect(() => {
    if (task) {
      setForm({ title:task.title||'', description:task.description||'', status:task.status||'todo', priority:task.priority||'medium', deadline:task.deadline||'', tags:(task.tags||[]).join(', '), project:task.project||'', estimated_hours:task.estimated_hours ?? 1, completion_percentage:task.completion_percentage ?? 0 });
      loadComments(task.id);
    } else {
      setForm(f=>({...EMPTY, status:initialStatus||'todo'}));
    }
  }, [task, initialStatus]);

  const loadComments = async id => {
    try { const r = await taskAPI.getComments(id); setComments(r.data); } catch {}
  };
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean), project:form.project||null };
      if (isEdit) await updateTask(task.id, payload); else await createTask(payload);
      onClose();
    } catch { toast.error('Failed to save task.'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task permanently?')) return;
    try { await deleteTask(task.id); onClose(); } catch { toast.error('Failed to delete.'); }
  };

  const handleAddComment = async e => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try { const r = await taskAPI.addComment(task.id,{content:newComment}); setComments(c=>[...c,r.data]); setNewComment(''); }
    catch { toast.error('Failed to add comment.'); }
  };

  // AI: suggest priority
  const handleSuggestPriority = async () => {
    if (!form.title.trim()) return toast.error('Enter a title first');
    setAiLoading('priority'); setAiHint(null);
    try {
      const r = await taskAPI.ai.suggestPriority({ title: form.title, description: form.description });
      const { priority, reason, suggested_deadline_days } = r.data;
      set('priority', priority);
      setAiHint({ type: 'priority', text: `AI set priority to ${priority}: ${reason}${suggested_deadline_days ? ` (suggested: ${suggested_deadline_days} days)` : ''}` });
      toast.success(`AI suggested: ${priority} priority`);
    } catch { toast.error('AI unavailable. Check GROQ_API_KEY in backend .env'); }
    finally { setAiLoading(''); }
  };

  // AI: improve description
  const handleImproveDesc = async () => {
    if (!form.title.trim()) return toast.error('Enter a title first');
    setAiLoading('improve'); setAiHint(null);
    try {
      const r = await taskAPI.ai.improveDescription({ title: form.title, description: form.description });
      set('description', r.data.improved_description);
      setAiHint({ type: 'improve', text: `Improved: ${r.data.changes_made}` });
      toast.success('Description improved!');
    } catch { toast.error('AI unavailable. Check GROQ_API_KEY in backend .env'); }
    finally { setAiLoading(''); }
  };

  const overdue = task && isOverdue(task);

  return (
    <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal} className="scale-in">
        <div style={s.header}>
          <div style={{flex:1}}>
            <div style={s.modalLabel}>{isEdit?'Edit Task':'New Task'}</div>
            {overdue && <span style={{fontSize:11,color:'var(--red)',fontWeight:600}}>⚠ Overdue</span>}
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        {isEdit && (
          <div style={s.tabs}>
            {['details','comments'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{...s.tab,...(tab===t?s.tabActive:{})}}>
                {t==='details'?'📋 Details':`💬 Comments (${comments.length})`}
              </button>
            ))}
          </div>
        )}
        <div style={s.body}>
          {tab==='details' && (
            <>
              <div className="form-group">
                <label className="form-label">Task title *</label>
                <input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="What needs to be done?" autoFocus style={{fontSize:15,fontWeight:500}} />
              </div>
              <div className="form-group">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
                  <label className="form-label" style={{margin:0}}>Description</label>
                  <button type="button" style={s.aiBtn} onClick={handleImproveDesc} disabled={aiLoading==='improve'}>
                    {aiLoading==='improve' ? <span className="spinner" style={{width:10,height:10,marginRight:4}}/> : '✨'} AI Improve
                  </button>
                </div>
                <textarea className="form-control" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Add details, notes, or context…" />
              </div>
              {aiHint && (
                <div style={s.aiHint}>
                  <span style={{fontSize:13}}>🤖</span>
                  <span style={{fontSize:12,color:'var(--text-2)'}}>{aiHint.text}</span>
                  <button onClick={()=>setAiHint(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-4)',fontSize:12,marginLeft:'auto'}}>✕</button>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e=>set('status',e.target.value)}>
                    <option value="todo">To Do</option><option value="inprogress">In Progress</option>
                    <option value="inreview">In Review</option><option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
                    <label className="form-label" style={{margin:0}}>Priority</label>
                    <button type="button" style={s.aiBtn} onClick={handleSuggestPriority} disabled={aiLoading==='priority'}>
                      {aiLoading==='priority' ? <span className="spinner" style={{width:10,height:10,marginRight:4}}/> : '🎯'} AI
                    </button>
                  </div>
                  <select className="form-control" value={form.priority} onChange={e=>set('priority',e.target.value)}>
                    <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-control" value={form.deadline} onChange={e=>set('deadline',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select className="form-control" value={form.project} onChange={e=>set('project',e.target.value)}>
                    <option value="">No project</option>
                    {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:isEdit?'1fr 1fr':'1fr',gap:14}}>
                <div className="form-group">
                  <label className="form-label">Estimated hours <span style={{color:'var(--text-4)',fontWeight:400}}>(used by AI Workload &amp; Scheduler)</span></label>
                  <input type="number" min="0.25" max="40" step="0.25" className="form-control" value={form.estimated_hours} onChange={e=>set('estimated_hours', parseFloat(e.target.value) || 0)} />
                </div>
                {isEdit && (
                  <div className="form-group">
                    <label className="form-label">Progress: {form.completion_percentage}%</label>
                    <input type="range" min="0" max="100" step="5" value={form.completion_percentage}
                      onChange={e=>set('completion_percentage', parseInt(e.target.value))}
                      style={{width:'100%', accentColor:'var(--brand-500)', marginTop:10}} />
                  </div>
                )}
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label className="form-label">Tags <span style={{color:'var(--text-4)',fontWeight:400}}>(comma-separated)</span></label>
                <input className="form-control" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="e.g. React, Backend, Bug" />
              </div>
            </>
          )}
          {tab==='comments' && (
            <div>
              <div style={s.commentList}>
                {comments.length===0 && <div style={s.emptyState}>💬 No comments yet.</div>}
                {comments.map(c=>(
                  <div key={c.id} style={s.comment}>
                    <div className="avatar avatar-sm" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',flexShrink:0}}>{(c.author_name||'U')[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontWeight:600,fontSize:12.5}}>{c.author_name||'User'}</span>
                        <span style={{fontSize:11,color:'var(--text-4)'}}>{c.created_at?.slice(0,10)}</span>
                      </div>
                      <p style={{fontSize:13,color:'var(--text-2)',marginTop:3}}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} style={{display:'flex',gap:8,marginTop:12}}>
                <input className="form-control" value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Add a comment…" style={{flex:1}} />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!newComment.trim()}>Send</button>
              </form>
            </div>
          )}
        </div>
        <div style={s.footer}>
          {isEdit && <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Delete</button>}
          <div style={{display:'flex',gap:8,marginLeft:'auto'}}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving?<><span className="spinner" style={{width:12,height:12,marginRight:6}}/>Saving…</>:isEdit?'✓ Save changes':'+ Create task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
const s = {
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
  modal:{ background:'var(--surface)', borderRadius:'var(--r-xl)', width:'100%', maxWidth:560, boxShadow:'var(--shadow-xl)', display:'flex', flexDirection:'column', maxHeight:'88vh' },
  header:{ display:'flex', alignItems:'flex-start', padding:'20px 22px 14px', borderBottom:'1px solid var(--border)', gap:12 },
  modalLabel:{ fontSize:17, fontWeight:700, color:'var(--text-1)' },
  closeBtn:{ background:'none', border:'none', fontSize:17, color:'var(--text-4)', cursor:'pointer', padding:4, lineHeight:1, marginTop:2 },
  tabs:{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 22px' },
  tab:{ background:'none', border:'none', padding:'10px 14px', fontSize:12.5, fontWeight:500, color:'var(--text-3)', cursor:'pointer', borderBottom:'2px solid transparent', marginBottom:-1, transition:'all 0.15s' },
  tabActive:{ color:'var(--brand-600)', borderBottomColor:'var(--brand-500)' },
  body:{ padding:'20px 22px', overflowY:'auto', flex:1 },
  footer:{ display:'flex', alignItems:'center', padding:'14px 22px', borderTop:'1px solid var(--border)' },
  commentList:{ display:'flex', flexDirection:'column', gap:14, maxHeight:280, overflowY:'auto' },
  comment:{ display:'flex', gap:10 },
  emptyState:{ textAlign:'center', color:'var(--text-4)', fontSize:13, padding:'24px 0' },
  aiBtn:{ background:'var(--brand-50)', border:'1px solid var(--brand-200)', color:'var(--brand-600)', borderRadius:'var(--r-sm)', padding:'3px 9px', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:3 },
  aiHint:{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 12px', background:'var(--brand-50)', border:'1px solid var(--brand-100)', borderRadius:'var(--r)', marginBottom:14, fontSize:12 },
};
