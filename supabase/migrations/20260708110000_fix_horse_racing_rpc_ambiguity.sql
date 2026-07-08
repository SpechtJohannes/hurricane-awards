-- Remove ambiguous PL/pgSQL references from Horse Racing RPCs.

create or replace function public.ha_get_horse_racing_state(
  p_participant_access_code text,
  p_festival_id text
)
returns table (
  festival_id text,
  is_enabled boolean,
  betting_status text,
  suit text,
  updated_at timestamptz
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
    coalesce(hrs.festival_id, requested.requested_festival_id) as festival_id,
    coalesce(hrs.is_enabled, false) as is_enabled,
    coalesce(hrs.betting_status, 'closed') as betting_status,
    hrb.suit,
    coalesce(hrs.updated_at, hrb.updated_at) as updated_at
  from (select p_festival_id as requested_festival_id) requested
  left join public.horse_racing_settings hrs
    on hrs.festival_id = requested.requested_festival_id
  left join public.horse_racing_bets hrb
    on hrb.festival_id = requested.requested_festival_id
   and hrb.participant_id = v_participant_id
  where p_festival_id is not null
    and btrim(p_festival_id) <> '';
end;
$$;

create or replace function public.ha_place_horse_racing_bet(
  p_participant_access_code text,
  p_festival_id text,
  p_suit text
)
returns table (
  festival_id text,
  is_enabled boolean,
  betting_status text,
  suit text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
  v_is_enabled boolean;
  v_betting_status text;
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);

  if v_participant_id is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  if p_festival_id is null or btrim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '22023';
  end if;

  if p_suit not in ('hearts', 'diamonds', 'spades', 'clubs') then
    raise exception 'invalid horse racing suit' using errcode = '22023';
  end if;

  select hrs.is_enabled, hrs.betting_status
  into v_is_enabled, v_betting_status
  from public.horse_racing_settings hrs
  where hrs.festival_id = p_festival_id;

  if coalesce(v_is_enabled, false) is not true then
    raise exception 'horse racing is disabled' using errcode = '42501';
  end if;

  if v_betting_status <> 'open' then
    raise exception 'horse racing betting is closed' using errcode = '42501';
  end if;

  insert into public.horse_racing_bets (
    festival_id,
    participant_id,
    suit,
    placed_at,
    updated_at
  )
  values (
    p_festival_id,
    v_participant_id,
    p_suit,
    now(),
    now()
  )
  on conflict on constraint horse_racing_bets_unique_participant_festival
  do update
    set suit = excluded.suit,
        updated_at = now();

  return query
  select *
  from public.ha_get_horse_racing_state(
    p_participant_access_code,
    p_festival_id
  );
end;
$$;

create or replace function public.ha_admin_get_horse_racing_state(
  p_participant_access_code text,
  p_festival_id text
)
returns table (
  festival_id text,
  is_enabled boolean,
  betting_status text,
  bet_count integer,
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

  return query
  select
    coalesce(hrs.festival_id, requested.requested_festival_id) as festival_id,
    coalesce(hrs.is_enabled, false) as is_enabled,
    coalesce(hrs.betting_status, 'closed') as betting_status,
    count(hrb.id)::integer as bet_count,
    hrs.updated_at
  from (select p_festival_id as requested_festival_id) requested
  left join public.horse_racing_settings hrs
    on hrs.festival_id = requested.requested_festival_id
  left join public.horse_racing_bets hrb
    on hrb.festival_id = requested.requested_festival_id
  where p_festival_id is not null
    and btrim(p_festival_id) <> ''
  group by
    requested.requested_festival_id,
    hrs.festival_id,
    hrs.is_enabled,
    hrs.betting_status,
    hrs.updated_at;
end;
$$;

create or replace function public.ha_admin_set_horse_racing_state(
  p_participant_access_code text,
  p_festival_id text,
  p_is_enabled boolean,
  p_betting_status text
)
returns table (
  festival_id text,
  is_enabled boolean,
  betting_status text,
  bet_count integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_participant_id text;
  v_is_enabled boolean;
  v_betting_status text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_festival_id is null or btrim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '22023';
  end if;

  if p_betting_status not in ('open', 'closed') then
    raise exception 'invalid betting status' using errcode = '22023';
  end if;

  v_admin_participant_id :=
    public.ha_participant_id_for_access(p_participant_access_code);
  v_is_enabled := coalesce(p_is_enabled, false);
  v_betting_status := case
    when v_is_enabled then p_betting_status
    else 'closed'
  end;

  insert into public.horse_racing_settings (
    festival_id,
    is_enabled,
    betting_status,
    updated_at,
    updated_by_participant_id
  )
  values (
    p_festival_id,
    v_is_enabled,
    v_betting_status,
    now(),
    v_admin_participant_id
  )
  on conflict on constraint horse_racing_settings_pkey
  do update
    set is_enabled = excluded.is_enabled,
        betting_status = excluded.betting_status,
        updated_at = excluded.updated_at,
        updated_by_participant_id = excluded.updated_by_participant_id;

  return query
  select *
  from public.ha_admin_get_horse_racing_state(
    p_participant_access_code,
    p_festival_id
  );
end;
$$;

create or replace function public.ha_admin_list_horse_racing_bets(
  p_participant_access_code text,
  p_festival_id text
)
returns table (
  participant_id text,
  participant_name text,
  suit text,
  placed_at timestamptz,
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

  return query
  select
    hrb.participant_id,
    p.display_name as participant_name,
    hrb.suit,
    hrb.placed_at,
    hrb.updated_at
  from public.horse_racing_bets hrb
  left join public.participants p on p.id = hrb.participant_id
  where hrb.festival_id = p_festival_id
  order by hrb.updated_at desc, p.display_name asc;
end;
$$;

grant execute on function public.ha_get_horse_racing_state(text, text)
  to anon, authenticated;
grant execute on function public.ha_place_horse_racing_bet(text, text, text)
  to anon, authenticated;
grant execute on function public.ha_admin_get_horse_racing_state(text, text)
  to anon, authenticated;
grant execute on function public.ha_admin_set_horse_racing_state(text, text, boolean, text)
  to anon, authenticated;
grant execute on function public.ha_admin_list_horse_racing_bets(text, text)
  to anon, authenticated;
