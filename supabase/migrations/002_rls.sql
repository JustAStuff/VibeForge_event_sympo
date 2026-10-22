-- ============================================================
-- VibeForge Row Level Security (RLS)
-- Migration: 002_rls.sql
-- Authoritative security layer. Client checks are UX only.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: is current user an admin (based on app_metadata)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    (auth.jwt() -> 'app_metadata' ->> 'claims_admin')::boolean,
    false
  );
END;
$$;

-- ------------------------------------------------------------
-- Helper: get participant_id linked to current auth user
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_participant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid UUID;
BEGIN
  SELECT participant_id
    INTO pid
    FROM public.participant_identities
   WHERE auth_user_id = auth.uid()
     AND is_active = true
   LIMIT 1;

  RETURN pid;
END;
$$;

-- ------------------------------------------------------------
-- Enable RLS on all tables
-- ------------------------------------------------------------
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprise_task_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- CHALLENGES
-- Everyone authenticated can read active challenges for selection
-- Only admins can write
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "challenges_read_authenticated" ON public.challenges;
CREATE POLICY "challenges_read_authenticated" ON public.challenges
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "challenges_admin_all" ON public.challenges;
CREATE POLICY "challenges_admin_all" ON public.challenges
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- PARTICIPANTS
-- Participants can read only their own row. Admins read all.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "participants_read_own_or_admin" ON public.participants;
CREATE POLICY "participants_read_own_or_admin" ON public.participants
  FOR SELECT TO authenticated
  USING (public.is_admin() OR id = public.current_participant_id());

DROP POLICY IF EXISTS "participants_insert_self" ON public.participants;
CREATE POLICY "participants_insert_self" ON public.participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "participants_admin_update" ON public.participants;
CREATE POLICY "participants_admin_update" ON public.participants
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- PARTICIPANT IDENTITIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "identities_read_own_or_admin" ON public.participant_identities;
CREATE POLICY "identities_read_own_or_admin" ON public.participant_identities
  FOR SELECT TO authenticated
  USING (public.is_admin() OR auth_user_id = auth.uid() OR participant_id = public.current_participant_id());

DROP POLICY IF EXISTS "identities_insert_self" ON public.participant_identities;
CREATE POLICY "identities_insert_self" ON public.participant_identities
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "identities_admin_all" ON public.participant_identities;
CREATE POLICY "identities_admin_all" ON public.participant_identities
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- SESSIONS
-- Participants can read their own session. Participants CANNOT update deadline/status directly.
-- Only admins can modify sessions.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sessions_read_own_or_admin" ON public.sessions;
CREATE POLICY "sessions_read_own_or_admin" ON public.sessions
  FOR SELECT TO authenticated
  USING (public.is_admin() OR participant_id = public.current_participant_id());

DROP POLICY IF EXISTS "sessions_insert_self" ON public.sessions;
CREATE POLICY "sessions_insert_self" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (participant_id = public.current_participant_id());

DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
CREATE POLICY "sessions_admin_all" ON public.sessions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- RECOVERY REQUESTS
-- Participant can create/read own request. Admin manages all.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "recovery_read_own_or_admin" ON public.recovery_requests;
CREATE POLICY "recovery_read_own_or_admin" ON public.recovery_requests
  FOR SELECT TO authenticated
  USING (public.is_admin() OR requesting_auth_user_id = auth.uid() OR participant_id = public.current_participant_id());

DROP POLICY IF EXISTS "recovery_insert_own" ON public.recovery_requests;
CREATE POLICY "recovery_insert_own" ON public.recovery_requests
  FOR INSERT TO authenticated
  WITH CHECK (requesting_auth_user_id = auth.uid());

DROP POLICY IF EXISTS "recovery_admin_all" ON public.recovery_requests;
CREATE POLICY "recovery_admin_all" ON public.recovery_requests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- SURPRISE TASKS
-- CRITICAL: Draft tasks must NEVER be visible to participants.
-- Participants only see published/acknowledged/completed for their session.
-- Admins see and manage all.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "surprise_tasks_read_policy" ON public.surprise_tasks;
CREATE POLICY "surprise_tasks_read_policy" ON public.surprise_tasks
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      participant_id = public.current_participant_id()
      AND status IN ('published', 'acknowledged', 'completed')
    )
  );

DROP POLICY IF EXISTS "surprise_tasks_participant_update" ON public.surprise_tasks;
CREATE POLICY "surprise_tasks_participant_update" ON public.surprise_tasks
  FOR UPDATE TO authenticated
  USING (
    participant_id = public.current_participant_id()
    AND status IN ('published', 'acknowledged')
  )
  WITH CHECK (
    participant_id = public.current_participant_id()
    AND status IN ('acknowledged', 'completed')
  );

DROP POLICY IF EXISTS "surprise_tasks_admin_all" ON public.surprise_tasks;
CREATE POLICY "surprise_tasks_admin_all" ON public.surprise_tasks
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- MILESTONE EVENTS
-- Admin only (processed by cron/edge functions with service role)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "milestones_admin_only" ON public.milestone_events;
CREATE POLICY "milestones_admin_only" ON public.milestone_events
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- NOTIFICATION DELIVERIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "notifications_admin_only" ON public.notification_deliveries;
CREATE POLICY "notifications_admin_only" ON public.notification_deliveries
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- EVALUATIONS
-- Admin only
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "evaluations_admin_only" ON public.evaluations;
CREATE POLICY "evaluations_admin_only" ON public.evaluations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- AUDIT LOGS / SESSION EVENTS
-- Admin read-only. Writes via SECURITY DEFINER functions/triggers.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "session_events_admin_read" ON public.session_events;
CREATE POLICY "session_events_admin_read" ON public.session_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- VERSIONS / PUSH SUBSCRIPTIONS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "task_versions_admin_only" ON public.surprise_task_versions;
CREATE POLICY "task_versions_admin_only" ON public.surprise_task_versions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "push_subs_own_or_admin" ON public.push_subscriptions;
CREATE POLICY "push_subs_own_or_admin" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth_user_id = auth.uid())
  WITH CHECK (public.is_admin() OR auth_user_id = auth.uid());
