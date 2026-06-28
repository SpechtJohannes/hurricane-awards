-- Restrict administrative RPC functions to explicitly authorized participants.
-- Apply after 20260628123000_secure_data_access.sql.

begin;

alter table public.participants
  add column if not exists is_admin boolean not null default false;

drop function if exists public.ha_find_participant(text);

create or replace function public.ha_find_participant(
  p_access_code text
)
returns table (
  id text,
  name text,
  display_name text,
  is_admin boolean
)
language sql
security definer
set search_path = public
as $$
  select p.id::text, p.name::text, p.display_name::text, p.is_admin
  from public.participants p
  where upper(p.access_code) = upper(trim(p_access_code))
  limit 1;
$$;

create or replace function public.ha_has_admin_access(
  p_participant_access_code text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.participants p
    where upper(p.access_code) = upper(trim(p_participant_access_code))
      and p.is_admin = true
  );
$$;

revoke all on function public.ha_has_admin_access(text) from public;
grant execute on function public.ha_find_participant(text) to anon, authenticated;

commit;
