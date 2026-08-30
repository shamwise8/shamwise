-- AI usage log: per-chapter tracking + rate limiting for the rewrite feature.
create table if not exists postbox.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  text not null references postbox.workspaces(id) on delete cascade,
  email         text not null,
  action        text not null default 'rewrite',
  model         text,
  input_tokens  int,
  output_tokens int,
  cost_usd      numeric(10,6),
  created_at    timestamptz not null default now()
);
create index if not exists ai_usage_ws   on postbox.ai_usage (workspace_id, created_at desc);
create index if not exists ai_usage_user on postbox.ai_usage (email, created_at desc);

alter table postbox.ai_usage enable row level security;
grant all on postbox.ai_usage to anon, authenticated, service_role;

-- members can see their chapter's usage (so Sam can make the case to HQ)
drop policy if exists ai_usage_read on postbox.ai_usage;
create policy ai_usage_read on postbox.ai_usage for select to authenticated
  using (postbox.is_member(workspace_id));

-- global kill switch + limits
create table if not exists postbox.ai_settings (
  id              int primary key default 1,
  enabled         boolean not null default true,
  daily_per_user  int not null default 30,
  max_input_chars int not null default 6000,
  check (id = 1)
);
insert into postbox.ai_settings (id) values (1) on conflict (id) do nothing;
alter table postbox.ai_settings enable row level security;
grant all on postbox.ai_settings to anon, authenticated, service_role;
drop policy if exists ai_settings_read on postbox.ai_settings;
create policy ai_settings_read on postbox.ai_settings for select to authenticated using (true);

-- Billing pools: a workspace can draw on a sponsor's allowance instead of
-- each member burning their own daily limit. Sam sponsors Thailand.
alter table postbox.workspaces add column if not exists ai_sponsor text;
alter table postbox.members    add column if not exists ai_uncapped boolean not null default false;
alter table postbox.ai_usage   add column if not exists billed_to text;
create index if not exists ai_usage_billed on postbox.ai_usage (billed_to, created_at desc);

update postbox.workspaces set ai_sponsor = 'shamwise8@gmail.com' where id in ('team1th','shamwise');
update postbox.members set ai_uncapped = true
  where lower(email) in ('shamwise8@gmail.com','shamwise@team1.network');
alter table postbox.workspaces add column if not exists ai_pool_daily int not null default 300;
