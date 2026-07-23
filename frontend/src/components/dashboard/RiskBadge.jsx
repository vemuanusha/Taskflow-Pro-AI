import React from 'react';

const META = {
  high:   { label: 'High Risk',   emoji: '🔴' },
  medium: { label: 'Medium Risk', emoji: '🟠' },
  low:    { label: 'Low Risk',    emoji: '🟢' },
};

/**
 * Small colored badge showing a task's AI-computed deadline risk level.
 * Hover to see the reason (title attribute) so it stays compact in dense lists.
 */
export default function RiskBadge({ level = 'low', reason = '', score }) {
  const meta = META[level] || META.low;
  return (
    <span
      className={`badge badge-${level}`}
      title={reason || meta.label}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700, cursor: reason ? 'help' : 'default' }}
    >
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
      {typeof score === 'number' && <span style={{ opacity: 0.7 }}>· {score}</span>}
    </span>
  );
}
