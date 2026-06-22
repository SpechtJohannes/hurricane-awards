import { supabase } from '../lib/supabase'

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

export async function loadAllTimeStandings(): Promise<AllTimeStanding[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('all_time_standings')
    .select('participant_id, participant_name, total_points')
    .order('total_points', { ascending: false })
    .order('participant_name', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapAllTimeStanding(row as AllTimeStandingRow),
  )
}
