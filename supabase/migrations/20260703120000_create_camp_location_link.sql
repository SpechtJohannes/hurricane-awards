-- Store one camp location link for the current festival info area.
-- Apply after 20260703110000_create_festival_documents.sql.

begin;

create or replace function public.ha_is_supported_camp_location_link(
  p_link text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(nullif(trim(p_link), ''), '') ~* (
    '^https://(' ||
    'maps\.app\.goo\.gl/' ||
    '|maps\.google\.com/' ||
    '|(www\.)?google\.com/maps' ||
    '|wa\.me/' ||
    '|api\.whatsapp\.com/' ||
    '|(www\.)?whatsapp\.com/' ||
    ')'
  );
$$;

create or replace function public.ha_get_camp_location_link(
  p_participant_access_code text
)
returns text
language sql
security definer
set search_path = public
as $$
  select s.value::text
  from public.app_settings s
  where s.key = 'camp_location_link'
    and public.ha_participant_id_for_access(p_participant_access_code) is not null
  limit 1;
$$;

create or replace function public.ha_admin_get_camp_location_link(
  p_participant_access_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select s.value::text
  into v_link
  from public.app_settings s
  where s.key = 'camp_location_link'
  limit 1;

  return v_link;
end;
$$;

create or replace function public.ha_update_camp_location_link(
  p_participant_access_code text,
  p_link text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link text := nullif(trim(p_link), '');
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_link is null then
    raise exception 'camp location link is required' using errcode = '23514';
  end if;

  if not public.ha_is_supported_camp_location_link(v_link) then
    raise exception 'unsupported camp location link' using errcode = '23514';
  end if;

  insert into public.app_settings (
    key,
    value,
    updated_at
  )
  values (
    'camp_location_link',
    v_link,
    now()
  )
  on conflict (key) do update
  set
    value = excluded.value,
    updated_at = excluded.updated_at;

  return v_link;
end;
$$;

create or replace function public.ha_delete_camp_location_link(
  p_participant_access_code text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  delete from public.app_settings s
  where s.key = 'camp_location_link';
end;
$$;

grant execute on function public.ha_is_supported_camp_location_link(text) to anon, authenticated;
grant execute on function public.ha_get_camp_location_link(text) to anon, authenticated;
grant execute on function public.ha_admin_get_camp_location_link(text) to anon, authenticated;
grant execute on function public.ha_update_camp_location_link(text, text) to anon, authenticated;
grant execute on function public.ha_delete_camp_location_link(text) to anon, authenticated;

commit;
