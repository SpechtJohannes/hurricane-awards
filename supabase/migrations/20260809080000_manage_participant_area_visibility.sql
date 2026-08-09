begin;

insert into public.app_settings (key, value)
values (
  'participant_area_visibility',
  '{"info":true,"profile":true,"timetable":true,"artists":true,"awards":true,"voting":true,"games":true}'
)
on conflict (key) do nothing;

create or replace function public.ha_get_participant_area_visibility()
returns table (
  info_visible boolean,
  profile_visible boolean,
  timetable_visible boolean,
  artists_visible boolean,
  awards_visible boolean,
  voting_visible boolean,
  games_visible boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce((s.value::jsonb ->> 'info')::boolean, true),
    coalesce((s.value::jsonb ->> 'profile')::boolean, true),
    coalesce((s.value::jsonb ->> 'timetable')::boolean, true),
    coalesce((s.value::jsonb ->> 'artists')::boolean, true),
    coalesce((s.value::jsonb ->> 'awards')::boolean, true),
    coalesce((s.value::jsonb ->> 'voting')::boolean, true),
    coalesce((s.value::jsonb ->> 'games')::boolean, true)
  from public.app_settings s
  where s.key = 'participant_area_visibility';
$$;

create or replace function public.ha_admin_update_participant_area_visibility(
  p_participant_access_code text,
  p_area_key text,
  p_is_visible boolean
)
returns table (
  info_visible boolean,
  profile_visible boolean,
  timetable_visible boolean,
  artists_visible boolean,
  awards_visible boolean,
  voting_visible boolean,
  games_visible boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visibility jsonb;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_area_key not in ('info', 'profile', 'timetable', 'artists', 'awards', 'voting', 'games') then
    raise exception 'unsupported participant area' using errcode = '22023';
  end if;

  select coalesce(s.value::jsonb, '{}'::jsonb)
  into v_visibility
  from public.app_settings s
  where s.key = 'participant_area_visibility';

  v_visibility := jsonb_set(
    coalesce(v_visibility, '{}'::jsonb),
    array[p_area_key],
    to_jsonb(p_is_visible),
    true
  );

  insert into public.app_settings (key, value, updated_at)
  values ('participant_area_visibility', v_visibility::text, now())
  on conflict (key) do update set
    value = excluded.value,
    updated_at = excluded.updated_at;

  return query select * from public.ha_get_participant_area_visibility();
end;
$$;

revoke all on function public.ha_get_participant_area_visibility() from public;
revoke all on function public.ha_admin_update_participant_area_visibility(text, text, boolean) from public;
grant execute on function public.ha_get_participant_area_visibility() to anon, authenticated;
grant execute on function public.ha_admin_update_participant_area_visibility(text, text, boolean) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
