const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, username, email, first_name, last_name, daily_available_hours, preferred_work_start, preferred_work_end, average_productivity_score FROM users WHERE id = $1',
      [payload.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = rows[0];
    next();

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({
      error: err.message
    });
  }
};