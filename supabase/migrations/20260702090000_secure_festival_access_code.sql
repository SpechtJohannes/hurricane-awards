-- Harden the shared festival access code against guessing and remove the
-- previous public default if it is still active.
-- Apply after 20260701070000_manage_festival_access_code.sql.

begin;

delete from public.app_settings s
where s.key = 'festival_access_code'
  and upper(s.value) = 'HURRICANE2026';

create table if not exists public.festival_access_attempts (
  festival_id text not null default 'current',
  technical_key text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  last_failed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint festival_access_attempts_failed_attempts_valid
    check (failed_attempts >= 0),
  primary key (festival_id, technical_key)
);

alter table public.festival_access_attempts enable row level security;

revoke all on table public.festival_access_attempts from anon, authenticated;

drop policy if exists "deny direct festival access attempt access"
on public.festival_access_attempts;

create policy "deny direct festival access attempt access"
on public.festival_access_attempts
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.ha_festival_access_rate_limit_key(
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
      concat_ws(':', 'ha-festival-access-v1', coalesce(nullif(p_festival_id, ''), 'current'), v_client_address, v_user_agent),
      'sha256'
    ),
    'hex'
  );
end;
$$;

drop function if exists public.ha_verify_festival_access_code(text);
drop function if exists public.ha_verify_festival_access_code(text, text);

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
  v_festival_id text := coalesce(nullif(trim(p_festival_id), ''), 'current');
  v_access_code text := upper(nullif(trim(p_access_code), ''));
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

revoke all on function public.ha_festival_access_rate_limit_key(text) from public;

grant execute on function public.ha_verify_festival_access_code(text, text) to anon, authenticated;

commit;
