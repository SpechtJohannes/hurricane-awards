import { supabase } from '../lib/supabase'
import {
  participantRpcParams,
  type ParticipantAccessContext,
} from './accessContext'

type AllTimeStandingRow = {
  participant_id: string
  participant_name: string
  total_points: number | string
}

export type AllTimeStanding = {
  participantId: string
  participantName: string
  totalPoints: number
}

function mapAllTimeStanding(row: AllTimeStandingRow): AllTimeStanding {
  return {
    participantId: row.participant_id,
    participantName: row.participant_name,
    totalPoints: Number(row.total_points),
  }
}

export async function loadAllTimeStandings(
  context: ParticipantAccessContext,
): Promise<AllTimeStanding[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc(
    'ha_list_all_time_standings',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as AllTimeStandingRow[]).map((row) =>
    mapAllTimeStanding(row),
  )
}
