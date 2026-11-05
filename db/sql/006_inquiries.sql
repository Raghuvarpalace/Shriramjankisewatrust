-- ROOT PATH: db/sql/006_inquiries.sql
-- Seva / donation / room enquiries from the public site. Safe to re-run.
-- Written ONLY by /api/inquiry (service role). Read + update by the logged-in admin.

create table if not exists public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique,
  kind          text not null check (kind in ('seva', 'donation', 'room')),
  name          text not null,
  phone         text not null,
  seva          text,
  purpose       text,
  amount_inr    integer check (amount_inr is null or amount_inr > 0),
  preferred_date date,
  city          text,
  guests        text,
  room          text,
  txn_ref       text,
  message       text,
  status        text not null default 'new' check (status in ('new', 'contacted', 'done', 'spam')),
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_kind_status_idx on public.inquiries (kind, status);

alter table public.inquiries enable row level security;

revoke all on public.inquiries from anon;
grant select, update on public.inquiries to authenticated;

drop policy if exists "Admin read inquiries" on public.inquiries;
drop policy if exists "Admin update inquiries" on public.inquiries;

create policy "Admin read inquiries"
on public.inquiries for select to authenticated
using (auth.role() = 'authenticated');

create policy "Admin update inquiries"
on public.inquiries for update to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
