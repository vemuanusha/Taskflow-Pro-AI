const pool = require('../db/pool');

// ── helpers ──────────────────────────────────────────────────────
async function getTagIds(tagNames) {
  const ids = [];
  for (const raw of tagNames) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    let res = await pool.query('SELECT id FROM tags WHERE name = $1', [name]);
    if (!res.rows.length) {
      res = await pool.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [name]);
    }
    ids.push(res.rows[0].id);
  }
  return ids;
}

async function attachTags(taskId, tagIds) {
  await pool.query('DELETE FROM task_tags WHERE task_id = $1', [taskId]);
  for (const tagId of tagIds) {
    await pool.query(
      'INSERT INTO task_tags (task_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [taskId, tagId]
    );
  }
}

const TASK_SELECT = `
  SELECT
    t.id, t.title, t.description, t.status, t.priority,
    t.due_date AS deadline, t."order", t.project_id AS project,
    t.completed_at, t.created_at, t.updated_at,
    t.estimated_hours, t.actual_hours, t.completion_percentage,
    t.risk_score, t.risk_level, t.risk_reason,
    t.scheduled_start, t.scheduled_end,
    t.due_date < CURRENT_DATE AND t.status != 'done' AS is_overdue,
    COALESCE(
      (SELECT json_agg(tg.name ORDER BY tg.name)
       FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.task_id = t.id), '[]'
    ) AS tags,
    (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comments_count,
    p.name AS project_name,
    u.username AS owner_username
  FROM tasks t
  LEFT JOIN projects p ON p.id = t.project_id
  LEFT JOIN users u ON u.id = t.user_id
`;

// ── GET /api/tasks ────────────────────────────────────────────────
exports.list = async (req, res) => {
  const uid = req.user.id;
  const { status, priority, project, search, ordering = 'created_at', page = 1, page_size = 25 } = req.query;

  const conditions = ['t.user_id = $1'];
  const vals = [uid];
  let i = 2;

  if (status)   { conditions.push(`t.status = $${i++}`);       vals.push(status); }
  if (priority) { conditions.push(`t.priority = $${i++}`);     vals.push(priority); }

  if (project)  { conditions.push(`t.project_id = $${i++}`);   vals.push(project); }
  if (search)   {
    conditions.push(`(t.title ILIKE $${i} OR t.description ILIKE $${i})`);
    vals.push(`%${search}%`); i++;
  }

  const where = 'WHERE ' + conditions.join(' AND ');
  const allowedOrdering = { created_at: 't.created_at DESC', due_date: 't.due_date ASC NULLS LAST', priority: "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END", title: 't.title ASC', order: 't."order" ASC' };
  const orderClause = allowedOrdering[ordering] || 't.created_at DESC';

  const offset = (parseInt(page) - 1) * parseInt(page_size);
  const countRes = await pool.query(`SELECT COUNT(*) FROM tasks t ${where}`, vals);
  const total = parseInt(countRes.rows[0].count);

  const { rows } = await pool.query(
    `${TASK_SELECT} ${where} ORDER BY ${orderClause} LIMIT $${i} OFFSET $${i+1}`,
    [...vals, parseInt(page_size), offset]
  );

  res.json({ count: total, results: rows });
};

// ── POST /api/tasks ───────────────────────────────────────────────
exports.create = async (req, res) => {
  const { title, description = '', status = 'todo', priority = 'medium', due_date, deadline, order = 0, project = null, tags = [], estimated_hours = 1 } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required.' });
  const dueDateVal = due_date ?? deadline ?? null;

  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, due_date, "order", user_id, project_id, estimated_hours)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [title, description, status, priority, dueDateVal || null, order, req.user.id, project || null, estimated_hours]
  );
  const taskId = rows[0].id;
  if (tags.length) await attachTags(taskId, await getTagIds(tags));

  const full = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [taskId]);
  res.status(201).json(full.rows[0]);
};

