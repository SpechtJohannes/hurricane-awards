/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const baseMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260628123000_secure_data_access.sql',
  ),
  'utf8',
)
const adminMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260628133000_restrict_admin_functions.sql',
  ),
  'utf8',
)
const activeParticipantMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260628143000_add_participant_active_flag.sql',
  ),
  'utf8',
)
const participantManagementMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260628153000_create_participant_management_rpcs.sql',
  ),
  'utf8',
)
const dataIntegrityMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260629100000_enforce_data_integrity.sql',
  ),
  'utf8',
)
const categoryManagementMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260630100000_create_category_management_rpcs.sql',
  ),
  'utf8',
)
const festivalNameMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260630110000_create_festival_name_setting.sql',
  ),
  'utf8',
)
const festivalArchiveMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260630120000_create_festival_archives.sql',
  ),
  'utf8',
)
const secureParticipantLoginMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260630130000_secure_participant_login.sql',
  ),
  'utf8',
)
const festivalAccessCodeMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260701070000_manage_festival_access_code.sql',
  ),
  'utf8',
)
const secureFestivalAccessCodeMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260702090000_secure_festival_access_code.sql',
  ),
  'utf8',
)
const hardeningMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260703100000_harden_security_infrastructure.sql',
  ),
  'utf8',
)
const festivalDocumentsMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260703110000_create_festival_documents.sql',
  ),
  'utf8',
)
const campLocationMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260703120000_create_camp_location_link.sql',
  ),
  'utf8',
)
const musicPlaylistMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260703130000_create_music_playlist_setting.sql',
  ),
  'utf8',
)
const bingoMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260704110000_create_bingo.sql',
  ),
  'utf8',
)
const bingoFixMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260704120000_fix_bingo_round_deactivation.sql',
  ),
  'utf8',
)
const timetableMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705100000_create_timetable.sql',
  ),
  'utf8',
)
const festivalDaysManagementMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705110000_manage_festival_days.sql',
  ),
  'utf8',
)
const timetableStagesManagementMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705120000_manage_timetable_stages.sql',
  ),
  'utf8',
)
const timetableActsManagementMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705130000_manage_timetable_acts.sql',
  ),
  'utf8',
)
const timetablePerformancesManagementMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705140000_manage_timetable_performances.sql',
  ),
  'utf8',
)
const timetableFavoritesMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705150000_create_timetable_favorites.sql',
  ),
  'utf8',
)
const timetableSharedFavoritesMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705160000_show_timetable_favorite_participants.sql',
  ),
  'utf8',
)
const timetableStageColorsMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260705170000_add_timetable_stage_colors.sql',
  ),
  'utf8',
)
const horseRacingMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260708100000_create_horse_racing.sql',
  ),
  'utf8',
)

