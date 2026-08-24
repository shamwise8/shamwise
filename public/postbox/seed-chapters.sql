-- Seed the official team1 chapters as empty, claimable workspaces.
-- (Thailand already exists as 'team1th'.) Additive; safe to re-run.

insert into postbox.workspaces (id, name) values
  ('team1global', 'team1 global'),
  ('team1br',     'team1 brazil'),
  ('team1in',     'team1 india'),
  ('team1kr',     'team1 korea'),
  ('team1latam',  'team1 latam'),
  ('team1tr',     'team1 turkey'),
  ('team1us',     'team1 united states'),
  ('team1vn',     'team1 vietnam'),
  ('team1jp',     'team1 japan'),
  ('team1fr',     'team1 france'),
  ('team1africa', 'team1 africa'),
  ('team1za',     'team1 south africa')
on conflict (id) do nothing;

-- Unclaimed-chapter list for @team1.network leads (empty workspaces only).
create or replace function postbox.claimable_workspaces()
returns table (id text, name text)
language sql stable security definer set search_path = postbox as
$$ select w.id, w.name from workspaces w
   where (auth.jwt() ->> 'email') like '%@team1.network'
     and not exists (select 1 from members m where m.workspace_id = w.id)
   order by w.name $$;
