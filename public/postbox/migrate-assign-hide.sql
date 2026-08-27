-- Accountability: assign a draft to a member. Plus: hide HQ/observer members
-- from the chapter's Team panel.

alter table postbox.drafts  add column if not exists assignee text;
alter table postbox.members add column if not exists hidden boolean not null default false;

-- A viewer who is themselves hidden can see other hidden members (HQ sees HQ).
create or replace function postbox.is_hidden_viewer(ws text) returns boolean
language sql stable security definer set search_path = postbox as
$$ select exists (select 1 from members where workspace_id = ws
                  and email = (auth.jwt() ->> 'email') and hidden) $$;

drop policy if exists members_read on postbox.members;
create policy members_read on postbox.members for select to authenticated
  using (
    postbox.is_member(workspace_id)
    and (
      not hidden
      or email = (auth.jwt() ->> 'email')
      or postbox.is_hidden_viewer(workspace_id)
    )
  );
