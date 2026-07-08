-- Return tournament update rows explicitly to avoid depending on older list RPC shapes.

create or replace function public.ha_admin_update_tournament(
  p_participant_access_code text,
  p_tournament_id uuid,
  p_name text,
  p_mode text,
  p_participant_ids text[]
)
returns table (
  id uuid,
  festival_id text,
  name text,
  mode text,
  status text,
  selected_participant_ids text[],
  draw_participant_ids text[],
  qualification_ranking_ids text[],
  bracket jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_festival_id text;
  v_participant_ids text[];
  v_draw_participant_ids text[];
  v_bracket jsonb;
  v_requested_count integer;
  v_active_count integer;
  v_field_size integer := 1;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select t.festival_id
  into v_festival_id
  from public.tournaments t
  where t.id = p_tournament_id;

  if v_festival_id is null then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'tournament name is required' using errcode = '22023';
  end if;

  if p_mode not in ('ko', 'knockout', 'qualification_knockout') then
    raise exception 'invalid tournament mode' using errcode = '22023';
  end if;

  select array_agg(valid_requested.participant_id order by valid_requested.position)
  into v_participant_ids
  from (
    select distinct on (btrim(requested_ids.participant_id))
      btrim(requested_ids.participant_id) as participant_id,
      requested_ids.position
    from unnest(coalesce(p_participant_ids, array[]::text[]))
      with ordinality as requested_ids(participant_id, position)
    where btrim(requested_ids.participant_id) <> ''
    order by btrim(requested_ids.participant_id), requested_ids.position
  ) valid_requested;

  v_participant_ids := coalesce(v_participant_ids, array[]::text[]);
  v_requested_count := array_length(v_participant_ids, 1);

  if coalesce(v_requested_count, 0) < 2 then
    raise exception 'at least two participants are required' using errcode = '22023';
  end if;

  select count(*)
  into v_active_count
  from unnest(v_participant_ids) selected_ids(participant_id)
  join public.participants p
    on p.id = selected_ids.participant_id
   and p.is_active = true;

  if v_requested_count <> v_active_count then
    raise exception 'selected participant is inactive or unknown' using errcode = '22023';
  end if;

  while v_field_size * 2 <= v_requested_count loop
    v_field_size := v_field_size * 2;
  end loop;

  select array_agg(draw.participant_id order by random())
  into v_draw_participant_ids
  from unnest(v_participant_ids) draw(participant_id);

  v_bracket := case
    when p_mode in ('ko', 'knockout') then
      public.ha_generate_tournament_bracket(v_draw_participant_ids)
    else
      jsonb_build_object(
        'type', 'single_elimination',
        'mainParticipantCount', v_field_size,
        'rounds', '[]'::jsonb
      )
  end;

  update public.tournaments t
  set name = btrim(p_name),
      mode = p_mode,
      selected_participant_ids = v_participant_ids,
      draw_participant_ids = v_draw_participant_ids,
      qualification_ranking_ids = array[]::text[],
      bracket = v_bracket,
      updated_at = now()
  where t.id = p_tournament_id;

  return query
  select
    t.id,
    t.festival_id,
    t.name,
    t.mode,
    t.status,
    t.selected_participant_ids,
    t.draw_participant_ids,
    t.qualification_ranking_ids,
    t.bracket,
    t.created_at,
    t.updated_at
  from public.tournaments t
  where t.id = p_tournament_id;
end;
$$;

grant execute on function public.ha_admin_update_tournament(text, uuid, text, text, text[])
  to anon, authenticated;

notify pgrst, 'reload schema';
