-- Self-join: @team1.network domain OR roster emails may join any chapter as a member.
-- (team1.network can still claim an admin-less chapter as admin via the earlier policy.)

create table if not exists postbox.self_join_emails (email text primary key);
insert into postbox.self_join_emails (email) values
  ('akash.bhakat82@gmail.com'),('akira.komiya@guild.support'),('alejandro.soto@avalabs.org'),
  ('dana.debondt@outlook.com'),('eamonn.deane@avalabs.org'),('federico.nardelli@avalabs.org'),
  ('giacomobarbieri94@gmail.com'),('griimgaming16@gmail.com'),('gunner1023@gmail.com'),
  ('ifeanyi.oyom@gmail.com'),('juliq.jq@gmail.com'),('lavenderesther202@gmail.com'),
  ('leandro.davo@avalabs.org'),('mer7cry@gmail.com'),('pedroluisbdp@gmail.com'),
  ('phfoong@gmail.com'),('promisewilfred0@gmail.com'),('sangeethxramesh@gmail.com'),
  ('snowofkila@gmail.com'),('svamsi.tech@gmail.com'),('tomasjulianda21@gmail.com'),
  ('vincentvanholm@gmail.com'),('yujin.katsuta@avalabs.org')
on conflict do nothing;

create or replace function postbox.can_self_join() returns boolean
language sql stable security definer set search_path = postbox as
$$ select (auth.jwt() ->> 'email') like '%@team1.network'
       or exists (select 1 from self_join_emails where email = (auth.jwt() ->> 'email')) $$;

-- Chapters the user may join and isn't already in.
create or replace function postbox.joinable_workspaces()
returns table (id text, name text)
language sql stable security definer set search_path = postbox as
$$ select w.id, w.name from workspaces w
   where postbox.can_self_join()
     and not exists (select 1 from members m where m.workspace_id = w.id and m.email = (auth.jwt() ->> 'email'))
   order by w.name $$;

drop policy if exists members_self_join on postbox.members;
create policy members_self_join on postbox.members for insert to authenticated
  with check (
    email = (auth.jwt() ->> 'email')
    and role = 'member'
    and postbox.can_self_join()
  );
