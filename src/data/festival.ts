import { supabase } from '../lib/supabase'
import {
  participantRpcParams,
  type AdminAccessContext,
} from './accessContext'

export async function loadFestivalName(): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_get_festival_name')

  if (error) {
    throw error
  }

  return String(data ?? '')
}

export async function updateFestivalName(
  name: string,
  context: AdminAccessContext,
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_update_festival_name', {
    ...participantRpcParams(context),
    p_name: name,
  })

  if (error) {
    throw error
  }

  return String(data ?? '')
}

export async function archiveFestival(adminAccessCode: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_archive_festival', {
    p_admin_access_code: adminAccessCode,
  })

  if (error) {
    throw error
  }

  return String(data ?? '')
}
