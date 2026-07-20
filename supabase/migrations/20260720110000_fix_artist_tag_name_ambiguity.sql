-- Fix PL/pgSQL ambiguity between the RETURNS TABLE field `name` and
-- public.artist_tags.name in ha_admin_add_artist_tag.

create or replace function public.ha_admin_add_artist_tag(
  p_participant_access_code text,
  p_act_id uuid,
  p_name text
)
returns table (
  id uuid,
  name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_tag_name text := nullif(
    regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'),
    ''
  );
  artist_tag_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if normalized_tag_name is null then
    raise exception 'artist tag name is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.timetable_acts as timetable_act
    where timetable_act.id = p_act_id
  ) then
    raise exception 'act not found' using errcode = 'P0002';
  end if;

  insert into public.artist_tags as artist_tag (name)
  values (normalized_tag_name)
  on conflict do nothing
  returning artist_tag.id into artist_tag_id;

  if artist_tag_id is null then
    select artist_tag.id
    into artist_tag_id
    from public.artist_tags as artist_tag
    where lower(regexp_replace(trim(artist_tag.name), '\s+', ' ', 'g')) =
      lower(normalized_tag_name);
  end if;

  insert into public.timetable_act_artist_tags as act_artist_tag (
    act_id,
    tag_id
  )
  values (
    p_act_id,
    artist_tag_id
  )
  on conflict do nothing;

  return query
  select artist_tag.id, artist_tag.name
  from public.artist_tags as artist_tag
  where artist_tag.id = artist_tag_id;
end;
$$;

revoke all on function public.ha_admin_add_artist_tag(text, uuid, text)
  from public;
grant execute on function public.ha_admin_add_artist_tag(text, uuid, text)
  to anon, authenticated;
