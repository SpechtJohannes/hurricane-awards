-- Allow admins to atomically reset a drawn random pairing action to draft.

create or replace function public.ha_admin_reset_random_pairing_action(
  p_participant_access_code text,
  p_festival_id text,
  p_action_id uuid
)
returns table (
  id uuid,
  festival_id text,
  name text,
  status text,
  selected_participant_ids text[],
  assignments jsonb,
  created_at timestamptz,
  drawn_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if p_festival_id is null or btrim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '22023';
  end if;

  select rpa.id
  into v_action_id
  from public.random_pairing_actions rpa
  where rpa.id = p_action_id
    and rpa.festival_id = p_festival_id
  for update;

  if v_action_id is null then
    raise exception 'random pairing action not found' using errcode = 'P0002';
  end if;

  delete from public.random_pairing_assignments rpas
  where rpas.action_id = v_action_id;

  update public.random_pairing_actions rpa
  set status = 'draft',
      drawn_at = null
  where rpa.id = v_action_id;

  return query
  select *
  from public.ha_admin_list_random_pairing_actions(
    p_participant_access_code,
    p_festival_id
  ) listed_actions
  where listed_actions.id = v_action_id;
end;
$$;

revoke all on function public.ha_admin_reset_random_pairing_action(text, text, uuid)
  from public;
grant execute on function public.ha_admin_reset_random_pairing_action(text, text, uuid)
  to anon, authenticated;

notify pgrst, 'reload schema';
