-- VibeForge Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Complete database schema for VibeForge event management application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CHALLENGES TABLE
-- ============================================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_number INTEGER NOT NULL UNIQUE CHECK (challenge_number BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  core_requirements TEXT[] NOT NULL DEFAULT '{}',
  possible_additions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PARTICIPANTS TABLE
-- ============================================================
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
  academic_year TEXT NOT NULL CHECK (academic_year IN ('First Year', 'Second Year', 'Third Year', 'Fourth Year')),
  register_number TEXT NOT NULL,
  normalized_register_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_normalized_register_number UNIQUE (normalized_register_number)
);

CREATE INDEX idx_participants_normalized_register ON participants (normalized_register_number);

-- ============================================================
-- PARTICIPANT IDENTITIES TABLE
-- Links Supabase auth users to participants (supports recovery across browsers)
-- ============================================================
CREATE TABLE participant_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  auth_user_id UUID NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by_admin_id UUID, -- NULL if self-registered, set on admin recovery approval
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_active_participant_auth UNIQUE (participant_id, auth_user_id)
);

CREATE INDEX idx_participant_identities_auth_user ON participant_identities (auth_user_id);
CREATE INDEX idx_participant_identities_participant ON participant_identities (participant_id);
-- Only one active identity per participant at a time
CREATE UNIQUE INDEX uq_one_active_identity_per_participant 
  ON participant_identities (participant_id) 
  WHERE is_active = true;

