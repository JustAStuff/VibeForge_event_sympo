-- ============================================================
-- VibeForge: authoritative session finalizer
-- Migration: 004_finalize_expired_sessions.sql
-- Moves overdue active sessions to 'completed'. Safe to call repeatedly.
-- ============================================================

CREATE OR REPLACE FUNCTION public.finalize_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.sessions
     SET session_status = 'completed',
         ended_at = COALESCE(ended_at, NOW())
   WHERE session_status = 'active'
     AND deadline_at IS NOT NULL
     AND deadline_at <= NOW();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_expired_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_expired_sessions() TO anon, authenticated;
