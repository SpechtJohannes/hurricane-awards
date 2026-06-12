import { supabase } from '../lib/supabase'

type VoteRow = {
  voter_id: string
  voted_for_id: string
  category_id: string
  timestamp: string
}

export type Vote = {
  voterId: string
  votedForId: string
  categoryId: string
  timestamp: string
}

function mapVote(row: VoteRow): Vote {
  return {
    voterId: row.voter_id,
    votedForId: row.voted_for_id,
    categoryId: row.category_id,
    timestamp: row.timestamp,
  }
}

export async function loadVotesForParticipant(voterId: string): Promise<Vote[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('votes')
    .select('voter_id, voted_for_id, category_id, timestamp')
    .eq('voter_id', voterId)

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapVote(row as VoteRow))
}

export async function saveVote(vote: Vote): Promise<Vote> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('votes')
    .insert({
      voter_id: vote.voterId,
      voted_for_id: vote.votedForId,
      category_id: vote.categoryId,
      timestamp: vote.timestamp,
    })
    .select('voter_id, voted_for_id, category_id, timestamp')
    .single()

  if (error) {
    throw error
  }

  return mapVote(data as VoteRow)
}