-- ============================================================
-- SESSIONS TABLE
-- ============================================================
CREATE TYPE session_status_type AS ENUM (
  'pending_challenge',  -- registered but challenge not yet selected
  'challenge_selected', -- challenge selected, not yet started
  'active',             -- session running
  'paused',             -- paused by admin
  'completed',          -- finished (time up or admin ended)
  'expired',            -- deadline passed while inactive
  'cancelled'           -- cancelled by admin
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  challenge_id UUID REFERENCES challenges(id) ON DELETE RESTRICT,
  session_status session_status_type NOT NULL DEFAULT 'pending_challenge',
  started_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  total_paused_seconds INTEGER NOT NULL DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ,
  connection_status TEXT NOT NULL DEFAULT 'unknown' CHECK (connection_status IN ('connected', 'connection_lost', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_participant ON sessions (participant_id);
CREATE INDEX idx_sessions_status ON sessions (session_status);
CREATE INDEX idx_sessions_deadline ON sessions (deadline_at);
-- Only one non-cancelled session per participant
CREATE UNIQUE INDEX uq_one_active_session_per_participant 
  ON sessions (participant_id) 
  WHERE session_status NOT IN ('cancelled');

-- ============================================================
-- RECOVERY REQUESTS TABLE
-- ============================================================
CREATE TYPE recovery_status_type AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE recovery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES sessions(id) ON DELETE RESTRICT,
  requesting_auth_user_id UUID NOT NULL,
  status recovery_status_type NOT NULL DEFAULT 'pending',
  request_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by_admin_id UUID,
  rejection_reason TEXT,
  approved_identity_id UUID REFERENCES participant_identities(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recovery_requests_participant ON recovery_requests (participant_id);
CREATE INDEX idx_recovery_requests_status ON recovery_requests (status);
CREATE INDEX idx_recovery_requests_auth_user ON recovery_requests (requesting_auth_user_id);
-- Only one pending request per auth user at a time
CREATE UNIQUE INDEX uq_one_pending_request_per_auth_user 
  ON recovery_requests (requesting_auth_user_id)
  WHERE status = 'pending';

-- ============================================================
-- SESSION EVENTS TABLE (Audit trail for session state changes)
-- ============================================================
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  actor_id UUID, -- auth user id of who triggered the event
  actor_role TEXT CHECK (actor_role IN ('participant', 'admin', 'system')),
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_events_session ON session_events (session_id);
CREATE INDEX idx_session_events_type ON session_events (event_type);
CREATE INDEX idx_session_events_timestamp ON session_events (event_timestamp);

-- ============================================================
-- SURPRISE TASKS TABLE
-- ============================================================
CREATE TYPE surprise_task_status_type AS ENUM (
  'draft',
  'published',
  'acknowledged',
  'completed',
  'withdrawn'
);

CREATE TABLE surprise_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  status surprise_task_status_type NOT NULL DEFAULT 'draft',
  created_by_admin_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  published_by_admin_id UUID,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by_participant_id UUID,
  completed_at TIMESTAMPTZ,
  completed_by_participant_id UUID,
  withdrawn_at TIMESTAMPTZ,
  withdrawn_by_admin_id UUID,
  withdrawal_reason TEXT,
  CONSTRAINT only_one_non_withdrawn_task_per_session UNIQUE (session_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Remove the unique constraint above since it's too strict; use a partial index instead
ALTER TABLE surprise_tasks DROP CONSTRAINT IF EXISTS only_one_non_withdrawn_task_per_session;
CREATE UNIQUE INDEX uq_one_active_task_per_session 
  ON surprise_tasks (session_id) 
  WHERE status NOT IN ('withdrawn');

CREATE INDEX idx_surprise_tasks_session ON surprise_tasks (session_id);
CREATE INDEX idx_surprise_tasks_participant ON surprise_tasks (participant_id);
CREATE INDEX idx_surprise_tasks_status ON surprise_tasks (status);

-- ============================================================
-- SURPRISE TASK VERSIONS TABLE
-- ============================================================
CREATE TABLE surprise_task_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  surprise_task_id UUID NOT NULL REFERENCES surprise_tasks(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL,
  previous_title TEXT,
  previous_instructions TEXT,
  new_title TEXT NOT NULL,
  new_instructions TEXT NOT NULL,
  changed_by_admin_id UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  change_reason TEXT,
  UNIQUE (surprise_task_id, version_number)
);

CREATE INDEX idx_task_versions_task ON surprise_task_versions (surprise_task_id);

-- ============================================================
-- MILESTONE EVENTS TABLE
-- ============================================================
CREATE TYPE milestone_type AS ENUM (
  'elapsed_15min',
  'elapsed_30min',
  'elapsed_45min'
);

CREATE TYPE processing_status_type AS ENUM (
  'pending',
  'processing',
  'processed',
  'failed',
  'skipped'
);

CREATE TABLE milestone_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  milestone_type milestone_type NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  processing_status processing_status_type NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, milestone_type)
);

CREATE INDEX idx_milestone_events_session ON milestone_events (session_id);
CREATE INDEX idx_milestone_events_due ON milestone_events (due_at, processing_status);

-- ============================================================
-- NOTIFICATION DELIVERIES TABLE
-- ============================================================
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_event_id UUID REFERENCES milestone_events(id) ON DELETE RESTRICT,
  -- for non-milestone notifications (task publish, recovery, etc.)
  notification_type TEXT NOT NULL,
  reference_id UUID, -- task id, recovery request id, etc.
  recipient_auth_user_id UUID NOT NULL,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('participant', 'admin')),
  channel TEXT NOT NULL DEFAULT 'browser' CHECK (channel IN ('browser', 'push', 'realtime')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'skipped')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_recipient ON notification_deliveries (recipient_auth_user_id, delivery_status);
CREATE INDEX idx_notification_deliveries_milestone ON notification_deliveries (milestone_event_id);

-- ============================================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (auth_user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions (auth_user_id, is_active);

-- ============================================================
-- EVALUATIONS TABLE
-- ============================================================
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
  creativity_score INTEGER CHECK (creativity_score BETWEEN 0 AND 20),
  functionality_score INTEGER CHECK (functionality_score BETWEEN 0 AND 25),
  ai_iteration_score INTEGER CHECK (ai_iteration_score BETWEEN 0 AND 20),
  surprise_task_score INTEGER CHECK (surprise_task_score BETWEEN 0 AND 20),
  presentation_score INTEGER CHECK (presentation_score BETWEEN 0 AND 15),
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(creativity_score, 0) +
    COALESCE(functionality_score, 0) +
    COALESCE(ai_iteration_score, 0) +
    COALESCE(surprise_task_score, 0) +
    COALESCE(presentation_score, 0)
  ) STORED,
  remarks TEXT,
  surprise_task_manually_verified BOOLEAN DEFAULT false,
  surprise_task_verification_note TEXT,
  evaluated_by_admin_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, session_id)
);

CREATE INDEX idx_evaluations_participant ON evaluations (participant_id);
CREATE INDEX idx_evaluations_session ON evaluations (session_id);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID, -- auth user id
  actor_role TEXT CHECK (actor_role IN ('participant', 'admin', 'system')),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recovery_requests_updated_at BEFORE UPDATE ON recovery_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_surprise_tasks_updated_at BEFORE UPDATE ON surprise_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_deliveries_updated_at BEFORE UPDATE ON notification_deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
