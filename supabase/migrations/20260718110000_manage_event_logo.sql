-- Add a festival-scoped event logo backed by a dedicated public Storage bucket.

begin;

alter table public.app_settings
  add column if not exists event_logo_path text,
  add column if not exists event_logo_mime_type text;

alter table public.app_settings
  drop constraint if exists app_settings_event_logo_consistent;
alter table public.app_settings
  add constraint app_settings_event_logo_consistent check (
    (event_logo_path is null and event_logo_mime_type is null)
    or (
      length(trim(event_logo_path)) > 0
      and event_logo_mime_type in ('image/png', 'image/jpeg', 'image/webp')
    )
  );

create table if not exists public.event_logo_uploads (
  file_path text primary key,
  festival_id text not null,
  mime_type text not null,
  file_size bigint not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint event_logo_uploads_mime_type_check
    check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  constraint event_logo_uploads_file_size_check
    check (file_size > 0 and file_size <= 2097152)
);

alter table public.event_logo_uploads enable row level security;
revoke all on table public.event_logo_uploads from anon, authenticated;
drop policy if exists "deny direct event logo upload access" on public.event_logo_uploads;
create policy "deny direct event logo upload access"
on public.event_logo_uploads
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-logos',
  'event-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "event logos are publicly readable" on storage.objects;
create policy "event logos are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-logos');

create or replace function public.ha_is_allowed_event_logo_upload(p_file_path text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_logo_uploads u
    where u.file_path = p_file_path
      and u.expires_at > now()
  );
$$;

drop policy if exists "authorized event logos can be uploaded" on storage.objects;
create policy "authorized event logos can be uploaded"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'event-logos'
  and public.ha_is_allowed_event_logo_upload(name)
);

-- The OUT columns are part of the function return type, so adding the logo
-- columns requires dropping and recreating the zero-argument function.
drop function if exists public.ha_get_event_settings();

create function public.ha_get_event_settings()
returns table (
  event_name text,
  event_start_date date,
  event_end_date date,
  event_logo_path text,
  event_logo_mime_type text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(s.value, ''),
    s.event_start_date,
    s.event_end_date,
    s.event_logo_path,
    s.event_logo_mime_type
  from public.app_settings s
  where s.key = 'festival_name';
$$;

create or replace function public.ha_create_event_logo_upload(
  p_participant_access_code text,
  p_festival_id text,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint
)
returns table (file_path text, mime_type text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_festival_id text := nullif(trim(p_festival_id), '');
  v_file_name text;
  v_file_path text;
  v_mime_type text := lower(nullif(trim(p_mime_type), ''));
  v_expires_at timestamptz := now() + interval '10 minutes';
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if v_festival_id is null then
    raise exception 'festival id is required' using errcode = '23514';
  end if;
  if v_mime_type not in ('image/png', 'image/jpeg', 'image/webp') then
    raise exception 'unsupported event logo file type' using errcode = '23514';
  end if;
  if p_file_size is null or p_file_size <= 0 or p_file_size > 2097152 then
    raise exception 'event logo file is too large' using errcode = '23514';
  end if;

  v_file_name := trim(both '-' from regexp_replace(
    lower(coalesce(p_file_name, 'logo')),
    '[^a-z0-9._-]+', '-', 'g'
  ));
  v_file_name := coalesce(nullif(v_file_name, ''), 'logo');
  v_file_path := v_festival_id || '/' || gen_random_uuid()::text || '-' || v_file_name;

  delete from public.event_logo_uploads u where u.expires_at <= now();
  insert into public.event_logo_uploads (
    file_path, festival_id, mime_type, file_size, expires_at
  ) values (
    v_file_path, v_festival_id, v_mime_type, p_file_size, v_expires_at
  );

  return query select v_file_path, v_mime_type, v_expires_at;
end;
$$;

create or replace function public.ha_admin_finalize_event_logo(
  p_participant_access_code text,
  p_festival_id text,
  p_file_path text
)
returns text
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_upload public.event_logo_uploads%rowtype;
  v_old_path text;
  v_object_size bigint;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select * into v_upload
  from public.event_logo_uploads u
  where u.file_path = p_file_path
    and u.festival_id = p_festival_id
    and u.expires_at > now();
  if v_upload.file_path is null then
    raise exception 'event logo upload is not authorized' using errcode = '42501';
  end if;

  select nullif(o.metadata ->> 'size', '')::bigint
  into v_object_size
  from storage.objects o
  where o.bucket_id = 'event-logos' and o.name = v_upload.file_path;
  if v_object_size is null or v_object_size > 2097152 then
    raise exception 'event logo object is missing or too large' using errcode = '23514';
  end if;

  select s.event_logo_path into v_old_path
  from public.app_settings s where s.key = 'festival_name'
  for update;

  update public.app_settings s
  set event_logo_path = v_upload.file_path,
      event_logo_mime_type = v_upload.mime_type,
      updated_at = now()
  where s.key = 'festival_name';

  delete from public.event_logo_uploads u where u.file_path = v_upload.file_path;
  if v_old_path is not null and v_old_path <> v_upload.file_path then
    delete from storage.objects o
    where o.bucket_id = 'event-logos' and o.name = v_old_path;
  end if;
  return v_upload.file_path;
end;
$$;

create or replace function public.ha_admin_remove_event_logo(
  p_participant_access_code text,
  p_festival_id text
)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_old_path text;
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;
  if p_festival_id is null or trim(p_festival_id) = '' then
    raise exception 'festival id is required' using errcode = '23514';
  end if;

  select s.event_logo_path into v_old_path
  from public.app_settings s where s.key = 'festival_name'
  for update;
  if v_old_path is not null and v_old_path not like p_festival_id || '/%' then
    raise exception 'event logo belongs to another festival' using errcode = '42501';
  end if;

  update public.app_settings s
  set event_logo_path = null, event_logo_mime_type = null, updated_at = now()
  where s.key = 'festival_name';
  delete from storage.objects o
  where o.bucket_id = 'event-logos' and o.name = v_old_path;
end;
$$;

revoke all on function public.ha_get_event_settings() from public;
revoke all on function public.ha_create_event_logo_upload(text, text, text, text, bigint) from public;
revoke all on function public.ha_admin_finalize_event_logo(text, text, text) from public;
revoke all on function public.ha_admin_remove_event_logo(text, text) from public;
grant execute on function public.ha_get_event_settings() to anon, authenticated;
grant execute on function public.ha_create_event_logo_upload(text, text, text, text, bigint) to anon, authenticated;
grant execute on function public.ha_admin_finalize_event_logo(text, text, text) to anon, authenticated;
grant execute on function public.ha_admin_remove_event_logo(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
