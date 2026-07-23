const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db/pool');

function signAccess(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '2h' });
}
function signRefresh(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '14d' });
}

exports.register = async (req, res) => {
  const { username, email, password, first_name = '', last_name = '' } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'username and password are required.' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, first_name, last_name, theme`,
      [username, email || null, hash, first_name, last_name]
    );
    const user    = rows[0];
    const access  = signAccess(user.id);
    const refresh = signRefresh(user.id);
    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1,$2)', [user.id, refresh]);
    res.status(201).json({ access, refresh, user });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already taken.' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "username and password are required."
    });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    console.log("Rows:", rows);

    const user = rows[0];

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({
        error: "Invalid credentials."
      });
    }

    console.log("Entered Password:", password);
    console.log("Stored Hash:", user.password);

    const match = await bcrypt.compare(password, user.password);

    console.log("Password Match:", match);

    if (!match) {
      return res.status(401).json({
        error: "Invalid credentials."
      });
    }

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1,$2)",
      [user.id, refresh]
    );

    const { password: _, ...safe } = user;

    res.json({
      access,
      refresh,
      user: safe
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Login failed."
    });
  }
};

exports.refresh = async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: 'Refresh token required.' });

  try {
    const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refresh]);
    if (!rows.length) return res.status(401).json({ error: 'Token revoked.' });

    const access      = signAccess(payload.userId);
    const newRefresh  = signRefresh(payload.userId);
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh]);
    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1,$2)', [payload.userId, newRefresh]);
    res.json({ access, refresh: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token.' });
  }
};

exports.logout = async (req, res) => {
  const { refresh } = req.body;
  if (refresh) await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh]).catch(() => {});
  res.json({ detail: 'Logged out.' });
};
