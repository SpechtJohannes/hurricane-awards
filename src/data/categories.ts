import { getSupabase } from '../lib/supabase'
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
  sort_order?: number
}

export type Category = {
  id: string
  title: string
  description: string
  status: CategoryStatus
  sortOrder?: number
}

export type CreateCategoryInput = {
  title: string
  description?: string
  status?: CategoryStatus
  sortOrder?: number
}

export type UpdateCategoryInput = {
  id: string
  title?: string
  description?: string
  status?: CategoryStatus
  sortOrder?: number
}

function mapCategory(row: CategoryRow): Category {
  const category: Category = {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
  }

  if (row.sort_order !== undefined) {
    category.sortOrder = row.sort_order
  }

  return category
}

function mapCategoryResult(data: unknown): Category {
  const category = Array.isArray(data) ? data[0] : data

  return mapCategory(category as CategoryRow)
}

export async function loadCategories(
  context: ParticipantAccessContext,
): Promise<Category[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc(
    'ha_list_categories',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as CategoryRow[]).map((row) => mapCategory(row))
}

export async function loadAdminCategories(
  context: AdminAccessContext,
): Promise<Category[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc(
    'ha_admin_list_categories',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as CategoryRow[]).map((row) => mapCategory(row))
}

export async function createCategory(
  input: CreateCategoryInput,
  context: AdminAccessContext,
): Promise<Category> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('ha_create_category', {
    ...participantRpcParams(context),
    p_title: input.title,
    p_description: input.description ?? '',
    p_status: input.status ?? 'upcoming',
    p_sort_order: input.sortOrder ?? null,
  })

  if (error) {
    throw error
  }

  return mapCategoryResult(data)
}

export async function updateCategoryStatus(
  categoryId: string,
  status: CategoryStatus,
  context: AdminAccessContext,
): Promise<Category> {
  const supabase = getSupabase()

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

export async function updateCategory(
  input: UpdateCategoryInput,
  context: AdminAccessContext,
): Promise<Category> {
  const supabase = getSupabase()

  const { data, error } = await supabase.rpc('ha_update_category', {
    ...participantRpcParams(context),
    p_category_id: input.id,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_status: input.status ?? null,
    p_sort_order: input.sortOrder ?? null,
  })

  if (error) {
    throw error
  }

  return mapCategoryResult(data)
}

export async function deleteCategory(
  categoryId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.rpc('ha_delete_category', {
    ...participantRpcParams(context),
    p_category_id: categoryId,
  })

  if (error) {
    throw error
  }
}
