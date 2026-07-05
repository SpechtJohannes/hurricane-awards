-- Add admin RPCs for managing timetable performances with database-backed time validation.

create extension if not exists btree_gist;

alter table public.timetable_performances
  alter column ends_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'timetable_performances_no_stage_overlap'
      and conrelid = 'public.timetable_performances'::regclass
  ) then
    alter table public.timetable_performances
      add constraint timetable_performances_no_stage_overlap
      exclude using gist (
        stage_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      );
  end if;
end;
$$;

create or replace function public.ha_admin_list_timetable_performances(
  p_participant_access_code text
)
returns table (
  id uuid,
  festival_day_id uuid,
  stage_id uuid,
  act_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
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
    tp.id,
    tp.festival_day_id,
    tp.stage_id,
    tp.act_id,
    tp.starts_at,
    tp.ends_at
  from public.timetable_performances tp
  join public.festival_days fd on fd.id = tp.festival_day_id
  join public.timetable_stages ts on ts.id = tp.stage_id
  join public.timetable_acts ta on ta.id = tp.act_id
  order by fd.sort_order, tp.starts_at, ts.sort_order, ta.name;
end;
$$;

create or replace function public.ha_create_timetable_performance(
  p_participant_access_code text,
  p_festival_day_id uuid,
  p_stage_id uuid,
  p_act_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns table (
  id uuid,
  festival_day_id uuid,
  stage_id uuid,
  act_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_performance_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_festival_day_id is null then
    raise exception 'festival day is required' using errcode = '22023';
  end if;

  if p_stage_id is null then
    raise exception 'stage is required' using errcode = '22023';
  end if;

  if p_act_id is null then
    raise exception 'act is required' using errcode = '22023';
  end if;

  if p_starts_at is null then
    raise exception 'performance start time is required' using errcode = '22023';
  end if;

  if p_ends_at is null then
    raise exception 'performance end time is required' using errcode = '22023';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'performance end time must be after start time' using errcode = '22023';
  end if;

  insert into public.timetable_performances (
    festival_day_id,
    stage_id,
    act_id,
    starts_at,
    ends_at
  )
  values (
    p_festival_day_id,
    p_stage_id,
    p_act_id,
    p_starts_at,
    p_ends_at
  )
  returning timetable_performances.id into v_performance_id;

  return query
  select
    tp.id,
    tp.festival_day_id,
    tp.stage_id,
    tp.act_id,
    tp.starts_at,
    tp.ends_at
  from public.timetable_performances tp
  where tp.id = v_performance_id;
exception
  when exclusion_violation then
    raise exception 'performance overlaps existing performance on stage' using errcode = '23P01';
  when foreign_key_violation then
    raise exception 'performance references are invalid' using errcode = '23503';
end;
$$;

create or replace function public.ha_update_timetable_performance(
  p_participant_access_code text,
  p_performance_id uuid,
  p_festival_day_id uuid,
  p_stage_id uuid,
  p_act_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
returns table (
  id uuid,
  festival_day_id uuid,
  stage_id uuid,
  act_id uuid,
  starts_at timestamptz,
  ends_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_performance_id is null then
    raise exception 'performance not found' using errcode = 'P0002';
  end if;

  if p_festival_day_id is null then
    raise exception 'festival day is required' using errcode = '22023';
  end if;

  if p_stage_id is null then
    raise exception 'stage is required' using errcode = '22023';
  end if;

  if p_act_id is null then
    raise exception 'act is required' using errcode = '22023';
  end if;

  if p_starts_at is null then
    raise exception 'performance start time is required' using errcode = '22023';
  end if;

  if p_ends_at is null then
    raise exception 'performance end time is required' using errcode = '22023';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'performance end time must be after start time' using errcode = '22023';
  end if;

  update public.timetable_performances tp
  set
    festival_day_id = p_festival_day_id,
    stage_id = p_stage_id,
    act_id = p_act_id,
    starts_at = p_starts_at,
    ends_at = p_ends_at
  where tp.id = p_performance_id;

  if not found then
    raise exception 'performance not found' using errcode = 'P0002';
  end if;

  return query
  select
    tp.id,
    tp.festival_day_id,
    tp.stage_id,
    tp.act_id,
    tp.starts_at,
    tp.ends_at
  from public.timetable_performances tp
  where tp.id = p_performance_id;
exception
  when exclusion_violation then
    raise exception 'performance overlaps existing performance on stage' using errcode = '23P01';
  when foreign_key_violation then
    raise exception 'performance references are invalid' using errcode = '23503';
end;
$$;

create or replace function public.ha_delete_timetable_performance(
  p_participant_access_code text,
  p_performance_id uuid
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

  delete from public.timetable_performances tp
  where tp.id = p_performance_id;

  if not found then
    raise exception 'performance not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.ha_admin_list_timetable_performances(text) to anon, authenticated;
grant execute on function public.ha_create_timetable_performance(text, uuid, uuid, uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.ha_update_timetable_performance(text, uuid, uuid, uuid, uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.ha_delete_timetable_performance(text, uuid) to anon, authenticated;
