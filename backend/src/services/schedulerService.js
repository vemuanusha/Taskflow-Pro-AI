const pool = require('../db/pool');
const { callGroqJSON } = require('./groqClient');

const BREAK_MINUTES = 10; // short break inserted between blocks
const LONG_BREAK_AFTER_MIN = 90; // insert a longer break after this much continuous work
const LONG_BREAK_MINUTES = 20;

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
}
function fmt(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Orders tasks by urgency: overdue/due-soonest first, then priority, then
 * a light boost for tasks the user already has momentum on (partially complete).
 */
function rankTasks(tasks) {
  const rank = { high: 0, medium: 1, low: 2 };
  const now = new Date();
  return [...tasks].sort((a, b) => {
    const aDays = a.due_date ? Math.ceil((new Date(a.due_date) - now) / 86400000) : Infinity;
    const bDays = b.due_date ? Math.ceil((new Date(b.due_date) - now) / 86400000) : Infinity;
    if (aDays !== bDays) return aDays - bDays;
    if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
    return (b.completion_percentage || 0) - (a.completion_percentage || 0);
  });
}

/**
 * Deterministically packs ranked tasks into the user's working window,
 * inserting short breaks and a longer break after sustained work.
 */
function buildSchedule(tasks, { workStart, workEnd }) {
  const startMin = toMinutes(workStart);
  const endMin = toMinutes(workEnd);
  const ranked = rankTasks(tasks);

  const blocks = [];
  let cursor = startMin;
  let sinceBreak = 0;
  const unscheduled = [];

  for (const t of ranked) {
    const remainingHours = (parseFloat(t.estimated_hours) || 1) * (1 - (t.completion_percentage || 0) / 100);
    const durationMin = Math.max(15, Math.round(remainingHours * 60));

    if (cursor + durationMin > endMin) {
      unscheduled.push(t);
      continue;
    }

    blocks.push({
      task_id: t.id,
      title: t.title,
      priority: t.priority,
      start: fmt(cursor),
      end: fmt(cursor + durationMin),
      duration_minutes: durationMin,
    });
    cursor += durationMin;
    sinceBreak += durationMin;

    if (sinceBreak >= LONG_BREAK_AFTER_MIN && cursor < endMin) {
      const brk = Math.min(LONG_BREAK_MINUTES, endMin - cursor);
      if (brk > 0) {
        blocks.push({ task_id: null, title: 'Break', priority: null, start: fmt(cursor), end: fmt(cursor + brk), duration_minutes: brk, is_break: true });
        cursor += brk;
      }
      sinceBreak = 0;
    } else if (cursor < endMin) {
      const brk = Math.min(BREAK_MINUTES, endMin - cursor);
      if (brk > 0) {
        blocks.push({ task_id: null, title: 'Short break', priority: null, start: fmt(cursor), end: fmt(cursor + brk), duration_minutes: brk, is_break: true });
        cursor += brk;
      }
    }
  }

  return { blocks, unscheduled };
}

async function explainSchedule({ blocks, unscheduled }) {
  const fallback = {
    summary: `Scheduled ${blocks.filter((b) => !b.is_break).length} tasks with breaks worked in.`,
    notes: unscheduled.length ? `${unscheduled.length} task(s) didn't fit today's hours and should move to tomorrow.` : 'Everything fit comfortably.',
  };
  if (!blocks.length) return { summary: 'No tasks to schedule today.', notes: 'Nothing pending — enjoy the clear day.' };

  const scheduleText = blocks.filter((b) => !b.is_break).map((b) => `${b.start}-${b.end} ${b.title} [${b.priority}]`).join('\n');
  return callGroqJSON(
    `You are a scheduling assistant. Given a generated daily schedule, briefly explain the reasoning behind the ordering (why these tasks came first) and note anything the user should know.
Respond ONLY with valid JSON:
{"summary":"1-2 sentences on the overall plan and why it's ordered this way","notes":"1 short sentence with a tip or warning, or null"}
No markdown, no extra text.`,
    `Schedule:\n${scheduleText}\n\nUnscheduled (didn't fit today): ${unscheduled.map((t) => t.title).join(', ') || 'none'}`,
    {},
    fallback
  );
}

/**
 * Builds and returns today's optimized schedule for a user.
 * Does not mutate tasks unless `persist` is true (writes scheduled_start/end).
 */
async function generateSchedule(userId, { persist = false } = {}) {
  const userRes = await pool.query(
    `SELECT preferred_work_start, preferred_work_end FROM users WHERE id=$1`,
    [userId]
  );
  const user = userRes.rows[0] || { preferred_work_start: '09:00', preferred_work_end: '17:00' };

  const { rows: tasks } = await pool.query(
    `SELECT id, title, priority, due_date, estimated_hours, completion_percentage
     FROM tasks WHERE user_id=$1 AND status != 'done'
     ORDER BY due_date NULLS LAST`,
    [userId]
  );

  const { blocks, unscheduled } = buildSchedule(tasks, {
    workStart: user.preferred_work_start,
    workEnd: user.preferred_work_end,
  });

  const ai = await explainSchedule({ blocks, unscheduled });

  if (persist) {
    const today = new Date().toISOString().slice(0, 10);
    for (const b of blocks) {
      if (b.is_break) continue;
      await pool.query(
        `UPDATE tasks SET scheduled_start=$1, scheduled_end=$2 WHERE id=$3`,
        [`${today}T${b.start}:00`, `${today}T${b.end}:00`, b.task_id]
      );
    }
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    work_window: { start: user.preferred_work_start, end: user.preferred_work_end },
    schedule: blocks,
    unscheduled: unscheduled.map((t) => ({ id: t.id, title: t.title, priority: t.priority })),
    ai_summary: ai.summary,
    ai_notes: ai.notes,
  };
}

module.exports = { rankTasks, buildSchedule, generateSchedule };
