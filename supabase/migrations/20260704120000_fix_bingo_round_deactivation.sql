-- Replace unsafe Bingo round deletes with explicit deactivation.

alter table public.bingo_rounds
  drop constraint if exists bingo_rounds_status_check;

alter table public.bingo_rounds
  add constraint bingo_rounds_status_check
  check (status in ('active', 'closed'));

create or replace function public.ha_start_bingo_round(
  p_participant_access_code text
)
returns table (
  id uuid,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_participant_id text;
  v_round_id uuid;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_admin_participant_id :=
    public.ha_participant_id_for_access(p_participant_access_code);

  update public.bingo_rounds br
  set status = 'closed'
  where br.status = 'active';

  insert into public.bingo_rounds (created_by_participant_id)
  values (v_admin_participant_id)
  returning bingo_rounds.id into v_round_id;

  return query
  select br.id, br.started_at
  from public.bingo_rounds br
  where br.id = v_round_id;
end;
$$;

create or replace function public.ha_close_bingo_round(
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

  update public.bingo_rounds br
  set status = 'closed'
  where br.status = 'active';
end;
$$;

grant execute on function public.ha_start_bingo_round(text) to anon, authenticated;
grant execute on function public.ha_close_bingo_round(text) to anon, authenticated;