// ── GET /api/tasks/:id ────────────────────────────────────────────
exports.get = async (req, res) => {
  const { rows } = await pool.query(
    `${TASK_SELECT} WHERE t.id = $1 AND t.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found.' });
  res.json(rows[0]);
};

// ── PUT /api/tasks/:id ────────────────────────────────────────────
exports.update = async (req, res) => {
  const { title, description, status, priority, due_date, deadline, order, project, tags, estimated_hours, actual_hours, completion_percentage } = req.body;
  const dueDateProvided = due_date !== undefined || deadline !== undefined;
  const dueDateVal = due_date !== undefined ? due_date : deadline;

  const existing = await pool.query('SELECT * FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Task not found.' });

  const t = existing.rows[0];
  const newStatus = status || t.status;
  let completedAt = t.completed_at;
  if (newStatus === 'done' && !completedAt) completedAt = new Date();
  if (newStatus !== 'done') completedAt = null;

  await pool.query(
    `UPDATE tasks SET
       title=$1, description=$2, status=$3, priority=$4,
       due_date=$5, "order"=$6, project_id=$7, completed_at=$8,
       estimated_hours=$9, actual_hours=$10, completion_percentage=$11, updated_at=NOW()
     WHERE id=$12`,
    [
      title        ?? t.title,
      description  ?? t.description,
      newStatus,
      priority     ?? t.priority,
      dueDateProvided ? (dueDateVal || null) : t.due_date,
      order        ?? t.order,
      project !== undefined ? (project || null) : t.project_id,
      completedAt,
      estimated_hours       ?? t.estimated_hours,
      actual_hours          ?? t.actual_hours,
      completion_percentage ?? (newStatus === 'done' ? 100 : t.completion_percentage),
      req.params.id
    ]
  );

  if (tags !== undefined) await attachTags(req.params.id, await getTagIds(tags));
  const full = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [req.params.id]);
  res.json(full.rows[0]);
};

// ── PATCH /api/tasks/:id ──────────────────────────────────────────
exports.patch = exports.update;

// ── DELETE /api/tasks/:id ─────────────────────────────────────────
exports.remove = async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM tasks WHERE id=$1 AND user_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
};

// ── PATCH /api/tasks/:id/move ─────────────────────────────────────
exports.move = async (req, res) => {
  const { status } = req.body;
  const valid = ['todo','inprogress','inreview','done'];
  if (!valid.includes(status)) return res.status(400).json({ error: `Invalid status: ${status}` });

  const existing = await pool.query('SELECT * FROM tasks WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Task not found.' });

  let completedAt = existing.rows[0].completed_at;
  if (status === 'done' && !completedAt) completedAt = new Date();
  if (status !== 'done') completedAt = null;

  await pool.query(
    'UPDATE tasks SET status=$1, completed_at=$2, updated_at=NOW() WHERE id=$3',
    [status, completedAt, req.params.id]
  );
  const full = await pool.query(`${TASK_SELECT} WHERE t.id = $1`, [req.params.id]);
  res.json(full.rows[0]);
};

// ── GET /api/tasks/stats ──────────────────────────────────────────
exports.stats = async (req, res) => {
  const uid = req.user.id;
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)                                                         AS total,
       COUNT(*) FILTER (WHERE status='todo')                           AS todo,
       COUNT(*) FILTER (WHERE status='inprogress')                     AS inprogress,
       COUNT(*) FILTER (WHERE status='inreview')                       AS inreview,
       COUNT(*) FILTER (WHERE status='done')                           AS done,
       COUNT(*) FILTER (WHERE priority='high')                         AS high,
       COUNT(*) FILTER (WHERE priority='medium')                       AS medium,
       COUNT(*) FILTER (WHERE priority='low')                          AS low,
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status!='done') AS overdue,
       COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND status!='done') AS due_today,
       COUNT(*) FILTER (WHERE status='done' AND completed_at > NOW()-INTERVAL '7 days') AS completed_this_week
     FROM tasks WHERE user_id = $1`,
    [uid]
  );
  const r = rows[0];
  res.json({
    total:   parseInt(r.total),
    by_status:   { todo: +r.todo, inprogress: +r.inprogress, inreview: +r.inreview, done: +r.done },
    by_priority: { high: +r.high, medium: +r.medium, low: +r.low },
    overdue:     +r.overdue,
    due_today:   +r.due_today,
    completed_this_week: +r.completed_this_week,
  });
};

// ── GET /api/tasks/overdue ────────────────────────────────────────
exports.overdue = async (req, res) => {
  const { rows } = await pool.query(
    `${TASK_SELECT} WHERE t.user_id=$1 AND t.due_date < CURRENT_DATE AND t.status != 'done'
     ORDER BY t.due_date ASC`,
    [req.user.id]
  );
  res.json(rows);
};

// ── GET /api/tasks/export ─────────────────────────────────────────
exports.exportCSV = async (req, res) => {
  const { rows } = await pool.query(
    `${TASK_SELECT} WHERE t.user_id = $1 ORDER BY t.created_at DESC`,
    [req.user.id]
  );
  const header = 'ID,Title,Status,Priority,Deadline,Tags,Project,Created\n';
  const body = rows.map(t =>
    [t.id, `"${t.title}"`, t.status, t.priority,
     t.deadline || '', (t.tags || []).join('|'),
     t.project_name || '', t.created_at?.toISOString().slice(0,10)
    ].join(',')
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
  res.send(header + body);
};
