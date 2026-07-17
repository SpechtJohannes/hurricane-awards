begin;

alter table public.app_settings
  add column if not exists event_start_date date,
  add column if not exists event_end_date date;

alter table public.app_settings
  drop constraint if exists app_settings_event_period_valid;

alter table public.app_settings
  add constraint app_settings_event_period_valid check (
    (event_start_date is null and event_end_date is null)
    or (
      event_start_date is not null
      and event_end_date is not null
      and event_end_date >= event_start_date
    )
  );

create or replace function public.ha_get_event_settings()
returns table (
  event_name text,
  event_start_date date,
  event_end_date date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(s.value, ''),
    s.event_start_date,
    s.event_end_date
  from public.app_settings s
  where s.key = 'festival_name';
$$;

create or replace function public.ha_admin_update_event_settings(
  p_participant_access_code text,
  p_event_name text,
  p_event_start_date date,
  p_event_end_date date
)
returns table (
  event_name text,
  event_start_date date,
  event_end_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(p_event_name), '');
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'event name is required' using errcode = '23514';
  end if;

  if (p_event_start_date is null) <> (p_event_end_date is null) then
    raise exception 'event period requires start and end date' using errcode = '23514';
  end if;

  if p_event_end_date < p_event_start_date then
    raise exception 'event end date must not be before start date' using errcode = '23514';
  end if;

  insert into public.app_settings (
    key, value, event_start_date, event_end_date, updated_at
  ) values (
    'festival_name', v_name, p_event_start_date, p_event_end_date, now()
  )
  on conflict (key) do update set
    value = excluded.value,
    event_start_date = excluded.event_start_date,
    event_end_date = excluded.event_end_date,
    updated_at = excluded.updated_at;

  return query select v_name, p_event_start_date, p_event_end_date;
end;
$$;

revoke all on function public.ha_get_event_settings() from public;
revoke all on function public.ha_admin_update_event_settings(text, text, date, date) from public;
grant execute on function public.ha_get_event_settings() to anon, authenticated;
grant execute on function public.ha_admin_update_event_settings(text, text, date, date) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
