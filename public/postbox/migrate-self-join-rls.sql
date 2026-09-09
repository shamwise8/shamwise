-- Fix for Supabase advisor "rls_disabled_in_public" (2026-09-06).
-- migrate-self-join.sql created postbox.self_join_emails without RLS. The postbox schema is
-- exposed to PostgREST, so anyone with the publishable key could list the roster emails.
--
-- No policies are needed: the only reader is postbox.can_self_join(), which is SECURITY DEFINER
-- and bypasses RLS, and the MCP server uses the service key, which also bypasses RLS.
-- With RLS on and zero policies, anon and authenticated clients get an empty result.

alter table postbox.self_join_emails enable row level security;
