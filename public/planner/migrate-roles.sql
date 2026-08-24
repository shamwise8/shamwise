-- Postbox upgrade: member roles + in-app team management.
-- Safe to run on a live install — additive only, no data dropped.

alter table postbox.members
  add column if not exists role text not null default 'member'
  check (role in ('member','admin'));

create or replace function postbox.is_admin(ws text) returns boolean
language sql stable security definer set search_path = postbox as
$$ select exists (select 1 from members where workspace_id = ws and email = (auth.jwt() ->> 'email') and role = 'admin') $$;

drop policy if exists members_admin_insert on postbox.members;
create policy members_admin_insert on postbox.members for insert to authenticated
  with check (postbox.is_admin(workspace_id));

drop policy if exists members_admin_update on postbox.members;
create policy members_admin_update on postbox.members for update to authenticated
  using (postbox.is_admin(workspace_id)) with check (postbox.is_admin(workspace_id));

-- Admins can remove anyone in their workspace except themselves.
drop policy if exists members_admin_delete on postbox.members;
create policy members_admin_delete on postbox.members for delete to authenticated
  using (postbox.is_admin(workspace_id) and email <> (auth.jwt() ->> 'email'));

-- Make Sam admin of team1th.
update postbox.members set role = 'admin'
  where workspace_id = 'team1th' and email = 'shamwise8@gmail.com';

-- To onboard a new chapter later (2 statements, then their lead self-serves):
--   insert into postbox.workspaces (id, name) values ('team1vn', 'team1 vietnam');
--   insert into postbox.members (workspace_id, email, name, role) values ('team1vn', 'lead@email.com', 'Lead', 'admin');
