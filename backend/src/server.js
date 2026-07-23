require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const routes     = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000,
  message: { error: 'Too many requests. Try again later.' }
}));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// 404
app.use((_, res) => res.status(404).json({ error: 'Not found.' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`✅  TaskFlow backend running on http://localhost:${PORT}`);
});
