-- Enforce server-side data integrity for participant codes and votes.
-- Apply after 20260628153000_create_participant_management_rpcs.sql.

begin;

create unique index if not exists participants_access_code_upper_unique
  on public.participants (upper(access_code))
  where access_code is not null;

create unique index if not exists votes_voter_category_unique
  on public.votes (voter_id, category_id);

create or replace function public.ha_create_participant(
  p_participant_access_code text,
  p_display_name text,
  p_access_code text default null
)
returns table (
  id text,
  name text,
  display_name text,
  access_code text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_access_code text;
  v_participant_id text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_display_name := nullif(trim(p_display_name), '');

  if v_display_name is null then
    raise exception 'display name is required' using errcode = '23514';
  end if;

  v_access_code := public.ha_normalize_participant_access_code(p_access_code);

  if v_access_code is null then
    v_access_code := public.ha_generate_participant_access_code();
  end if;

  v_participant_id := gen_random_uuid()::text;

  insert into public.participants (
    id,
    name,
    display_name,
    access_code,
    is_admin,
    is_active
  )
  values (
    v_participant_id,
    v_display_name,
    v_display_name,
    v_access_code,
    false,
    true
  );

  return query
  select *
  from public.ha_admin_participant_row(v_participant_id);
exception
  when unique_violation then
    raise exception 'participant access code already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_update_participant(
  p_participant_access_code text,
  p_participant_id text,
  p_display_name text default null,
  p_access_code text default null
)
returns table (
  id text,
  name text,
  display_name text,
  access_code text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_access_code text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.participants p
    where p.id::text = p_participant_id
  ) then
    raise exception 'participant not found' using errcode = 'P0002';
  end if;

  v_display_name := nullif(trim(p_display_name), '');
  v_access_code := public.ha_normalize_participant_access_code(p_access_code);

  if p_display_name is not null and v_display_name is null then
    raise exception 'display name is required' using errcode = '23514';
  end if;

  if p_access_code is not null and v_access_code is null then
    raise exception 'participant access code is required' using errcode = '23514';
  end if;

  update public.participants p
  set
    display_name = coalesce(v_display_name, p.display_name),
    name = coalesce(v_display_name, p.name),
    access_code = coalesce(v_access_code, p.access_code)
  where p.id::text = p_participant_id;

  return query
  select *
  from public.ha_admin_participant_row(p_participant_id);
exception
  when unique_violation then
    raise exception 'participant access code already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_save_vote(
  p_participant_access_code text,
  p_voter_id text,
  p_voted_for_id text,
  p_category_id text,
  p_timestamp timestamptz
)
returns table (
  voter_id text,
  voted_for_id text,
  category_id text,
  "timestamp" timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
  v_category_status text;
begin
  v_participant_id := public.ha_participant_id_for_access(
    p_participant_access_code
  );

  if v_participant_id is null or v_participant_id <> p_voter_id then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if p_voter_id = p_voted_for_id then
    raise exception 'self votes are not allowed' using errcode = '23514';
  end if;

  select c.status::text
  into v_category_status
  from public.categories c
  where c.id = p_category_id;

  if v_category_status is distinct from 'open' then
    raise exception 'category is not open' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.participants p
    where p.id = p_voted_for_id
  ) then
    raise exception 'vote target is invalid' using errcode = '23503';
  end if;

  insert into public.votes (
    voter_id,
    voted_for_id,
    category_id,
    "timestamp"
  )
  values (
    p_voter_id,
    p_voted_for_id,
    p_category_id,
    coalesce(p_timestamp, now())
  );

  return query
  select v.voter_id::text, v.voted_for_id::text, v.category_id::text, v."timestamp"
  from public.votes v
  where v.voter_id = p_voter_id
    and v.category_id = p_category_id
  order by v."timestamp" desc
  limit 1;
exception
  when unique_violation then
    raise exception 'vote already exists for category' using errcode = '23505';
end;
$$;

commit;
