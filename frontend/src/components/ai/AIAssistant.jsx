import React, { useState, useRef, useEffect } from 'react';
import { taskAPI } from '../../api/taskAPI';
import toast from 'react-hot-toast';

export default function AIAssistant({ onClose }) {
  const [tab, setTab]         = useState('chat');
  const [chatMsgs, setChatMsgs] = useState([
    { role: 'assistant', content: "Hi! I'm your AI task assistant 🤖 I can help you plan tasks, suggest priorities, break down complex work, or just chat about your workload. What would you like to do?" }
  ]);
  const [input, setInput]     = useState('');
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Suggest priority
  const [spTitle, setSpTitle] = useState('');
  const [spDesc, setSpDesc]   = useState('');
  const [spResult, setSpResult] = useState(null);
  const [spLoading, setSpLoading] = useState(false);

  // Breakdown
  const [bdTitle, setBdTitle] = useState('');
  const [bdDesc, setBdDesc]   = useState('');
  const [bdResult, setBdResult] = useState(null);
  const [bdLoading, setBdLoading] = useState(false);

  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);

  const sendChat = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    const history = [...chatMsgs, { role: 'user', content: msg }];
    setChatMsgs(history);
    setSending(true);
    try {
      const context = history.slice(-7).map(m => ({ role: m.role, content: m.content }));
      const r = await taskAPI.ai.chat({ message: msg, context: context.slice(0, -1) });
      setChatMsgs(h => [...h, { role: 'assistant', content: r.data.reply }]);
    } catch {
      setChatMsgs(h => [...h, { role: 'assistant', content: '⚠️ Sorry, AI is unavailable. Make sure your API_KEY is set in backend .env' }]);
    } finally { setSending(false); }
  };

  const loadSummary = async () => {
    setSummaryLoading(true); setSummary(null);
    try {
      const r = await taskAPI.ai.dailySummary();
      setSummary(r.data);
    } catch { toast.error('Could not load summary. Check your API key.'); }
    finally { setSummaryLoading(false); }
  };

  useEffect(() => { if (tab === 'summary') loadSummary(); }, [tab]);

  const suggestPriority = async () => {
    if (!spTitle.trim()) return toast.error('Enter a task title');
    setSpLoading(true); setSpResult(null);
    try {
      const r = await taskAPI.ai.suggestPriority({ title: spTitle, description: spDesc });
      setSpResult(r.data);
    } catch { toast.error('AI unavailable. Check your API key.'); }
    finally { setSpLoading(false); }
  };

  const breakdownTask = async () => {
    if (!bdTitle.trim()) return toast.error('Enter a task title');
    setBdLoading(true); setBdResult(null);
    try {
      const r = await taskAPI.ai.breakdown({ title: bdTitle, description: bdDesc });
      setBdResult(r.data);
    } catch { toast.error('AI unavailable. Check your API key.'); }
    finally { setBdLoading(false); }
  };

  const TABS = [
    { id: 'chat',     label: '💬 Chat' },
    { id: 'priority', label: '🎯 Priority' },
    { id: 'breakdown',label: '🔧 Breakdown' },
    { id: 'summary',  label: '📊 Daily Summary' },
  ];

  const priorityColor = p => p === 'high' ? 'var(--red)' : p === 'medium' ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.panel} className="scale-in">
        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>AI Task Assistant</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Powered by Claude AI</div>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Chat */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={s.chatArea}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ ...s.bubble, ...(m.role === 'user' ? s.bubbleUser : s.bubbleAI) }}>
                  {m.role === 'assistant' && <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>🤖</span>}
                  <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{m.content}</div>
                </div>
              ))}
              {sending && (
                <div style={{ ...s.bubble, ...s.bubbleAI }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                    {[0,1,2].map(i => <span key={i} style={{ ...s.dot, animationDelay: `${i*0.2}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={s.chatInput}>
              <input
                className="form-control"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="Ask anything about your tasks…"
                disabled={sending}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-sm" onClick={sendChat} disabled={sending || !input.trim()}>
                {sending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Send'}
              </button>
            </div>
          </div>
        )}

        {/* Priority Suggestion */}
        {tab === 'priority' && (
          <div style={s.tabBody}>
            <p style={s.hint}>Enter a task and AI will suggest the right priority level with reasoning.</p>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-control" value={spTitle} onChange={e => setSpTitle(e.target.value)}
                placeholder="e.g. Fix login bug in production" />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-control" rows={2} value={spDesc} onChange={e => setSpDesc(e.target.value)}
                placeholder="Add any context…" />
            </div>
            <button className="btn btn-primary" onClick={suggestPriority} disabled={spLoading} style={{ width: '100%', justifyContent: 'center' }}>
              {spLoading ? <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Analysing…</> : '🎯 Suggest Priority'}
            </button>
            {spResult && (
              <div style={{ ...s.resultBox, borderColor: priorityColor(spResult.priority) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 22 }}>
                    {spResult.priority === 'high' ? '🔴' : spResult.priority === 'medium' ? '🟡' : '🟢'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: priorityColor(spResult.priority), textTransform: 'capitalize' }}>
                      {spResult.priority} Priority
                    </div>
                    {spResult.suggested_deadline_days && (
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        Suggested deadline: in {spResult.suggested_deadline_days} days
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{spResult.reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Breakdown */}
        {tab === 'breakdown' && (
          <div style={s.tabBody}>
            <p style={s.hint}>AI will break your task into clear, actionable subtasks.</p>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-control" value={bdTitle} onChange={e => setBdTitle(e.target.value)}
                placeholder="e.g. Build user authentication system" />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-control" rows={2} value={bdDesc} onChange={e => setBdDesc(e.target.value)}
                placeholder="Add any technical details or constraints…" />
            </div>
            <button className="btn btn-primary" onClick={breakdownTask} disabled={bdLoading} style={{ width: '100%', justifyContent: 'center' }}>
              {bdLoading ? <><span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />Thinking…</> : '🔧 Break Down Task'}
            </button>
            {bdResult && (
              <div style={s.resultBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Subtasks</span>
                  {bdResult.estimated_hours && (
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>~{bdResult.estimated_hours}h estimated</span>
                  )}
                </div>
                {(bdResult.subtasks || []).map((step, i) => (
                  <div key={i} style={s.subtaskRow}>
                    <span style={{ ...s.stepNum }}>{i + 1}</span>
                    <span style={{ fontSize: 13 }}>{step}</span>
                  </div>
                ))}
                {bdResult.notes && (
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--brand-50)', borderRadius: 'var(--r)', fontSize: 12.5, color: 'var(--text-2)' }}>
                    💡 {bdResult.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Daily Summary */}
        {tab === 'summary' && (
          <div style={s.tabBody}>
            {summaryLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-4)', fontSize: 13 }}>Analysing your tasks…</div>
              </div>
            )}
            {summary && !summaryLoading && (
              <>
                {summary.warning && (
                  <div style={{ ...s.resultBox, borderColor: 'var(--red)', background: 'var(--red-bg)', marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 4 }}>⚠️ Heads up</div>
                    <p style={{ fontSize: 13, color: 'var(--red)' }}>{summary.warning}</p>
                  </div>
                )}
                <div style={s.resultBox}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>📊 Today's Overview</div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{summary.summary}</p>
                </div>
                {summary.focus_tasks?.length > 0 && (
                  <div style={{ ...s.resultBox, marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>🎯 Focus on These Today</div>
                    {summary.focus_tasks.map((t, i) => (
                      <div key={i} style={s.subtaskRow}>
                        <span style={s.stepNum}>{i + 1}</span>
                        <span style={{ fontSize: 13 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ ...s.resultBox, marginTop: 12, background: 'var(--green-bg)', borderColor: 'var(--green-border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>✨ {summary.motivation}</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={loadSummary} style={{ marginTop: 12 }}>🔄 Refresh</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000, padding: 0 },
  panel: { background: 'var(--surface)', width: '100%', maxWidth: 420, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--brand-50), var(--accent-light))' },
  closeBtn: { background: 'none', border: 'none', fontSize: 17, color: 'var(--text-3)', cursor: 'pointer', padding: 4 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)', overflowX: 'auto' },
  tab: { background: 'none', border: 'none', padding: '10px 14px', fontSize: 12, fontWeight: 500, color: 'var(--text-3)', cursor: 'pointer', borderBottom: '2px solid transparent', whiteSpace: 'nowrap', marginBottom: -1, transition: 'all 0.15s' },
  tabActive: { color: 'var(--brand-600)', borderBottomColor: 'var(--brand-500)', background: 'var(--surface)' },
  tabBody: { flex: 1, overflowY: 'auto', padding: '16px 18px' },
  chatArea: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 },
  chatInput: { padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 },
  bubble: { display: 'flex', gap: 8, maxWidth: '90%', padding: '10px 13px', borderRadius: 'var(--r-lg)' },
  bubbleAI: { background: 'var(--bg-2)', border: '1px solid var(--border)', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleUser: { background: 'var(--brand-500)', color: '#fff', alignSelf: 'flex-end', borderBottomRightRadius: 4, flexDirection: 'row-reverse' },
  hint: { fontSize: 12.5, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 },
  resultBox: { background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px 16px', marginTop: 14 },
  subtaskRow: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' },
  stepNum: { width: 22, height: 22, borderRadius: '50%', background: 'var(--brand-500)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  dot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)', animation: 'bounce 1s infinite', display: 'inline-block' },
};
