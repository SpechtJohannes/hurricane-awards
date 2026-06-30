-- Protect participant login checks with server-side rate limiting.
-- Apply after 20260630120000_create_festival_archives.sql.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.participant_login_attempts (
  festival_id text not null default 'current',
  technical_key text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  last_failed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participant_login_attempts_failed_attempts_valid
    check (failed_attempts >= 0),
  primary key (festival_id, technical_key)
);

alter table public.participant_login_attempts enable row level security;

revoke all on table public.participant_login_attempts from anon, authenticated;

drop policy if exists "deny direct participant login attempt access"
on public.participant_login_attempts;

create policy "deny direct participant login attempt access"
on public.participant_login_attempts
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.ha_login_rate_limit_key(
  p_festival_id text default 'current'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers jsonb;
  v_forwarded_for text;
  v_client_address text;
  v_user_agent text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception
    when others then
      v_headers := '{}'::jsonb;
  end;

  v_forwarded_for := nullif(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1), '');
  v_client_address := coalesce(v_forwarded_for, inet_client_addr()::text, 'unknown-client');
  v_user_agent := coalesce(nullif(v_headers->>'user-agent', ''), 'unknown-agent');

  return encode(
    extensions.digest(
      concat_ws(':', 'ha-login-v1', coalesce(nullif(p_festival_id, ''), 'current'), v_client_address, v_user_agent),
      'sha256'
    ),
    'hex'
  );
end;
$$;

drop function if exists public.ha_login_participant(text);
drop function if exists public.ha_login_participant(text, text);

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
  v_festival_id text := coalesce(nullif(trim(p_festival_id), ''), 'current');
  v_access_code text := public.ha_normalize_participant_access_code(p_access_code);
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
  where upper(p.access_code) = v_access_code
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

revoke all on function public.ha_login_rate_limit_key(text) from public;
revoke all on function public.ha_find_participant(text) from anon, authenticated;

grant execute on function public.ha_login_participant(text, text) to anon, authenticated;

commit;
