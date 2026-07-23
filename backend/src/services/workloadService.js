const pool = require('../db/pool');
const { callGroqJSON } = require('./groqClient');

/**
 * Pulls today's (and overdue, not-done) tasks for a user plus their working-hours prefs.
 */
async function getWorkloadInputs(userId) {
  const userRes = await pool.query(
    `SELECT daily_available_hours, preferred_work_start, preferred_work_end, average_productivity_score
     FROM users WHERE id = $1`,
    [userId]
  );
  const user = userRes.rows[0] || {
    daily_available_hours: 8,
    preferred_work_start: '09:00',
    preferred_work_end: '17:00',
    average_productivity_score: 70,
  };

  const taskRes = await pool.query(
    `SELECT id, title, priority, estimated_hours, due_date, status, completion_percentage
     FROM tasks
     WHERE user_id = $1
       AND status != 'done'
       AND (due_date <= CURRENT_DATE OR due_date IS NULL)
     ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, due_date NULLS LAST`,
    [userId]
  );

  return { user, tasks: taskRes.rows };
}

/**
 * Pure calculation: given tasks + available hours, work out workload % and
 * which low-priority tasks are safe to postpone.
 */
function calculateWorkload(tasks, availableHours) {
  const remaining = (t) => {
    const est = parseFloat(t.estimated_hours) || 1;
    const pct = t.completion_percentage || 0;
    return Math.max(est * (1 - pct / 100), 0);
  };

  const totalEstimatedHours = tasks.reduce((sum, t) => sum + remaining(t), 0);
  const workloadPercentage = availableHours > 0
    ? Math.round((totalEstimatedHours / availableHours) * 100)
    : 0;

  const overloaded = workloadPercentage > 100;

  // Greedy: if overloaded, suggest postponing lowest-priority / furthest-deadline tasks
  // until the load fits inside available hours.
  const postponable = [];
  if (overloaded) {
    const sorted = [...tasks]
      .filter((t) => t.priority === 'low' || t.priority === 'medium')
      .sort((a, b) => {
        const rank = { low: 0, medium: 1, high: 2 };
        if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
        const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return bd - ad; // furthest deadline first
      });

    let hoursOver = totalEstimatedHours - availableHours;
    for (const t of sorted) {
      if (hoursOver <= 0) break;
      const h = remaining(t);
      postponable.push({ id: t.id, title: t.title, priority: t.priority, estimated_hours: h });
      hoursOver -= h;
    }
  }

  let confidence = 'high';
  if (workloadPercentage > 100) confidence = 'low';
  else if (workloadPercentage > 80) confidence = 'medium';

  return { totalEstimatedHours, workloadPercentage, overloaded, postponable, confidence };
}

async function persistWorkloadHistory(userId, { totalEstimatedHours, workloadPercentage, confidence }) {
  await pool.query(
    `INSERT INTO workload_history (user_id, date, estimated_work, actual_work, completion_rate, workload_percentage, confidence)
     VALUES ($1, CURRENT_DATE, $2, 0, 0, $3, $4)
     ON CONFLICT (user_id, date)
     DO UPDATE SET estimated_work = $2, workload_percentage = $3, confidence = $4`,
    [userId, totalEstimatedHours, workloadPercentage, confidence]
  );
}

async function explainWorkload({ tasks, calc, availableHours }) {
  const fallback = {
    prediction: calc.overloaded ? 'Today looks overloaded.' : 'Today\'s workload looks realistic.',
    reasoning: `You have ${calc.totalEstimatedHours.toFixed(1)}h of estimated work against ${availableHours}h available.`,
    recommendation: calc.postponable.length
      ? `Consider postponing: ${calc.postponable.map((t) => t.title).join(', ')}.`
      : 'No changes needed.',
  };
  if (!tasks.length) {
    return { prediction: 'No pending tasks today.', reasoning: 'Your plate is clear.', recommendation: 'Good time to get ahead on upcoming work.' };
  }

  const taskList = tasks
    .map((t) => `- "${t.title}" [${t.priority}, est ${t.estimated_hours}h, ${t.completion_percentage || 0}% done${t.due_date ? `, due ${t.due_date.toISOString?.().slice(0, 10) || t.due_date}` : ''}]`)
    .join('\n');

  return callGroqJSON(
    `You are a workload-planning assistant. Given a user's pending tasks and available hours, predict whether today's plan is realistic.
Respond ONLY with valid JSON:
{"prediction":"one sentence verdict","reasoning":"2-3 sentences explaining the reasoning behind the verdict, referencing the numbers","recommendation":"one actionable sentence, e.g. which tasks to postpone or why it's fine"}
No markdown, no extra text.`,
    `Available working hours today: ${availableHours}\nEstimated total work: ${calc.totalEstimatedHours.toFixed(1)}h\nWorkload: ${calc.workloadPercentage}%\nCandidates to postpone: ${calc.postponable.map((t) => t.title).join(', ') || 'none'}\n\nTasks:\n${taskList}`,
    {},
    fallback
  );
}

/**
 * Full workload analysis for a user: fetch -> calculate -> persist -> explain.
 */
async function analyzeWorkload(userId) {
  const { user, tasks } = await getWorkloadInputs(userId);
  const availableHours = parseFloat(user.daily_available_hours) || 8;
  const calc = calculateWorkload(tasks, availableHours);
  await persistWorkloadHistory(userId, calc);
  const ai = await explainWorkload({ tasks, calc, availableHours });

  return {
    date: new Date().toISOString().slice(0, 10),
    available_hours: availableHours,
    estimated_hours: Math.round(calc.totalEstimatedHours * 100) / 100,
    workload_percentage: calc.workloadPercentage,
    is_overloaded: calc.overloaded,
    completion_confidence: calc.confidence,
    postponable_tasks: calc.postponable,
    task_count: tasks.length,
    ai_prediction: ai.prediction,
    ai_reasoning: ai.reasoning,
    ai_recommendation: ai.recommendation,
  };
}

module.exports = { getWorkloadInputs, calculateWorkload, persistWorkloadHistory, analyzeWorkload };
