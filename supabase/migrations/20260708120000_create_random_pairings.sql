-- Add festival-scoped random pairing actions with admin-managed drawings.

create table if not exists public.random_pairing_actions (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null,
  name text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  drawn_at timestamptz,
  created_by_participant_id text,
  constraint random_pairing_actions_status_check
    check (status in ('draft', 'drawn')),
  constraint random_pairing_actions_name_required
    check (btrim(name) <> '')
);

create table if not exists public.random_pairing_participants (
  action_id uuid not null references public.random_pairing_actions(id) on delete cascade,
  participant_id text not null,
  selected_at timestamptz not null default now(),
  primary key (action_id, participant_id)
);

create table if not exists public.random_pairing_assignments (
  action_id uuid not null references public.random_pairing_actions(id) on delete cascade,
  participant_id text not null,
  assigned_participant_id text not null,
  assigned_at timestamptz not null default now(),
  primary key (action_id, participant_id),
  constraint random_pairing_assignments_no_self
    check (participant_id <> assigned_participant_id)
);

alter table public.random_pairing_actions enable row level security;
alter table public.random_pairing_participants enable row level security;
alter table public.random_pairing_assignments enable row level security;

revoke all on table public.random_pairing_actions from anon, authenticated;
revoke all on table public.random_pairing_participants from anon, authenticated;
revoke all on table public.random_pairing_assignments from anon, authenticated;

create policy "deny direct random pairing action access"
  on public.random_pairing_actions
  for all
  using (false)
  with check (false);

create policy "deny direct random pairing participant access"
  on public.random_pairing_participants
  for all
  using (false)
  with check (false);

create policy "deny direct random pairing assignment access"
  on public.random_pairing_assignments
  for all
  using (false)
  with check (false);

