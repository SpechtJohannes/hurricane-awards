-- Add participant avatar selection and expose avatar IDs through participant RPCs.
-- Apply after 20260703130000_create_music_playlist_setting.sql.

alter table public.participants
  add column if not exists avatar_id text;

alter table public.participants
  add constraint participants_avatar_id_length
  check (avatar_id is null or length(trim(avatar_id)) between 1 and 80)
  not valid;

alter table public.participants
  validate constraint participants_avatar_id_length;

drop function if exists public.ha_update_participant_avatar(text, text, text);
drop function if exists public.ha_reactivate_participant(text, text);
drop function if exists public.ha_deactivate_participant(text, text);
drop function if exists public.ha_update_participant(text, text, text, text);
drop function if exists public.ha_create_participant(text, text, text);
drop function if exists public.ha_admin_list_participants(text);
drop function if exists public.ha_admin_participant_row(text);
drop function if exists public.ha_list_participants(text);
drop function if exists public.ha_login_participant(text, text);

create or replace function public.ha_admin_participant_row(
  p_participant_id text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  access_code text,
  is_admin boolean,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id::text,
    p.name::text,
    p.display_name::text,
    p.avatar_id::text,
    p.access_code::text,
    p.is_admin,
    p.is_active
  from public.participants p
  where p.id::text = p_participant_id
  limit 1;
$$;

create or replace function public.ha_list_participants(
  p_participant_access_code text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  return query
  select
    p.id::text,
    p.name::text,
    p.display_name::text,
    p.avatar_id::text,
    p.is_admin,
    p.is_active
  from public.participants p
  where p.is_active = true
  order by p.display_name asc, p.name asc;
end;
$$;

create or replace function public.ha_admin_list_participants(
  p_participant_access_code text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  access_code text,
  is_admin boolean,
  is_active boolean
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
    p.id::text,
    p.name::text,
    p.display_name::text,
    p.avatar_id::text,
    p.access_code::text,
    p.is_admin,
    p.is_active
  from public.participants p
  order by p.is_active desc, p.display_name asc, p.name asc;
end;
$$;

create or replace function public.ha_create_participant(
  p_participant_access_code text,
  p_display_name text,
  p_access_code text default null
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
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
  avatar_id text,
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

create or replace function public.ha_deactivate_participant(
  p_participant_access_code text,
  p_participant_id text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  access_code text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  update public.participants p
  set is_active = false
  where p.id::text = p_participant_id;

  return query
  select *
  from public.ha_admin_participant_row(p_participant_id);
end;
$$;

create or replace function public.ha_reactivate_participant(
  p_participant_access_code text,
  p_participant_id text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  access_code text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  update public.participants p
  set is_active = true
  where p.id::text = p_participant_id;

  return query
  select *
  from public.ha_admin_participant_row(p_participant_id);
end;
$$;

create or replace function public.ha_login_participant(
  p_access_code text,
  p_festival_id text default 'current'
)
returns table (
  status text,
  locked_until timestamptz,
  id text,
  name text,
  display_name text,
  avatar_id text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_failed_attempts constant integer := 3;
  v_lock_duration constant interval := interval '30 seconds';
  v_attempt_retention constant interval := interval '1 day';
  v_festival_id text := coalesce(nullif(left(trim(p_festival_id), 64), ''), 'current');
  v_access_code text := public.ha_normalize_participant_access_code(left(coalesce(p_access_code, ''), 128));
  v_technical_key text;
  v_attempt public.participant_login_attempts%rowtype;
  v_participant public.participants%rowtype;
  v_failed_attempts integer;
  v_locked_until timestamptz;
begin
  v_technical_key := public.ha_login_rate_limit_key(v_festival_id);

  delete from public.participant_login_attempts pla
  where pla.updated_at < now() - v_attempt_retention
    and (pla.locked_until is null or pla.locked_until <= now());

  select *
  into v_attempt
  from public.participant_login_attempts pla
  where pla.festival_id = v_festival_id
    and pla.technical_key = v_technical_key
  for update;

  if v_attempt.locked_until is not null and v_attempt.locked_until > now() then
    return query
    select 'blocked'::text, v_attempt.locked_until, null::text, null::text, null::text, null::text, null::boolean, null::boolean;
    return;
  end if;

  select p.*
  into v_participant
  from public.participants p
  where v_access_code is not null
    and upper(p.access_code) = v_access_code
    and p.is_active = true
  limit 1;

  if v_participant.id is not null then
    delete from public.participant_login_attempts pla
    where pla.festival_id = v_festival_id
      and pla.technical_key = v_technical_key;

    return query
    select
      'success'::text,
      null::timestamptz,
      v_participant.id::text,
      v_participant.name::text,
      v_participant.display_name::text,
      v_participant.avatar_id::text,
      v_participant.is_admin,
      v_participant.is_active;
    return;
  end if;

  v_failed_attempts := coalesce(v_attempt.failed_attempts, 0) + 1;
  v_locked_until := case
    when v_failed_attempts >= v_max_failed_attempts then now() + v_lock_duration
    else null
  end;

  insert into public.participant_login_attempts (
    festival_id,
    technical_key,
    failed_attempts,
    locked_until,
    last_failed_at,
    updated_at
  )
  values (
    v_festival_id,
    v_technical_key,
    case when v_locked_until is null then v_failed_attempts else 0 end,
    v_locked_until,
    now(),
    now()
  )
  on conflict (festival_id, technical_key)
  do update set
    failed_attempts = excluded.failed_attempts,
    locked_until = excluded.locked_until,
    last_failed_at = excluded.last_failed_at,
    updated_at = excluded.updated_at;

  if v_locked_until is not null then
    return query
    select 'blocked'::text, v_locked_until, null::text, null::text, null::text, null::text, null::boolean, null::boolean;
    return;
  end if;

  return query
  select 'invalid'::text, null::timestamptz, null::text, null::text, null::text, null::text, null::boolean, null::boolean;
end;
$$;

create or replace function public.ha_update_participant_avatar(
  p_participant_access_code text,
  p_participant_id text,
  p_avatar_id text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  access_code text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_authenticated_participant_id text;
  v_avatar_id text := nullif(trim(left(coalesce(p_avatar_id, ''), 80)), '');
begin
  v_authenticated_participant_id := public.ha_participant_id_for_access(
    p_participant_access_code
  );

  if v_authenticated_participant_id is null
    or v_authenticated_participant_id <> p_participant_id then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  if v_avatar_id is null then
    raise exception 'avatar id is required' using errcode = '23514';
  end if;

  update public.participants p
  set avatar_id = v_avatar_id
  where p.id::text = p_participant_id;

  return query
  select *
  from public.ha_admin_participant_row(p_participant_id);
end;
$$;

revoke all on function public.ha_admin_participant_row(text) from anon, authenticated;
grant execute on function public.ha_list_participants(text) to anon, authenticated;
grant execute on function public.ha_admin_list_participants(text) to anon, authenticated;
grant execute on function public.ha_create_participant(text, text, text) to anon, authenticated;
grant execute on function public.ha_update_participant(text, text, text, text) to anon, authenticated;
grant execute on function public.ha_deactivate_participant(text, text) to anon, authenticated;
grant execute on function public.ha_reactivate_participant(text, text) to anon, authenticated;
grant execute on function public.ha_login_participant(text, text) to anon, authenticated;
grant execute on function public.ha_update_participant_avatar(text, text, text) to anon, authenticated;
