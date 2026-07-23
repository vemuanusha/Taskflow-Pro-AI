const bcrypt = require('bcryptjs');
const pool   = require('../db/pool');

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.updateMe = async (req, res) => {
  const { first_name, last_name, email, bio, theme, daily_available_hours, preferred_work_start, preferred_work_end } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET
         first_name = COALESCE($1, first_name),
         last_name  = COALESCE($2, last_name),
         email      = COALESCE($3, email),
         bio        = COALESCE($4, bio),
         theme      = COALESCE($5, theme),
         daily_available_hours = COALESCE($6, daily_available_hours),
         preferred_work_start  = COALESCE($7, preferred_work_start),
         preferred_work_end    = COALESCE($8, preferred_work_end),
         updated_at = NOW()
       WHERE id = $9
       RETURNING id, username, email, first_name, last_name, bio, theme,
                 daily_available_hours, preferred_work_start, preferred_work_end, average_productivity_score`,
      [first_name, last_name, email, bio, theme, daily_available_hours, preferred_work_start, preferred_work_end, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile update failed.' });
  }
};

exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password)
    return res.status(400).json({ error: 'old_password and new_password required.' });

  const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
  const valid = await bcrypt.compare(old_password, rows[0].password);
  if (!valid) return res.status(400).json({ error: 'Incorrect password.' });

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
  res.json({ detail: 'Password updated successfully.' });
};
