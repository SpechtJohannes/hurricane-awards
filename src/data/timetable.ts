import { getSupabase } from '../lib/supabase'
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from './accessContext'

export type FestivalDay = {
  id: string
  date: string
  label: string
  sortOrder: number
}

export type TimetableStage = {
  id: string
  name: string
  sortOrder: number
  color: string | null
}

export type TimetableAct = {
  id: string
  name: string
  description: string | null
}

export type TimetablePerformance = {
  id: string
  festivalDayId: string
  stageId: string
  actId: string
  startsAt: string
  endsAt: string | null
}

export type TimetableFavoriteParticipant = {
  participantId: string
  displayName: string
  avatarId: string | null
}

export type TimetablePerformanceFavorites = {
  performanceId: string
  participants: TimetableFavoriteParticipant[]
}

export type Timetable = {
  festivalDays: FestivalDay[]
  stages: TimetableStage[]
  acts: TimetableAct[]
  performances: TimetablePerformance[]
  favoritePerformanceIds: string[]
  performanceFavorites: TimetablePerformanceFavorites[]
}

export type CreateFestivalDayInput = {
  date: string
  label: string
  sortOrder: number
}

export type UpdateFestivalDayInput = {
  id: string
  date: string
  label: string
  sortOrder: number
}

export type CreateTimetableStageInput = {
  name: string
  sortOrder: number
  color: string | null
}

export type UpdateTimetableStageInput = {
  id: string
  name: string
  sortOrder: number
  color: string | null
}

export type CreateTimetableActInput = {
  name: string
  description: string
}

export type UpdateTimetableActInput = {
  id: string
  name: string
  description: string
}

export type CreateTimetablePerformanceInput = {
  festivalDayId: string
  stageId: string
  actId: string
  startsAt: string
  endsAt: string
}

export type UpdateTimetablePerformanceInput = CreateTimetablePerformanceInput & {
  id: string
}

type FestivalDayRow = {
  id: string
  date: string
  label: string
  sort_order: number
}

type TimetableStageRow = {
  id: string
  name: string
  sort_order: number
  color?: string | null
}

type TimetableActRow = {
  id: string
  name: string
  description: string | null
}

type TimetablePerformanceRow = {
  id: string
  festival_day_id: string
  stage_id: string
  act_id: string
  starts_at: string
  ends_at: string | null
}

type TimetableFavoriteParticipantRow = {
  participant_id: string
  display_name: string
  avatar_id: string | null
}

type TimetablePerformanceFavoritesRow = {
  performance_id: string
  participants: TimetableFavoriteParticipantRow[]
}

function mapFestivalDay(row: FestivalDayRow): FestivalDay {
  return {
    id: row.id,
    date: row.date,
    label: row.label,
    sortOrder: row.sort_order,
  }
}

function mapStage(row: TimetableStageRow): TimetableStage {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    color: row.color ?? null,
  }
}

function mapAct(row: TimetableActRow): TimetableAct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  }
}

function mapPerformance(row: TimetablePerformanceRow): TimetablePerformance {
  return {
    id: row.id,
    festivalDayId: row.festival_day_id,
    stageId: row.stage_id,
    actId: row.act_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }
}

function mapFavoriteParticipant(
  row: TimetableFavoriteParticipantRow,
): TimetableFavoriteParticipant {
  return {
    participantId: row.participant_id,
    displayName: row.display_name,
    avatarId: row.avatar_id,
  }
}

function mapPerformanceFavorites(
  row: TimetablePerformanceFavoritesRow,
): TimetablePerformanceFavorites {
  return {
    performanceId: row.performance_id,
    participants: (row.participants ?? []).map(mapFavoriteParticipant),
  }
}

export async function loadTimetable(
  context: ParticipantAccessContext,
): Promise<Timetable> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc(
    'ha_get_timetable',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  const row = (Array.isArray(data) ? data[0] : data) as Partial<{
    festival_days: FestivalDayRow[]
    stages: TimetableStageRow[]
    acts: TimetableActRow[]
    performances: TimetablePerformanceRow[]
    favorite_performance_ids: string[]
    performance_favorites: TimetablePerformanceFavoritesRow[]
  }> | null

  return {
    festivalDays: (row?.festival_days ?? []).map(mapFestivalDay),
    stages: (row?.stages ?? []).map(mapStage),
    acts: (row?.acts ?? []).map(mapAct),
    performances: (row?.performances ?? []).map(mapPerformance),
    favoritePerformanceIds: row?.favorite_performance_ids ?? [],
    performanceFavorites: (row?.performance_favorites ?? []).map(
      mapPerformanceFavorites,
    ),
  }
}

export async function addTimetableFavorite(
  performanceId: string,
  context: ParticipantAccessContext,
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('ha_add_timetable_favorite', {
    ...participantRpcParams(context),
    p_performance_id: performanceId,
  })

  if (error) {
    throw error
  }
}

export async function removeTimetableFavorite(
  performanceId: string,
  context: ParticipantAccessContext,
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('ha_remove_timetable_favorite', {
    ...participantRpcParams(context),
    p_performance_id: performanceId,
  })

  if (error) {
    throw error
  }
}

export async function loadAdminFestivalDays(
  context: AdminAccessContext,
): Promise<FestivalDay[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc(
    'ha_admin_list_festival_days',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as FestivalDayRow[]).map(mapFestivalDay)
}

