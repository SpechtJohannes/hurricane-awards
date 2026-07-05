-- Add admin RPCs for managing timetable acts independently from performances.

create or replace function public.ha_admin_list_timetable_acts(
  p_participant_access_code text
)
returns table (
  id uuid,
  name text,
  description text
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
  select ta.id, ta.name, ta.description
  from public.timetable_acts ta
  order by ta.name;
end;
$$;

create or replace function public.ha_create_timetable_act(
  p_participant_access_code text,
  p_name text,
  p_description text
)
returns table (
  id uuid,
  name text,
  description text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_act_id uuid;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'act name is required' using errcode = '22023';
  end if;

  insert into public.timetable_acts (name, description)
  values (v_name, v_description)
  returning timetable_acts.id into v_act_id;

  return query
  select ta.id, ta.name, ta.description
  from public.timetable_acts ta
  where ta.id = v_act_id;
end;
$$;

create or replace function public.ha_update_timetable_act(
  p_participant_access_code text,
  p_act_id uuid,
  p_name text,
  p_description text
)
returns table (
  id uuid,
  name text,
  description text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_act_id is null then
    raise exception 'act not found' using errcode = 'P0002';
  end if;

  if v_name is null then
    raise exception 'act name is required' using errcode = '22023';
  end if;

  update public.timetable_acts ta
  set
    name = v_name,
    description = v_description
  where ta.id = p_act_id;

  if not found then
    raise exception 'act not found' using errcode = 'P0002';
  end if;

  return query
  select ta.id, ta.name, ta.description
  from public.timetable_acts ta
  where ta.id = p_act_id;
end;
$$;

create or replace function public.ha_delete_timetable_act(
  p_participant_access_code text,
  p_act_id uuid
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

  if exists (
    select 1
    from public.timetable_performances tp
    where tp.act_id = p_act_id
  ) then
    raise exception 'act cannot be deleted while performances exist' using errcode = '23503';
  end if;

  delete from public.timetable_acts ta
  where ta.id = p_act_id;

  if not found then
    raise exception 'act not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.ha_admin_list_timetable_acts(text) to anon, authenticated;
grant execute on function public.ha_create_timetable_act(text, text, text) to anon, authenticated;
grant execute on function public.ha_update_timetable_act(text, uuid, text, text) to anon, authenticated;
grant execute on function public.ha_delete_timetable_act(text, uuid) to anon, authenticated;
