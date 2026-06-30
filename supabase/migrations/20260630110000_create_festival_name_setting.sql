-- Store editable application settings such as the public festival name.
-- Apply after 20260630100000_create_category_management_rpcs.sql.

begin;

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  constraint app_settings_value_not_blank check (nullif(trim(value), '') is not null)
);

insert into public.app_settings (key, value)
values ('festival_name', 'Hurricane Awards 2026')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

revoke all on table public.app_settings from anon, authenticated;

drop policy if exists "deny direct app settings access" on public.app_settings;
create policy "deny direct app settings access"
on public.app_settings
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.ha_get_festival_name()
returns text
language sql
security definer
set search_path = public
as $$
  select s.value::text
  from public.app_settings s
  where s.key = 'festival_name'
  limit 1;
$$;

create or replace function public.ha_update_festival_name(
  p_participant_access_code text,
  p_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  v_name := nullif(trim(p_name), '');

  if v_name is null then
    raise exception 'festival name is required' using errcode = '23514';
  end if;

  insert into public.app_settings (
    key,
    value,
    updated_at
  )
  values (
    'festival_name',
    v_name,
    now()
  )
  on conflict (key) do update
  set
    value = excluded.value,
    updated_at = excluded.updated_at;

  return v_name;
end;
$$;

grant execute on function public.ha_get_festival_name() to anon, authenticated;
grant execute on function public.ha_update_festival_name(text, text) to anon, authenticated;

commit;
