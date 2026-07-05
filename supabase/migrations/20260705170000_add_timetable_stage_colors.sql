-- Allow admins to configure optional colors for timetable stages.

alter table public.timetable_stages
  add column if not exists color text;

alter table public.timetable_stages
  drop constraint if exists timetable_stages_color_hex;

alter table public.timetable_stages
  add constraint timetable_stages_color_hex
  check (color is null or color ~ '^#[0-9A-Fa-f]{6}$');

drop function if exists public.ha_admin_list_timetable_stages(text);
drop function if exists public.ha_create_timetable_stage(text, text, integer);
drop function if exists public.ha_update_timetable_stage(text, uuid, text, integer);
drop function if exists public.ha_get_timetable(text);

create or replace function public.ha_admin_list_timetable_stages(
  p_participant_access_code text
)
returns table (
  id uuid,
  name text,
  sort_order integer,
  color text
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
  select ts.id, ts.name, ts.sort_order, ts.color
  from public.timetable_stages ts
  order by ts.sort_order, ts.name;
end;
$$;

create or replace function public.ha_create_timetable_stage(
  p_participant_access_code text,
  p_name text,
  p_sort_order integer,
  p_color text default null
)
returns table (
  id uuid,
  name text,
  sort_order integer,
  color text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage_id uuid;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_sort_order integer := coalesce(p_sort_order, 0);
  v_color text := nullif(trim(coalesce(p_color, '')), '');
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

  if v_color is not null and v_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'stage color is invalid' using errcode = '22023';
  end if;

  insert into public.timetable_stages (name, sort_order, color)
  values (v_name, v_sort_order, v_color)
  returning timetable_stages.id into v_stage_id;

  return query
  select ts.id, ts.name, ts.sort_order, ts.color
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
  p_sort_order integer,
  p_color text default null
)
returns table (
  id uuid,
  name text,
  sort_order integer,
  color text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_sort_order integer := coalesce(p_sort_order, 0);
  v_color text := nullif(trim(coalesce(p_color, '')), '');
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

  if v_color is not null and v_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'stage color is invalid' using errcode = '22023';
  end if;

  update public.timetable_stages ts
  set
    name = v_name,
    sort_order = v_sort_order,
    color = v_color
  where ts.id = p_stage_id;

  if not found then
    raise exception 'stage not found' using errcode = 'P0002';
  end if;

  return query
  select ts.id, ts.name, ts.sort_order, ts.color
  from public.timetable_stages ts
  where ts.id = p_stage_id;
exception
  when unique_violation then
    raise exception 'stage name already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_get_timetable(
  p_participant_access_code text
)
returns table (
  festival_days jsonb,
  stages jsonb,
  acts jsonb,
  performances jsonb,
  favorite_performance_ids jsonb,
  performance_favorites jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);

  if v_participant_id is null then
    return;
  end if;

  return query
  select
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', fd.id,
            'date', fd.date,
            'label', fd.label,
            'sort_order', fd.sort_order
          )
          order by fd.sort_order, fd.date
        )
        from public.festival_days fd
      ),
      '[]'::jsonb
    ) as festival_days,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ts.id,
            'name', ts.name,
            'sort_order', ts.sort_order,
            'color', ts.color
          )
          order by ts.sort_order, ts.name
        )
        from public.timetable_stages ts
      ),
      '[]'::jsonb
    ) as stages,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ta.id,
            'name', ta.name,
            'description', ta.description
          )
          order by ta.name
        )
        from public.timetable_acts ta
      ),
      '[]'::jsonb
    ) as acts,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', tp.id,
            'festival_day_id', tp.festival_day_id,
            'stage_id', tp.stage_id,
            'act_id', tp.act_id,
            'starts_at', tp.starts_at,
            'ends_at', tp.ends_at
          )
          order by fd.sort_order, tp.starts_at, ts.sort_order
        )
        from public.timetable_performances tp
        join public.festival_days fd on fd.id = tp.festival_day_id
        join public.timetable_stages ts on ts.id = tp.stage_id
      ),
      '[]'::jsonb
    ) as performances,
    coalesce(
      (
        select jsonb_agg(ptf.performance_id order by tp.starts_at)
        from public.participant_timetable_favorites ptf
        join public.timetable_performances tp on tp.id = ptf.performance_id
        where ptf.participant_id = v_participant_id
      ),
      '[]'::jsonb
    ) as favorite_performance_ids,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'performance_id', grouped_favorites.performance_id,
            'participants', grouped_favorites.participants
          )
          order by grouped_favorites.starts_at
        )
        from (
          select
            tp.id as performance_id,
            tp.starts_at,
            jsonb_agg(
              jsonb_build_object(
                'participant_id', p.id,
                'display_name', p.display_name,
                'avatar_id', p.avatar_id
              )
              order by p.display_name
            ) as participants
          from public.participant_timetable_favorites ptf
          join public.timetable_performances tp on tp.id = ptf.performance_id
          join public.participants p on p.id = ptf.participant_id
          where p.is_active = true
          group by tp.id, tp.starts_at
        ) grouped_favorites
      ),
      '[]'::jsonb
    ) as performance_favorites;
end;
$$;

grant execute on function public.ha_admin_list_timetable_stages(text) to anon, authenticated;
grant execute on function public.ha_create_timetable_stage(text, text, integer, text) to anon, authenticated;
grant execute on function public.ha_update_timetable_stage(text, uuid, text, integer, text) to anon, authenticated;
grant execute on function public.ha_get_timetable(text) to anon, authenticated;
