-- Claimable now means "no admin yet" (workspaces can be pre-seeded with members).
create or replace function postbox.workspace_has_admin(ws text) returns boolean
language sql stable security definer set search_path = postbox as
$$ select exists (select 1 from members where workspace_id = ws and role = 'admin') $$;

create or replace function postbox.claimable_workspaces()
returns table (id text, name text)
language sql stable security definer set search_path = postbox as
$$ select w.id, w.name from workspaces w
   where (auth.jwt() ->> 'email') like '%@team1.network'
     and not postbox.workspace_has_admin(w.id)
   order by w.name $$;

drop policy if exists members_claim_new_workspace on postbox.members;
create policy members_claim_new_workspace on postbox.members for insert to authenticated
  with check (
    email = (auth.jwt() ->> 'email')
    and role = 'admin'
    and (auth.jwt() ->> 'email') like '%@team1.network'
    and not postbox.workspace_has_admin(workspace_id)
  );
