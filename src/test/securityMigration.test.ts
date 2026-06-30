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

  it('fuehrt keine Mehrfestival Datenmodell Migration durch', () => {
    const migrations = [
      baseMigration,
      adminMigration,
      activeParticipantMigration,
      participantManagementMigration,
      dataIntegrityMigration,
      categoryManagementMigration,
      festivalNameMigration,
    ].join('\n')

    expect(migrations).not.toContain('create table if not exists public.festivals')
    expect(migrations).not.toContain('add column if not exists festival_id')
    expect(migrations).not.toContain('set festival_id')
    expect(migrations).not.toContain('p_festival_id')
    expect(migrations).not.toContain('p_festival_code')
  })
})
