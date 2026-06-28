-- Add an active flag for participants.
-- Apply after 20260628133000_restrict_admin_functions.sql.

begin;

alter table public.participants
  add column if not exists is_active boolean not null default true;

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
    and p.is_active = true
  limit 1;
$$;

drop function if exists public.ha_find_participant(text);

create or replace function public.ha_find_participant(
  p_access_code text
)
returns table (
  id text,
  name text,
  display_name text,
  is_admin boolean,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select p.id::text, p.name::text, p.display_name::text, p.is_admin, p.is_active
  from public.participants p
  where upper(p.access_code) = upper(trim(p_access_code))
    and p.is_active = true
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
  select exists (
    select 1
    from public.participants p
    where upper(p.access_code) = upper(trim(p_participant_access_code))
      and p.is_admin = true
      and p.is_active = true
  );
$$;

create or replace function public.ha_normalize_participant_access_code(
  p_access_code text
)
returns text
language sql
security definer
set search_path = public
as $$
  select nullif(upper(trim(p_access_code)), '');
$$;

create or replace function public.ha_generate_participant_access_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_index integer;
begin
  loop
    v_code := '';

    for v_index in 1..8 loop
      v_code := v_code || substr(
        v_alphabet,
        floor(random() * length(v_alphabet) + 1)::integer,
        1
      );
    end loop;

    exit when not exists (
      select 1
      from public.participants p
      where upper(p.access_code) = v_code
    );
  end loop;

  return v_code;
end;
$$;

create or replace function public.ha_admin_participant_row(
  p_participant_id text
)
returns table (
  id text,
  name text,
  display_name text,
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
    p.access_code::text,
    p.is_admin,
    p.is_active
  from public.participants p
  where p.id::text = p_participant_id
  limit 1;
$$;

create or replace function public.ha_admin_list_participants(
  p_participant_access_code text
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
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return query
  select
    p.id::text,
    p.name::text,
    p.display_name::text,
    p.access_code::text,
    p.is_admin,
    p.is_active
  from public.participants p
  order by p.is_active desc, p.display_name asc, p.name asc;
end;
$$;

create or replace function public.ha_suggest_participant_access_code(
  p_participant_access_code text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  return public.ha_generate_participant_access_code();
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

  if exists (
    select 1
    from public.participants p
    where upper(p.access_code) = v_access_code
  ) then
    raise exception 'participant access code already exists' using errcode = '23505';
  end if;

  insert into public.participants (
    id,
    name,
    display_name,
    access_code,
    is_admin,
    is_active
  )
  values (
    gen_random_uuid()::text,
    v_display_name,
    v_display_name,
    v_access_code,
    false,
    true
  )
  returning participants.id::text into v_participant_id;

  return query
  select *
  from public.ha_admin_participant_row(v_participant_id);
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

  if v_access_code is not null and exists (
    select 1
    from public.participants p
    where upper(p.access_code) = v_access_code
      and p.id::text <> p_participant_id
  ) then
    raise exception 'participant access code already exists' using errcode = '23505';
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

revoke all on function public.ha_participant_id_for_access(text) from public;
revoke all on function public.ha_has_admin_access(text) from public;
revoke all on function public.ha_normalize_participant_access_code(text) from public;
revoke all on function public.ha_generate_participant_access_code() from public;
revoke all on function public.ha_admin_participant_row(text) from public;
grant execute on function public.ha_find_participant(text) to anon, authenticated;
grant execute on function public.ha_admin_list_participants(text) to anon, authenticated;
grant execute on function public.ha_suggest_participant_access_code(text) to anon, authenticated;
grant execute on function public.ha_create_participant(text, text, text) to anon, authenticated;
grant execute on function public.ha_update_participant(text, text, text, text) to anon, authenticated;
grant execute on function public.ha_deactivate_participant(text, text) to anon, authenticated;
grant execute on function public.ha_reactivate_participant(text, text) to anon, authenticated;

commit;
