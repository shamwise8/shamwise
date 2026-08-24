-- Media attachments: per-tweet images/video on drafts.
alter table postbox.drafts add column if not exists media jsonb not null default '[]';

-- Public bucket; uploads/deletes restricted to members of the workspace in the path prefix.
insert into storage.buckets (id, name, public) values ('postbox-media','postbox-media', true)
on conflict (id) do nothing;

drop policy if exists "postbox media insert" on storage.objects;
create policy "postbox media insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'postbox-media' and postbox.is_member(split_part(name, '/', 1)));

drop policy if exists "postbox media delete" on storage.objects;
create policy "postbox media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'postbox-media' and postbox.is_member(split_part(name, '/', 1)));

drop policy if exists "postbox media read" on storage.objects;
create policy "postbox media read" on storage.objects for select
  using (bucket_id = 'postbox-media');
