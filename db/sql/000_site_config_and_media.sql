-- ROOT PATH: db/sql/000_site_config_and_media.sql
-- Site settings table + public "media" bucket for admin uploads. Safe to re-run. Run this FIRST.

create table if not exists public.site_config (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.site_config enable row level security;

drop policy if exists "Allow public read site config" on public.site_config;
drop policy if exists "Allow authenticated admin insert site config" on public.site_config;
drop policy if exists "Allow authenticated admin update site config" on public.site_config;

create policy "Allow public read site config"
on public.site_config
for select
using (true);

create policy "Allow authenticated admin insert site config"
on public.site_config
for insert
to authenticated
with check (auth.role() = 'authenticated');

create policy "Allow authenticated admin update site config"
on public.site_config
for update
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into public.site_config (id, data, updated_at)
values ('main', '{}'::jsonb, now())
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public read media" on storage.objects;
drop policy if exists "Allow authenticated upload media" on storage.objects;
drop policy if exists "Allow authenticated update media" on storage.objects;
drop policy if exists "Allow authenticated delete media" on storage.objects;

create policy "Allow public read media"
on storage.objects
for select
using (bucket_id = 'media');

create policy "Allow authenticated upload media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'media');

create policy "Allow authenticated update media"
on storage.objects
for update
to authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

create policy "Allow authenticated delete media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'media');
