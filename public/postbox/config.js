// Planner configuration.
//
// LOCAL MODE (default): leave supabaseUrl/supabaseAnonKey empty — the planner runs
// immediately, saving drafts in your browser (localStorage). Good for trying it out solo.
//
// TEAM MODE (shared drafts, sign-in, live sync):
// 1. Create a free project at https://supabase.com/dashboard
// 2. Project Settings → API → copy "Project URL" and the "anon public" key here.
//    (The anon key is safe to commit — access is enforced by row-level security.)
// 3. Run planner/schema.sql in the SQL editor, then add your team emails to the members table.
//
// Handing this to another Team1 chapter? See planner/README.md — they only edit this file.
window.PLANNER_CONFIG = {
  networkName: "team1",            // shown on the shared sign-in screen (chapter-neutral)
  chapterName: "team1 thailand",   // fallback header name (normally the workspace name from the DB is used)
  workspace: "team1th",            // workspace slug inside the Supabase project (see schema.sql)
  supabaseUrl: "https://sepomduzcpuwmarjvqth.supabase.co",
  supabaseAnonKey: "sb_publishable_4KO7yLJE3bX-CisShQbokw_3Ny0cS5a",
};
