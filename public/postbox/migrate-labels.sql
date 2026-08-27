-- Post category labels (Finder-style tags), per workspace. Additive.

create table if not exists postbox.labels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id text not null references postbox.workspaces(id) on delete cascade,
  name         text not null,
  color        text not null default 'grey',
  created_at   timestamptz not null default now()
);
create index if not exists labels_ws on postbox.labels (workspace_id, name);

alter table postbox.drafts add column if not exists labels jsonb not null default '[]';

alter table postbox.labels enable row level security;
grant all on postbox.labels to anon, authenticated, service_role;

drop policy if exists labels_all on postbox.labels;
create policy labels_all on postbox.labels for all to authenticated
  using (postbox.is_member(workspace_id)) with check (postbox.is_member(workspace_id));

alter publication supabase_realtime add table postbox.labels;
