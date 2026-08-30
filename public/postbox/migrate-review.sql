-- Key-gated review links: a batch of drafts behind a passphrase the sharer sets.
-- Unlike the public preview, nothing here is readable without the key — anon has
-- no table access at all, and the key is bcrypt-hashed, never stored in the clear.
create table if not exists postbox.review_sets (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references postbox.workspaces(id) on delete cascade,
  token        uuid not null unique default gen_random_uuid(),
  name         text not null default 'Review',
  key_hash     text not null,
  draft_ids    uuid[] not null default '{}',
  created_by   text,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz
);
create index if not exists review_sets_ws on postbox.review_sets (workspace_id, created_at desc);

alter table postbox.review_sets enable row level security;
grant all on postbox.review_sets to authenticated, service_role;
revoke all on postbox.review_sets from anon;

drop policy if exists review_sets_member on postbox.review_sets;
create policy review_sets_member on postbox.review_sets for all to authenticated
  using (postbox.is_member(workspace_id)) with check (postbox.is_member(workspace_id));

-- create: hashes the key server-side so the plaintext is never stored
create or replace function postbox.create_review_set(ws text, nm text, key text, ids uuid[], ttl_days int default null)
returns uuid
language plpgsql
security definer
set search_path = postbox, extensions, public
as $$
declare t uuid;
begin
  if not postbox.is_member(ws) then raise exception 'not a member of that workspace'; end if;
  if length(coalesce(key, '')) < 4 then raise exception 'access key must be at least 4 characters'; end if;
  insert into postbox.review_sets (workspace_id, name, key_hash, draft_ids, created_by, expires_at)
  values (ws, coalesce(nullif(nm,''), 'Review'), extensions.crypt(key, extensions.gen_salt('bf')), ids,
          auth.jwt() ->> 'email',
          case when ttl_days is null then null else now() + (ttl_days || ' days')::interval end)
  returning token into t;
  return t;
end;
$$;

-- open: returns the batch only when the key verifies. Wrong key and unknown
-- token are indistinguishable to the caller.
create or replace function postbox.open_review_set(tok uuid, key text)
returns json
language plpgsql
security definer
stable
set search_path = postbox, extensions, public
as $$
declare s record; out json;
begin
  select * into s from postbox.review_sets where token = tok;
  if not found then return null; end if;
  if s.expires_at is not null and s.expires_at < now() then return null; end if;
  if s.key_hash <> extensions.crypt(coalesce(key,''), s.key_hash) then return null; end if;

  select json_build_object(
    'name', s.name,
    'workspace', json_build_object('name', w.name, 'handle', w.handle,
                                   'avatar_url', w.avatar_url, 'theme', w.theme),
    'posts', coalesce((
      select json_agg(json_build_object(
        'title', d.title, 'content', d.content,
        'media', coalesce(d.media, '[]'::jsonb), 'planned_at', d.planned_at)
        order by array_position(s.draft_ids, d.id))
      from postbox.drafts d where d.id = any(s.draft_ids)
    ), '[]'::json)
  ) into out
  from postbox.workspaces w where w.id = s.workspace_id;
  return out;
end;
$$;

revoke all on function postbox.create_review_set(text,text,text,uuid[],int) from public, anon;
grant execute on function postbox.create_review_set(text,text,text,uuid[],int) to authenticated;
revoke all on function postbox.open_review_set(uuid,text) from public;
grant execute on function postbox.open_review_set(uuid,text) to anon, authenticated;
