import { supabase } from '../lib/supabase'
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from './accessContext'

export type CategoryStatus = 'upcoming' | 'open' | 'closed'

type CategoryRow = {
  id: string
  title: string
  description: string
  status: CategoryStatus
}

export type Category = {
  id: string
  title: string
  description: string
  status: CategoryStatus
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
  }
}

export async function loadCategories(
  context: ParticipantAccessContext,
): Promise<Category[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc(
    'ha_list_categories',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as CategoryRow[]).map((row) => mapCategory(row))
}

export async function updateCategoryStatus(
  categoryId: string,
  status: CategoryStatus,
  context: AdminAccessContext,
): Promise<Category> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_update_category_status', {
    ...participantRpcParams(context),
    p_category_id: categoryId,
    p_status: status,
  })

  if (error) {
    throw error
  }

  const category = Array.isArray(data) ? data[0] : data

  return mapCategory(category as CategoryRow)
}
