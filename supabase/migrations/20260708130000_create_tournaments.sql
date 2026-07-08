-- Add festival-scoped single-elimination tournaments.

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null,
  name text not null,
  mode text not null default 'knockout',
  status text not null default 'active',
  selected_participant_ids text[] not null default array[]::text[],
  draw_participant_ids text[] not null default array[]::text[],
  qualification_ranking_ids text[] not null default array[]::text[],
  bracket jsonb not null default '{"type":"single_elimination","rounds":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_participant_id text,
  constraint tournaments_status_check
    check (status in ('draft', 'active')),
  constraint tournaments_mode_check
    check (mode in ('knockout', 'qualification_knockout')),
  constraint tournaments_name_required
    check (btrim(name) <> ''),
  constraint tournaments_bracket_object
    check (jsonb_typeof(bracket) = 'object')
);

alter table public.tournaments enable row level security;

revoke all on table public.tournaments from anon, authenticated;

create policy "deny direct tournament access"
  on public.tournaments
  for all
  using (false)
  with check (false);

create or replace function public.ha_generate_tournament_bracket(
  p_participant_ids text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_count integer;
  v_main_participant_count integer := 1;
  v_round integer := 1;
  v_match_position integer;
  v_match_count integer;
  v_bye_count integer;
  v_first_round_participant_count integer;
  v_match_id text;
  v_slot_a_participant_id text;
  v_slot_b_participant_id text;
  v_participant_a public.participants%rowtype;
  v_participant_b public.participants%rowtype;
  v_bye_participant public.participants%rowtype;
  v_bye_participant_json jsonb;
  v_byes jsonb := '[]'::jsonb;
  v_round_matches jsonb;
  v_rounds jsonb := '[]'::jsonb;
  v_current_entries jsonb[] := array[]::jsonb[];
  v_next_entries jsonb[] := array[]::jsonb[];
begin
  select count(*)
  into v_participant_count
  from unnest(coalesce(p_participant_ids, array[]::text[])) selected_ids(participant_id);

  if v_participant_count < 2 then
    return '{"type":"single_elimination","mainParticipantCount":0,"rounds":[]}'::jsonb;
  end if;

  while v_main_participant_count < v_participant_count loop
    v_main_participant_count := v_main_participant_count * 2;
  end loop;

  v_bye_count := v_main_participant_count - v_participant_count;
  v_first_round_participant_count := v_participant_count - v_bye_count;
  v_match_count := v_first_round_participant_count / 2;
  v_round_matches := '[]'::jsonb;
  v_current_entries := array[]::jsonb[];

  for v_match_position in 1..v_match_count loop
    v_match_id := 'r' || v_round::text || '-m' || v_match_position::text;
    v_slot_a_participant_id :=
      p_participant_ids[((v_match_position - 1) * 2) + 1];
    v_slot_b_participant_id :=
      p_participant_ids[((v_match_position - 1) * 2) + 2];

    select *
    into v_participant_a
    from public.participants p
    where p.id = v_slot_a_participant_id;

    select *
    into v_participant_b
    from public.participants p
    where p.id = v_slot_b_participant_id;

    v_round_matches := v_round_matches || jsonb_build_object(
      'id', v_match_id,
      'round', v_round,
      'position', v_match_position,
      'status', 'scheduled',
      'participantA', jsonb_build_object(
        'participant', jsonb_build_object(
          'type', 'participant',
          'participantId', v_slot_a_participant_id,
          'participantName', v_participant_a.display_name
        )
      ),
      'participantB', jsonb_build_object(
        'participant', jsonb_build_object(
          'type', 'participant',
          'participantId', v_slot_b_participant_id,
          'participantName', v_participant_b.display_name
        )
      ),
      'winnerParticipantId', null
    );
    v_current_entries := array_append(
      v_current_entries,
      jsonb_build_object('participant', null, 'sourceMatchId', v_match_id)
    );
  end loop;

  if v_bye_count > 0 then
    for v_match_position in 1..v_bye_count loop
      v_slot_a_participant_id :=
        p_participant_ids[v_first_round_participant_count + v_match_position];

      select *
      into v_bye_participant
      from public.participants p
      where p.id = v_slot_a_participant_id;

      v_bye_participant_json := jsonb_build_object(
        'type', 'participant',
        'participantId', v_slot_a_participant_id,
        'participantName', v_bye_participant.display_name
      );

      v_byes := v_byes || v_bye_participant_json;
      v_current_entries := array_append(
        v_current_entries,
        jsonb_build_object('participant', v_bye_participant_json)
      );
    end loop;
  end loop;

  v_rounds := v_rounds || jsonb_build_object(
    'round', v_round,
    'type', 'main',
    'matches', v_round_matches,
    'byes', v_byes
  );
  v_round := v_round + 1;

  while array_length(v_current_entries, 1) > 1 loop
    v_match_count := array_length(v_current_entries, 1) / 2;
    v_next_entries := array[]::jsonb[];
    v_round_matches := '[]'::jsonb;

    for v_match_position in 1..v_match_count loop
      v_match_id := 'r' || v_round::text || '-m' || v_match_position::text;
      v_round_matches := v_round_matches || jsonb_build_object(
        'id', v_match_id,
        'round', v_round,
        'position', v_match_position,
        'status', 'scheduled',
        'participantA', v_current_entries[((v_match_position - 1) * 2) + 1],
        'participantB', v_current_entries[((v_match_position - 1) * 2) + 2],
        'winnerParticipantId', null
      );
      v_next_entries := array_append(
        v_next_entries,
        jsonb_build_object('participant', null, 'sourceMatchId', v_match_id)
      );
    end loop;

    v_rounds := v_rounds || jsonb_build_object(
      'round', v_round,
      'type', 'main',
      'matches', v_round_matches
    );
    v_current_entries := v_next_entries;
    v_round := v_round + 1;
  end loop;

  return jsonb_build_object(
    'type', 'single_elimination',
    'mainParticipantCount', v_main_participant_count,
    'rounds', v_rounds
  );
end;
$$;

revoke all on function public.ha_generate_tournament_bracket(text[]) from public;

create or replace function public.ha_seed_tournament_participants(
  p_participant_ids text[]
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_field_size integer := 1;
  v_seed_order integer[] := array[1, 2];
  v_next_seed_order integer[];
  v_seed integer;
  v_seeded_participant_ids text[] := array[]::text[];
begin
  v_count := array_length(coalesce(p_participant_ids, array[]::text[]), 1);

  if coalesce(v_count, 0) < 2 then
    return array[]::text[];
  end if;

  while v_field_size * 2 <= v_count loop
    v_field_size := v_field_size * 2;
  end loop;

  while array_length(v_seed_order, 1) < v_field_size loop
    v_next_seed_order := array[]::integer[];

    foreach v_seed in array v_seed_order loop
      v_next_seed_order := array_append(v_next_seed_order, v_seed);
      v_next_seed_order := array_append(
        v_next_seed_order,
        array_length(v_seed_order, 1) * 2 + 1 - v_seed
      );
    end loop;

    v_seed_order := v_next_seed_order;
  end loop;

  foreach v_seed in array v_seed_order loop
    v_seeded_participant_ids :=
      array_append(v_seeded_participant_ids, p_participant_ids[v_seed]);
  end loop;

  return v_seeded_participant_ids;
end;
$$;

revoke all on function public.ha_seed_tournament_participants(text[]) from public;

create or replace function public.ha_admin_list_tournaments(
  p_participant_access_code text,
  p_festival_id text
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
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_festival_id is null or btrim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '22023';
  end if;

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
  where t.festival_id = p_festival_id
  order by t.created_at desc, t.name asc;
end;
$$;

create or replace function public.ha_admin_create_tournament(
  p_participant_access_code text,
  p_festival_id text,
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
  select *
  from public.ha_admin_list_tournaments(
    p_participant_access_code,
    v_festival_id
  ) listed_tournaments
  where listed_tournaments.id = p_tournament_id;
end;
$$;

create or replace function public.ha_admin_delete_tournament(
  p_participant_access_code text,
  p_tournament_id uuid
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

  delete from public.tournaments t
  where t.id = p_tournament_id;

  if not found then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.ha_admin_set_tournament_qualification_ranking(
  p_participant_access_code text,
  p_tournament_id uuid,
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
  v_mode text;
  v_selected_participant_ids text[];
  v_ranking_participant_ids text[];
  v_requested_count integer;
  v_selected_count integer;
  v_matching_count integer;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select t.festival_id, t.mode, t.selected_participant_ids
  into v_festival_id, v_mode, v_selected_participant_ids
  from public.tournaments t
  where t.id = p_tournament_id;

  if v_festival_id is null then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;

  if v_mode <> 'qualification_knockout' then
    raise exception 'qualification ranking is only allowed for qualification tournaments' using errcode = '22023';
  end if;

  select array_agg(valid_requested.participant_id order by valid_requested.position)
  into v_ranking_participant_ids
  from (
    select distinct on (btrim(requested_ids.participant_id))
      btrim(requested_ids.participant_id) as participant_id,
      requested_ids.position
    from unnest(coalesce(p_participant_ids, array[]::text[]))
      with ordinality as requested_ids(participant_id, position)
    where btrim(requested_ids.participant_id) <> ''
    order by btrim(requested_ids.participant_id), requested_ids.position
  ) valid_requested;

  v_ranking_participant_ids := coalesce(v_ranking_participant_ids, array[]::text[]);
  v_requested_count := array_length(v_ranking_participant_ids, 1);
  v_selected_count := array_length(v_selected_participant_ids, 1);

  if v_requested_count <> v_selected_count then
    raise exception 'qualification ranking must include every selected participant exactly once' using errcode = '22023';
  end if;

  select count(*)
  into v_matching_count
  from unnest(v_ranking_participant_ids) ranked(participant_id)
  where ranked.participant_id = any(v_selected_participant_ids);

  if v_matching_count <> v_selected_count then
    raise exception 'qualification ranking contains unknown participant' using errcode = '22023';
  end if;

  update public.tournaments t
  set qualification_ranking_ids = v_ranking_participant_ids,
      bracket = public.ha_generate_tournament_bracket(
        public.ha_seed_tournament_participants(v_ranking_participant_ids)
      ),
      updated_at = now()
  where t.id = p_tournament_id;

  return query
  select *
  from public.ha_admin_list_tournaments(
    p_participant_access_code,
    v_festival_id
  ) listed_tournaments
  where listed_tournaments.id = p_tournament_id;
end;
$$;

create or replace function public.ha_list_tournaments(
  p_participant_access_code text,
  p_festival_id text
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
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    return;
  end if;

  if p_festival_id is null or btrim(p_festival_id) = '' then
    return;
  end if;

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
  where t.festival_id = p_festival_id
    and t.status = 'active'
  order by t.created_at desc, t.name asc;
end;
$$;

grant execute on function public.ha_admin_list_tournaments(text, text)
  to anon, authenticated;
grant execute on function public.ha_admin_create_tournament(text, text, text, text, text[])
  to anon, authenticated;
grant execute on function public.ha_admin_update_tournament(text, uuid, text, text, text[])
  to anon, authenticated;
grant execute on function public.ha_admin_delete_tournament(text, uuid)
  to anon, authenticated;
grant execute on function public.ha_admin_set_tournament_qualification_ranking(text, uuid, text[])
  to anon, authenticated;
grant execute on function public.ha_list_tournaments(text, text)
  to anon, authenticated;
