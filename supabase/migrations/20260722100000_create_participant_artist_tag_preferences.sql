-- Store private musical preferences and expose them only for the participant
-- identified by the existing participant access-code infrastructure.

begin;

create table public.participant_artist_tag_preferences (
  participant_id uuid not null references public.participants(id) on delete cascade,
  artist_tag_id uuid not null references public.artist_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (participant_id, artist_tag_id)
);

create index participant_artist_tag_preferences_artist_tag_id_idx
  on public.participant_artist_tag_preferences (artist_tag_id);

alter table public.participant_artist_tag_preferences enable row level security;
revoke all on table public.participant_artist_tag_preferences from anon, authenticated;
create policy "deny direct participant artist tag preference access"
  on public.participant_artist_tag_preferences for all using (false) with check (false);

create function public.ha_get_own_artist_tag_preferences(p_participant_access_code text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_participant_id uuid;
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code)::uuid;
  if v_participant_id is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  return query
    select tag.id, tag.name
    from public.participant_artist_tag_preferences preference
    join public.artist_tags tag on tag.id = preference.artist_tag_id
    where preference.participant_id = v_participant_id
    order by lower(tag.name), tag.name;
end;
$$;

create function public.ha_replace_own_artist_tag_preferences(
  p_participant_access_code text,
  p_artist_tag_ids uuid[]
)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public
as $$
declare
  v_participant_id uuid;
  v_tag_ids uuid[] := coalesce(p_artist_tag_ids, array[]::uuid[]);
begin
  v_participant_id := public.ha_participant_id_for_access(p_participant_access_code)::uuid;
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
  from (select distinct id from unnest(v_tag_ids) requested(id)) requested;

  return query
    select tag.id, tag.name
    from public.participant_artist_tag_preferences preference
    join public.artist_tags tag on tag.id = preference.artist_tag_id
    where preference.participant_id = v_participant_id
    order by lower(tag.name), tag.name;
end;
$$;

revoke all on function public.ha_get_own_artist_tag_preferences(text) from public;
revoke all on function public.ha_replace_own_artist_tag_preferences(text, uuid[]) from public;
grant execute on function public.ha_get_own_artist_tag_preferences(text) to anon, authenticated;
grant execute on function public.ha_replace_own_artist_tag_preferences(text, uuid[]) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
