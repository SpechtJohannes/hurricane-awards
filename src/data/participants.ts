import { supabase } from '../lib/supabase'
import {
  participantRpcParams,
  type ParticipantAccessContext,
} from './accessContext'

type ParticipantRow = {
  id: string
  name: string
  display_name: string
  access_code?: string
  is_admin?: boolean
}

export type Participant = {
  id: string
  name: string
  displayName: string
  accessCode: string
  isAdmin: boolean
}

function mapParticipant(row: ParticipantRow, accessCode = ''): Participant {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    accessCode: row.access_code ?? accessCode,
    isAdmin: row.is_admin ?? false,
  }
}

export async function loadParticipants(
  context: ParticipantAccessContext,
): Promise<Participant[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc(
    'ha_list_participants',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as ParticipantRow[]).map((row) => mapParticipant(row))
}

export async function findParticipantByAccessCode(
  accessCode: string,
): Promise<Participant | null> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_find_participant', {
    p_access_code: accessCode,
  })

  if (error) {
    throw error
  }

  const participant = Array.isArray(data) ? data[0] : data

  return participant ? mapParticipant(participant as ParticipantRow, accessCode) : null
}
