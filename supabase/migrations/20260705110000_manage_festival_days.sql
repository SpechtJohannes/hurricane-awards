-- Add admin RPCs for managing festival days in the structured timetable.

create or replace function public.ha_admin_list_festival_days(
  p_participant_access_code text
)
returns table (
  id uuid,
  date date,
  label text,
  sort_order integer
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
  select fd.id, fd.date, fd.label, fd.sort_order
  from public.festival_days fd
  order by fd.sort_order, fd.date;
end;
$$;

create or replace function public.ha_create_festival_day(
  p_participant_access_code text,
  p_date date,
  p_label text,
  p_sort_order integer
)
returns table (
  id uuid,
  date date,
  label text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_festival_day_id uuid;
  v_label text := nullif(trim(coalesce(p_label, '')), '');
  v_sort_order integer := coalesce(p_sort_order, 0);
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_date is null then
    raise exception 'festival day date is required' using errcode = '22023';
  end if;

  if v_label is null then
    raise exception 'festival day label is required' using errcode = '22023';
  end if;

  if v_sort_order < 0 then
    raise exception 'festival day sort order is invalid' using errcode = '22023';
  end if;

  insert into public.festival_days (date, label, sort_order)
  values (p_date, v_label, v_sort_order)
  returning festival_days.id into v_festival_day_id;

  return query
  select fd.id, fd.date, fd.label, fd.sort_order
  from public.festival_days fd
  where fd.id = v_festival_day_id;
exception
  when unique_violation then
    raise exception 'festival day date already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_update_festival_day(
  p_participant_access_code text,
  p_festival_day_id uuid,
  p_date date,
  p_label text,
  p_sort_order integer
)
returns table (
  id uuid,
  date date,
  label text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_label text := nullif(trim(coalesce(p_label, '')), '');
  v_sort_order integer := coalesce(p_sort_order, 0);
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_festival_day_id is null then
    raise exception 'festival day not found' using errcode = 'P0002';
  end if;

  if p_date is null then
    raise exception 'festival day date is required' using errcode = '22023';
  end if;

  if v_label is null then
    raise exception 'festival day label is required' using errcode = '22023';
  end if;

  if v_sort_order < 0 then
    raise exception 'festival day sort order is invalid' using errcode = '22023';
  end if;

  update public.festival_days fd
  set
    date = p_date,
    label = v_label,
    sort_order = v_sort_order
  where fd.id = p_festival_day_id;

  if not found then
    raise exception 'festival day not found' using errcode = 'P0002';
  end if;

  return query
  select fd.id, fd.date, fd.label, fd.sort_order
  from public.festival_days fd
  where fd.id = p_festival_day_id;
exception
  when unique_violation then
    raise exception 'festival day date already exists' using errcode = '23505';
end;
$$;

create or replace function public.ha_delete_festival_day(
  p_participant_access_code text,
  p_festival_day_id uuid
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

  delete from public.festival_days fd
  where fd.id = p_festival_day_id;

  if not found then
    raise exception 'festival day not found' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.ha_admin_list_festival_days(text) to anon, authenticated;
grant execute on function public.ha_create_festival_day(text, date, text, integer) to anon, authenticated;
grant execute on function public.ha_update_festival_day(text, uuid, date, text, integer) to anon, authenticated;
grant execute on function public.ha_delete_festival_day(text, uuid) to anon, authenticated;
