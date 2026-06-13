import { supabase } from '../lib/supabase'

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

export async function loadCategories(): Promise<Category[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id, title, description, status, sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapCategory(row as CategoryRow))
}

export async function updateCategoryStatus(
  categoryId: string,
  status: CategoryStatus,
): Promise<Category> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ status })
    .eq('id', categoryId)
    .select('id, title, description, status')
    .single()

  if (error) {
    throw error
  }

  return mapCategory(data as CategoryRow)
}
