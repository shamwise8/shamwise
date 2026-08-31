-- X account connections, one per workspace.
-- Tokens are never readable by the browser: direct select is revoked and the
-- client only ever sees handle/name/avatar through a SECURITY DEFINER function.
create table if not exists postbox.x_accounts (
  workspace_id  text primary key references postbox.workspaces(id) on delete cascade,
  x_user_id     text not null,
  handle        text not null,
  name          text,
  avatar_url    text,
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz,
  scopes        text,
  connected_by  text,
  connected_at  timestamptz not null default now()
);
alter table postbox.x_accounts enable row level security;
revoke all on postbox.x_accounts from anon, authenticated;
grant all on postbox.x_accounts to service_role;

-- short-lived OAuth handshake state (PKCE verifier + which workspace)
create table if not exists postbox.x_oauth_state (
  state         text primary key,
  workspace_id  text not null,
  email         text not null,
  verifier      text not null,
  created_at    timestamptz not null default now()
);
alter table postbox.x_oauth_state enable row level security;
revoke all on postbox.x_oauth_state from anon, authenticated;
grant all on postbox.x_oauth_state to service_role;

-- what the app is allowed to know about a connection
create or replace function postbox.x_connection(ws text)
returns json
language sql
security definer
stable
set search_path = postbox, public
as $$
  select case when not postbox.is_member(ws) then null else (
    select json_build_object('handle', a.handle, 'name', a.name,
                             'avatar_url', a.avatar_url, 'connected_by', a.connected_by,
                             'connected_at', a.connected_at)
    from postbox.x_accounts a where a.workspace_id = ws
  ) end;
$$;
revoke all on function postbox.x_connection(text) from public, anon;
grant execute on function postbox.x_connection(text) to authenticated;

-- disconnect: admins of that workspace only
create or replace function postbox.x_disconnect(ws text)
returns boolean
language plpgsql
security definer
set search_path = postbox, public
as $$
begin
  if not postbox.is_admin(ws) then raise exception 'admins only'; end if;
  delete from postbox.x_accounts where workspace_id = ws;
  return true;
end;
$$;
revoke all on function postbox.x_disconnect(text) from public, anon;
grant execute on function postbox.x_disconnect(text) to authenticated;

-- posting log: what went out, what it cost, who sent it
create table if not exists postbox.x_posts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references postbox.workspaces(id) on delete cascade,
  draft_id     uuid references postbox.drafts(id) on delete set null,
  tweet_ids    text[] not null default '{}',
  tweets       int not null default 0,
  with_links   int not null default 0,
  est_cost_usd numeric(10,4),
  posted_by    text,
  created_at   timestamptz not null default now()
);
alter table postbox.x_posts enable row level security;
grant all on postbox.x_posts to authenticated, service_role;
drop policy if exists x_posts_read on postbox.x_posts;
create policy x_posts_read on postbox.x_posts for select to authenticated
  using (postbox.is_member(workspace_id));

alter table postbox.drafts add column if not exists posted_at timestamptz;
alter table postbox.drafts add column if not exists x_tweet_id text;
