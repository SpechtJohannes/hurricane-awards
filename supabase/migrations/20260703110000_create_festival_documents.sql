-- Create festival document metadata and storage access for the info area.
-- Apply after 20260703100000_harden_security_infrastructure.sql.

begin;

create table if not exists public.festival_documents (
  document_type text primary key,
  title text not null,
  file_path text not null,
  mime_type text not null,
  updated_at timestamptz not null default now(),
  constraint festival_documents_document_type_check
    check (document_type in ('timetable', 'site_map')),
  constraint festival_documents_title_not_blank
    check (length(trim(title)) > 0),
  constraint festival_documents_file_path_not_blank
    check (length(trim(file_path)) > 0),
  constraint festival_documents_supported_mime_type
    check (mime_type = 'application/pdf' or mime_type like 'image/%')
);

create table if not exists public.festival_document_uploads (
  file_path text primary key,
  document_type text not null,
  title text not null,
  mime_type text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint festival_document_uploads_document_type_check
    check (document_type in ('timetable', 'site_map')),
  constraint festival_document_uploads_supported_mime_type
    check (mime_type = 'application/pdf' or mime_type like 'image/%')
);

alter table public.festival_documents enable row level security;
alter table public.festival_document_uploads enable row level security;

revoke all on table public.festival_documents from anon, authenticated;
revoke all on table public.festival_document_uploads from anon, authenticated;

drop policy if exists "deny direct festival document access" on public.festival_documents;
create policy "deny direct festival document access"
on public.festival_documents
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny direct festival document upload access" on public.festival_document_uploads;
create policy "deny direct festival document upload access"
on public.festival_document_uploads
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'festival-documents',
  'festival-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "festival documents can be read" on storage.objects;
create policy "festival documents can be read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'festival-documents');

create or replace function public.ha_is_allowed_festival_document_upload(
  p_file_path text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.festival_document_uploads u
    where u.file_path = p_file_path
      and u.expires_at > now()
  );
$$;

drop policy if exists "festival documents can be uploaded" on storage.objects;
create policy "festival documents can be uploaded"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'festival-documents'
  and public.ha_is_allowed_festival_document_upload(name)
);

create or replace function public.ha_list_festival_documents(
  p_participant_access_code text
)
returns table (
  document_type text,
  title text,
  file_path text,
  mime_type text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    d.document_type,
    d.title,
    d.file_path,
    d.mime_type,
    d.updated_at
  from public.festival_documents d
  where public.ha_participant_id_for_access(p_participant_access_code) is not null
  order by case d.document_type
    when 'timetable' then 1
    when 'site_map' then 2
    else 100
  end, d.title asc;
$$;

create or replace function public.ha_admin_list_festival_documents(
  p_participant_access_code text
)
returns table (
  document_type text,
  title text,
  file_path text,
  mime_type text,
  updated_at timestamptz
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
  select
    d.document_type,
    d.title,
    d.file_path,
    d.mime_type,
    d.updated_at
  from public.festival_documents d
  order by case d.document_type
    when 'timetable' then 1
    when 'site_map' then 2
    else 100
  end, d.title asc;
end;
$$;

create or replace function public.ha_create_festival_document_upload(
  p_participant_access_code text,
  p_document_type text,
  p_title text,
  p_file_name text,
  p_mime_type text
)
returns table (
  document_type text,
  title text,
  file_path text,
  mime_type text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document_type text := lower(nullif(trim(p_document_type), ''));
  v_title text := nullif(trim(p_title), '');
  v_file_name text;
  v_file_path text;
  v_mime_type text := lower(nullif(trim(p_mime_type), ''));
  v_expires_at timestamptz := now() + interval '10 minutes';
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_document_type not in ('timetable', 'site_map') then
    raise exception 'invalid document type' using errcode = '23514';
  end if;

  if v_title is null then
    raise exception 'document title is required' using errcode = '23514';
  end if;

  if v_mime_type is null
    or not (v_mime_type = 'application/pdf' or v_mime_type like 'image/%')
  then
    raise exception 'unsupported document file type' using errcode = '23514';
  end if;

  v_file_name := trim(both '-' from regexp_replace(lower(coalesce(p_file_name, 'document')), '[^a-z0-9._-]+', '-', 'g'));
  v_file_name := coalesce(nullif(v_file_name, ''), 'document');
  v_file_path := 'current/' || v_document_type || '/' || gen_random_uuid()::text || '-' || v_file_name;

  delete from public.festival_document_uploads u
  where u.expires_at <= now();

  insert into public.festival_document_uploads (
    file_path,
    document_type,
    title,
    mime_type,
    expires_at
  )
  values (
    v_file_path,
    v_document_type,
    v_title,
    v_mime_type,
    v_expires_at
  );

  return query
  select
    v_document_type,
    v_title,
    v_file_path,
    v_mime_type,
    v_expires_at;
end;
$$;

create or replace function public.ha_upsert_festival_document(
  p_participant_access_code text,
  p_document_type text,
  p_title text,
  p_file_path text,
  p_mime_type text
)
returns table (
  document_type text,
  title text,
  file_path text,
  mime_type text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document_type text := lower(nullif(trim(p_document_type), ''));
  v_title text := nullif(trim(p_title), '');
  v_file_path text := nullif(trim(p_file_path), '');
  v_mime_type text := lower(nullif(trim(p_mime_type), ''));
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_document_type not in ('timetable', 'site_map') then
    raise exception 'invalid document type' using errcode = '23514';
  end if;

  if v_title is null then
    raise exception 'document title is required' using errcode = '23514';
  end if;

  if v_file_path is null then
    raise exception 'document file path is required' using errcode = '23514';
  end if;

  if v_mime_type is null
    or not (v_mime_type = 'application/pdf' or v_mime_type like 'image/%')
  then
    raise exception 'unsupported document file type' using errcode = '23514';
  end if;

  insert into public.festival_documents (
    document_type,
    title,
    file_path,
    mime_type,
    updated_at
  )
  values (
    v_document_type,
    v_title,
    v_file_path,
    v_mime_type,
    now()
  )
  on conflict on constraint festival_documents_pkey do update
  set
    title = excluded.title,
    file_path = excluded.file_path,
    mime_type = excluded.mime_type,
    updated_at = excluded.updated_at;

  return query
  select
    d.document_type,
    d.title,
    d.file_path,
    d.mime_type,
    d.updated_at
  from public.festival_documents d
  where d.document_type = v_document_type;
end;
$$;

create or replace function public.ha_delete_festival_document(
  p_participant_access_code text,
  p_document_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_document_type text := lower(nullif(trim(p_document_type), ''));
begin
  if not public.ha_has_admin_access(p_participant_access_code) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  if v_document_type not in ('timetable', 'site_map') then
    raise exception 'invalid document type' using errcode = '23514';
  end if;

  delete from public.festival_documents d
  where d.document_type = v_document_type;
end;
$$;

grant execute on function public.ha_list_festival_documents(text) to anon, authenticated;
grant execute on function public.ha_admin_list_festival_documents(text) to anon, authenticated;
grant execute on function public.ha_create_festival_document_upload(text, text, text, text, text) to anon, authenticated;
grant execute on function public.ha_upsert_festival_document(text, text, text, text, text) to anon, authenticated;
grant execute on function public.ha_delete_festival_document(text, text) to anon, authenticated;
grant execute on function public.ha_is_allowed_festival_document_upload(text) to anon, authenticated;

commit;
