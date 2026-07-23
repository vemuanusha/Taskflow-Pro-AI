const pool = require('../db/pool');

// ── Projects ─────────────────────────────────────────────────────
exports.listProjects = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.username AS owner_username,
       (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count
     FROM projects p JOIN users u ON u.id = p.owner_id
     WHERE p.owner_id = $1 ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
};

exports.createProject = async (req, res) => {
  const { name, description = '', color = '#6366f1' } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const { rows } = await pool.query(
    'INSERT INTO projects (name, description, color, owner_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, description, color, req.user.id]
  );
  res.status(201).json({ ...rows[0], task_count: 0 });
};

exports.updateProject = async (req, res) => {
  const { name, description, color } = req.body;
  const { rows } = await pool.query(
    `UPDATE projects SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       color = COALESCE($3, color),
       updated_at = NOW()
     WHERE id=$4 AND owner_id=$5 RETURNING *`,
    [name, description, color, req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Project not found.' });
  res.json(rows[0]);
};

exports.deleteProject = async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM projects WHERE id=$1 AND owner_id=$2',
    [req.params.id, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Project not found.' });
  res.status(204).end();
};

// ── Comments ──────────────────────────────────────────────────────
exports.listComments = async (req, res) => {
  // Verify task ownership
  const task = await pool.query('SELECT id FROM tasks WHERE id=$1 AND owner_id=$2', [req.params.taskId, req.user.id]);
  if (!task.rows.length) return res.status(404).json({ error: 'Task not found.' });

  const { rows } = await pool.query(
    `SELECT c.id, c.content, c.created_at, c.updated_at,
       u.username AS author_name
     FROM comments c JOIN users u ON u.id = c.author_id
     WHERE c.task_id = $1 ORDER BY c.created_at ASC`,
    [req.params.taskId]
  );
  res.json(rows);
};

exports.addComment = async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required.' });

  const task = await pool.query('SELECT id FROM tasks WHERE id=$1 AND owner_id=$2', [req.params.taskId, req.user.id]);
  if (!task.rows.length) return res.status(404).json({ error: 'Task not found.' });

  const { rows } = await pool.query(
    `INSERT INTO comments (task_id, author_id, content)
     VALUES ($1,$2,$3) RETURNING id, content, created_at`,
    [req.params.taskId, req.user.id, content]
  );
  res.status(201).json({ ...rows[0], author_name: req.user.username });
};

exports.deleteComment = async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM comments WHERE id=$1 AND author_id=$2',
    [req.params.commentId, req.user.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Comment not found.' });
  res.status(204).end();
};
