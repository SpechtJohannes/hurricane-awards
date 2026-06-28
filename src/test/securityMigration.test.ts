/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260628123000_secure_data_access.sql',
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
      expect(migration).toContain(
        `alter table public.${table} enable row level security`,
      )
      expect(migration).toContain(
        `revoke all on table public.${table} from anon, authenticated`,
      )
    }

    expect(migration).toContain(
      "revoke all on table public.all_time_standings from anon, authenticated",
    )
    expect(migration).toContain(
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
      expect(migration).toContain(`function public.${functionName}`)
      expect(migration).toContain(
        `grant execute on function public.${functionName}`,
      )
    }
  })

  it('bildet die bestehende Adminlogik ohne neues Adminfeld ab', () => {
    expect(migration).toContain('public.ha_has_admin_access')
    expect(migration).toContain(
      'select public.ha_participant_id_for_access(p_participant_access_code) is not null',
    )
    expect(migration).toContain('admin access required')
    expect(migration).not.toContain("column_name = 'is_admin'")
    expect(migration).not.toContain('add column if not exists is_admin')
  })

  it('fuehrt keine Mehrfestival Datenmodell Migration durch', () => {
    expect(migration).not.toContain('create table if not exists public.festivals')
    expect(migration).not.toContain('add column if not exists festival_id')
    expect(migration).not.toContain('set festival_id')
    expect(migration).not.toContain('p_festival_id')
    expect(migration).not.toContain('p_festival_code')
  })
})
