import React, { useEffect, useState } from 'react';
import { taskAPI } from '../../api/taskAPI';
import RiskBadge from './RiskBadge';
import { fmtShortDate } from '../../utils/helpers';

export default function TopRisksCard({ onTaskClick }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await taskAPI.dashboardOverview();
      setData(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load risk overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const risks = data?.top_risks || [];

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <span style={{ fontSize: 15 }}>🚦</span>
          <span style={s.title}>Deadline Risk</span>
        </div>
        <button onClick={load} disabled={loading} style={s.refreshBtn} title="Refresh">↻</button>
      </div>

      {loading && !data && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <div className="spinner" style={{ width: 22, height: 22 }} />
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

      {data && (
        <>
          {data.stats && (
            <p style={s.subline}>
              {data.stats.overdue > 0
                ? `${data.stats.overdue} overdue out of ${data.stats.total} tasks.`
                : `${data.stats.done}/${data.stats.total} tasks completed. No overdue tasks.`}
            </p>
          )}
          {risks.length === 0 ? (
            <div style={s.empty}>✅ No tasks currently flagged as at-risk.</div>
          ) : (
            <div style={s.list}>
              {risks.map((t) => (
                <div key={t.id} style={s.row} onClick={() => onTaskClick?.(t.id)} title="Click to open">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.rowTitle}>{t.title}</div>
                    {t.due_date && <div style={s.rowMeta}>Due {fmtShortDate(t.due_date)}</div>}
                  </div>
                  <RiskBadge level={t.risk_level} reason={t.risk_reason} score={t.risk_score} />
                </div>
              ))}
            </div>
          )}
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
  subline: { fontSize: 11.5, color: 'var(--text-4)', marginBottom: 12 },
  empty: { fontSize: 12.5, color: 'var(--text-4)', padding: '10px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', cursor: 'pointer' },
  rowTitle: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowMeta: { fontSize: 11, color: 'var(--text-4)', marginTop: 2 },
};
