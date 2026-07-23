import React, { useEffect, useState } from 'react';
import { taskAPI } from '../../api/taskAPI';

function meterColor(pct) {
  if (pct > 100) return 'var(--red)';
  if (pct > 80) return 'var(--amber)';
  return 'var(--green)';
}

export default function WorkloadCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await taskAPI.ai.workloadAnalysis();
      setData(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not analyze workload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.titleRow}>
          <span style={{ fontSize: 15 }}>🧠</span>
          <span style={s.title}>AI Workload Predictor</span>
        </div>
        <button onClick={load} disabled={loading} style={s.refreshBtn} title="Re-analyze">↻</button>
      </div>

      {loading && !data && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <div className="spinner" style={{ width: 22, height: 22 }} />
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

      {data && (
        <>
          <div style={s.meterRow}>
            <div style={s.meterTrack}>
              <div style={{ ...s.meterFill, width: `${Math.min(data.workload_percentage, 100)}%`, background: meterColor(data.workload_percentage) }} />
            </div>
            <span style={{ ...s.meterPct, color: meterColor(data.workload_percentage) }}>{data.workload_percentage}%</span>
          </div>
          <p style={s.subline}>
            {data.estimated_hours}h estimated of {data.available_hours}h available · confidence:{' '}
            <strong style={{ textTransform: 'capitalize' }}>{data.completion_confidence}</strong>
          </p>

          {data.is_overloaded && (
            <div style={s.warningBox}>
              <p style={s.warningTitle}>⚠️ Today looks overloaded</p>
              {data.postponable_tasks?.length > 0 && (
                <ul style={s.list}>
                  {data.postponable_tasks.map((t) => (
                    <li key={t.id} style={s.listItem}>{t.title} <span style={{ color: 'var(--text-4)' }}>({t.estimated_hours}h)</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p style={s.aiText}><strong>{data.ai_prediction}</strong> {data.ai_reasoning}</p>
          {data.ai_recommendation && <p style={s.recommendation}>💡 {data.ai_recommendation}</p>}
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
  meterRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  meterTrack: { flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-2)', overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 99, transition: 'width 0.3s' },
  meterPct: { fontSize: 13, fontWeight: 700, minWidth: 42, textAlign: 'right' },
  subline: { fontSize: 11.5, color: 'var(--text-4)', marginBottom: 12 },
  warningBox: { background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 },
  warningTitle: { fontSize: 12.5, fontWeight: 700, color: 'var(--amber)', marginBottom: 6 },
  list: { margin: 0, paddingLeft: 18, fontSize: 12 },
  listItem: { marginBottom: 2, color: 'var(--text-2)' },
  aiText: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 6 },
  recommendation: { fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, background: 'var(--bg-2)', padding: '8px 10px', borderRadius: 8 },
};
