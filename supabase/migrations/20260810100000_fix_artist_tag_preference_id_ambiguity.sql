-- Qualify the unnested tag id so it cannot collide with the `id` output
-- parameter created by RETURNS TABLE.

begin;

create or replace function public.ha_replace_own_artist_tag_preferences(
  p_participant_access_code text,
  p_artist_tag_ids uuid[]
)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_participant_id text;
  v_tag_ids uuid[] := coalesce(p_artist_tag_ids, array[]::uuid[]);
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code);
  if v_participant_id is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  if exists (
    select 1 from unnest(v_tag_ids) requested(id)
    where not exists (select 1 from public.artist_tags tag where tag.id = requested.id)
  ) then
    raise exception 'invalid artist tag id' using errcode = '23503';
  end if;

  delete from public.participant_artist_tag_preferences preference
  where preference.participant_id = v_participant_id;

  insert into public.participant_artist_tag_preferences (participant_id, artist_tag_id)
  select v_participant_id, requested.id
  from (
    select distinct requested_tag.id
    from unnest(v_tag_ids) requested_tag(id)
  ) requested;

  return query
    select tag.id, tag.name
    from public.participant_artist_tag_preferences preference
    join public.artist_tags tag on tag.id = preference.artist_tag_id
    where preference.participant_id = v_participant_id
    order by lower(tag.name), tag.name;
end;
$$;

revoke all on function public.ha_replace_own_artist_tag_preferences(text, uuid[]) from public;
grant execute on function public.ha_replace_own_artist_tag_preferences(text, uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
