-- Allow active participants to update only their own display name and avatar.
-- Apply after 20260709110000_fix_tournament_bye_propagation.sql.

begin;

create or replace function public.ha_update_own_profile(
  p_participant_access_code text,
  p_display_name text,
  p_avatar_id text
)
returns table (
  id text,
  name text,
  display_name text,
  avatar_id text,
  is_admin boolean,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id text;
  v_display_name text := nullif(btrim(p_display_name), '');
  v_avatar_id text := nullif(btrim(p_avatar_id), '');
  v_allowed_avatar_ids constant text[] := array[
    'camp-sunrise', 'neon-tent', 'stage-spark', 'rain-dancer',
    'mellow-moon', 'bass-cloud', 'sun-hat', 'campfire', 'glitter',
    'mainstage', 'golden-hour', 'laser-lime', 'pink-noise', 'blue-hour',
    'orange-amp', 'green-room', 'silver-rain', 'violet-vibe',
    'red-wristband', 'aqua-echo', 'mud-proof', 'disco-dot', 'ticket-stub',
    'late-shift', 'power-nap', 'circle-pit', 'silent-disco', 'fries-first',
    'camp-captain', 'queue-hero', 'poncho-pro', 'setlist', 'blackout',
    'white-noise', 'mint-mosh', 'ruby-riff', 'cobalt-crew', 'banana-beat',
    'violet-amp', 'coral-crowd', 'skyline', 'forest-floor', 'amber-anthem',
    'indigo-intro', 'platinum-pass', 'turbo-teal', 'crimson-chorus',
    'olive-outro', 'magenta-mix', 'denim-drop', 'sunset-slot', 'lime-lineup'
  ];
begin
  v_participant_id := public.ha_participant_id_for_access(
    p_participant_access_code
  );

  if v_participant_id is null then
    raise exception 'participant access required' using errcode = '42501';
  end if;

  if v_display_name is null then
    raise exception 'display name is required' using errcode = '23514';
  end if;

  if char_length(v_display_name) > 50 then
    raise exception 'display name is too long' using errcode = '22001';
  end if;

  if v_avatar_id is null or not (v_avatar_id = any(v_allowed_avatar_ids)) then
    raise exception 'invalid avatar id' using errcode = '23514';
  end if;

  update public.participants p
  set
    display_name = v_display_name,
    avatar_id = v_avatar_id
  where p.id::text = v_participant_id;

  return query
  select
    p.id::text,
    p.name::text,
    p.display_name::text,
    p.avatar_id::text,
    p.is_admin,
    p.is_active
  from public.participants p
  where p.id::text = v_participant_id
  limit 1;
end;
$$;

revoke all on function public.ha_update_own_profile(text, text, text) from public;
grant execute on function public.ha_update_own_profile(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
