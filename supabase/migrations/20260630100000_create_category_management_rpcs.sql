-- Create category management RPC functions for the admin interface.
-- Apply after 20260629100000_enforce_data_integrity.sql.

begin;

create or replace function public.ha_admin_category_row(
  p_category_id text
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
  select
    c.id::text,
    c.title::text,
    c.description::text,
    c.status::text,
    c.sort_order
  from public.categories c
  where c.id::text = p_category_id
  limit 1;
$$;

create or replace function public.ha_admin_list_categories(
  p_participant_access_code text
)
returns table (
  id text,
  title text,
  description text,
  status text,
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
  select
    c.id::text,
    c.title::text,
    c.description::text,
    c.status::text,
    c.sort_order
  from public.categories c
  order by c.sort_order asc, c.title asc;
end;
$$;

create or replace function public.ha_create_category(
  p_participant_access_code text,
  p_title text,
  p_description text default '',
  p_status text default 'upcoming',
  p_sort_order integer default null
)
returns table (
  id text,
  title text,
  description text,
  status text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category_id text;
  v_title text;
  v_description text;
  v_status text;
  v_sort_order integer;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_title := nullif(trim(p_title), '');
  v_description := coalesce(trim(p_description), '');
  v_status := coalesce(nullif(trim(p_status), ''), 'upcoming');

  if v_title is null then
    raise exception 'category title is required' using errcode = '23514';
  end if;

  if v_status not in ('upcoming', 'open', 'closed') then
    raise exception 'invalid status' using errcode = '23514';
  end if;

  if p_sort_order is null then
    select coalesce(max(c.sort_order), 0) + 1
    into v_sort_order
    from public.categories c;
  else
    v_sort_order := p_sort_order;
  end if;

  v_category_id := gen_random_uuid()::text;

  insert into public.categories (
    id,
    title,
    description,
    status,
    sort_order
  )
  values (
    v_category_id,
    v_title,
    v_description,
    v_status,
    v_sort_order
  );

  return query
  select *
  from public.ha_admin_category_row(v_category_id);
end;
$$;

create or replace function public.ha_update_category(
  p_participant_access_code text,
  p_category_id text,
  p_title text default null,
  p_description text default null,
  p_status text default null,
  p_sort_order integer default null
)
returns table (
  id text,
  title text,
  description text,
  status text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_description text;
  v_status text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.categories c
    where c.id::text = p_category_id
  ) then
    raise exception 'category not found' using errcode = 'P0002';
  end if;

  v_title := nullif(trim(p_title), '');
  v_description := trim(p_description);
  v_status := nullif(trim(p_status), '');

  if p_title is not null and v_title is null then
    raise exception 'category title is required' using errcode = '23514';
  end if;

  if v_status is not null and v_status not in ('upcoming', 'open', 'closed') then
    raise exception 'invalid status' using errcode = '23514';
  end if;

  update public.categories c
  set
    title = coalesce(v_title, c.title),
    description = coalesce(v_description, c.description),
    status = coalesce(v_status, c.status::text),
    sort_order = coalesce(p_sort_order, c.sort_order)
  where c.id::text = p_category_id;

  return query
  select *
  from public.ha_admin_category_row(p_category_id);
end;
$$;

create or replace function public.ha_delete_category(
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

  if not exists (
    select 1
    from public.categories c
    where c.id::text = p_category_id
  ) then
    raise exception 'category not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.votes v
    where v.category_id::text = p_category_id
  ) or exists (
    select 1
    from public.archived_votes av
    where av.category_id::text = p_category_id
  ) then
    raise exception 'category cannot be deleted while votes exist' using errcode = '23503';
  end if;

  delete from public.categories c
  where c.id::text = p_category_id;
end;
$$;

revoke all on function public.ha_admin_category_row(text) from public;

grant execute on function public.ha_admin_list_categories(text) to anon, authenticated;
grant execute on function public.ha_create_category(text, text, text, text, integer) to anon, authenticated;
grant execute on function public.ha_update_category(text, text, text, text, text, integer) to anon, authenticated;
grant execute on function public.ha_delete_category(text, text) to anon, authenticated;

commit;
