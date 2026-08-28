-- Workspace brand identity: handle + logo shown in post previews.
alter table postbox.workspaces add column if not exists handle     text;
alter table postbox.workspaces add column if not exists avatar_url text;

-- Admins of a workspace may edit its brand.
drop policy if exists workspaces_admin_update on postbox.workspaces;
create policy workspaces_admin_update on postbox.workspaces for update to authenticated
  using (postbox.is_admin(id)) with check (postbox.is_admin(id));
