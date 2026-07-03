-- Store one Spotify playlist for the current festival info area.
-- Apply after 20260703120000_create_camp_location_link.sql.

begin;

create or replace function public.ha_spotify_playlist_id(
  p_link text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link text := trim(coalesce(p_link, ''));
  v_match text[];
begin
  if v_link ~ '^spotify:playlist:[A-Za-z0-9]{22}$' then
    return substring(v_link from '^spotify:playlist:([A-Za-z0-9]{22})$');
  end if;

  v_match := regexp_match(
    v_link,
    '^https://open\.spotify\.com/(?:intl-[a-z]{2}/)?playlist/([A-Za-z0-9]{22})(?:[/?#].*)?$'
  );

  if v_match is null then
    return null;
  end if;

  return v_match[1];
end;
$$;

create or replace function public.ha_is_supported_music_playlist_link(
  p_link text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.ha_spotify_playlist_id(p_link) is not null;
$$;

create or replace function public.ha_music_playlist_row(
  p_playlist_id text
)
returns table (
  provider text,
  playlist_id text,
  external_url text,
  embed_url text
)
language sql
security definer
set search_path = public
as $$
  select
    'spotify'::text as provider,
    p_playlist_id::text as playlist_id,
    ('https://open.spotify.com/playlist/' || p_playlist_id)::text as external_url,
    ('https://open.spotify.com/embed/playlist/' || p_playlist_id)::text as embed_url
  where p_playlist_id ~ '^[A-Za-z0-9]{22}$';
$$;

create or replace function public.ha_get_music_playlist(
  p_participant_access_code text
)
returns table (
  provider text,
  playlist_id text,
  external_url text,
  embed_url text
)
language sql
security definer
set search_path = public
as $$
  select playlist.*
  from public.app_settings s
  cross join lateral public.ha_music_playlist_row(s.value::text) playlist
  where s.key = 'music_spotify_playlist_id'
    and public.ha_participant_id_for_access(p_participant_access_code) is not null
  limit 1;
$$;

create or replace function public.ha_admin_get_music_playlist(
  p_participant_access_code text
)
returns table (
  provider text,
  playlist_id text,
  external_url text,
  embed_url text
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
  select playlist.*
  from public.app_settings s
  cross join lateral public.ha_music_playlist_row(s.value::text) playlist
  where s.key = 'music_spotify_playlist_id'
  limit 1;
end;
$$;

create or replace function public.ha_update_music_playlist(
  p_participant_access_code text,
  p_link text
)
returns table (
  provider text,
  playlist_id text,
  external_url text,
  embed_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_playlist_id text := public.ha_spotify_playlist_id(p_link);
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_playlist_id is null then
    raise exception 'unsupported music playlist link' using errcode = '23514';
  end if;

  insert into public.app_settings (
    key,
    value,
    updated_at
  )
  values (
    'music_spotify_playlist_id',
    v_playlist_id,
    now()
  )
  on conflict (key) do update
  set
    value = excluded.value,
    updated_at = excluded.updated_at;

  return query
  select *
  from public.ha_music_playlist_row(v_playlist_id);
end;
$$;

create or replace function public.ha_delete_music_playlist(
  p_participant_access_code text
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

  delete from public.app_settings s
  where s.key = 'music_spotify_playlist_id';
end;
$$;

grant execute on function public.ha_spotify_playlist_id(text) to anon, authenticated;
grant execute on function public.ha_is_supported_music_playlist_link(text) to anon, authenticated;
grant execute on function public.ha_music_playlist_row(text) to anon, authenticated;
grant execute on function public.ha_get_music_playlist(text) to anon, authenticated;
grant execute on function public.ha_admin_get_music_playlist(text) to anon, authenticated;
grant execute on function public.ha_update_music_playlist(text, text) to anon, authenticated;
grant execute on function public.ha_delete_music_playlist(text) to anon, authenticated;

commit;
