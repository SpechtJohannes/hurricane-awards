-- Let admins set a match winner and atomically reconcile every dependent round.

create or replace function public.ha_admin_set_tournament_match_winner(
  p_participant_access_code text,
  p_tournament_id uuid,
  p_match_id text,
  p_winner_participant_id text
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
  v_bracket jsonb;
  v_round_index integer;
  v_match_index integer;
  v_match jsonb;
  v_match_id text;
  v_slot_a_id text;
  v_slot_b_id text;
  v_winner_id text;
  v_source_id text;
  v_winners jsonb := '{}'::jsonb;
  v_target_found boolean := false;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_match_id is null or btrim(p_match_id) = ''
     or p_winner_participant_id is null
     or btrim(p_winner_participant_id) = '' then
    raise exception 'match and winner are required' using errcode = '22023';
  end if;

  select t.bracket
  into v_bracket
  from public.tournaments t
  where t.id = p_tournament_id
  for update;

  if v_bracket is null then
    raise exception 'tournament not found' using errcode = 'P0002';
  end if;

  if jsonb_array_length(v_bracket->'rounds') = 0 then
    raise exception 'match not found' using errcode = 'P0002';
  end if;

  for v_round_index in 0..jsonb_array_length(v_bracket->'rounds') - 1 loop
    if jsonb_array_length(
      v_bracket->'rounds'->v_round_index->'matches'
    ) = 0 then
      continue;
    end if;

    for v_match_index in 0..jsonb_array_length(
      v_bracket->'rounds'->v_round_index->'matches'
    ) - 1 loop
      v_match := v_bracket->'rounds'->v_round_index->'matches'->v_match_index;
      v_match_id := v_match->>'id';

      v_slot_a_id := v_match->'participantA'->'participant'->>'participantId';
      if v_slot_a_id is null then
        v_source_id := v_match->'participantA'->>'sourceMatchId';
        v_slot_a_id := v_winners->>v_source_id;
      end if;

      v_slot_b_id := v_match->'participantB'->'participant'->>'participantId';
      if v_slot_b_id is null then
        v_source_id := v_match->'participantB'->>'sourceMatchId';
        v_slot_b_id := v_winners->>v_source_id;
      end if;

      v_winner_id := v_match->>'winnerParticipantId';

      if v_match_id = p_match_id then
        v_target_found := true;
        if p_winner_participant_id is distinct from v_slot_a_id
           and p_winner_participant_id is distinct from v_slot_b_id then
          raise exception 'winner must participate in the match'
            using errcode = '22023';
        end if;
        v_winner_id := p_winner_participant_id;
      elsif v_winner_id is not null
            and v_winner_id is distinct from v_slot_a_id
            and v_winner_id is distinct from v_slot_b_id then
        v_winner_id := null;
      end if;

      v_bracket := jsonb_set(
        v_bracket,
        array['rounds', v_round_index::text, 'matches', v_match_index::text,
          'winnerParticipantId'],
        coalesce(to_jsonb(v_winner_id), 'null'::jsonb)
      );
      v_bracket := jsonb_set(
        v_bracket,
        array['rounds', v_round_index::text, 'matches', v_match_index::text,
          'status'],
        to_jsonb(case when v_winner_id is null then 'scheduled' else 'completed' end)
      );

      if v_winner_id is not null then
        v_winners := v_winners || jsonb_build_object(v_match_id, v_winner_id);
      end if;
    end loop;
  end loop;

  if not v_target_found then
    raise exception 'match not found' using errcode = 'P0002';
  end if;

  update public.tournaments t
  set bracket = v_bracket,
      updated_at = now()
  where t.id = p_tournament_id;

  return query
  select t.id, t.festival_id, t.name, t.mode, t.status,
    t.selected_participant_ids, t.draw_participant_ids,
    t.qualification_ranking_ids, t.bracket, t.created_at, t.updated_at
  from public.tournaments t
  where t.id = p_tournament_id;
end;
$$;

revoke all on function public.ha_admin_set_tournament_match_winner(
  text, uuid, text, text
) from public;
grant execute on function public.ha_admin_set_tournament_match_winner(
  text, uuid, text, text
) to anon, authenticated;
