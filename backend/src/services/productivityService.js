const pool = require('../db/pool');
const { callGroqJSON } = require('./groqClient');

/**
 * Aggregates the productivity metrics shown on the Productivity Intelligence Dashboard.
 */
async function getProductivityMetrics(userId) {
  const weekRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')                          AS created_this_week,
       COUNT(*) FILTER (WHERE status='done' AND completed_at > NOW() - INTERVAL '7 days')       AS completed_this_week,
       COUNT(*) FILTER (WHERE status='done')                                                    AS total_completed,
       COUNT(*)                                                                                 AS total_tasks,
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done')                     AS overdue,
       AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600.0)
         FILTER (WHERE status='done' AND completed_at IS NOT NULL)                              AS avg_completion_hours
     FROM tasks WHERE user_id = $1`,
    [userId]
  );
  const w = weekRes.rows[0];

  const dayRes = await pool.query(
    `SELECT TRIM(TO_CHAR(completed_at, 'Day')) AS day, COUNT(*) AS cnt
     FROM tasks WHERE user_id=$1 AND status='done' AND completed_at IS NOT NULL
     GROUP BY 1 ORDER BY cnt DESC LIMIT 1`,
    [userId]
  );
  const hourRes = await pool.query(
    `SELECT EXTRACT(HOUR FROM completed_at)::int AS hour, COUNT(*) AS cnt
     FROM tasks WHERE user_id=$1 AND status='done' AND completed_at IS NOT NULL
     GROUP BY 1 ORDER BY cnt DESC LIMIT 1`,
    [userId]
  );

  const trendRes = await pool.query(
    `SELECT date::text, workload_percentage, completion_rate
     FROM workload_history WHERE user_id=$1 ORDER BY date DESC LIMIT 14`,
    [userId]
  );

  const totalTasks = parseInt(w.total_tasks) || 0;
  const totalCompleted = parseInt(w.total_completed) || 0;
  const weeklyCompletionRate = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return {
    weekly_completion_rate: weeklyCompletionRate,
    tasks_completed_this_week: parseInt(w.completed_this_week) || 0,
    tasks_created_this_week: parseInt(w.created_this_week) || 0,
    average_completion_time_hours: w.avg_completion_hours ? Math.round(parseFloat(w.avg_completion_hours) * 10) / 10 : null,
    total_tasks_completed: totalCompleted,
    overdue_tasks: parseInt(w.overdue) || 0,
    most_productive_day: dayRes.rows[0]?.day || null,
    most_productive_hour: hourRes.rows[0] != null ? `${hourRes.rows[0].hour}:00` : null,
    trend: trendRes.rows.reverse(),
  };
}

async function generateInsights(metrics) {
  const fallback = {
    insights: [
      metrics.weekly_completion_rate >= 70
        ? 'Your completion rate is strong this week — keep the momentum going.'
        : 'Your completion rate has room to improve — consider tackling fewer tasks at once.',
      metrics.overdue_tasks > 0 ? `You have ${metrics.overdue_tasks} overdue task(s) that need attention.` : 'No overdue tasks — nice work staying on top of deadlines.',
    ],
  };
  return callGroqJSON(
    `You are a productivity coach analysing a user's metrics. Give 2-3 short, specific, encouraging-but-honest insights.
Respond ONLY with valid JSON: {"insights":["insight 1","insight 2","insight 3 (optional)"]}
No markdown, no extra text.`,
    JSON.stringify(metrics),
    {},
    fallback
  );
}

module.exports = { getProductivityMetrics, generateInsights };
