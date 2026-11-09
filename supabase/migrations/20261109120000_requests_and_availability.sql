-- IntoTheLighthouse: support requests + practitioner availability.
--
-- Access model
--   * Visitors never touch tables directly. The `submit-request` Edge Function validates
--     input and inserts with the service role.
--   * Practitioners sign in (invite-only, emailed link). They can read requests and change
--     ONLY their own availability, through `set_my_availability()`.
--   * Requests are deleted automatically after `request_retention_days` (see bottom).

create extension if not exists pg_cron with schema pg_catalog;

-- Practitioners --------------------------------------------------------------------------
create table public.practitioners (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text not null check (length(display_name) between 1 and 80),
  personal_email        text not null check (personal_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  is_active             boolean not null default true,
  -- Only practitioners who hold the legal qualifications to work with under-18s.
  qualified_under_18    boolean not null default false,
  is_available          boolean not null default false,
  availability_changed_at timestamptz not null default now(),
  created_at            timestamptz not null default now()
);
comment on table public.practitioners is
  'One row per invited practitioner. Rows are added by an admin after inviting the user in Supabase Auth.';

alter table public.practitioners enable row level security;

-- True when the signed-in user is an active practitioner (used by the requests policy).
create or replace function public.is_active_practitioner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.practitioners p
    where p.id = auth.uid() and p.is_active
  );
$$;
revoke all on function public.is_active_practitioner() from public, anon;
grant execute on function public.is_active_practitioner() to authenticated;

create policy "practitioners read own row"
  on public.practitioners for select
  to authenticated
  using (id = auth.uid());

-- No insert/update/delete policies: changes go through set_my_availability() or the dashboard.
revoke all on public.practitioners from anon, authenticated;
grant select on public.practitioners to authenticated;

-- The one thing a practitioner may change about themselves: available / not available.
create or replace function public.set_my_availability(available boolean)
returns public.practitioners
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.practitioners;
begin
  update public.practitioners
     set is_available = available,
         availability_changed_at = now()
   where id = auth.uid() and is_active
  returning * into result;

  if result.id is null then
    raise exception 'Not an active practitioner' using errcode = '42501';
  end if;
  return result;
end;
$$;
revoke all on function public.set_my_availability(boolean) from public, anon;
grant execute on function public.set_my_availability(boolean) to authenticated;

-- Support requests -----------------------------------------------------------------------
create table public.support_requests (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null check (length(name) between 1 and 120),
  contact_method  text not null check (contact_method in ('Email', 'Phone')),
  contact         text not null check (length(contact) between 3 and 200),
  message         text check (message is null or length(message) <= 2000),
  -- Who was notified when it arrived (available practitioners, or everyone if none were).
  notified_practitioner_ids uuid[] not null default '{}',
  notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'not_configured', 'failed')),
  -- Salted hash of the sender's IP, used only to slow down floods. Deleted with the request.
  ip_hash         text
);
create index support_requests_created_at_idx on public.support_requests (created_at);
create index support_requests_ip_hash_idx on public.support_requests (ip_hash, created_at);

alter table public.support_requests enable row level security;

create policy "active practitioners read requests"
  on public.support_requests for select
  to authenticated
  using ((select public.is_active_practitioner()));

revoke all on public.support_requests from anon, authenticated;
grant select on public.support_requests to authenticated;

-- Automatic deletion ---------------------------------------------------------------------
-- Keep requests only as long as needed to respond. Change the number of days here (and on
-- safety.html) if Cassidy chooses a different retention period.
create or replace function public.delete_expired_requests(retention_days integer default 30)
returns integer
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.support_requests
     where created_at < now() - make_interval(days => retention_days)
    returning 1
  )
  select count(*)::integer from gone;
$$;
revoke all on function public.delete_expired_requests(integer) from public, anon, authenticated;

select cron.schedule(
  'itl-delete-expired-requests',
  '17 3 * * *',  -- daily at 03:17 UTC
  $$select public.delete_expired_requests(30)$$
);
