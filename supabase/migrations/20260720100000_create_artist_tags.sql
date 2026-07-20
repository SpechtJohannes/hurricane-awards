-- Categorize timetable acts with reusable, normalized artist tags.

create table public.artist_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint artist_tags_name_not_blank check (length(trim(name)) > 0)
);

create unique index artist_tags_normalized_name_key
  on public.artist_tags (lower(regexp_replace(trim(name), '\s+', ' ', 'g')));

create table public.timetable_act_artist_tags (
  act_id uuid not null references public.timetable_acts(id) on delete cascade,
  tag_id uuid not null references public.artist_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (act_id, tag_id)
);

create index timetable_act_artist_tags_tag_id_idx
  on public.timetable_act_artist_tags (tag_id);

alter table public.artist_tags enable row level security;
alter table public.timetable_act_artist_tags enable row level security;

revoke all on table public.artist_tags from anon, authenticated;
revoke all on table public.timetable_act_artist_tags from anon, authenticated;

create policy "deny direct artist tag access"
  on public.artist_tags for all using (false) with check (false);
create policy "deny direct timetable act artist tag access"
  on public.timetable_act_artist_tags for all using (false) with check (false);

create function public.ha_list_artist_tags(p_participant_access_code text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    return;
  end if;
  return query select t.id, t.name from public.artist_tags t order by lower(t.name), t.name;
end;
$$;

create function public.ha_list_act_artist_tags(p_participant_access_code text)
returns table (act_id uuid, tag_id uuid, name text)
language plpgsql security definer set search_path = public
as $$
begin
  if public.ha_participant_id_for_access(p_participant_access_code) is null then
    return;
  end if;
  return query
    select at.act_id, t.id, t.name
    from public.timetable_act_artist_tags at
    join public.artist_tags t on t.id = at.tag_id
    order by at.act_id, lower(t.name), t.name;
end;
$$;

create function public.ha_admin_add_artist_tag(
  p_participant_access_code text,
  p_act_id uuid,
  p_name text
)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_name text := nullif(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), '');
  v_tag_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if v_name is null then
    raise exception 'artist tag name is required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.timetable_acts a where a.id = p_act_id) then
    raise exception 'act not found' using errcode = 'P0002';
  end if;

  insert into public.artist_tags (name) values (v_name)
  on conflict (lower(regexp_replace(trim(name), '\s+', ' ', 'g')))
  do update set name = artist_tags.name
  returning artist_tags.id into v_tag_id;

  insert into public.timetable_act_artist_tags (act_id, tag_id)
  values (p_act_id, v_tag_id)
  on conflict do nothing;

  return query select t.id, t.name from public.artist_tags t where t.id = v_tag_id;
end;
$$;

create function public.ha_admin_assign_artist_tag(
  p_participant_access_code text,
  p_act_id uuid,
  p_tag_id uuid
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  insert into public.timetable_act_artist_tags (act_id, tag_id)
  values (p_act_id, p_tag_id)
  on conflict do nothing;
end;
$$;

create function public.ha_admin_remove_artist_tag(
  p_participant_access_code text,
  p_act_id uuid,
  p_tag_id uuid
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  delete from public.timetable_act_artist_tags
  where act_id = p_act_id and tag_id = p_tag_id;
end;
$$;

revoke all on function public.ha_list_artist_tags(text) from public;
revoke all on function public.ha_list_act_artist_tags(text) from public;
revoke all on function public.ha_admin_add_artist_tag(text, uuid, text) from public;
revoke all on function public.ha_admin_assign_artist_tag(text, uuid, uuid) from public;
revoke all on function public.ha_admin_remove_artist_tag(text, uuid, uuid) from public;
grant execute on function public.ha_list_artist_tags(text) to anon, authenticated;
grant execute on function public.ha_list_act_artist_tags(text) to anon, authenticated;
grant execute on function public.ha_admin_add_artist_tag(text, uuid, text) to anon, authenticated;
grant execute on function public.ha_admin_assign_artist_tag(text, uuid, uuid) to anon, authenticated;
grant execute on function public.ha_admin_remove_artist_tag(text, uuid, uuid) to anon, authenticated;
