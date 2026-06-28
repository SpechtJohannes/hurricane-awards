-- Server-side access control for the current Hurricane Awards schema.
-- Apply this file in the Supabase SQL editor.
--
-- This migration intentionally does not create a festivals table, does not add
-- festival_id columns and does not update existing application data.

begin;

alter table public.participants enable row level security;
alter table public.categories enable row level security;
alter table public.votes enable row level security;
alter table public.archived_votes enable row level security;

do $$
declare
  standings_relkind "char";
begin
  select c.relkind
  into standings_relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'all_time_standings';

  if standings_relkind in ('r', 'p') then
    execute 'alter table public.all_time_standings enable row level security';
    raise notice 'all_time_standings is a table; RLS enabled.';
  elsif standings_relkind in ('v', 'm') then
    raise notice 'all_time_standings is a view/materialized view; direct grants are revoked and access is exposed through RPC only.';
  else
    raise notice 'all_time_standings was not found; the standings RPC creation below requires it to exist.';
  end if;
end;
$$;

revoke all on table public.participants from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.votes from anon, authenticated;
revoke all on table public.archived_votes from anon, authenticated;

do $$
begin
  if to_regclass('public.all_time_standings') is not null then
    execute 'revoke all on table public.all_time_standings from anon, authenticated';
  end if;
end;
$$;

drop policy if exists "deny direct participant access" on public.participants;
create policy "deny direct participant access"
on public.participants
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct category access" on public.categories;
create policy "deny direct category access"
on public.categories
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct vote access" on public.votes;
create policy "deny direct vote access"
on public.votes
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct archived vote access" on public.archived_votes;
create policy "deny direct archived vote access"
on public.archived_votes
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'all_time_standings'
      and c.relkind in ('r', 'p')
  ) then
    execute 'drop policy if exists "deny direct standings access" on public.all_time_standings';
    execute 'create policy "deny direct standings access"
      on public.all_time_standings
      as restrictive
      for all
      to anon, authenticated
      using (false)
      with check (false)';
  end if;
end;
$$;

-- Remove old signatures from earlier draft executions, if they exist.
drop function if exists public.ha_is_valid_festival(text, text);
drop function if exists public.ha_participant_id_for_access(text, text, text);
drop function if exists public.ha_is_admin_participant(text, text, text);
drop function if exists public.ha_has_admin_access(text);
drop function if exists public.ha_find_participant(text, text, text);
drop function if exists public.ha_list_participants(text, text, text);
drop function if exists public.ha_list_categories(text, text, text);
drop function if exists public.ha_list_participant_votes(text, text, text, text);
drop function if exists public.ha_list_result_votes(text, text, text);
drop function if exists public.ha_save_vote(text, text, text, text, text, text, timestamptz);
drop function if exists public.ha_update_category_status(text, text, text, text, text);
drop function if exists public.ha_delete_category_votes(text, text, text, text);
drop function if exists public.ha_list_all_time_standings(text, text, text);

create or replace function public.ha_participant_id_for_access(
  p_participant_access_code text
)
returns text
language sql
security definer
set search_path = public
as $$
  select p.id::text
  from public.participants p
  where upper(p.access_code) = upper(trim(p_participant_access_code))
  limit 1;
$$;

create or replace function public.ha_has_admin_access(
  p_participant_access_code text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.ha_participant_id_for_access(p_participant_access_code) is not null;
$$;

create or replace function public.ha_find_participant(
  p_access_code text
)
returns table (
  id text,
  name text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select p.id::text, p.name::text, p.display_name::text
  from public.participants p
  where upper(p.access_code) = upper(trim(p_access_code))
  limit 1;
$$;

create or replace function public.ha_list_participants(
  p_participant_access_code text
)
returns table (
  id text,
  name text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select p.id::text, p.name::text, p.display_name::text
  from public.participants p
  where public.ha_participant_id_for_access(p_participant_access_code) is not null
  order by p.name;
$$;

create or replace function public.ha_list_categories(
  p_participant_access_code text
)
returns table (
  id text,
  title text,
  description text,
  status text,
  sort_order integer
)
language sql
security definer
set search_path = public
as $$
  select c.id::text, c.title::text, c.description::text, c.status::text, c.sort_order
  from public.categories c
  where public.ha_participant_id_for_access(p_participant_access_code) is not null
  order by c.sort_order asc;
$$;

create or replace function public.ha_list_participant_votes(
  p_participant_access_code text,
  p_voter_id text
)
returns table (
  voter_id text,
  voted_for_id text,
  category_id text,
  "timestamp" timestamptz
)
language sql
security definer
set search_path = public
as $$
  select v.voter_id::text, v.voted_for_id::text, v.category_id::text, v."timestamp"
  from public.votes v
  where public.ha_participant_id_for_access(p_participant_access_code) = p_voter_id
    and v.voter_id = p_voter_id
  order by v."timestamp" asc;
$$;

create or replace function public.ha_list_result_votes(
  p_participant_access_code text
)
returns table (
  voter_id text,
  voted_for_id text,
  category_id text,
  "timestamp" timestamptz
)
language sql
security definer
set search_path = public
as $$
  select v.voter_id::text, v.voted_for_id::text, v.category_id::text, v."timestamp"
  from public.votes v
  where public.ha_participant_id_for_access(p_participant_access_code) is not null
  order by v."timestamp" asc;
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
end;
$$;

create or replace function public.ha_update_category_status(
  p_participant_access_code text,
  p_category_id text,
  p_status text
)
returns table (
  id text,
  title text,
  description text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('upcoming', 'open', 'closed') then
    raise exception 'invalid status' using errcode = '23514';
  end if;

  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  update public.categories c
  set status = p_status
  where c.id = p_category_id;

  return query
  select c.id::text, c.title::text, c.description::text, c.status::text
  from public.categories c
  where c.id = p_category_id;
end;
$$;

create or replace function public.ha_delete_category_votes(
  p_participant_access_code text,
  p_category_id text
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

  delete from public.votes v
  where v.category_id = p_category_id;
end;
$$;

create or replace function public.ha_list_all_time_standings(
  p_participant_access_code text
)
returns table (
  participant_id text,
  participant_name text,
  total_points bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    return;
  end if;

  if to_regclass('public.all_time_standings') is null then
    raise exception 'all_time_standings does not exist' using errcode = '42P01';
  end if;

  return query execute
    'select
      s.participant_id::text,
      s.participant_name::text,
      s.total_points::bigint
    from public.all_time_standings s
    order by s.total_points desc, s.participant_name asc';
end;
$$;

revoke all on function public.ha_participant_id_for_access(text) from public;
revoke all on function public.ha_has_admin_access(text) from public;

grant execute on function public.ha_find_participant(text) to anon, authenticated;
grant execute on function public.ha_list_participants(text) to anon, authenticated;
grant execute on function public.ha_list_categories(text) to anon, authenticated;
grant execute on function public.ha_list_participant_votes(text, text) to anon, authenticated;
grant execute on function public.ha_list_result_votes(text) to anon, authenticated;
grant execute on function public.ha_save_vote(text, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.ha_update_category_status(text, text, text) to anon, authenticated;
grant execute on function public.ha_delete_category_votes(text, text) to anon, authenticated;
grant execute on function public.ha_list_all_time_standings(text) to anon, authenticated;

commit;
