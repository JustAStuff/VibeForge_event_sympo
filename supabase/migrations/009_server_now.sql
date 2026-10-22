-- ============================================================
-- VibeForge: server clock
-- Migration: 009_server_now.sql
-- Lets the client display the countdown relative to the server's
-- clock instead of whatever time the participant's device reports.
-- Enforcement remains entirely server-side.
-- ============================================================

CREATE OR REPLACE FUNCTION public.server_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT now();
$$;

REVOKE ALL ON FUNCTION public.server_now() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.server_now() TO anon, authenticated;
