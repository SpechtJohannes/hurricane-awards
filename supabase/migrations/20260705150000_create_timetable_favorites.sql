-- Add participant-specific favorites for timetable performances.

create table if not exists public.participant_timetable_favorites (
  participant_id text not null references public.participants(id) on delete cascade,
  performance_id uuid not null references public.timetable_performances(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (participant_id, performance_id)
);

create index if not exists participant_timetable_favorites_performance_idx
  on public.participant_timetable_favorites (performance_id);

alter table public.participant_timetable_favorites enable row level security;

revoke all on table public.participant_timetable_favorites from anon, authenticated;

create policy "deny direct timetable favorite access"
  on public.participant_timetable_favorites
  for all
  using (false)
  with check (false);

drop function if exists public.ha_get_timetable(text);

create or replace function public.ha_get_timetable(
  p_participant_access_code text
)
returns table (
  festival_days jsonb,
  stages jsonb,
  acts jsonb,
  performances jsonb,
  favorite_performance_ids jsonb
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
            'sort_order', ts.sort_order
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
    ) as favorite_performance_ids;
end;
$$;

create or replace function public.ha_add_timetable_favorite(
  p_participant_access_code text,
  p_performance_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);

  if v_participant_id is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.timetable_performances tp
    where tp.id = p_performance_id
  ) then
    raise exception 'timetable performance not found' using errcode = 'P0002';
  end if;

  insert into public.participant_timetable_favorites (
    participant_id,
    performance_id
  )
  values (
    v_participant_id,
    p_performance_id
  )
  on conflict (participant_id, performance_id) do nothing;
end;
$$;

create or replace function public.ha_remove_timetable_favorite(
  p_participant_access_code text,
  p_performance_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);

  if v_participant_id is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  delete from public.participant_timetable_favorites ptf
  where ptf.participant_id = v_participant_id
    and ptf.performance_id = p_performance_id;
end;
$$;

grant execute on function public.ha_get_timetable(text) to anon, authenticated;
grant execute on function public.ha_add_timetable_favorite(text, uuid) to anon, authenticated;
grant execute on function public.ha_remove_timetable_favorite(text, uuid) to anon, authenticated;
