-- Bring existing tournament tables in line with the current table shape.

alter table public.tournaments
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists festival_id text,
  add column if not exists name text,
  add column if not exists mode text not null default 'ko',
  add column if not exists status text not null default 'active',
  add column if not exists selected_participant_ids text[] not null default array[]::text[],
  add column if not exists draw_participant_ids text[] not null default array[]::text[],
  add column if not exists qualification_ranking_ids text[] not null default array[]::text[],
  add column if not exists bracket jsonb not null default '{"type":"single_elimination","rounds":[]}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by_participant_id text;

alter table public.tournaments
  alter column id set default gen_random_uuid(),
  alter column mode set default 'ko',
  alter column status set default 'active',
  alter column selected_participant_ids set default array[]::text[],
  alter column draw_participant_ids set default array[]::text[],
  alter column qualification_ranking_ids set default array[]::text[],
  alter column bracket set default '{"type":"single_elimination","rounds":[]}'::jsonb,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.tournaments
  alter column id set not null,
  alter column festival_id set not null,
  alter column name set not null,
  alter column mode set not null,
  alter column status set not null,
  alter column selected_participant_ids set not null,
  alter column draw_participant_ids set not null,
  alter column qualification_ranking_ids set not null,
  alter column bracket set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.tournaments
  drop constraint if exists tournaments_status_check,
  drop constraint if exists tournaments_mode_check,
  drop constraint if exists tournaments_name_required,
  drop constraint if exists tournaments_bracket_object;

alter table public.tournaments
  add constraint tournaments_status_check
    check (status in ('draft', 'active')),
  add constraint tournaments_mode_check
    check (mode in ('ko', 'knockout', 'qualification_knockout')),
  add constraint tournaments_name_required
    check (btrim(name) <> ''),
  add constraint tournaments_bracket_object
    check (jsonb_typeof(bracket) = 'object');
