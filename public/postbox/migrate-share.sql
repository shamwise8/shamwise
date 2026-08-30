-- Public read-only preview links. The token is the capability; there is no
-- broadened RLS policy — anon reads go through one function that returns
-- only what a preview needs and nothing about who wrote it.
alter table postbox.drafts add column if not exists public_token uuid;
create unique index if not exists drafts_public_token
  on postbox.drafts (public_token) where public_token is not null;

create or replace function postbox.shared_preview(tok uuid)
returns json
language sql
security definer
stable
set search_path = postbox, public
as $$
  select json_build_object(
    'content',    d.content,
    'media',      coalesce(d.media, '[]'::jsonb),
    'name',       w.name,
    'handle',     w.handle,
    'avatar_url', w.avatar_url,
    'theme',      w.theme
  )
  from postbox.drafts d
  join postbox.workspaces w on w.id = d.workspace_id
  where d.public_token = tok;
$$;

revoke all on function postbox.shared_preview(uuid) from public;
grant execute on function postbox.shared_preview(uuid) to anon, authenticated;
