-- Archive the current festival snapshot into separate immutable archive tables.
-- Apply after 20260630110000_create_festival_name_setting.sql.

begin;

create table if not exists public.festival_archives (
  id uuid primary key default gen_random_uuid(),
  festival_name text not null,
  archived_at timestamptz not null default now(),
  version_label text null,
  created_by_participant_id uuid null
);

create table if not exists public.festival_archive_participants (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.festival_archives(id),
  original_participant_id uuid null,
  display_name text not null,
  access_code text null,
  is_admin boolean not null,
  is_active boolean not null
);

create table if not exists public.festival_archive_categories (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.festival_archives(id),
  original_category_id uuid null,
  name text not null,
  description text null,
  sort_order integer null,
  is_active boolean not null
);

create table if not exists public.festival_archive_votes (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.festival_archives(id),
  original_vote_id uuid null,
  original_voter_id uuid null,
  original_category_id uuid null,
  original_nominee_id uuid null,
  voter_display_name text not null,
  category_name text not null,
  nominee_display_name text not null
);

alter table public.festival_archives enable row level security;
alter table public.festival_archive_participants enable row level security;
alter table public.festival_archive_categories enable row level security;
alter table public.festival_archive_votes enable row level security;

revoke all on table public.festival_archives from anon, authenticated;
revoke all on table public.festival_archive_participants from anon, authenticated;
revoke all on table public.festival_archive_categories from anon, authenticated;
revoke all on table public.festival_archive_votes from anon, authenticated;

drop policy if exists "deny direct festival archive access" on public.festival_archives;
create policy "deny direct festival archive access"
on public.festival_archives
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct festival archive participant access" on public.festival_archive_participants;
create policy "deny direct festival archive participant access"
on public.festival_archive_participants
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct festival archive category access" on public.festival_archive_categories;
create policy "deny direct festival archive category access"
on public.festival_archive_categories
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct festival archive vote access" on public.festival_archive_votes;
create policy "deny direct festival archive vote access"
on public.festival_archive_votes
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.ha_archive_festival(
  p_admin_access_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_archive_id uuid;
  v_created_by_participant_id uuid;
  v_festival_name text;
  v_uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not public.ha_has_admin_access(p_admin_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select
    case
      when p.id::text ~* v_uuid_pattern then p.id::text::uuid
      else null
    end
  into v_created_by_participant_id
  from public.participants p
  where upper(p.access_code) = upper(trim(p_admin_access_code))
    and p.is_admin = true
    and p.is_active = true
  limit 1;

  select s.value::text
  into v_festival_name
  from public.app_settings s
  where s.key = 'festival_name'
  limit 1;

  v_festival_name := nullif(trim(v_festival_name), '');

  if v_festival_name is null then
    raise exception 'festival name is required' using errcode = '23514';
  end if;

  insert into public.festival_archives (
    festival_name,
    created_by_participant_id
  )
  values (
    v_festival_name,
    v_created_by_participant_id
  )
  returning id into v_archive_id;

  insert into public.festival_archive_participants (
    archive_id,
    original_participant_id,
    display_name,
    access_code,
    is_admin,
    is_active
  )
  select
    v_archive_id,
    case
      when p.id::text ~* v_uuid_pattern then p.id::text::uuid
      else null
    end,
    coalesce(nullif(p.display_name::text, ''), p.name::text),
    p.access_code::text,
    p.is_admin,
    p.is_active
  from public.participants p;

  insert into public.festival_archive_categories (
    archive_id,
    original_category_id,
    name,
    description,
    sort_order,
    is_active
  )
  select
    v_archive_id,
    case
      when c.id::text ~* v_uuid_pattern then c.id::text::uuid
      else null
    end,
    c.title::text,
    c.description::text,
    c.sort_order,
    c.status::text = 'open'
  from public.categories c;

  insert into public.festival_archive_votes (
    archive_id,
    original_vote_id,
    original_voter_id,
    original_category_id,
    original_nominee_id,
    voter_display_name,
    category_name,
    nominee_display_name
  )
  select
    v_archive_id,
    null,
    case
      when v.voter_id::text ~* v_uuid_pattern then v.voter_id::text::uuid
      else null
    end,
    case
      when v.category_id::text ~* v_uuid_pattern then v.category_id::text::uuid
      else null
    end,
    case
      when v.voted_for_id::text ~* v_uuid_pattern then v.voted_for_id::text::uuid
      else null
    end,
    coalesce(nullif(voter.display_name::text, ''), voter.name::text, v.voter_id::text),
    coalesce(c.title::text, v.category_id::text),
    coalesce(nullif(nominee.display_name::text, ''), nominee.name::text, v.voted_for_id::text)
  from public.votes v
  left join public.participants voter
    on voter.id = v.voter_id
  left join public.categories c
    on c.id = v.category_id
  left join public.participants nominee
    on nominee.id = v.voted_for_id;

  return v_archive_id;
end;
$$;

grant execute on function public.ha_archive_festival(text) to anon, authenticated;

commit;
