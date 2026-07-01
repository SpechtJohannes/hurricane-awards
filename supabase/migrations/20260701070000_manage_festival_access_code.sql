-- Store and manage the shared festival access code through app_settings.
-- Apply after 20260630130000_secure_participant_login.sql.

begin;

insert into public.app_settings (key, value)
values ('festival_access_code', 'HURRICANE2026')
on conflict (key) do nothing;

create or replace function public.ha_get_festival_access_version()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(s.updated_at, now())::text
  from public.app_settings s
  where s.key = 'festival_access_code'
  limit 1;
$$;

create or replace function public.ha_verify_festival_access_code(
  p_access_code text
)
returns table (
  is_valid boolean,
  access_version text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access_code text;
  v_stored_access_code text;
  v_access_version text;
begin
  v_access_code := upper(nullif(trim(p_access_code), ''));

  select
    upper(s.value::text),
    coalesce(s.updated_at, now())::text
  into
    v_stored_access_code,
    v_access_version
  from public.app_settings s
  where s.key = 'festival_access_code'
  limit 1;

  return query
  select
    v_access_code is not null
      and v_stored_access_code is not null
      and v_access_code = v_stored_access_code,
    case
      when v_access_code is not null
        and v_stored_access_code is not null
        and v_access_code = v_stored_access_code
      then v_access_version
      else null
    end;
end;
$$;

create or replace function public.ha_get_festival_access_code(
  p_participant_access_code text
)
returns table (
  access_code text,
  access_version text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return query
  select
    s.value::text,
    coalesce(s.updated_at, now())::text
  from public.app_settings s
  where s.key = 'festival_access_code'
  limit 1;
end;
$$;

create or replace function public.ha_update_festival_access_code(
  p_participant_access_code text,
  p_access_code text
)
returns table (
  access_code text,
  access_version text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access_code text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_access_code := upper(nullif(trim(p_access_code), ''));

  if v_access_code is null then
    raise exception 'festival access code is required' using errcode = '23514';
  end if;

  insert into public.app_settings (
    key,
    value,
    updated_at
  )
  values (
    'festival_access_code',
    v_access_code,
    now()
  )
  on conflict (key) do update
  set
    value = excluded.value,
    updated_at = excluded.updated_at;

  return query
  select
    s.value::text,
    s.updated_at::text
  from public.app_settings s
  where s.key = 'festival_access_code'
  limit 1;
end;
$$;

grant execute on function public.ha_get_festival_access_version() to anon, authenticated;
grant execute on function public.ha_verify_festival_access_code(text) to anon, authenticated;
grant execute on function public.ha_get_festival_access_code(text) to anon, authenticated;
grant execute on function public.ha_update_festival_access_code(text, text) to anon, authenticated;

commit;
