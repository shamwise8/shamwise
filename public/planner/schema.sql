-- Postbox planner schema (multi-workspace) — run once in the Supabase SQL editor.
-- One Supabase project hosts many brands/teams ("workspaces"), each with its own
-- member list and drafts. FRESH INSTALL: this drops any previous planner tables.
--
-- After running, seed your workspace + members (edit and run):
--   insert into workspaces (id, name) values ('team1th', 'team1 thailand');
--   insert into members (workspace_id, email, name) values ('team1th', 'shamwise8@gmail.com', 'Sam');
--
-- Auth: Dashboard → Authentication → Providers → Email (magic link is on by default).

drop table if exists comments cascade;
drop table if exists drafts cascade;
drop table if exists members cascade;
drop table if exists workspaces cascade;
drop function if exists is_member(text);
drop function if exists is_member();

create table workspaces (
  id   text primary key,          -- short slug, e.g. 'team1th', 'shamwise'
  name text not null default ''
);

create table members (
  workspace_id text not null references workspaces(id) on delete cascade,
  email        text not null,
  name         text not null default '',
  primary key (workspace_id, email)
);

create table drafts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references workspaces(id) on delete cascade,
  title        text not null default '',
  content      text not null default '',
  status       text not null default 'idea' check (status in ('idea','draft','review','approved','posted')),
  planned_at   timestamptz,
  author       text not null default '',
  updated_by   text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index drafts_ws on drafts (workspace_id, updated_at desc);

create table comments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references workspaces(id) on delete cascade,
  draft_id     uuid not null references drafts(id) on delete cascade,
  author       text not null default '',
  body         text not null,
  created_at   timestamptz not null default now()
);
create index comments_draft on comments (draft_id, created_at);

alter table workspaces enable row level security;
alter table members    enable row level security;
alter table drafts     enable row level security;
alter table comments   enable row level security;

-- A user belongs to a workspace if their signed-in email is in its members list.
create or replace function is_member(ws text) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from members where workspace_id = ws and email = (auth.jwt() ->> 'email')) $$;

create policy workspaces_read on workspaces for select to authenticated using (is_member(id));
create policy members_read    on members    for select to authenticated using (is_member(workspace_id));
create policy drafts_all      on drafts     for all    to authenticated
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy comments_all    on comments   for all    to authenticated
  using (is_member(workspace_id)) with check (is_member(workspace_id));

-- Live updates between editors.
alter publication supabase_realtime add table drafts;
alter publication supabase_realtime add table comments;
