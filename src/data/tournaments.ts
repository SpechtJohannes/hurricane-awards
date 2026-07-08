import { getSupabase } from '../lib/supabase'
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from './accessContext'

export type TournamentStatus = 'draft' | 'active'
export type TournamentMode = 'ko' | 'knockout' | 'qualification_knockout'

export type TournamentBracketParticipant = {
  type: 'participant'
  participantId: string
  participantName: string
}

export type TournamentBracketSlot = {
  participant: TournamentBracketParticipant | null
  sourceMatchId?: string | null
}

export type TournamentBracketMatch = {
  id: string
  round: number
  position: number
  status: 'scheduled'
  participantA: TournamentBracketSlot
  participantB: TournamentBracketSlot
  winnerParticipantId: string | null
}

export type TournamentBracketRound = {
  round: number
  type?: 'main'
  matches: TournamentBracketMatch[]
  byes?: TournamentBracketParticipant[]
}

export type TournamentBracket = {
  type: 'single_elimination'
  mainParticipantCount?: number
  rounds: TournamentBracketRound[]
}

export type Tournament = {
  id: string
  festivalId: string
  name: string
  mode: TournamentMode
  status: TournamentStatus
  selectedParticipantIds: string[]
  drawParticipantIds: string[]
  qualificationRankingIds: string[]
  bracket: TournamentBracket
  createdAt: string
  updatedAt: string
}

export type TournamentInput = {
  name: string
  mode: TournamentMode
  participantIds: string[]
}

type TournamentRow = {
  id: string
  festival_id: string
  name: string
  mode?: TournamentMode | null
  status: TournamentStatus
  selected_participant_ids?: string[] | null
  draw_participant_ids?: string[] | null
  qualification_ranking_ids?: string[] | null
  bracket: TournamentBracket | string
  created_at: string
  updated_at: string
}

export type BracketParticipantInput = {
  participantId: string
  participantName: string
}

function firstRow<T>(data: unknown): T | null {
  const row = Array.isArray(data) ? data[0] : data

  return row ? (row as T) : null
}

function parseBracket(bracket: TournamentRow['bracket']): TournamentBracket {
  return typeof bracket === 'string'
    ? (JSON.parse(bracket) as TournamentBracket)
    : bracket
}