describe('Supabase Sicherheitsmigration', () => {
  it('aktiviert RLS fuer geschuetzte Tabellen und entzieht direkte Browserrechte', () => {
    for (const table of [
      'participants',
      'categories',
      'votes',
      'archived_votes',
    ]) {
      expect(baseMigration).toContain(
        `alter table public.${table} enable row level security`,
      )
      expect(baseMigration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      )
    }

    expect(baseMigration).toContain(
      "revoke all on table public.all_time_standings from anon, authenticated",
    )
    expect(baseMigration).toContain(
      'alter table public.all_time_standings enable row level security',
    )
  })

  it('stellt nur gezielte RPC Funktionen fuer anon und authenticated bereit', () => {
    for (const functionName of [
      'ha_find_participant',
      'ha_list_participants',
      'ha_list_categories',
      'ha_list_participant_votes',
      'ha_list_result_votes',
      'ha_save_vote',
      'ha_update_category_status',
      'ha_delete_category_votes',
      'ha_list_all_time_standings',
    ]) {
      expect(baseMigration).toContain(`function public.${functionName}`)
      expect(baseMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }
  })

  it('bildet in der Basismigration die bestehende Adminlogik ohne neues Adminfeld ab', () => {
    expect(baseMigration).toContain('public.ha_has_admin_access')
    expect(baseMigration).toContain(
      'select public.ha_participant_id_for_access(p_participant_access_code) is not null',
    )
    expect(baseMigration).toContain('admin access required')
    expect(baseMigration).not.toContain("column_name = 'is_admin'")
    expect(baseMigration).not.toContain('add column if not exists is_admin')
  })

  it('schraenkt Adminfunktionen in einer Folgemigration auf Adminteilnehmer ein', () => {
    expect(adminMigration).toContain(
      'add column if not exists is_admin boolean not null default false',
    )
    expect(adminMigration).toContain('p.is_admin = true')
    expect(adminMigration).toContain('create or replace function public.ha_has_admin_access')
    expect(adminMigration).toContain('drop function if exists public.ha_find_participant(text)')
    expect(adminMigration).toContain('is_admin boolean')
  })

  it('erkennt nur aktive Teilnehmer als gueltigen serverseitigen Zugriff', () => {
    expect(activeParticipantMigration).toContain(
      'add column if not exists is_active boolean not null default true',
    )
    expect(activeParticipantMigration).toContain(
      'create or replace function public.ha_participant_id_for_access',
    )
    expect(activeParticipantMigration).toContain(
      'create or replace function public.ha_find_participant',
    )
    expect(activeParticipantMigration).toContain('is_active boolean')
    expect(activeParticipantMigration).toContain(
      'p.name::text, p.display_name::text, p.is_admin, p.is_active',
    )
    expect(activeParticipantMigration).toContain(
      'create or replace function public.ha_has_admin_access',
    )
    expect(activeParticipantMigration.match(/and p\.is_active = true/g)).toHaveLength(3)
  })

  it('stellt Admin RPCs fuer die Teilnehmerverwaltung bereit', () => {
    for (const functionName of [
      'ha_admin_list_participants',
      'ha_suggest_participant_access_code',
      'ha_create_participant',
      'ha_update_participant',
      'ha_deactivate_participant',
      'ha_reactivate_participant',
    ]) {
      expect(participantManagementMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(participantManagementMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(participantManagementMigration).toContain(
      "v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'",
    )
    expect(participantManagementMigration).toContain(
      'participant access code already exists',
    )
    expect(participantManagementMigration).toContain('display name is required')
    expect(
      participantManagementMigration.match(
        /if not public\.ha_has_admin_access\(p_participant_access_code\)/g,
      ),
    ).toHaveLength(6)
    expect(participantManagementMigration).toContain('set is_active = false')
    expect(participantManagementMigration).toContain('set is_active = true')
  })

  it('erzwingt Teilnehmercodes case insensitive serverseitig eindeutig', () => {
    expect(dataIntegrityMigration).toContain(
      'create unique index if not exists participants_access_code_upper_unique',
    )
    expect(dataIntegrityMigration).toContain(
      'on public.participants (upper(access_code))',
    )
    expect(dataIntegrityMigration).toContain('where access_code is not null')
    expect(dataIntegrityMigration.match(/when unique_violation then/g)).toHaveLength(3)
    expect(dataIntegrityMigration.match(
      /participant access code already exists/g,
    )).toHaveLength(2)
  })

  it('erzwingt eine Stimme pro Waehler und Kategorie serverseitig eindeutig', () => {
    expect(dataIntegrityMigration).toContain(
      'create unique index if not exists votes_voter_category_unique',
    )
    expect(dataIntegrityMigration).toContain(
      'on public.votes (voter_id, category_id)',
    )
    expect(dataIntegrityMigration).toContain(
      "raise exception 'vote already exists for category' using errcode = '23505'",
    )
  })

  it('definiert nur die fuer Integritaetsfehler relevanten RPCs neu', () => {
    expect(
      dataIntegrityMigration.match(/create or replace function public\.(\w+)/g),
    ).toEqual([
      'create or replace function public.ha_create_participant',
      'create or replace function public.ha_update_participant',
      'create or replace function public.ha_save_vote',
    ])

    for (const functionName of [
      'ha_normalize_participant_access_code',
      'ha_generate_participant_access_code',
      'ha_admin_participant_row',
      'ha_admin_list_participants',
      'ha_suggest_participant_access_code',
      'ha_create_participant',
      'ha_update_participant',
      'ha_deactivate_participant',
      'ha_reactivate_participant',
    ]) {
      const expectedCount =
        functionName === 'ha_create_participant' ||
        functionName === 'ha_update_participant'
          ? 1
          : 0

      expect(
        dataIntegrityMigration.match(
          new RegExp(`create or replace function public\\.${functionName}\\(`, 'g'),
        )?.length ?? 0,
      ).toBe(expectedCount)
    }
  })

  it('stellt Admin RPCs fuer die Kategorienverwaltung bereit', () => {
    for (const functionName of [
      'ha_admin_list_categories',
      'ha_create_category',
      'ha_update_category',
      'ha_delete_category',
    ]) {
      expect(categoryManagementMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(categoryManagementMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(categoryManagementMigration).toContain(
      'create or replace function public.ha_admin_category_row',
    )
    expect(categoryManagementMigration).toContain(
      'revoke all on function public.ha_admin_category_row(text) from public',
    )
    expect(
      categoryManagementMigration.match(
        /if not public\.ha_has_admin_access\(p_participant_access_code\)/g,
      ),
    ).toHaveLength(4)
    expect(categoryManagementMigration).toContain('category title is required')
    expect(categoryManagementMigration).toContain('invalid status')
    expect(categoryManagementMigration).toContain('category not found')
    expect(categoryManagementMigration).toContain(
      'category cannot be deleted while votes exist',
    )
    expect(categoryManagementMigration).toContain('from public.votes v')
    expect(categoryManagementMigration).toContain('from public.archived_votes av')
  })

  it('speichert den Festivalnamen zentral und schuetzt direkte Settings-Zugriffe', () => {
    expect(festivalNameMigration).toContain(
      'create table if not exists public.app_settings',
    )
    expect(festivalNameMigration).toContain(
      'alter table public.app_settings enable row level security',
    )
    expect(festivalNameMigration).toContain(
      'revoke all on table public.app_settings from anon, authenticated',
    )
    expect(festivalNameMigration).toContain(
      'create policy "deny direct app settings access"',
    )
    expect(festivalNameMigration).toContain(
      "values ('festival_name', 'Hurricane Awards 2026')",
    )

    for (const functionName of [
      'ha_get_festival_name',
      'ha_update_festival_name',
    ]) {
      expect(festivalNameMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(festivalNameMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(festivalNameMigration).toContain(
      'if not public.ha_has_admin_access(p_participant_access_code)',
    )
    expect(festivalNameMigration).toContain('festival name is required')
    expect(festivalNameMigration).toContain(
      'constraint app_settings_value_not_blank',
    )
  })

  it('verwaltet den Festivalcode ueber geschuetzte Settings RPCs', () => {
    expect(festivalAccessCodeMigration).not.toContain('HURRICANE2026')

    for (const functionName of [
      'ha_get_festival_access_version',
      'ha_verify_festival_access_code',
      'ha_get_festival_access_code',
      'ha_update_festival_access_code',
    ]) {
      expect(festivalAccessCodeMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(festivalAccessCodeMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(festivalAccessCodeMigration).toContain(
      'if not public.ha_has_admin_access(p_participant_access_code)',
    )
    expect(festivalAccessCodeMigration).toContain(
      'festival access code is required',
    )
    expect(festivalAccessCodeMigration).toContain(
      "where s.key = 'festival_access_code'",
    )
    expect(festivalAccessCodeMigration).not.toContain(
      'create table if not exists public.festivals',
    )
  })

  it('schuetzt den Festivalcode serverseitig gegen Code Erraten', () => {
    expect(secureFestivalAccessCodeMigration).toContain(
      "upper(s.value) = 'HURRICANE2026'",
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'create table if not exists public.festival_access_attempts',
    )
    expect(secureFestivalAccessCodeMigration).toContain('festival_id text not null')
    expect(secureFestivalAccessCodeMigration).toContain('technical_key text not null')
    expect(secureFestivalAccessCodeMigration).toContain(
      'primary key (festival_id, technical_key)',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'alter table public.festival_access_attempts enable row level security',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'revoke all on table public.festival_access_attempts from anon, authenticated',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'create policy "deny direct festival access attempt access"',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'create or replace function public.ha_festival_access_rate_limit_key',
    )
    expect(secureFestivalAccessCodeMigration).toContain('request.headers')
    expect(secureFestivalAccessCodeMigration).toContain('digest(')
    expect(
      secureFestivalAccessCodeMigration.match(
        /create table if not exists public\.festival_access_attempts \(([\s\S]*?)\n\);/,
      )?.[1] ?? '',
    ).not.toContain('access_code')
    expect(secureFestivalAccessCodeMigration).toContain(
      'drop function if exists public.ha_verify_festival_access_code(text)',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'create or replace function public.ha_verify_festival_access_code',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'v_max_failed_attempts constant integer := 3',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      "v_lock_duration constant interval := interval '30 seconds'",
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      "select false, null::text, 'blocked'::text",
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      "select true, v_access_version, 'success'::text",
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      "select false, null::text, 'invalid'::text",
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'v_failed_attempts := coalesce(v_attempt.failed_attempts, 0) + 1',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'failed_attempts = excluded.failed_attempts',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'delete from public.festival_access_attempts faa',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'grant execute on function public.ha_verify_festival_access_code(text, text) to anon, authenticated',
    )
    expect(secureFestivalAccessCodeMigration).toContain(
      'revoke all on function public.ha_festival_access_rate_limit_key(text) from public',
    )
  })

  it('erzwingt Adminberechtigungen in allen Admin RPC Migrationen', () => {
    const adminRpcExpectations = [
      [participantManagementMigration, 'ha_admin_list_participants'],
      [participantManagementMigration, 'ha_suggest_participant_access_code'],
      [participantManagementMigration, 'ha_create_participant'],
      [participantManagementMigration, 'ha_update_participant'],
      [participantManagementMigration, 'ha_deactivate_participant'],
      [participantManagementMigration, 'ha_reactivate_participant'],
      [categoryManagementMigration, 'ha_admin_list_categories'],
      [categoryManagementMigration, 'ha_create_category'],
      [categoryManagementMigration, 'ha_update_category'],
      [categoryManagementMigration, 'ha_delete_category'],
      [festivalNameMigration, 'ha_update_festival_name'],
      [festivalArchiveMigration, 'ha_archive_festival'],
      [festivalAccessCodeMigration, 'ha_get_festival_access_code'],
      [festivalAccessCodeMigration, 'ha_update_festival_access_code'],
      [festivalDocumentsMigration, 'ha_admin_list_festival_documents'],
      [festivalDocumentsMigration, 'ha_create_festival_document_upload'],
      [festivalDocumentsMigration, 'ha_upsert_festival_document'],
      [festivalDocumentsMigration, 'ha_delete_festival_document'],
      [campLocationMigration, 'ha_admin_get_camp_location_link'],
      [campLocationMigration, 'ha_update_camp_location_link'],
      [campLocationMigration, 'ha_delete_camp_location_link'],
      [musicPlaylistMigration, 'ha_admin_get_music_playlist'],
      [musicPlaylistMigration, 'ha_update_music_playlist'],
      [musicPlaylistMigration, 'ha_delete_music_playlist'],
      [bingoMigration, 'ha_admin_get_bingo_round'],
      [bingoMigration, 'ha_start_bingo_round'],
      [bingoMigration, 'ha_close_bingo_round'],
      [festivalDaysManagementMigration, 'ha_admin_list_festival_days'],
      [festivalDaysManagementMigration, 'ha_create_festival_day'],
      [festivalDaysManagementMigration, 'ha_update_festival_day'],
      [festivalDaysManagementMigration, 'ha_delete_festival_day'],
      [timetableStagesManagementMigration, 'ha_admin_list_timetable_stages'],
      [timetableStagesManagementMigration, 'ha_create_timetable_stage'],
      [timetableStagesManagementMigration, 'ha_update_timetable_stage'],
      [timetableStagesManagementMigration, 'ha_delete_timetable_stage'],
      [timetableActsManagementMigration, 'ha_admin_list_timetable_acts'],
      [timetableActsManagementMigration, 'ha_create_timetable_act'],
      [timetableActsManagementMigration, 'ha_update_timetable_act'],
      [timetableActsManagementMigration, 'ha_delete_timetable_act'],
      [
        timetablePerformancesManagementMigration,
        'ha_admin_list_timetable_performances',
      ],
      [
        timetablePerformancesManagementMigration,
        'ha_create_timetable_performance',
      ],
      [
        timetablePerformancesManagementMigration,
        'ha_update_timetable_performance',
      ],
      [
        timetablePerformancesManagementMigration,
        'ha_delete_timetable_performance',
      ],
    ] as const

    for (const [migration, functionName] of adminRpcExpectations) {
      const functionBody =
        migration.match(
          new RegExp(
            `create or replace function public\\.${functionName}[\\s\\S]*?\\n\\$\\$;`,
          ),
        )?.[0] ?? ''

      expect(functionBody, functionName).toContain('ha_has_admin_access')
      expect(functionBody, functionName).toContain('admin access required')
    }
  })

  it('archiviert Festivaldaten in getrennte geschuetzte Archivtabellen', () => {
    for (const table of [
      'festival_archives',
      'festival_archive_participants',
      'festival_archive_categories',
      'festival_archive_votes',
    ]) {
      expect(festivalArchiveMigration).toContain(
        `create table if not exists public.${table}`,
      )
      expect(festivalArchiveMigration).toContain(
        `alter table public.${table} enable row level security`,
      )
      expect(festivalArchiveMigration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      )
    }

    expect(festivalArchiveMigration).toContain(
      'create or replace function public.ha_archive_festival',
    )
    expect(festivalArchiveMigration).toContain(
      'if not public.ha_has_admin_access(p_admin_access_code)',
    )
    expect(festivalArchiveMigration).toContain(
      'grant execute on function public.ha_archive_festival(text) to anon, authenticated',
    )
    expect(festivalArchiveMigration).toContain('from public.app_settings s')
    expect(festivalArchiveMigration).toContain('from public.participants p')
    expect(festivalArchiveMigration).toContain('from public.categories c')
    expect(festivalArchiveMigration).toContain('from public.votes v')
    expect(festivalArchiveMigration).toContain('voter_display_name')
    expect(festivalArchiveMigration).toContain('category_name')
    expect(festivalArchiveMigration).toContain('nominee_display_name')
    expect(festivalArchiveMigration).not.toContain(
      'references public.participants',
    )
    expect(festivalArchiveMigration).not.toContain('references public.categories')
    expect(festivalArchiveMigration).not.toContain('references public.votes')
  })

  it('schuetzt Teilnehmerlogin serverseitig gegen Code Erraten', () => {
    expect(secureParticipantLoginMigration).toContain(
      'create table if not exists public.participant_login_attempts',
    )
    expect(secureParticipantLoginMigration).toContain('festival_id text not null')
    expect(secureParticipantLoginMigration).toContain('technical_key text not null')
    expect(secureParticipantLoginMigration).toContain(
      'primary key (festival_id, technical_key)',
    )
    expect(secureParticipantLoginMigration).toContain(
      'alter table public.participant_login_attempts enable row level security',
    )
    expect(secureParticipantLoginMigration).toContain(
      'revoke all on table public.participant_login_attempts from anon, authenticated',
    )
    expect(secureParticipantLoginMigration).toContain(
      'create or replace function public.ha_login_rate_limit_key',
    )
    expect(secureParticipantLoginMigration).toContain('current_setting')
    expect(secureParticipantLoginMigration).toContain('request.headers')
    expect(secureParticipantLoginMigration).toContain('digest(')
    expect(secureParticipantLoginMigration).not.toContain('p_access_code,')
    expect(secureParticipantLoginMigration).toContain(
      'v_max_failed_attempts constant integer := 3',
    )
    expect(secureParticipantLoginMigration).toContain(
      "v_lock_duration constant interval := interval '30 seconds'",
    )
    expect(secureParticipantLoginMigration).toContain(
      'create or replace function public.ha_login_participant',
    )
    expect(secureParticipantLoginMigration).toContain("select 'invalid'::text")
    expect(secureParticipantLoginMigration).toContain("select 'blocked'::text")
    expect(secureParticipantLoginMigration).toMatch(/'success'::text/)
    expect(secureParticipantLoginMigration).toContain('and p.is_active = true')
    expect(secureParticipantLoginMigration).toContain(
      'v_failed_attempts := coalesce(v_attempt.failed_attempts, 0) + 1',
    )
    expect(secureParticipantLoginMigration).toContain(
      'failed_attempts = excluded.failed_attempts',
    )
    expect(secureParticipantLoginMigration).toContain('v_locked_until := case')
    expect(secureParticipantLoginMigration).toContain(
      'then now() + v_lock_duration',
    )
    expect(secureParticipantLoginMigration).toContain(
      'locked_until = excluded.locked_until',
    )
    expect(secureParticipantLoginMigration).toContain(
      'delete from public.participant_login_attempts pla',
    )
    expect(
      secureParticipantLoginMigration.match(
        /create table if not exists public\.participant_login_attempts \(([\s\S]*?)\n\);/,
      )?.[1] ?? '',
    ).not.toContain('access_code')
    expect(secureParticipantLoginMigration).toContain(
      'grant execute on function public.ha_login_participant(text, text) to anon, authenticated',
    )
    expect(secureParticipantLoginMigration).toContain(
      'revoke all on function public.ha_find_participant(text) from anon, authenticated',
    )
  })

  it('haertet Archivdaten und interne RPC Helper in einer Folgemigration', () => {
    expect(hardeningMigration).toContain(
      'alter table public.festival_archive_participants',
    )
    expect(hardeningMigration).toContain('drop column if exists access_code')
    expect(hardeningMigration).toContain(
      'create or replace function public.ha_archive_festival',
    )
    expect(
      hardeningMigration.match(
        /insert into public\.festival_archive_participants \(([\s\S]*?)\n {2}\)\n {2}select/,
      )?.[1] ?? '',
    ).not.toContain('access_code')

    for (const helperSignature of [
      'public.ha_participant_id_for_access(text)',
      'public.ha_has_admin_access(text)',
      'public.ha_normalize_participant_access_code(text)',
      'public.ha_generate_participant_access_code()',
      'public.ha_admin_participant_row(text)',
      'public.ha_admin_category_row(text)',
      'public.ha_login_rate_limit_key(text)',
      'public.ha_festival_access_rate_limit_key(text)',
    ]) {
      expect(hardeningMigration).toContain(
        `revoke all on function ${helperSignature} from anon, authenticated`,
      )
    }

    expect(hardeningMigration).toContain(
      "v_festival_id text := coalesce(nullif(left(trim(p_festival_id), 64), ''), 'current')",
    )
    expect(hardeningMigration).toContain(
      "public.ha_normalize_participant_access_code(left(coalesce(p_access_code, ''), 128))",
    )
    expect(hardeningMigration).toContain(
      "upper(nullif(trim(left(coalesce(p_access_code, ''), 128)), ''))",
    )
    expect(hardeningMigration).toContain(
      'grant execute on function public.ha_login_participant(text, text) to anon, authenticated',
    )
    expect(hardeningMigration).toContain(
      'grant execute on function public.ha_verify_festival_access_code(text, text) to anon, authenticated',
    )
  })

  it('legt Festivaldokumente mit geschuetzter Metadatentabelle und Storage Bucket an', () => {
    expect(festivalDocumentsMigration).toContain(
      'create table if not exists public.festival_documents',
    )
    expect(festivalDocumentsMigration).toContain(
      'create table if not exists public.festival_document_uploads',
    )
    expect(festivalDocumentsMigration).toContain(
      'document_type text primary key',
    )
    expect(festivalDocumentsMigration).toContain(
      "document_type in ('timetable', 'site_map')",
    )
    expect(festivalDocumentsMigration).toContain(
      "mime_type = 'application/pdf' or mime_type like 'image/%'",
    )
    expect(festivalDocumentsMigration).toContain(
      'alter table public.festival_documents enable row level security',
    )
    expect(festivalDocumentsMigration).toContain(
      'alter table public.festival_document_uploads enable row level security',
    )
    expect(festivalDocumentsMigration).toContain(
      'revoke all on table public.festival_documents from anon, authenticated',
    )
    expect(festivalDocumentsMigration).toContain(
      'revoke all on table public.festival_document_uploads from anon, authenticated',
    )
    expect(festivalDocumentsMigration).toContain(
      'create policy "deny direct festival document access"',
    )
    expect(festivalDocumentsMigration).toContain("'festival-documents'")
    expect(festivalDocumentsMigration).toContain(
      "allowed_mime_types",
    )
    expect(festivalDocumentsMigration).toContain(
      'create policy "festival documents can be read"',
    )
    expect(festivalDocumentsMigration).toContain(
      'create policy "festival documents can be uploaded"',
    )
    expect(festivalDocumentsMigration).toContain(
      'public.ha_is_allowed_festival_document_upload(name)',
    )

    for (const functionName of [
      'ha_is_allowed_festival_document_upload',
      'ha_list_festival_documents',
      'ha_admin_list_festival_documents',
      'ha_create_festival_document_upload',
      'ha_upsert_festival_document',
      'ha_delete_festival_document',
    ]) {
      expect(festivalDocumentsMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(festivalDocumentsMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    const upsertFunctionBody =
      festivalDocumentsMigration.match(
        /create or replace function public\.ha_upsert_festival_document[\s\S]*?\n\$\$;/,
      )?.[0] ?? ''

    expect(upsertFunctionBody).toContain(
      'p_document_type text',
    )
    expect(upsertFunctionBody).toContain(
      'p_title text',
    )
    expect(upsertFunctionBody).toContain(
      'p_file_path text',
    )
    expect(upsertFunctionBody).toContain(
      'p_mime_type text',
    )
    expect(upsertFunctionBody).toContain(
      'on conflict on constraint festival_documents_pkey do update',
    )
    expect(upsertFunctionBody).toContain('d.document_type')
    expect(upsertFunctionBody).not.toContain('on conflict (document_type)')
  })

  it('speichert genau einen Campstandort Link in den App Settings', () => {
    expect(campLocationMigration).toContain(
      "where s.key = 'camp_location_link'",
    )
    expect(campLocationMigration).toContain("'camp_location_link'")
    expect(campLocationMigration).toContain(
      'delete from public.app_settings s',
    )
    expect(campLocationMigration).not.toContain('latitude')
    expect(campLocationMigration).not.toContain('longitude')
    expect(campLocationMigration).not.toContain('gps')

    for (const functionName of [
      'ha_is_supported_camp_location_link',
      'ha_get_camp_location_link',
      'ha_admin_get_camp_location_link',
      'ha_update_camp_location_link',
      'ha_delete_camp_location_link',
    ]) {
      expect(campLocationMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(campLocationMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(campLocationMigration).toContain('maps\\.app\\.goo\\.gl')
    expect(campLocationMigration).toContain('google\\.com/maps')
    expect(campLocationMigration).toContain('wa\\.me')
    expect(campLocationMigration).toContain('whatsapp\\.com')
    expect(campLocationMigration).toContain(
      'unsupported camp location link',
    )
  })

  it('speichert genau eine Spotify Playlist ohne personenbezogene Spotify Daten', () => {
    expect(musicPlaylistMigration).toContain(
      "where s.key = 'music_spotify_playlist_id'",
    )
    expect(musicPlaylistMigration).toContain("'music_spotify_playlist_id'")
    expect(musicPlaylistMigration).toContain(
      'delete from public.app_settings s',
    )
    expect(musicPlaylistMigration).toContain(
      "'https://open.spotify.com/embed/playlist/'",
    )
    expect(musicPlaylistMigration).toContain(
      "'https://open.spotify.com/playlist/'",
    )
    expect(musicPlaylistMigration).toContain('spotify:playlist:')
    expect(musicPlaylistMigration).toContain('open\\.spotify\\.com')
    expect(musicPlaylistMigration).toContain('unsupported music playlist link')
    expect(musicPlaylistMigration).not.toContain('spotify_user')
    expect(musicPlaylistMigration).not.toContain('access_token')
    expect(musicPlaylistMigration).not.toContain('refresh_token')

    for (const functionName of [
      'ha_spotify_playlist_id',
      'ha_is_supported_music_playlist_link',
      'ha_music_playlist_row',
      'ha_get_music_playlist',
      'ha_admin_get_music_playlist',
      'ha_update_music_playlist',
      'ha_delete_music_playlist',
    ]) {
      expect(musicPlaylistMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(musicPlaylistMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }
  })

  it('legt Bingo mit geschuetzten Tabellen und serverseitiger Kartengenerierung an', () => {
    for (const table of ['bingo_rounds', 'bingo_cards', 'bingo_marks']) {
      expect(bingoMigration).toContain(
        `create table if not exists public.${table}`,
      )
      expect(bingoMigration).toContain(
        `alter table public.${table} enable row level security`,
      )
      expect(bingoMigration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      )
    }

    expect(bingoMigration).toContain('bingo_rounds_single_active')
    expect(bingoMigration).toContain("status in ('active', 'closed')")
    expect(bingoMigration).toContain("where status = 'active'")
    expect(bingoMigration).toContain(
      'constraint bingo_cards_round_participant_unique unique (round_id, participant_id)',
    )
    expect(bingoMigration).toContain(
      'constraint bingo_cards_numbers_valid check (public.ha_bingo_numbers_are_valid(numbers))',
    )
    expect(bingoMigration).toContain('cardinality(p_numbers) = 25')
    expect(bingoMigration).toContain('number < 1 or number > 75')
    expect(bingoMigration).toContain('count(distinct number)')
    expect(bingoMigration).toContain('generate_series(1, 75)')
    expect(bingoMigration).toContain('order by random()')
    expect(bingoMigration).toContain('limit 25')
    expect(bingoMigration).toContain(
      'public.ha_generate_bingo_card_numbers()',
    )
    expect(bingoMigration).toContain(
      'on conflict on constraint bingo_cards_round_participant_unique do nothing',
    )
    expect(bingoMigration).toContain('p_number is null or not p_number = any(v_numbers)')
    expect(bingoMigration).toContain('number is not on bingo card')
    expect(bingoMigration).toContain('insert into public.bingo_marks')
    expect(bingoMigration).toContain('delete from public.bingo_marks')

    for (const functionName of [
      'ha_get_active_bingo_round',
      'ha_admin_get_bingo_round',
      'ha_start_bingo_round',
      'ha_close_bingo_round',
      'ha_get_or_create_bingo_card',
      'ha_set_bingo_mark',
    ]) {
      expect(bingoMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(bingoMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(bingoMigration).toContain(
      'revoke all on function public.ha_generate_bingo_card_numbers() from anon, authenticated',
    )
    expect(bingoMigration).toContain('update public.bingo_rounds br')
    expect(bingoMigration).toContain("set status = 'closed'")
    expect(bingoMigration).toContain("where br.status = 'active'")
    expect(bingoMigration).not.toContain('delete from public.bingo_rounds;')
    expect(bingoMigration).not.toContain('bingo_history')
  })

  it('korrigiert angewendete Bingo RPCs ohne unsichere DELETE Statements', () => {
    expect(bingoFixMigration).toContain(
      'drop constraint if exists bingo_rounds_status_check',
    )
    expect(bingoFixMigration).toContain("status in ('active', 'closed')")

    for (const functionName of [
      'ha_start_bingo_round',
      'ha_close_bingo_round',
    ]) {
      expect(bingoFixMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(bingoFixMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(bingoFixMigration).toContain('update public.bingo_rounds br')
    expect(bingoFixMigration).toContain("set status = 'closed'")
    expect(bingoFixMigration).toContain("where br.status = 'active'")
    expect(bingoFixMigration).not.toContain('delete from public.bingo_rounds;')
  })

  it('legt Pferderennen mit festivalbezogenem Status und geschuetzten Wetten an', () => {
    for (const table of ['horse_racing_settings', 'horse_racing_bets']) {
      expect(horseRacingMigration).toContain(
        `create table if not exists public.${table}`,
      )
      expect(horseRacingMigration).toContain(
        `alter table public.${table} enable row level security`,
      )
      expect(horseRacingMigration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      )
    }

    expect(horseRacingMigration).toContain('festival_id text primary key')
    expect(horseRacingMigration).toContain(
      'constraint horse_racing_bets_unique_participant_festival',
    )
    expect(horseRacingMigration).toContain(
      'unique (festival_id, participant_id)',
    )
    expect(horseRacingMigration).toContain(
      "check (suit in ('hearts', 'diamonds', 'spades', 'clubs'))",
    )
    expect(horseRacingMigration).toContain(
      "check (betting_status in ('open', 'closed'))",
    )
    expect(horseRacingMigration).toContain(
      'if not public.ha_has_admin_access(p_participant_access_code) then',
    )
    expect(horseRacingMigration).toContain(
      "if v_betting_status <> 'open' then",
    )
    expect(horseRacingMigration).toContain(
      'on conflict on constraint horse_racing_bets_unique_participant_festival',
    )
    expect(horseRacingMigration).toContain(
      'when p_is_enabled then p_betting_status',
    )
    expect(horseRacingMigration).toContain("else 'closed'")

    for (const functionName of [
      'ha_get_horse_racing_state',
      'ha_place_horse_racing_bet',
      'ha_admin_get_horse_racing_state',
      'ha_admin_set_horse_racing_state',
      'ha_admin_list_horse_racing_bets',
    ]) {
      expect(horseRacingMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(horseRacingMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }
  })

  it('legt die technische Timetable Basis mit getrennten Entitaeten an', () => {
    for (const table of [
      'festival_days',
      'timetable_stages',
      'timetable_acts',
      'timetable_performances',
    ]) {
      expect(timetableMigration).toContain(
        `create table if not exists public.${table}`,
      )
      expect(timetableMigration).toContain(
        `alter table public.${table} enable row level security`,
      )
      expect(timetableMigration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      )
    }

    expect(timetableMigration).toContain(
      'festival_day_id uuid not null references public.festival_days(id)',
    )
    expect(timetableMigration).toContain(
      'stage_id uuid not null references public.timetable_stages(id)',
    )
    expect(timetableMigration).toContain(
      'act_id uuid not null references public.timetable_acts(id)',
    )
    expect(timetableMigration).toContain(
      'constraint timetable_performances_time_order',
    )
    expect(timetableMigration).toContain(
      'create or replace function public.ha_get_timetable',
    )
    expect(timetableMigration).toContain(
      'grant execute on function public.ha_get_timetable(text) to anon, authenticated',
    )
    expect(timetableMigration).toContain(
      'public.ha_participant_id_for_access(p_participant_access_code) is null',
    )
    expect(timetableMigration).not.toContain('favorite')
    expect(timetableMigration).not.toContain('admin_get_timetable')
  })

  it('stellt Admin RPCs fuer die Festivaltag Verwaltung bereit', () => {
    for (const functionName of [
      'ha_admin_list_festival_days',
      'ha_create_festival_day',
      'ha_update_festival_day',
      'ha_delete_festival_day',
    ]) {
      expect(festivalDaysManagementMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(festivalDaysManagementMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(festivalDaysManagementMigration).toContain(
      'if not public.ha_has_admin_access(p_participant_access_code)',
    )
    expect(festivalDaysManagementMigration).toContain(
      'festival day date already exists',
    )
    expect(festivalDaysManagementMigration).toContain(
      'festival day date is required',
    )
    expect(festivalDaysManagementMigration).toContain(
      'festival day label is required',
    )
    expect(festivalDaysManagementMigration).toContain(
      'festival day sort order is invalid',
    )
    expect(festivalDaysManagementMigration).toContain(
      'order by fd.sort_order, fd.date',
    )
    expect(festivalDaysManagementMigration).not.toContain(
      'ha_create_timetable_stage',
    )
    expect(festivalDaysManagementMigration).not.toContain('ha_create_timetable_act')
    expect(festivalDaysManagementMigration).not.toContain(
      'ha_create_timetable_performance',
    )
  })

  it('stellt Admin RPCs fuer die Buehnenverwaltung bereit', () => {
    for (const functionName of [
      'ha_admin_list_timetable_stages',
      'ha_create_timetable_stage',
      'ha_update_timetable_stage',
      'ha_delete_timetable_stage',
    ]) {
      expect(timetableStagesManagementMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(timetableStagesManagementMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(timetableStagesManagementMigration).toContain(
      'create unique index if not exists timetable_stages_name_unique',
    )
    expect(timetableStagesManagementMigration).toContain('lower(trim(name))')
    expect(timetableStagesManagementMigration).toContain(
      'if not public.ha_has_admin_access(p_participant_access_code)',
    )
    expect(timetableStagesManagementMigration).toContain(
      'stage name already exists',
    )
    expect(timetableStagesManagementMigration).toContain('stage name is required')
    expect(timetableStagesManagementMigration).toContain(
      'stage sort order is invalid',
    )
    expect(timetableStagesManagementMigration).toContain(
      'order by ts.sort_order, ts.name',
    )
    expect(timetableStagesManagementMigration).not.toContain(
      'ha_create_timetable_act',
    )
    expect(timetableStagesManagementMigration).not.toContain(
      'ha_create_timetable_performance',
    )
  })

  it('stellt Admin RPCs fuer die Act Verwaltung bereit', () => {
    for (const functionName of [
      'ha_admin_list_timetable_acts',
      'ha_create_timetable_act',
      'ha_update_timetable_act',
      'ha_delete_timetable_act',
    ]) {
      expect(timetableActsManagementMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(timetableActsManagementMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(timetableActsManagementMigration).toContain(
      'if not public.ha_has_admin_access(p_participant_access_code)',
    )
    expect(timetableActsManagementMigration).toContain('act name is required')
    expect(timetableActsManagementMigration).toContain(
      'act cannot be deleted while performances exist',
    )
    expect(timetableActsManagementMigration).toContain(
      'from public.timetable_performances tp',
    )
    expect(timetableActsManagementMigration).toContain('order by ta.name')
    expect(timetableActsManagementMigration).not.toContain(
      'ha_create_timetable_performance',
    )
  })

  it('stellt Admin RPCs und DB Validierung fuer Auftritte bereit', () => {
    for (const functionName of [
      'ha_admin_list_timetable_performances',
      'ha_create_timetable_performance',
      'ha_update_timetable_performance',
      'ha_delete_timetable_performance',
    ]) {
      expect(timetablePerformancesManagementMigration).toContain(
        `create or replace function public.${functionName}`,
      )
      expect(timetablePerformancesManagementMigration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }

    expect(timetablePerformancesManagementMigration).toContain(
      'alter column ends_at set not null',
    )
    expect(timetablePerformancesManagementMigration).toContain(
      'timetable_performances_no_stage_overlap',
    )
    expect(timetablePerformancesManagementMigration).toContain(
      "tstzrange(starts_at, ends_at, '[)') with &&",
    )
    expect(timetablePerformancesManagementMigration).toContain(
      'stage_id with =',
    )
    expect(timetablePerformancesManagementMigration).toContain(
      'performance end time must be after start time',
    )
    expect(timetablePerformancesManagementMigration).toContain(
      'performance overlaps existing performance on stage',
    )
    expect(timetablePerformancesManagementMigration).toContain(
      'when exclusion_violation then',
    )
    expect(timetablePerformancesManagementMigration).toContain(
      'p_performance_id uuid',
    )
    expect(timetablePerformancesManagementMigration).not.toContain('favorite')
  })

  it('speichert Timetable Favoriten pro Teilnehmer und Auftritt geschuetzt', () => {
    expect(timetableFavoritesMigration).toContain(
      'create table if not exists public.participant_timetable_favorites',
    )
    expect(timetableFavoritesMigration).toContain(
      'participant_id text not null references public.participants(id) on delete cascade',
    )
    expect(timetableFavoritesMigration).toContain(
      'performance_id uuid not null references public.timetable_performances(id) on delete cascade',
    )
    expect(timetableFavoritesMigration).toContain(
      'primary key (participant_id, performance_id)',
    )
    expect(timetableFavoritesMigration).toContain(
      'alter table public.participant_timetable_favorites enable row level security',
    )
    expect(timetableFavoritesMigration).toContain(
      'revoke all on table public.participant_timetable_favorites from anon, authenticated',
    )
    expect(timetableFavoritesMigration).toContain(
      'create policy "deny direct timetable favorite access"',
    )
    expect(timetableFavoritesMigration).toContain(
      'favorite_performance_ids jsonb',
    )
    expect(timetableFavoritesMigration).toContain(
      'drop function if exists public.ha_get_timetable(text)',
    )
    expect(timetableFavoritesMigration).toContain(
      'create or replace function public.ha_add_timetable_favorite',
    )
    expect(timetableFavoritesMigration).toContain(
      'create or replace function public.ha_remove_timetable_favorite',
    )
    expect(timetableFavoritesMigration).toContain(
      'on conflict (participant_id, performance_id) do nothing',
    )
    expect(timetableFavoritesMigration).toContain(
      'grant execute on function public.ha_add_timetable_favorite(text, uuid) to anon, authenticated',
    )
    expect(timetableFavoritesMigration).toContain(
      'grant execute on function public.ha_remove_timetable_favorite(text, uuid) to anon, authenticated',
    )
    expect(timetableFavoritesMigration).not.toContain('ha_admin')
  })

  it('stellt gemeinsame Timetable Favoriten als reine Lesedaten bereit', () => {
    expect(timetableSharedFavoritesMigration).toContain(
      'drop function if exists public.ha_get_timetable(text)',
    )
    expect(timetableSharedFavoritesMigration).toContain(
      'create or replace function public.ha_get_timetable',
    )
    expect(timetableSharedFavoritesMigration).toContain(
      'performance_favorites jsonb',
    )
    expect(timetableSharedFavoritesMigration).toContain(
      'from public.participant_timetable_favorites ptf',
    )
    expect(timetableSharedFavoritesMigration).toContain(
      'join public.participants p on p.id = ptf.participant_id',
    )
    expect(timetableSharedFavoritesMigration).toContain(
      "'display_name', p.display_name",
    )
    expect(timetableSharedFavoritesMigration).toContain(
      "'avatar_id', p.avatar_id",
    )
    expect(timetableSharedFavoritesMigration).toContain('where p.is_active = true')
    expect(timetableSharedFavoritesMigration).not.toContain(
      'create table if not exists',
    )
    expect(timetableSharedFavoritesMigration).not.toContain(
      'ha_add_timetable_favorite',
    )
    expect(timetableSharedFavoritesMigration).not.toContain(
      'ha_remove_timetable_favorite',
    )
    expect(timetableSharedFavoritesMigration).not.toContain('ha_admin')
  })

  it('erweitert Timetable Buehnen um optionale Farben', () => {
    expect(timetableStageColorsMigration).toContain(
      'alter table public.timetable_stages',
    )
    expect(timetableStageColorsMigration).toContain(
      'add column if not exists color text',
    )
    expect(timetableStageColorsMigration).toContain(
      'constraint timetable_stages_color_hex',
    )
    expect(timetableStageColorsMigration).toContain(
      "color is null or color ~ '^#[0-9A-Fa-f]{6}$'",
    )
    expect(timetableStageColorsMigration).toContain(
      'drop function if exists public.ha_admin_list_timetable_stages(text)',
    )
    expect(timetableStageColorsMigration).toContain(
      'p_color text default null',
    )
    expect(timetableStageColorsMigration).toContain("'color', ts.color")
    expect(timetableStageColorsMigration).toContain(
      'grant execute on function public.ha_create_timetable_stage(text, text, integer, text) to anon, authenticated',
    )
    expect(timetableStageColorsMigration).toContain(
      'grant execute on function public.ha_update_timetable_stage(text, uuid, text, integer, text) to anon, authenticated',
    )
    expect(timetableStageColorsMigration).not.toContain('create table if not exists')
  })

  it('fuehrt keine Mehrfestival Datenmodell Migration durch', () => {
    const migrations = [
      baseMigration,
      adminMigration,
      activeParticipantMigration,
      participantManagementMigration,
      dataIntegrityMigration,
      categoryManagementMigration,
      festivalNameMigration,
      festivalArchiveMigration,
      secureParticipantLoginMigration,
      festivalAccessCodeMigration,
      secureFestivalAccessCodeMigration,
      hardeningMigration,
      festivalDocumentsMigration,
      campLocationMigration,
      musicPlaylistMigration,
      bingoMigration,
      bingoFixMigration,
      timetableMigration,
      festivalDaysManagementMigration,
      timetableStagesManagementMigration,
      timetableActsManagementMigration,
      timetablePerformancesManagementMigration,
      timetableFavoritesMigration,
      timetableSharedFavoritesMigration,
      timetableStageColorsMigration,
      horseRacingMigration,
    ].join('\n')

    expect(migrations).not.toContain('create table if not exists public.festivals')
    expect(migrations).not.toContain('add column if not exists festival_id')
    expect(migrations).not.toContain('set festival_id')
    expect(migrations).not.toContain('p_festival_code')
  })
})
