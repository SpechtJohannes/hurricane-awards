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

  it('fuehrt keine Mehrfestival Datenmodell Migration durch', () => {
    const migrations = `${baseMigration}\n${adminMigration}`

    expect(migrations).not.toContain('create table if not exists public.festivals')
    expect(migrations).not.toContain('add column if not exists festival_id')
    expect(migrations).not.toContain('set festival_id')
    expect(migrations).not.toContain('p_festival_id')
    expect(migrations).not.toContain('p_festival_code')
  })
})
