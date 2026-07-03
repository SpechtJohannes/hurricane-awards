-- Harden archive storage and RPC helper permissions.
-- Apply after 20260702090000_secure_festival_access_code.sql.

begin;

alter table public.festival_archive_participants
  drop column if exists access_code;

create or replace function public.ha_archive_festival(
  p_admin_access_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_archive_id uuid;
  v_created_by_participant_id uuid;
  v_festival_name text;
  v_uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not public.ha_has_admin_access(p_admin_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select
    case
      when p.id::text ~* v_uuid_pattern then p.id::text::uuid
      else null
    end
  into v_created_by_participant_id
  from public.participants p
  where upper(p.access_code) = upper(trim(p_admin_access_code))
    and p.is_admin = true
    and p.is_active = true
  limit 1;

  select s.value::text
  into v_festival_name
  from public.app_settings s
  where s.key = 'festival_name'
  limit 1;

  v_festival_name := nullif(trim(v_festival_name), '');

  if v_festival_name is null then
    raise exception 'festival name is required' using errcode = '23514';
  end if;

  insert into public.festival_archives (
    festival_name,
    created_by_participant_id
  )
  values (
    v_festival_name,
    v_created_by_participant_id
  )
  returning id into v_archive_id;

  insert into public.festival_archive_participants (
    archive_id,
    original_participant_id,
    display_name,
    is_admin,
    is_active
  )
  select
    v_archive_id,
    case
      when p.id::text ~* v_uuid_pattern then p.id::text::uuid
      else null
    end,
    coalesce(nullif(p.display_name::text, ''), p.name::text),
    p.is_admin,
    p.is_active
  from public.participants p;

  insert into public.festival_archive_categories (
    archive_id,
    original_category_id,
    name,
    description,
    sort_order,
    is_active
  )
  select
    v_archive_id,
    case
      when c.id::text ~* v_uuid_pattern then c.id::text::uuid
      else null
    end,
    c.title::text,
    c.description::text,
    c.sort_order,
    c.status::text = 'open'
  from public.categories c;

  insert into public.festival_archive_votes (
    archive_id,
    original_vote_id,
    original_voter_id,
    original_category_id,
    original_nominee_id,
    voter_display_name,
    category_name,
    nominee_display_name
  )
  select
    v_archive_id,
    null,
    case
      when v.voter_id::text ~* v_uuid_pattern then v.voter_id::text::uuid
      else null
    end,
    case
      when v.category_id::text ~* v_uuid_pattern then v.category_id::text::uuid
      else null
    end,
    case
      when v.voted_for_id::text ~* v_uuid_pattern then v.voted_for_id::text::uuid
      else null
    end,
    coalesce(nullif(voter.display_name::text, ''), voter.name::text, v.voter_id::text),
    coalesce(c.title::text, v.category_id::text),
    coalesce(nullif(nominee.display_name::text, ''), nominee.name::text, v.voted_for_id::text)
  from public.votes v
  left join public.participants voter
    on voter.id = v.voter_id
  left join public.categories c
    on c.id = v.category_id
  left join public.participants nominee
    on nominee.id = v.voted_for_id;

  return v_archive_id;
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
    select 'blocked'::text, v_attempt.locked_until, null::text, null::text, null::text, null::boolean, null::boolean;
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
  on conflict (festival_id, technical_key) do update
  set
    failed_attempts = excluded.failed_attempts,
    locked_until = excluded.locked_until,
    last_failed_at = excluded.last_failed_at,
    updated_at = excluded.updated_at;

  if v_locked_until is not null then
    return query
    select 'blocked'::text, v_locked_until, null::text, null::text, null::text, null::boolean, null::boolean;
    return;
  end if;

  return query
  select 'invalid'::text, null::timestamptz, null::text, null::text, null::text, null::boolean, null::boolean;
end;
$$;

create or replace function public.ha_verify_festival_access_code(
  p_access_code text,
  p_festival_id text default 'current'
)
returns table (
  is_valid boolean,
  access_version text,
  status text,
  locked_until timestamptz
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
  v_access_code text := upper(nullif(trim(left(coalesce(p_access_code, ''), 128)), ''));
  v_stored_access_code text;
  v_access_version text;
  v_technical_key text;
  v_attempt public.festival_access_attempts%rowtype;
  v_failed_attempts integer;
  v_locked_until timestamptz;
begin
  v_technical_key := public.ha_festival_access_rate_limit_key(v_festival_id);

  delete from public.festival_access_attempts faa
  where faa.updated_at < now() - v_attempt_retention
    and (faa.locked_until is null or faa.locked_until <= now());

  select *
  into v_attempt
  from public.festival_access_attempts faa
  where faa.festival_id = v_festival_id
    and faa.technical_key = v_technical_key
  for update;

  if v_attempt.locked_until is not null and v_attempt.locked_until > now() then
    return query
    select false, null::text, 'blocked'::text, v_attempt.locked_until;
    return;
  end if;

  select
    upper(s.value::text),
    coalesce(s.updated_at, now())::text
  into
    v_stored_access_code,
    v_access_version
  from public.app_settings s
  where s.key = 'festival_access_code'
  limit 1;

  if v_access_code is not null
    and v_stored_access_code is not null
    and v_access_code = v_stored_access_code
  then
    delete from public.festival_access_attempts faa
    where faa.festival_id = v_festival_id
      and faa.technical_key = v_technical_key;

    return query
    select true, v_access_version, 'success'::text, null::timestamptz;
    return;
  end if;

  v_failed_attempts := coalesce(v_attempt.failed_attempts, 0) + 1;
  v_locked_until := case
    when v_failed_attempts >= v_max_failed_attempts then now() + v_lock_duration
    else null
  end;

  insert into public.festival_access_attempts (
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
  on conflict (festival_id, technical_key) do update
  set
    failed_attempts = excluded.failed_attempts,
    locked_until = excluded.locked_until,
    last_failed_at = excluded.last_failed_at,
    updated_at = excluded.updated_at;

  if v_locked_until is not null then
    return query
    select false, null::text, 'blocked'::text, v_locked_until;
    return;
  end if;

  return query
  select false, null::text, 'invalid'::text, null::timestamptz;
end;
$$;

revoke all on function public.ha_participant_id_for_access(text) from anon, authenticated;
revoke all on function public.ha_has_admin_access(text) from anon, authenticated;
revoke all on function public.ha_normalize_participant_access_code(text) from anon, authenticated;
revoke all on function public.ha_generate_participant_access_code() from anon, authenticated;
revoke all on function public.ha_admin_participant_row(text) from anon, authenticated;
revoke all on function public.ha_admin_category_row(text) from anon, authenticated;
revoke all on function public.ha_login_rate_limit_key(text) from anon, authenticated;
revoke all on function public.ha_festival_access_rate_limit_key(text) from anon, authenticated;

grant execute on function public.ha_archive_festival(text) to anon, authenticated;
grant execute on function public.ha_login_participant(text, text) to anon, authenticated;
grant execute on function public.ha_verify_festival_access_code(text, text) to anon, authenticated;

commit;
