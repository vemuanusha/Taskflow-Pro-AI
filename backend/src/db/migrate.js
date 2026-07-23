require('dotenv').config();
const pool = require('./pool');

const SQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(150) UNIQUE NOT NULL,
  email       VARCHAR(255) UNIQUE,
  password    VARCHAR(255) NOT NULL,
  first_name  VARCHAR(100) DEFAULT '',
  last_name   VARCHAR(100) DEFAULT '',
  bio         TEXT         DEFAULT '',
  theme       VARCHAR(10)  DEFAULT 'light',
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT         DEFAULT '',
  color       VARCHAR(7)   DEFAULT '#6366f1',
  owner_id    INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(60) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1'
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT         DEFAULT '',
  status       VARCHAR(20)  NOT NULL DEFAULT 'todo'
                 CHECK (status IN ('todo','inprogress','inreview','done')),
  priority     VARCHAR(10)  NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('high','medium','low')),
  deadline     DATE,
  "order"      INTEGER      DEFAULT 0,
  owner_id     INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  project_id   INTEGER      REFERENCES projects(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_owner_status   ON tasks(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_priority ON tasks(owner_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline       ON tasks(deadline);

-- Task-Tag junction
CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  task_id    INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- Productivity Intelligence Platform additions
-- ─────────────────────────────────────────────────────────────────

-- NOTE: this repo's controllers read/write tasks.user_id and tasks.due_date,
-- but the table above (as originally written) defines owner_id / deadline.
-- This block reconciles the two so existing queries actually work.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='owner_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='user_id') THEN
    ALTER TABLE tasks RENAME COLUMN owner_id TO user_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='deadline')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN
    ALTER TABLE tasks RENAME COLUMN deadline TO due_date;
  END IF;
END $$;

-- Tasks: workload / risk tracking columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours       NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (estimated_hours >= 0);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours          NUMERIC(5,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_percentage INTEGER      NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS risk_score            INTEGER      NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS risk_level             VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS risk_reason            TEXT        NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS risk_updated_at         TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_start         TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_end           TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_risk_level ON tasks(user_id, risk_level);

-- Users: scheduling / productivity preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_available_hours      NUMERIC(4,2) NOT NULL DEFAULT 8.0 CHECK (daily_available_hours > 0);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_work_start       TIME         NOT NULL DEFAULT '09:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_work_end         TIME         NOT NULL DEFAULT '17:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_productivity_score NUMERIC(5,2) NOT NULL DEFAULT 70.0 CHECK (average_productivity_score BETWEEN 0 AND 100);

-- Workload history: one row per user per day
CREATE TABLE IF NOT EXISTS workload_history (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  estimated_work       NUMERIC(6,2) NOT NULL DEFAULT 0,
  actual_work          NUMERIC(6,2) NOT NULL DEFAULT 0,
  completion_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
  workload_percentage  NUMERIC(6,2) NOT NULL DEFAULT 0,
  confidence           VARCHAR(10)  NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  created_at           TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_workload_history_user_date ON workload_history(user_id, date DESC);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('✅  Migrations complete — all tables created.');
  } catch (err) {
    console.error('❌  Migration error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
