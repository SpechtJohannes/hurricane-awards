-- Align tournament creation RPC signature with the client-side p_mode argument.

drop function if exists public.ha_admin_create_tournament(text, text, text[]);
drop function if exists public.ha_admin_create_tournament(text, text, text, text[]);
drop function if exists public.ha_admin_create_tournament(text, text, text, text, text[]);

create or replace function public.ha_admin_create_tournament(
  p_participant_access_code text,
  p_festival_id text,
  p_mode text,
  p_name text,
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
  v_admin_participant_id text;
  v_tournament_id uuid;
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

  if p_festival_id is null or btrim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '22023';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'tournament name is required' using errcode = '22023';
  end if;

  if p_mode not in ('knockout', 'qualification_knockout') then
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
    when p_mode = 'knockout' then
      public.ha_generate_tournament_bracket(v_draw_participant_ids)
    else
      jsonb_build_object(
        'type', 'single_elimination',
        'mainParticipantCount', v_field_size,
        'rounds', '[]'::jsonb
      )
  end;

  v_admin_participant_id :=
    public.ha_participant_id_for_access(p_participant_access_code);

  insert into public.tournaments (
    festival_id,
    name,
    mode,
    status,
    selected_participant_ids,
    draw_participant_ids,
    qualification_ranking_ids,
    bracket,
    created_by_participant_id
  )
  values (
    p_festival_id,
    btrim(p_name),
    p_mode,
    'active',
    v_participant_ids,
    v_draw_participant_ids,
    array[]::text[],
    v_bracket,
    v_admin_participant_id
  )
  returning tournaments.id into v_tournament_id;

  return query
  select *
  from public.ha_admin_list_tournaments(
    p_participant_access_code,
    p_festival_id
  ) listed_tournaments
  where listed_tournaments.id = v_tournament_id;
end;
$$;

grant execute on function public.ha_admin_create_tournament(text, text, text, text, text[])
  to anon, authenticated;

notify pgrst, 'reload schema';
