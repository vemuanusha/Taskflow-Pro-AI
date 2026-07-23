import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
export function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = typeof d === 'string' ? parseISO(d) : d;
    if (isToday(dt)) return 'Today';
    if (isTomorrow(dt)) return 'Tomorrow';
    return format(dt, 'MMM d, yyyy');
  } catch { return d; }
}
export function fmtShortDate(d) {
  if (!d) return '—';
  try { return format(parseISO(d), 'MMM d'); } catch { return d; }
}
export function fmtRelative(d) {
  if (!d) return '';
  try { return formatDistanceToNow(parseISO(d), { addSuffix: true }); } catch { return ''; }
}
export function fmtDateTime(d) {
  if (!d) return '';
  try { return format(parseISO(d), 'MMM d, yyyy · h:mm a'); } catch { return d; }
}
export function isOverdue(task) {
  if (!task.deadline || task.status === 'done') return false;
  return isPast(parseISO(task.deadline));
}
export function isDueToday(task) {
  if (!task.deadline || task.status === 'done') return false;
  return isToday(parseISO(task.deadline));
}
export const PRIORITY_ORDER = { high:0, medium:1, low:2 };
export const PRIORITY_COLORS = {
  high:   { text:'#ef4444', bg:'#fef2f2', border:'#fecaca' },
  medium: { text:'#f59e0b', bg:'#fffbeb', border:'#fde68a' },
  low:    { text:'#10b981', bg:'#ecfdf5', border:'#a7f3d0' },
};
export const STATUS_META = {
  todo:       { label:'To Do',       color:'#64748b', bg:'#f1f5f9' },
  inprogress: { label:'In Progress', color:'#3b82f6', bg:'#eff6ff' },
  inreview:   { label:'In Review',   color:'#8b5cf6', bg:'#ede9fe' },
  done:       { label:'Done',        color:'#10b981', bg:'#ecfdf5' },
};
export const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
export const initials = (name='') => name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
export function sortTasks(tasks, by) {
  const arr = [...tasks];
  if (by==='priority') return arr.sort((a,b) => PRIORITY_ORDER[a.priority]-PRIORITY_ORDER[b.priority]);
  if (by==='deadline') return arr.sort((a,b) => { if(!a.deadline)return 1; if(!b.deadline)return -1; return a.deadline<b.deadline?-1:1; });
  if (by==='title')    return arr.sort((a,b) => a.title.localeCompare(b.title));
  return arr.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
}
export function filterTasks(tasks, { search, status, priority, projectId }) {
  return tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (status   && t.status   !== status)   return false;
    if (priority && t.priority !== priority) return false;
    if (projectId && String(t.project) !== String(projectId)) return false;
    return true;
  });
}
export function exportToCSV(tasks) {
  const headers = ['Title','Status','Priority','Deadline','Tags','Description'];
  const rows = tasks.map(t => [`"${t.title}"`,t.status,t.priority,t.deadline||'',(t.tags||[]).join(';'),`"${(t.description||'').replace(/"/g,'""')}"`]);
  const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download=`tasks-${format(new Date(),'yyyy-MM-dd')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
const GRADIENTS=[['#6366f1','#8b5cf6'],['#3b82f6','#6366f1'],['#10b981','#3b82f6'],['#f59e0b','#ef4444'],['#8b5cf6','#ec4899'],['#14b8a6','#6366f1']];
export function avatarGradient(str='') {
  const idx = str.charCodeAt(0) % GRADIENTS.length;
  return `linear-gradient(135deg, ${GRADIENTS[idx][0]}, ${GRADIENTS[idx][1]})`;
}
