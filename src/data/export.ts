import { loadAdminCategories, type Category } from './categories'
import { loadFestivalName } from './festival'
import { loadAdminParticipants, type Participant } from './participants'
import { loadVotes, type Vote } from './votes'
import type { AdminAccessContext } from './accessContext'

export const festivalExportFormatVersion = 1

export type FestivalExportOptions = {
  includeParticipantAccessCodes?: boolean
}

export type FestivalExportSource =
  | {
      type: 'active'
      festivalId: string
    }
  | {
      type: 'archive'
      festivalId: string
      archiveId: string
      archivedAt?: string
    }

export type FestivalExportData = {
  formatVersion: typeof festivalExportFormatVersion
  exportedAt: string
  festival: {
    id: string
    name: string
    source: FestivalExportSource['type']
    archiveId?: string
    archivedAt?: string
  }
  participants: Array<Omit<Participant, 'accessCode'> & { accessCode?: string }>
  categories: Category[]
  votes: Vote[]
}

export type CreateFestivalExportInput = {
  festivalName: string
  festivalSource: FestivalExportSource
  participants: Participant[]
  categories: Category[]
  votes: Vote[]
  exportedAt?: Date
  options?: FestivalExportOptions
}

export async function loadFestivalExportData(
  context: AdminAccessContext,
  festivalSource: FestivalExportSource,
  exportedAt = new Date(),
  options: FestivalExportOptions = {},
): Promise<FestivalExportData> {
  const [festivalName, participants, categories, votes] = await Promise.all([
    loadFestivalName(),
    loadAdminParticipants(context),
    loadAdminCategories(context),
    loadVotes(context),
  ])

  return createFestivalExportData({
    festivalName,
    festivalSource,
    participants,
    categories,
    votes,
    exportedAt,
    options,
  })
}

function participantForExport(
  participant: Participant,
  options: FestivalExportOptions,
): FestivalExportData['participants'][number] {
  if (options.includeParticipantAccessCodes === true) {
    return participant
  }

  return {
    id: participant.id,
    name: participant.name,
    displayName: participant.displayName,
    isAdmin: participant.isAdmin,
    isActive: participant.isActive,
  }
}

export function createFestivalExportData({
  festivalName,
  festivalSource,
  participants,
  categories,
  votes,
  exportedAt = new Date(),
  options = {},
}: CreateFestivalExportInput): FestivalExportData {
  return {
    formatVersion: festivalExportFormatVersion,
    exportedAt: exportedAt.toISOString(),
    festival: {
      id: festivalSource.festivalId,
      name: festivalName,
      source: festivalSource.type,
      ...(festivalSource.type === 'archive'
        ? {
            archiveId: festivalSource.archiveId,
            archivedAt: festivalSource.archivedAt,
          }
        : {}),
    },
    participants: participants.map((participant) =>
      participantForExport(participant, options),
    ),
    categories,
    votes,
  }
}

export function serializeFestivalExport(exportData: FestivalExportData) {
  return `${JSON.stringify(exportData, null, 2)}\n`
}

export function festivalExportFileName(
  festivalName: string,
  exportedAt = new Date(),
) {
  const date = exportedAt.toISOString().slice(0, 10)
  const slug =
    festivalName
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'festival'

  return `festival-awards-${slug}-${date}.json`
}
