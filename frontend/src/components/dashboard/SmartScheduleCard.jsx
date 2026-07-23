import React, { useEffect, useState } from 'react';
import { taskAPI } from '../../api/taskAPI';

export default function SmartScheduleCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await taskAPI.ai.generateSchedule(false);
      setData(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate a schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <span style={{ fontSize: 15 }}>🗓️</span>
          <span style={s.title}>AI Smart Scheduler</span>
        </div>
        <button onClick={load} disabled={loading} style={s.refreshBtn} title="Regenerate">↻</button>
      </div>

      {loading && !data && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <div className="spinner" style={{ width: 22, height: 22 }} />
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

      {data && (
        <>
          {data.ai_summary && <p style={s.aiText}>{data.ai_summary}</p>}

          {data.schedule?.length ? (
            <div style={s.timeline}>
              {data.schedule.map((b, i) => (
                <div key={i} style={{ ...s.block, ...(b.is_break ? s.breakBlock : {}) }}>
                  <span style={s.time}>{b.start}–{b.end}</span>
                  <span style={{ ...s.blockTitle, ...(b.is_break ? { color: 'var(--text-4)', fontStyle: 'italic' } : {}) }}>
                    {b.is_break ? `☕ ${b.title}` : b.title}
                  </span>
                  {!b.is_break && b.priority && (
                    <span className={`badge badge-${b.priority === 'high' ? 'high' : b.priority === 'medium' ? 'medium' : 'low'}`} style={{ fontSize: 9.5 }}>
                      {b.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: 'var(--text-4)' }}>Nothing to schedule today.</p>
          )}

          {data.unscheduled?.length > 0 && (
            <p style={s.notes}>⚠️ {data.unscheduled.length} task(s) didn't fit today's hours: {data.unscheduled.map((t) => t.title).join(', ')}</p>
          )}
          {data.ai_notes && <p style={s.notes}>💡 {data.ai_notes}</p>}
        </>
      )}
    </div>
  );
}

const s = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 18 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 8 },
  title: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-1)' },
  refreshBtn: { border: '1px solid var(--border)', background: 'var(--bg-2)', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 13, color: 'var(--text-3)' },
  error: { fontSize: 12.5, color: 'var(--red)' },
  aiText: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' },
  block: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)' },
  breakBlock: { background: 'transparent', border: '1px dashed var(--border)' },
  time: { fontSize: 11, fontWeight: 700, color: 'var(--brand-500)', minWidth: 92 },
  blockTitle: { fontSize: 12.5, color: 'var(--text-1)', flex: 1 },
  notes: { fontSize: 11.5, color: 'var(--text-4)', marginTop: 10, lineHeight: 1.5 },
};
