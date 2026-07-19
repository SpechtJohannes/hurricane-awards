begin;

alter table public.app_settings
  add column if not exists camp_location_label text,
  add column if not exists camp_location_latitude double precision,
  add column if not exists camp_location_longitude double precision,
  add column if not exists camp_location_timezone text;

alter table public.app_settings
  add constraint app_settings_camp_location_coordinates_valid check (
    (camp_location_latitude is null and camp_location_longitude is null and camp_location_timezone is null)
    or (
      camp_location_label is not null
      and camp_location_latitude between -90 and 90
      and camp_location_longitude between -180 and 180
    )
  );

create table public.event_weather_cache (
  event_key text primary key check (event_key = 'current'),
  payload jsonb not null,
  fetched_at timestamptz not null,
  expires_at timestamptz not null
);

alter table public.event_weather_cache enable row level security;
revoke all on table public.event_weather_cache from anon, authenticated;

drop function if exists public.ha_get_camp_location_link(text);
create function public.ha_get_camp_location_link(p_participant_access_code text)
returns table (
  camp_location_label text,
  camp_location_map_url text,
  camp_location_latitude double precision,
  camp_location_longitude double precision,
  camp_location_timezone text
)
language sql security definer set search_path = public
as $$
  select s.camp_location_label, s.value, s.camp_location_latitude,
    s.camp_location_longitude, s.camp_location_timezone
  from public.app_settings s
  where s.key = 'camp_location_link'
    and public.ha_participant_id_for_access(p_participant_access_code) is not null
  limit 1;
$$;

drop function if exists public.ha_admin_get_camp_location_link(text);
create function public.ha_admin_get_camp_location_link(p_participant_access_code text)
returns table (
  camp_location_label text,
  camp_location_map_url text,
  camp_location_latitude double precision,
  camp_location_longitude double precision,
  camp_location_timezone text
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  return query select s.camp_location_label, s.value, s.camp_location_latitude,
    s.camp_location_longitude, s.camp_location_timezone
  from public.app_settings s where s.key = 'camp_location_link' limit 1;
end;
$$;

drop function if exists public.ha_update_camp_location_link(text, text);
create function public.ha_update_camp_location_link(
  p_participant_access_code text,
  p_link text,
  p_label text,
  p_latitude double precision,
  p_longitude double precision,
  p_timezone text
)
returns table (
  camp_location_label text,
  camp_location_map_url text,
  camp_location_latitude double precision,
  camp_location_longitude double precision,
  camp_location_timezone text
)
language plpgsql security definer set search_path = public
as $$
declare
  v_link text := nullif(trim(p_link), '');
  v_label text := nullif(trim(p_label), '');
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if v_link is null or not public.ha_is_supported_camp_location_link(v_link) then
    raise exception 'unsupported camp location link' using errcode = '23514';
  end if;
  if v_label is null or p_latitude is null or p_longitude is null
     or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'complete geocoded camp location required' using errcode = '23514';
  end if;

  insert into public.app_settings (
    key, value, camp_location_label, camp_location_latitude,
    camp_location_longitude, camp_location_timezone, updated_at
  ) values (
    'camp_location_link', v_link, v_label, p_latitude, p_longitude,
    nullif(trim(p_timezone), ''), now()
  ) on conflict (key) do update set
    value = excluded.value,
    camp_location_label = excluded.camp_location_label,
    camp_location_latitude = excluded.camp_location_latitude,
    camp_location_longitude = excluded.camp_location_longitude,
    camp_location_timezone = excluded.camp_location_timezone,
    updated_at = excluded.updated_at;

  delete from public.event_weather_cache where event_key = 'current';
  return query select v_label, v_link, p_latitude, p_longitude, nullif(trim(p_timezone), '');
end;
$$;

create or replace function public.ha_delete_camp_location_link(p_participant_access_code text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  delete from public.app_settings where key = 'camp_location_link';
  delete from public.event_weather_cache where event_key = 'current';
end;
$$;

revoke all on function public.ha_get_camp_location_link(text) from public;
revoke all on function public.ha_admin_get_camp_location_link(text) from public;
revoke all on function public.ha_update_camp_location_link(text, text, text, double precision, double precision, text) from public;
revoke all on function public.ha_delete_camp_location_link(text) from public;
grant execute on function public.ha_get_camp_location_link(text) to anon, authenticated, service_role;
grant execute on function public.ha_admin_get_camp_location_link(text) to anon, authenticated;
grant execute on function public.ha_update_camp_location_link(text, text, text, double precision, double precision, text) to anon, authenticated;
grant execute on function public.ha_delete_camp_location_link(text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
