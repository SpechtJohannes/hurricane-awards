-- Expose compact participant details for shared timetable favorites.

drop function if exists public.ha_get_timetable(text);

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

grant execute on function public.ha_get_timetable(text) to anon, authenticated;