export async function createFestivalDay(
  input: CreateFestivalDayInput,
  context: AdminAccessContext,
): Promise<FestivalDay> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_create_festival_day', {
    ...participantRpcParams(context),
    p_date: input.date,
    p_label: input.label,
    p_sort_order: input.sortOrder,
  })

  if (error) {
    throw error
  }

  return mapFestivalDay((Array.isArray(data) ? data[0] : data) as FestivalDayRow)
}

export async function updateFestivalDay(
  input: UpdateFestivalDayInput,
  context: AdminAccessContext,
): Promise<FestivalDay> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_update_festival_day', {
    ...participantRpcParams(context),
    p_festival_day_id: input.id,
    p_date: input.date,
    p_label: input.label,
    p_sort_order: input.sortOrder,
  })

  if (error) {
    throw error
  }

  return mapFestivalDay((Array.isArray(data) ? data[0] : data) as FestivalDayRow)
}

export async function deleteFestivalDay(
  festivalDayId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('ha_delete_festival_day', {
    ...participantRpcParams(context),
    p_festival_day_id: festivalDayId,
  })

  if (error) {
    throw error
  }
}

export async function loadAdminTimetableStages(
  context: AdminAccessContext,
): Promise<TimetableStage[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc(
    'ha_admin_list_timetable_stages',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as TimetableStageRow[]).map(mapStage)
}

export async function createTimetableStage(
  input: CreateTimetableStageInput,
  context: AdminAccessContext,
): Promise<TimetableStage> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_create_timetable_stage', {
    ...participantRpcParams(context),
    p_name: input.name,
    p_sort_order: input.sortOrder,
    p_color: input.color,
  })

  if (error) {
    throw error
  }

  return mapStage((Array.isArray(data) ? data[0] : data) as TimetableStageRow)
}

export async function updateTimetableStage(
  input: UpdateTimetableStageInput,
  context: AdminAccessContext,
): Promise<TimetableStage> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_update_timetable_stage', {
    ...participantRpcParams(context),
    p_stage_id: input.id,
    p_name: input.name,
    p_sort_order: input.sortOrder,
    p_color: input.color,
  })

  if (error) {
    throw error
  }

  return mapStage((Array.isArray(data) ? data[0] : data) as TimetableStageRow)
}

export async function deleteTimetableStage(
  stageId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('ha_delete_timetable_stage', {
    ...participantRpcParams(context),
    p_stage_id: stageId,
  })

  if (error) {
    throw error
  }
}

export async function loadAdminTimetableActs(
  context: AdminAccessContext,
): Promise<TimetableAct[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc(
    'ha_admin_list_timetable_acts',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as TimetableActRow[]).map(mapAct)
}

export async function createTimetableAct(
  input: CreateTimetableActInput,
  context: AdminAccessContext,
): Promise<TimetableAct> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_create_timetable_act', {
    ...participantRpcParams(context),
    p_name: input.name,
    p_description: input.description,
  })

  if (error) {
    throw error
  }

  return mapAct((Array.isArray(data) ? data[0] : data) as TimetableActRow)
}

export async function updateTimetableAct(
  input: UpdateTimetableActInput,
  context: AdminAccessContext,
): Promise<TimetableAct> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_update_timetable_act', {
    ...participantRpcParams(context),
    p_act_id: input.id,
    p_name: input.name,
    p_description: input.description,
  })

  if (error) {
    throw error
  }

  return mapAct((Array.isArray(data) ? data[0] : data) as TimetableActRow)
}

export async function deleteTimetableAct(
  actId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('ha_delete_timetable_act', {
    ...participantRpcParams(context),
    p_act_id: actId,
  })

  if (error) {
    throw error
  }
}

export async function loadAdminTimetablePerformances(
  context: AdminAccessContext,
): Promise<TimetablePerformance[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc(
    'ha_admin_list_timetable_performances',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as TimetablePerformanceRow[]).map(mapPerformance)
}

export async function createTimetablePerformance(
  input: CreateTimetablePerformanceInput,
  context: AdminAccessContext,
): Promise<TimetablePerformance> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_create_timetable_performance', {
    ...participantRpcParams(context),
    p_festival_day_id: input.festivalDayId,
    p_stage_id: input.stageId,
    p_act_id: input.actId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
  })

  if (error) {
    throw error
  }

  return mapPerformance(
    (Array.isArray(data) ? data[0] : data) as TimetablePerformanceRow,
  )
}

export async function updateTimetablePerformance(
  input: UpdateTimetablePerformanceInput,
  context: AdminAccessContext,
): Promise<TimetablePerformance> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('ha_update_timetable_performance', {
    ...participantRpcParams(context),
    p_performance_id: input.id,
    p_festival_day_id: input.festivalDayId,
    p_stage_id: input.stageId,
    p_act_id: input.actId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
  })

  if (error) {
    throw error
  }

  return mapPerformance(
    (Array.isArray(data) ? data[0] : data) as TimetablePerformanceRow,
  )
}

export async function deleteTimetablePerformance(
  performanceId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.rpc('ha_delete_timetable_performance', {
    ...participantRpcParams(context),
    p_performance_id: performanceId,
  })

  if (error) {
    throw error
  }
}
