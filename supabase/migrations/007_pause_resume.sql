-- ============================================================
-- VibeForge: admin pause / resume
-- Migration: 007_pause_resume.sql
-- Pausing freezes the clock; resuming shifts the deadline by the
-- paused duration so no participant loses time.
-- ============================================================

CREATE OR REPLACE FUNCTION public.pause_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.sessions
     SET session_status = 'paused',
         paused_at = now()
   WHERE id = p_session_id
     AND session_status = 'active';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paused_at timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT paused_at INTO v_paused_at
    FROM public.sessions
   WHERE id = p_session_id
     AND session_status = 'paused'
   FOR UPDATE;

  IF v_paused_at IS NULL THEN
    RAISE EXCEPTION 'Session is not paused';
  END IF;

  UPDATE public.sessions
     SET deadline_at = deadline_at + (now() - v_paused_at),
         total_paused_seconds = total_paused_seconds + floor(extract(epoch FROM (now() - v_paused_at)))::int,
         session_status = 'active',
         paused_at = NULL,
         resumed_at = now()
   WHERE id = p_session_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.pause_session(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resume_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pause_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_session(uuid) TO authenticated;