function mapTournament(row: TournamentRow): Tournament {
  return {
    id: row.id,
    festivalId: row.festival_id,
    name: row.name,
    mode: row.mode ?? 'knockout',
    status: row.status,
    selectedParticipantIds: row.selected_participant_ids ?? [],
    drawParticipantIds: row.draw_participant_ids ?? row.selected_participant_ids ?? [],
    qualificationRankingIds: row.qualification_ranking_ids ?? [],
    bracket: parseBracket(row.bracket),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function largestPowerOfTwo(value: number) {
  let size = 1

  while (size * 2 <= value) {
    size *= 2
  }

  return size
}

export function nextPowerOfTwo(value: number) {
  let size = 1

  while (size < value) {
    size *= 2
  }

  return size
}

function toBracketParticipant(
  participant: BracketParticipantInput,
): TournamentBracketParticipant {
  return {
    type: 'participant',
    participantId: participant.participantId,
    participantName: participant.participantName,
  }
}

export function shuffleParticipants<T>(
  items: T[],
  random = Math.random,
): T[] {
  const shuffledItems = [...items]

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentItem = shuffledItems[index]

    shuffledItems[index] = shuffledItems[swapIndex]
    shuffledItems[swapIndex] = currentItem
  }

  return shuffledItems
}

export function drawTournamentParticipants(
  participants: BracketParticipantInput[],
  random = Math.random,
) {
  const shuffledParticipants = [...participants]

  for (let index = shuffledParticipants.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentParticipant = shuffledParticipants[index]

    shuffledParticipants[index] = shuffledParticipants[swapIndex]
    shuffledParticipants[swapIndex] = currentParticipant
  }

  return shuffledParticipants
}

export function generateTournamentBracket(
  participants: BracketParticipantInput[],
): TournamentBracket {
  if (participants.length < 2) {
    return {
      type: 'single_elimination',
      mainParticipantCount: 0,
      rounds: [],
    }
  }

  const mainParticipantCount = nextPowerOfTwo(participants.length)
  const byeCount = mainParticipantCount - participants.length
  const firstRoundParticipantCount = participants.length - byeCount
  const firstRoundParticipants = participants.slice(0, firstRoundParticipantCount)
  const byeParticipants = participants
    .slice(firstRoundParticipantCount)
    .map(toBracketParticipant)
  const rounds: TournamentBracketRound[] = []
  const firstRoundEntries: TournamentBracketSlot[] = firstRoundParticipants.map(
    (participant) => ({
      participant: toBracketParticipant(participant),
    }),
  )

  const firstMainRoundNumber = 1
  const firstMainRoundMatches: TournamentBracketMatch[] = []

  for (let index = 0; index < firstRoundEntries.length; index += 2) {
    firstMainRoundMatches.push({
      id: `r${firstMainRoundNumber}-m${index / 2 + 1}`,
      round: firstMainRoundNumber,
      position: index / 2 + 1,
      status: 'scheduled',
      participantA: firstRoundEntries[index],
      participantB: firstRoundEntries[index + 1],
      winnerParticipantId: null,
    })
  }

  rounds.push({
    round: firstMainRoundNumber,
    type: 'main',
    matches: firstMainRoundMatches,
    byes: byeParticipants,
  })

  let previousRoundEntries: TournamentBracketSlot[] = [
    ...firstMainRoundMatches.map((match) => ({
      participant: null,
      sourceMatchId: match.id,
    })),
    ...byeParticipants.map((participant) => ({
      participant,
    })),
  ]
  let round = firstMainRoundNumber + 1

  while (previousRoundEntries.length > 1) {
    const matches: TournamentBracketMatch[] = []

    for (let index = 0; index < previousRoundEntries.length; index += 2) {
      matches.push({
        id: `r${round}-m${index / 2 + 1}`,
        round,
        position: index / 2 + 1,
        status: 'scheduled',
        participantA: previousRoundEntries[index],
        participantB: previousRoundEntries[index + 1],
        winnerParticipantId: null,
      })
    }

    rounds.push({ round, type: 'main', matches })
    previousRoundEntries = matches.map((match) => ({
      participant: null,
      sourceMatchId: match.id,
    }))
    round += 1
  }

  return {
    type: 'single_elimination',
    mainParticipantCount,
    rounds,
  }
}

export async function loadTournaments(
  festivalId: string,
  context: ParticipantAccessContext,
): Promise<Tournament[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('ha_list_tournaments', {
    ...participantRpcParams(context),
    p_festival_id: festivalId,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as TournamentRow[]).map(mapTournament)
}

export async function loadAdminTournaments(
  festivalId: string,
  context: AdminAccessContext,
): Promise<Tournament[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('ha_admin_list_tournaments', {
    ...participantRpcParams(context),
    p_festival_id: festivalId,
  })

  if (error) {
    throw error
  }

  return ((data ?? []) as TournamentRow[]).map(mapTournament)
}

export async function createTournament(
  festivalId: string,
  input: TournamentInput,
  context: AdminAccessContext,
): Promise<Tournament> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('ha_admin_create_tournament', {
    ...participantRpcParams(context),
    p_festival_id: festivalId,
    p_name: input.name.trim(),
    p_mode: input.mode,
    p_participant_ids: input.participantIds,
  })

  if (error) {
    throw error
  }

  const row = firstRow<TournamentRow>(data)

  if (!row) {
    throw new Error('tournament was not returned')
  }

  return mapTournament(row)
}

export async function updateTournament(
  tournamentId: string,
  input: TournamentInput,
  context: AdminAccessContext,
): Promise<Tournament> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('ha_admin_update_tournament', {
    ...participantRpcParams(context),
    p_tournament_id: tournamentId,
    p_name: input.name.trim(),
    p_mode: input.mode,
    p_participant_ids: input.participantIds,
  })

  if (error) {
    throw error
  }

  const row = firstRow<TournamentRow>(data)

  if (!row) {
    throw new Error('tournament was not returned')
  }

  return mapTournament(row)
}

export async function updateTournamentQualificationRanking(
  tournamentId: string,
  participantIds: string[],
  context: AdminAccessContext,
): Promise<Tournament> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc(
    'ha_admin_set_tournament_qualification_ranking',
    {
      ...participantRpcParams(context),
      p_tournament_id: tournamentId,
      p_participant_ids: participantIds,
    },
  )

  if (error) {
    throw error
  }

  const row = firstRow<TournamentRow>(data)

  if (!row) {
    throw new Error('tournament was not returned')
  }

  return mapTournament(row)
}

export async function deleteTournament(
  tournamentId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.rpc('ha_admin_delete_tournament', {
    ...participantRpcParams(context),
    p_tournament_id: tournamentId,
  })

  if (error) {
    throw error
  }
}
