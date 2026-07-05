-- Add admin RPCs for managing timetable stages.

create unique index if not exists timetable_stages_name_unique
  on public.timetable_stages (lower(trim(name)));

create or replace function public.ha_admin_list_timetable_stages(
  p_participant_access_code text
)
returns table (
  id uuid,
  name text,
  sort_order integer
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
  select ts.id, ts.name, ts.sort_order
  from public.timetable_stages ts
  order by ts.sort_order, ts.name;
end;
$$;

create or replace function public.ha_create_timetable_stage(
  p_participant_access_code text,
  p_name text,
  p_sort_order integer
)
returns table (
  id uuid,
  name text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage_id uuid;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_sort_order integer := coalesce(p_sort_order, 0);
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'stage name is required' using errcode = '22023';
  end if;

  if v_sort_order < 0 then
    raise exception 'stage sort order is invalid' using errcode = '22023';
  end if;

  insert into public.timetable_stages (name, sort_order)
  values (v_name, v_sort_order)
  returning timetable_stages.id into v_stage_id;

  return query
  select ts.id, ts.name, ts.sort_order
  from public.timetable_stages ts
  where ts.id = v_stage_id;
exception
  when unique_violation then
    raise exception 'stage name already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_update_timetable_stage(
  p_participant_access_code text,
  p_stage_id uuid,
  p_name text,
  p_sort_order integer
)
returns table (
  id uuid,
  name text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_sort_order integer := coalesce(p_sort_order, 0);
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_stage_id is null then
    raise exception 'stage not found' using errcode = 'P0002';
  end if;

  if v_name is null then
    raise exception 'stage name is required' using errcode = '22023';
  end if;

  if v_sort_order < 0 then
    raise exception 'stage sort order is invalid' using errcode = '22023';
  end if;

  update public.timetable_stages ts
  set
    name = v_name,
    sort_order = v_sort_order
  where ts.id = p_stage_id;

  if not found then
    raise exception 'stage not found' using errcode = 'P0002';
  end if;

  return query
  select ts.id, ts.name, ts.sort_order
  from public.timetable_stages ts
  where ts.id = p_stage_id;
exception
  when unique_violation then
    raise exception 'stage name already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_delete_timetable_stage(
  p_participant_access_code text,
  p_stage_id uuid
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

  delete from public.timetable_stages ts
  where ts.id = p_stage_id;

  if not found then
    raise exception 'stage not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.ha_admin_list_timetable_stages(text) to anon, authenticated;
grant execute on function public.ha_create_timetable_stage(text, text, integer) to anon, authenticated;
grant execute on function public.ha_update_timetable_stage(text, uuid, text, integer) to anon, authenticated;
grant execute on function public.ha_delete_timetable_stage(text, uuid) to anon, authenticated;
