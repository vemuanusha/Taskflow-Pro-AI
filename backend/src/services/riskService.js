const pool = require('../db/pool');
const { callGroqJSON } = require('./groqClient');

/**
 * Deterministic 0-100 risk score for a single task.
 * Considers: days remaining, remaining estimated hours, completion %,
 * user's average productivity, and how busy the rest of the user's plate is.
 */
function scoreTask(task, { averageProductivityScore = 70, workloadPercentage = 0 } = {}) {
  const now = new Date();
  let daysRemaining = null;
  if (task.due_date) {
    const due = new Date(task.due_date);
    daysRemaining = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  }

  const estHours = parseFloat(task.estimated_hours) || 1;
  const pctDone = task.completion_percentage || 0;
  const remainingHours = estHours * (1 - pctDone / 100);

  let score = 0;
  const reasons = [];

  // Overdue or imminent deadline
  if (daysRemaining === null) {
    score += 10;
  } else if (daysRemaining < 0) {
    score += 45;
    reasons.push('past its deadline');
  } else if (daysRemaining === 0) {
    score += 35;
    reasons.push('due today');
  } else if (daysRemaining <= 1) {
    score += 28;
    reasons.push('due within a day');
  } else if (daysRemaining <= 3) {
    score += 18;
    reasons.push('due within 3 days');
  } else if (daysRemaining <= 7) {
    score += 8;
  }

  // Not enough runway for the remaining work
  if (daysRemaining !== null && daysRemaining >= 0) {
    const hoursPerDayNeeded = remainingHours / Math.max(daysRemaining, 1);
    if (hoursPerDayNeeded > 4) {
      score += 20;
      reasons.push(`needs ~${hoursPerDayNeeded.toFixed(1)}h/day to finish in time`);
    } else if (hoursPerDayNeeded > 2) {
      score += 10;
    }
  }

  // Low completion relative to time elapsed
  if (pctDone < 25 && daysRemaining !== null && daysRemaining <= 3) {
    score += 15;
    reasons.push('little progress made with limited time left');
  }

  // Priority weighting
  if (task.priority === 'high') score += 10;

  // User's overall productivity / current workload context
  if (averageProductivityScore < 60) score += 8;
  if (workloadPercentage > 100) {
    score += 10;
    reasons.push('competing with an overloaded schedule');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const level = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return { score, level, reasons };
}

async function persistRisk(taskId, { score, level, reason }) {
  await pool.query(
    `UPDATE tasks SET risk_score=$1, risk_level=$2, risk_reason=$3, risk_updated_at=NOW() WHERE id=$4`,
    [score, level, reason, taskId]
  );
}

/**
 * Scores every open task for a user, persists the result, and returns the list.
 * Uses one Groq call to turn rule-based reasons into a natural-language explanation
 * per task (batched into a single prompt to keep latency/cost down).
 */
async function assessDeadlineRisk(userId) {
  const userRes = await pool.query('SELECT average_productivity_score FROM users WHERE id=$1', [userId]);
  const avgProductivity = parseFloat(userRes.rows[0]?.average_productivity_score) || 70;

  const historyRes = await pool.query(
    `SELECT workload_percentage FROM workload_history WHERE user_id=$1 ORDER BY date DESC LIMIT 1`,
    [userId]
  );
  const workloadPercentage = parseFloat(historyRes.rows[0]?.workload_percentage) || 0;

  const { rows: tasks } = await pool.query(
    `SELECT id, title, priority, due_date, estimated_hours, completion_percentage
     FROM tasks WHERE user_id=$1 AND status != 'done'
     ORDER BY due_date NULLS LAST`,
    [userId]
  );

  if (!tasks.length) return [];

  const scored = tasks.map((t) => ({ task: t, ...scoreTask(t, { averageProductivityScore: avgProductivity, workloadPercentage }) }));

  // Only bother the AI with tasks that actually carry some risk, to save tokens.
  const risky = scored.filter((s) => s.level !== 'low');
  let aiExplanations = {};
  if (risky.length) {
    const list = risky
      .map((s) => `- id ${s.task.id}: "${s.task.title}" (${s.level} risk, score ${s.score}, factors: ${s.reasons.join('; ') || 'general timing pressure'})`)
      .join('\n');
    const result = await callGroqJSON(
      `You are a deadline-risk assistant. For each task, write ONE short, specific sentence explaining WHY it is at risk, in plain language a user would understand.
Respond ONLY with valid JSON: {"explanations": {"<task id>": "reason sentence", ...}}
No markdown, no extra text.`,
      list,
      {},
      { explanations: {} }
    );
    aiExplanations = result.explanations || {};
  }

  const results = [];
  for (const s of scored) {
    const reason = aiExplanations[s.task.id]
      || (s.reasons.length ? `At risk because it's ${s.reasons.join(' and ')}.` : 'On track — no significant risk factors detected.');
    await persistRisk(s.task.id, { score: s.score, level: s.level, reason });
    results.push({ task_id: s.task.id, title: s.task.title, due_date: s.task.due_date, risk_score: s.score, risk_level: s.level, risk_reason: reason });
  }
  return results;
}

module.exports = { scoreTask, assessDeadlineRisk };
