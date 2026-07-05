import { getSupabase } from '../lib/supabase'
import {
  participantRpcParams,
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

export type Timetable = {
  festivalDays: FestivalDay[]
  stages: TimetableStage[]
  acts: TimetableAct[]
  performances: TimetablePerformance[]
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
  }> | null

  return {
    festivalDays: (row?.festival_days ?? []).map(mapFestivalDay),
    stages: (row?.stages ?? []).map(mapStage),
    acts: (row?.acts ?? []).map(mapAct),
    performances: (row?.performances ?? []).map(mapPerformance),
  }
}
