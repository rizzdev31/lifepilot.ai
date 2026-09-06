-- ============================================================
-- LifePilot AI — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  avatar            TEXT,
  google_id         TEXT UNIQUE,
  telegram_chat_id  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: voice_notes
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_url   TEXT,
  transcript  TEXT NOT NULL DEFAULT '',
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: tasks
-- ============================================================
CREATE TYPE task_status   AS ENUM ('pending', 'in_progress', 'done', 'overdue');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS tasks (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voice_note_id      UUID REFERENCES voice_notes(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  priority           task_priority NOT NULL DEFAULT 'medium',
  status             task_status NOT NULL DEFAULT 'pending',
  category           TEXT,
  deadline           TIMESTAMPTZ,
  estimated_duration INTEGER, -- in minutes
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: roadmap_steps
-- ============================================================
CREATE TYPE step_status AS ENUM ('done', 'in_progress', 'pending');

CREATE TABLE IF NOT EXISTS roadmap_steps (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  scheduled_at TIMESTAMPTZ,
  status       step_status NOT NULL DEFAULT 'pending',
  "order"      INTEGER NOT NULL DEFAULT 0,
  step_type    TEXT NOT NULL DEFAULT 'action', -- action | learn | review
  content      TEXT,                           -- materi belajar untuk step_type=learn
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Jika sudah punya tabel, jalankan migrasi ini:
-- ALTER TABLE roadmap_steps ADD COLUMN IF NOT EXISTS step_type TEXT NOT NULL DEFAULT 'action';
-- ALTER TABLE roadmap_steps ADD COLUMN IF NOT EXISTS content TEXT;

-- ============================================================
-- TABLE: reminders
-- ============================================================
CREATE TYPE reminder_channel AS ENUM ('telegram', 'email', 'push');
CREATE TYPE reminder_status  AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE IF NOT EXISTS reminders (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  channel    reminder_channel NOT NULL DEFAULT 'telegram',
  message    TEXT NOT NULL,
  remind_at  TIMESTAMPTZ NOT NULL,
  status     reminder_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: calendar_events
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  google_event_id TEXT,
  calendar_link   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_steps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own voice_notes" ON voice_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own roadmap_steps" ON roadmap_steps
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own reminders" ON reminders
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own calendar_events" ON calendar_events
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
  );

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_voice_notes_updated_at
  BEFORE UPDATE ON voice_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_roadmap_steps_updated_at
  BEFORE UPDATE ON roadmap_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reminders_updated_at
  BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
