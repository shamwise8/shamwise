-- Postbox planner schema — lives in its own "postbox" Postgres schema so it can
-- share a Supabase project with an app (e.g. CoachProof) without touching its tables.
-- Run once in the Supabase SQL editor. Multi-workspace: one project hosts many
-- brands/teams, each with its own member list and drafts, isolated by RLS.
--
-- AFTER RUNNING: Project Settings → API → "Exposed schemas" → add: postbox
-- (required — the API only serves schemas on that list).
--
-- Then seed your workspace + members (edit and run):
--   insert into postbox.workspaces (id, name) values ('team1th', 'team1 thailand');
--   insert into postbox.members (workspace_id, email, name) values ('team1th', 'shamwise8@gmail.com', 'Sam');

create schema if not exists postbox;
grant usage on schema postbox to anon, authenticated, service_role;

drop table if exists postbox.comments cascade;
drop table if exists postbox.drafts cascade;
drop table if exists postbox.members cascade;
drop table if exists postbox.workspaces cascade;
drop function if exists postbox.is_member(text);

create table postbox.workspaces (
  id   text primary key,          -- short slug, e.g. 'team1th', 'shamwise'
  name text not null default ''
);

create table postbox.members (
  workspace_id text not null references postbox.workspaces(id) on delete cascade,
  email        text not null,
  name         text not null default '',
  primary key (workspace_id, email)
);

create table postbox.drafts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references postbox.workspaces(id) on delete cascade,
  title        text not null default '',
  content      text not null default '',
  status       text not null default 'idea' check (status in ('idea','draft','review','approved','posted')),
  planned_at   timestamptz,
  author       text not null default '',
  updated_by   text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index drafts_ws on postbox.drafts (workspace_id, updated_at desc);

create table postbox.comments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references postbox.workspaces(id) on delete cascade,
  draft_id     uuid not null references postbox.drafts(id) on delete cascade,
  author       text not null default '',
  body         text not null,
  created_at   timestamptz not null default now()
);
create index comments_draft on postbox.comments (draft_id, created_at);

-- API roles need table privileges; RLS below is what actually gates access.
grant all on all tables in schema postbox to anon, authenticated, service_role;
alter default privileges in schema postbox grant all on tables to anon, authenticated, service_role;

alter table postbox.workspaces enable row level security;
alter table postbox.members    enable row level security;
alter table postbox.drafts     enable row level security;
alter table postbox.comments   enable row level security;

-- A user belongs to a workspace if their signed-in email is in its members list.
create or replace function postbox.is_member(ws text) returns boolean
language sql stable security definer set search_path = postbox as
$$ select exists (select 1 from members where workspace_id = ws and email = (auth.jwt() ->> 'email')) $$;

create policy workspaces_read on postbox.workspaces for select to authenticated using (postbox.is_member(id));
create policy members_read    on postbox.members    for select to authenticated using (postbox.is_member(workspace_id));
create policy drafts_all      on postbox.drafts     for all    to authenticated
  using (postbox.is_member(workspace_id)) with check (postbox.is_member(workspace_id));
create policy comments_all    on postbox.comments   for all    to authenticated
  using (postbox.is_member(workspace_id)) with check (postbox.is_member(workspace_id));

-- Live updates between editors.
alter publication supabase_realtime add table postbox.drafts;
alter publication supabase_realtime add table postbox.comments;
