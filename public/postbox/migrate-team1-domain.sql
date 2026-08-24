-- Postbox upgrade (team1-specific): @team1.network self-serve chapter creation.
-- Additive only. Anyone signing in with an @team1.network email who belongs to no
-- workspace can create ONE new empty workspace and become its admin. They can never
-- read or join an existing workspace this way — joining stays invite-only.

create or replace function postbox.workspace_member_count(ws text) returns integer
language sql stable security definer set search_path = postbox as
$$ select count(*)::int from members where workspace_id = ws $$;

drop policy if exists workspaces_create_team1 on postbox.workspaces;
create policy workspaces_create_team1 on postbox.workspaces for insert to authenticated
  with check ((auth.jwt() ->> 'email') like '%@team1.network');

-- A team1.network user may claim an EMPTY workspace by inserting themselves as its admin.
drop policy if exists members_claim_new_workspace on postbox.members;
create policy members_claim_new_workspace on postbox.members for insert to authenticated
  with check (
    email = (auth.jwt() ->> 'email')
    and role = 'admin'
    and (auth.jwt() ->> 'email') like '%@team1.network'
    and postbox.workspace_member_count(workspace_id) = 0
  );
