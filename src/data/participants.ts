import { supabase } from '../lib/supabase'
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from './accessContext'

type ParticipantRow = {
  id: string
  name: string
  display_name: string
  access_code?: string
  is_admin?: boolean
  is_active?: boolean
}

export type Participant = {
  id: string
  name: string
  displayName: string
  accessCode: string
  isAdmin: boolean
  isActive: boolean
}

export type ParticipantLoginResult =
  | {
      status: 'success'
      participant: Participant
      lockedUntil: null
    }
  | {
      status: 'invalid'
      participant: null
      lockedUntil: null
    }
  | {
      status: 'blocked'
      participant: null
      lockedUntil: string
    }

export type CreateParticipantInput = {
  displayName: string
  accessCode?: string
}

export type UpdateParticipantInput = {
  id: string
  displayName?: string
  accessCode?: string
}

function mapParticipant(row: ParticipantRow, accessCode = ''): Participant {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    accessCode: row.access_code ?? accessCode,
    isAdmin: row.is_admin ?? false,
    isActive: row.is_active ?? true,
  }
}

function mapParticipantResult(data: unknown): Participant {
  const participant = Array.isArray(data) ? data[0] : data

  return mapParticipant(participant as ParticipantRow)
}

export async function loadParticipants(
  context: ParticipantAccessContext,
): Promise<Participant[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc(
    'ha_list_participants',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as ParticipantRow[]).map((row) => mapParticipant(row))
}

export async function loginParticipant(
  accessCode: string,
): Promise<ParticipantLoginResult> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const normalizedAccessCode = accessCode.trim().toUpperCase()
  const { data, error } = await supabase.rpc('ha_login_participant', {
    p_access_code: normalizedAccessCode,
  })

  if (error) {
    throw error
  }

  const loginResult = (Array.isArray(data) ? data[0] : data) as
    | (ParticipantRow & {
        status?: string
        locked_until?: string | null
      })
    | null

  if (!loginResult || loginResult.status === 'invalid') {
    return {
      status: 'invalid',
      participant: null,
      lockedUntil: null,
    }
  }

  if (loginResult.status === 'blocked') {
    return {
      status: 'blocked',
      participant: null,
      lockedUntil: loginResult.locked_until ?? new Date().toISOString(),
    }
  }

  return {
    status: 'success',
    participant: mapParticipant(loginResult, normalizedAccessCode),
    lockedUntil: null,
  }
}

export async function loadAdminParticipants(
  context: AdminAccessContext,
): Promise<Participant[]> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc(
    'ha_admin_list_participants',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return ((data ?? []) as ParticipantRow[]).map((row) => mapParticipant(row))
}

export async function suggestParticipantAccessCode(
  context: AdminAccessContext,
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc(
    'ha_suggest_participant_access_code',
    participantRpcParams(context),
  )

  if (error) {
    throw error
  }

  return String(data ?? '')
}

export async function createParticipant(
  input: CreateParticipantInput,
  context: AdminAccessContext,
): Promise<Participant> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_create_participant', {
    ...participantRpcParams(context),
    p_display_name: input.displayName,
    p_access_code: input.accessCode ?? null,
  })

  if (error) {
    throw error
  }

  return mapParticipantResult(data)
}

export async function updateParticipant(
  input: UpdateParticipantInput,
  context: AdminAccessContext,
): Promise<Participant> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_update_participant', {
    ...participantRpcParams(context),
    p_participant_id: input.id,
    p_display_name: input.displayName ?? null,
    p_access_code: input.accessCode ?? null,
  })

  if (error) {
    throw error
  }

  return mapParticipantResult(data)
}

export async function deactivateParticipant(
  participantId: string,
  context: AdminAccessContext,
): Promise<Participant> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_deactivate_participant', {
    ...participantRpcParams(context),
    p_participant_id: participantId,
  })

  if (error) {
    throw error
  }

  return mapParticipantResult(data)
}

export async function reactivateParticipant(
  participantId: string,
  context: AdminAccessContext,
): Promise<Participant> {
  if (!supabase) {
    throw new Error('Supabase ist noch nicht konfiguriert.')
  }

  const { data, error } = await supabase.rpc('ha_reactivate_participant', {
    ...participantRpcParams(context),
    p_participant_id: participantId,
  })

  if (error) {
    throw error
  }

  return mapParticipantResult(data)
}