create or replace function public.ha_admin_list_random_pairing_actions(
  p_participant_access_code text,
  p_festival_id text
)
returns table (
  id uuid,
  festival_id text,
  name text,
  status text,
  selected_participant_ids text[],
  assignments jsonb,
  created_at timestamptz,
  drawn_at timestamptz
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
    rpa.id,
    rpa.festival_id,
    rpa.name,
    rpa.status,
    coalesce(
      array_agg(distinct rpp.participant_id order by rpp.participant_id)
        filter (where rpp.participant_id is not null),
      array[]::text[]
    ) as selected_participant_ids,
    coalesce(
      jsonb_agg(
        distinct jsonb_build_object(
          'participant_id', rpas.participant_id,
          'participant_name', participant.display_name,
          'assigned_participant_id', rpas.assigned_participant_id,
          'assigned_participant_name', assigned.display_name
        )
      ) filter (where rpas.participant_id is not null),
      '[]'::jsonb
    ) as assignments,
    rpa.created_at,
    rpa.drawn_at
  from public.random_pairing_actions rpa
  left join public.random_pairing_participants rpp
    on rpp.action_id = rpa.id
  left join public.random_pairing_assignments rpas
    on rpas.action_id = rpa.id
  left join public.participants participant
    on participant.id = rpas.participant_id
  left join public.participants assigned
    on assigned.id = rpas.assigned_participant_id
  where rpa.festival_id = p_festival_id
  group by rpa.id, rpa.festival_id, rpa.name, rpa.status, rpa.created_at, rpa.drawn_at
  order by rpa.created_at desc, rpa.name asc;
end;
$$;

create or replace function public.ha_admin_create_random_pairing_action(
  p_participant_access_code text,
  p_festival_id text,
  p_name text
)
returns table (
  id uuid,
  festival_id text,
  name text,
  status text,
  selected_participant_ids text[],
  assignments jsonb,
  created_at timestamptz,
  drawn_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_participant_id text;
  v_action_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_festival_id is null or btrim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '22023';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'action name is required' using errcode = '22023';
  end if;

  v_admin_participant_id :=
    public.ha_participant_id_for_access(p_participant_access_code);

  insert into public.random_pairing_actions (
    festival_id,
    name,
    created_by_participant_id
  )
  values (
    p_festival_id,
    btrim(p_name),
    v_admin_participant_id
  )
  returning random_pairing_actions.id into v_action_id;

  return query
  select *
  from public.ha_admin_list_random_pairing_actions(
    p_participant_access_code,
    p_festival_id
  ) listed_actions
  where listed_actions.id = v_action_id;
end;
$$;

create or replace function public.ha_admin_set_random_pairing_participants(
  p_participant_access_code text,
  p_action_id uuid,
  p_participant_ids text[]
)
returns table (
  id uuid,
  festival_id text,
  name text,
  status text,
  selected_participant_ids text[],
  assignments jsonb,
  created_at timestamptz,
  drawn_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_festival_id text;
  v_status text;
  v_requested_count integer;
  v_active_count integer;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select rpa.festival_id, rpa.status
  into v_festival_id, v_status
  from public.random_pairing_actions rpa
  where rpa.id = p_action_id;

  if v_festival_id is null then
    raise exception 'random pairing action not found' using errcode = 'P0002';
  end if;

  if v_status = 'drawn' then
    raise exception 'drawn random pairing action cannot be changed' using errcode = '42501';
  end if;

  with requested as (
    select distinct btrim(requested_ids.participant_id) as participant_id
    from unnest(coalesce(p_participant_ids, array[]::text[]))
      as requested_ids(participant_id)
  ),
  valid_requested as (
    select requested.participant_id
    from requested
    where requested.participant_id <> ''
  )
  select count(*)
  into v_requested_count
  from valid_requested;

  with requested as (
    select distinct btrim(requested_ids.participant_id) as participant_id
    from unnest(coalesce(p_participant_ids, array[]::text[]))
      as requested_ids(participant_id)
  ),
  valid_requested as (
    select requested.participant_id
    from requested
    where requested.participant_id <> ''
  )
  select count(*)
  into v_active_count
  from valid_requested
  join public.participants p
    on p.id = valid_requested.participant_id
   and p.is_active = true;

  if v_requested_count <> v_active_count then
    raise exception 'selected participant is inactive or unknown' using errcode = '22023';
  end if;

  delete from public.random_pairing_participants rpp
  where rpp.action_id = p_action_id;

  insert into public.random_pairing_participants (action_id, participant_id)
  select p_action_id, valid_requested.participant_id
  from (
    select distinct btrim(requested_ids.participant_id) as participant_id
    from unnest(coalesce(p_participant_ids, array[]::text[]))
      as requested_ids(participant_id)
  ) valid_requested
  where valid_requested.participant_id <> '';

  return query
  select *
  from public.ha_admin_list_random_pairing_actions(
    p_participant_access_code,
    v_festival_id
  ) listed_actions
  where listed_actions.id = p_action_id;
end;
$$;

create or replace function public.ha_admin_draw_random_pairing_action(
  p_participant_access_code text,
  p_action_id uuid,
  p_replace_existing boolean default false
)
returns table (
  id uuid,
  festival_id text,
  name text,
  status text,
  selected_participant_ids text[],
  assignments jsonb,
  created_at timestamptz,
  drawn_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_festival_id text;
  v_status text;
  v_selected_count integer;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select rpa.festival_id, rpa.status
  into v_festival_id, v_status
  from public.random_pairing_actions rpa
  where rpa.id = p_action_id;

  if v_festival_id is null then
    raise exception 'random pairing action not found' using errcode = 'P0002';
  end if;

  if v_status = 'drawn' and p_replace_existing is not true then
    raise exception 'random pairing action is already drawn' using errcode = '42501';
  end if;

  select count(*)
  into v_selected_count
  from public.random_pairing_participants rpp
  join public.participants p
    on p.id = rpp.participant_id
   and p.is_active = true
  where rpp.action_id = p_action_id;

  if v_selected_count < 2 then
    raise exception 'at least two participants are required' using errcode = '22023';
  end if;

  delete from public.random_pairing_assignments rpas
  where rpas.action_id = p_action_id;

  insert into public.random_pairing_assignments (
    action_id,
    participant_id,
    assigned_participant_id,
    assigned_at
  )
  with shuffled as (
    select
      rpp.participant_id,
      row_number() over (order by random()) as position,
      count(*) over () as total_count
    from public.random_pairing_participants rpp
    join public.participants p
      on p.id = rpp.participant_id
     and p.is_active = true
    where rpp.action_id = p_action_id
  ),
  paired as (
    select
      current_participant.participant_id,
      next_participant.participant_id as assigned_participant_id
    from shuffled current_participant
    join shuffled next_participant
      on next_participant.position =
        case
          when current_participant.position = current_participant.total_count then 1
          else current_participant.position + 1
        end
  )
  select
    p_action_id,
    paired.participant_id,
    paired.assigned_participant_id,
    now()
  from paired;

  update public.random_pairing_actions rpa
  set status = 'drawn',
      drawn_at = now()
  where rpa.id = p_action_id;

  return query
  select *
  from public.ha_admin_list_random_pairing_actions(
    p_participant_access_code,
    v_festival_id
  ) listed_actions
  where listed_actions.id = p_action_id;
end;
$$;

create or replace function public.ha_list_random_pairing_assignments(
  p_participant_access_code text,
  p_festival_id text
)
returns table (
  action_id uuid,
  action_name text,
  assigned_participant_id text,
  assigned_participant_name text,
  drawn_at timestamptz
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
    rpa.id as action_id,
    rpa.name as action_name,
    rpas.assigned_participant_id,
    assigned.display_name as assigned_participant_name,
    rpa.drawn_at
  from public.random_pairing_assignments rpas
  join public.random_pairing_actions rpa
    on rpa.id = rpas.action_id
  join public.participants assigned
    on assigned.id = rpas.assigned_participant_id
  where rpa.festival_id = p_festival_id
    and rpa.status = 'drawn'
    and rpas.participant_id = v_participant_id
  order by rpa.drawn_at desc, rpa.name asc;
end;
$$;

grant execute on function public.ha_admin_list_random_pairing_actions(text, text)
  to anon, authenticated;
grant execute on function public.ha_admin_create_random_pairing_action(text, text, text)
  to anon, authenticated;
grant execute on function public.ha_admin_set_random_pairing_participants(text, uuid, text[])
  to anon, authenticated;
grant execute on function public.ha_admin_draw_random_pairing_action(text, uuid, boolean)
  to anon, authenticated;
grant execute on function public.ha_list_random_pairing_assignments(text, text)
  to anon, authenticated;
