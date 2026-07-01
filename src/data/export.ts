import { loadAdminCategories, type Category } from './categories'
import { loadFestivalName } from './festival'
import { loadAdminParticipants, type Participant } from './participants'
import { loadVotes, type Vote } from './votes'
import type { AdminAccessContext } from './accessContext'

export const festivalExportFormatVersion = 1

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
  participants: Participant[]
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
}

export async function loadFestivalExportData(
  context: AdminAccessContext,
  festivalSource: FestivalExportSource,
  exportedAt = new Date(),
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
  })
}

export function createFestivalExportData({
  festivalName,
  festivalSource,
  participants,
  categories,
  votes,
  exportedAt = new Date(),
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
    participants,
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
