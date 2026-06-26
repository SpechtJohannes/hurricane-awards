import { supabase } from '../lib/supabase'

type ParticipantRow = {
  id: string
  name: string
  display_name: string
  access_code: string
}

export type Participant = {
  id: string
  name: string
  displayName: string
  accessCode: string
}

function mapParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    accessCode: row.access_code,
  }
}

export async function loadParticipants(): Promise<Participant[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('participants')
    .select('id, name, display_name, access_code')
    .order('name')

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapParticipant(row as ParticipantRow))
}

export async function findParticipantByAccessCode(
  accessCode: string,
): Promise<Participant | null> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('participants')
    .select('id, name, display_name, access_code')
    .eq('access_code', accessCode)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapParticipant(data as ParticipantRow) : null
}
