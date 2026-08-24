-- Planner schema — run once in the Supabase SQL editor.
-- Then add your team:  insert into members (email, name) values ('shamwise8@gmail.com', 'Sam');
-- Auth: Dashboard → Authentication → Providers → Email → enable "Email OTP / magic link" (on by default).

create table if not exists members (
  email text primary key,
  name  text default ''
);

create table if not exists drafts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  content     text not null default '',
  status      text not null default 'idea' check (status in ('idea','draft','review','approved','posted')),
  planned_at  timestamptz,
  author      text not null default '',
  updated_by  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  draft_id   uuid not null references drafts(id) on delete cascade,
  author     text not null default '',
  body       text not null,
  created_at timestamptz not null default now()
);

alter table members  enable row level security;
alter table drafts   enable row level security;
alter table comments enable row level security;

-- A user is on the team if their signed-in email is in members.
create or replace function is_member() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from members where email = (auth.jwt() ->> 'email')) $$;

drop policy if exists members_read on members;
create policy members_read on members for select to authenticated using (is_member());

drop policy if exists drafts_all on drafts;
create policy drafts_all on drafts for all to authenticated
  using (is_member()) with check (is_member());

drop policy if exists comments_all on comments;
create policy comments_all on comments for all to authenticated
  using (is_member()) with check (is_member());

-- Live updates between editors.
alter publication supabase_realtime add table drafts;
alter publication supabase_realtime add table comments;
