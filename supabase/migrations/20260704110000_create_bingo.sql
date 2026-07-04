-- Add a single active Bingo round with server-generated cards and persisted marks.

create table if not exists public.bingo_rounds (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  created_by_participant_id text,
  constraint bingo_rounds_status_check check (status in ('active', 'closed'))
);

create unique index if not exists bingo_rounds_single_active
  on public.bingo_rounds ((status))
  where status = 'active';

create or replace function public.ha_bingo_numbers_are_valid(
  p_numbers integer[]
)
returns boolean
language sql
immutable
as $$
  select
    cardinality(p_numbers) = 25
    and not exists (
      select 1
      from unnest(p_numbers) number
      where number < 1 or number > 75
    )
    and (
      select count(distinct number)
      from unnest(p_numbers) number
    ) = 25;
$$;

create table if not exists public.bingo_cards (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.bingo_rounds(id) on delete cascade,
  participant_id text not null,
  numbers integer[] not null,
  created_at timestamptz not null default now(),
  constraint bingo_cards_round_participant_unique unique (round_id, participant_id),
  constraint bingo_cards_numbers_valid check (public.ha_bingo_numbers_are_valid(numbers))
);

create table if not exists public.bingo_marks (
  card_id uuid not null references public.bingo_cards(id) on delete cascade,
  number integer not null,
  marked_at timestamptz not null default now(),
  primary key (card_id, number),
  constraint bingo_marks_number_range check (number between 1 and 75)
);

alter table public.bingo_rounds enable row level security;
alter table public.bingo_cards enable row level security;
alter table public.bingo_marks enable row level security;

revoke all on table public.bingo_rounds from anon, authenticated;
revoke all on table public.bingo_cards from anon, authenticated;
revoke all on table public.bingo_marks from anon, authenticated;

create policy "deny direct bingo round access"
  on public.bingo_rounds
  for all
  using (false)
  with check (false);

create policy "deny direct bingo card access"
  on public.bingo_cards
  for all
  using (false)
  with check (false);

create policy "deny direct bingo mark access"
  on public.bingo_marks
  for all
  using (false)
  with check (false);

create or replace function public.ha_generate_bingo_card_numbers()
returns integer[]
language sql
volatile
security definer
set search_path = public
as $$
  select array_agg(number order by position)
  from (
    select number, row_number() over () as position
    from (
      select number
      from generate_series(1, 75) number
      order by random()
      limit 25
    ) picked_numbers
  ) ordered_numbers;
$$;

create or replace function public.ha_get_active_bingo_round(
  p_participant_access_code text
)
returns table (
  id uuid,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    return;
  end if;

  return query
  select br.id, br.started_at
  from public.bingo_rounds br
  where br.status = 'active'
  order by br.started_at desc
  limit 1;
end;
$$;

create or replace function public.ha_admin_get_bingo_round(
  p_participant_access_code text
)
returns table (
  id uuid,
  started_at timestamptz
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
  select br.id, br.started_at
  from public.bingo_rounds br
  where br.status = 'active'
  order by br.started_at desc
  limit 1;
end;
$$;

create or replace function public.ha_start_bingo_round(
  p_participant_access_code text
)
returns table (
  id uuid,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_participant_id text;
  v_round_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_admin_participant_id :=
    public.ha_participant_id_for_access(p_participant_access_code);

  update public.bingo_rounds br
  set status = 'closed'
  where br.status = 'active';

  insert into public.bingo_rounds (created_by_participant_id)
  values (v_admin_participant_id)
  returning bingo_rounds.id into v_round_id;

  return query
  select br.id, br.started_at
  from public.bingo_rounds br
  where br.id = v_round_id;
end;
$$;

create or replace function public.ha_close_bingo_round(
  p_participant_access_code text
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

  update public.bingo_rounds br
  set status = 'closed'
  where br.status = 'active';
end;
$$;

create or replace function public.ha_get_or_create_bingo_card(
  p_participant_access_code text
)
returns table (
  id uuid,
  started_at timestamptz,
  card_id uuid,
  numbers integer[],
  marked_numbers integer[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
  v_round_id uuid;
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);

  if v_participant_id is null then
    return;
  end if;

  select br.id
  into v_round_id
  from public.bingo_rounds br
  where br.status = 'active'
  order by br.started_at desc
  limit 1;

  if v_round_id is null then
    return;
  end if;

  insert into public.bingo_cards (round_id, participant_id, numbers)
  values (
    v_round_id,
    v_participant_id,
    public.ha_generate_bingo_card_numbers()
  )
  on conflict on constraint bingo_cards_round_participant_unique do nothing;

  return query
  select
    br.id,
    br.started_at,
    bc.id as card_id,
    bc.numbers,
    coalesce(
      array_agg(bm.number order by bm.number) filter (where bm.number is not null),
      array[]::integer[]
    ) as marked_numbers
  from public.bingo_rounds br
  join public.bingo_cards bc on bc.round_id = br.id
  left join public.bingo_marks bm on bm.card_id = bc.id
  where br.id = v_round_id
    and bc.participant_id = v_participant_id
  group by br.id, br.started_at, bc.id, bc.numbers;
end;
$$;

create or replace function public.ha_set_bingo_mark(
  p_participant_access_code text,
  p_number integer,
  p_is_marked boolean
)
returns integer[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
  v_card_id uuid;
  v_numbers integer[];
  v_marked_numbers integer[];
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);

  if v_participant_id is null then
    raise exception 'bingo card not found' using errcode = '42501';
  end if;

  select bc.id, bc.numbers
  into v_card_id, v_numbers
  from public.bingo_cards bc
  join public.bingo_rounds br on br.id = bc.round_id
  where br.status = 'active'
    and bc.participant_id = v_participant_id
  order by br.started_at desc
  limit 1;

  if v_card_id is null then
    raise exception 'bingo card not found' using errcode = 'P0002';
  end if;

  if p_number is null or not p_number = any(v_numbers) then
    raise exception 'number is not on bingo card' using errcode = '22023';
  end if;

  if p_is_marked then
    insert into public.bingo_marks (card_id, number)
    values (v_card_id, p_number)
    on conflict (card_id, number) do nothing;
  else
    delete from public.bingo_marks bm
    where bm.card_id = v_card_id
      and bm.number = p_number;
  end if;

  select coalesce(array_agg(bm.number order by bm.number), array[]::integer[])
  into v_marked_numbers
  from public.bingo_marks bm
  where bm.card_id = v_card_id;

  return v_marked_numbers;
end;
$$;

revoke all on function public.ha_bingo_numbers_are_valid(integer[]) from public;
revoke all on function public.ha_generate_bingo_card_numbers() from public;
revoke all on function public.ha_bingo_numbers_are_valid(integer[]) from anon, authenticated;
revoke all on function public.ha_generate_bingo_card_numbers() from anon, authenticated;

grant execute on function public.ha_get_active_bingo_round(text) to anon, authenticated;
grant execute on function public.ha_admin_get_bingo_round(text) to anon, authenticated;
grant execute on function public.ha_start_bingo_round(text) to anon, authenticated;
grant execute on function public.ha_close_bingo_round(text) to anon, authenticated;
grant execute on function public.ha_get_or_create_bingo_card(text) to anon, authenticated;
grant execute on function public.ha_set_bingo_mark(text, integer, boolean) to anon, authenticated;
