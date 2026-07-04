import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readdirSync } from 'node:fs'

const rpcMock = vi.hoisted(() => vi.fn())
const storageFromMock = vi.hoisted(() => vi.fn())
const uploadMock = vi.hoisted(() => vi.fn())
const createSignedUrlMock = vi.hoisted(() => vi.fn())

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    storage: {
      from: storageFromMock,
    },
  },
  getSupabase: () => ({
    rpc: rpcMock,
    storage: {
      from: storageFromMock,
    },
  }),
}))

import { loadAllTimeStandings } from '../data/allTimeStandings'
import {
  archiveFestival,
  loadFestivalAccessCode,
  loadFestivalAccessVersion,
  loadFestivalName,
  updateFestivalAccessCode,
  updateFestivalName,
  verifyFestivalAccessCode,
} from '../data/festival'
import {
  createFestivalExportData,
  festivalExportFileName,
  loadFestivalExportData,
  serializeFestivalExport,
} from '../data/export'
import {
  createCategory,
  deleteCategory,
  loadAdminCategories,
  loadCategories,
  updateCategory,
  updateCategoryStatus,
} from '../data/categories'
import {
  createParticipant,
  deactivateParticipant,
  loginParticipant,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  updateParticipant,
  updateParticipantAvatar,
} from '../data/participants'
import { avatarById, avatars, defaultAvatarId } from '../data/avatars'
import {
  deleteVotesForCategory,
  loadVotes,
  loadVotesForParticipant,
  saveVote,
} from '../data/votes'
import {
  deleteCampLocationLink,
  deleteFestivalDocument,
  isSupportedCampLocationLink,
  loadAdminCampLocationLink,
  loadAdminFestivalDocuments,
  loadCampLocationLink,
  loadFestivalDocuments,
  updateCampLocationLink,
  uploadFestivalDocument,
} from '../data/festivalDocuments'
import {
  deleteMusicPlaylist,
  loadAdminMusicPlaylist,
  loadMusicPlaylist,
  updateMusicPlaylist,
} from '../data/festivalMusic'
import {
  closeBingoRound,
  loadAdminBingoRound,
  loadOrCreateBingoCard,
  setBingoMark,
  startBingoRound,
} from '../data/bingo'
import {
  isSupportedMusicPlaylistLink,
  normalizeSpotifyPlaylistLink,
} from '../data/musicEmbeds'

const participantContext = {
  participantAccessCode: 'ALICE42',
}

const expectedParticipantRpcContext = {
  p_participant_access_code: 'ALICE42',
}

const participantRow = {
  id: 'alice',
  name: 'alice',
  display_name: 'Alice',
  access_code: 'ALICE42',
  is_admin: false,
  is_active: true,
}

const mappedParticipant = {
  id: 'alice',
  name: 'alice',
  displayName: 'Alice',
  accessCode: 'ALICE42',
  isAdmin: false,
  isActive: true,
}

beforeEach(() => {
  rpcMock.mockReset()
  uploadMock.mockReset()
  createSignedUrlMock.mockReset()
  storageFromMock.mockReset()
  storageFromMock.mockReturnValue({
    upload: uploadMock,
    createSignedUrl: createSignedUrlMock,
  })
  uploadMock.mockResolvedValue({
    data: { path: 'current/timetable/file.pdf' },
    error: null,
  })
  createSignedUrlMock.mockResolvedValue({
    data: { signedUrl: 'https://example.test/document.pdf' },
    error: null,
  })
})

describe('Supabase Datenzugriffe', () => {
  it('laedt den Festivalnamen ueber eine RPC Funktion', async () => {
    rpcMock.mockResolvedValue({
      data: 'Hurricane Awards 2026',
      error: null,
    })

    await expect(loadFestivalName()).resolves.toBe('Hurricane Awards 2026')
    expect(rpcMock).toHaveBeenCalledWith('ha_get_festival_name')
  })

  it('speichert den Festivalnamen ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: 'Hurricane Crew Awards',
      error: null,
    })

    await expect(
      updateFestivalName('Hurricane Crew Awards', participantContext),
    ).resolves.toBe('Hurricane Crew Awards')
    expect(rpcMock).toHaveBeenCalledWith('ha_update_festival_name', {
      ...expectedParticipantRpcContext,
      p_name: 'Hurricane Crew Awards',
    })
  })

  it('prueft den Festivalcode ohne ihn auszulesen', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          is_valid: true,
          access_version: '2026-07-01 10:00:00+00',
        },
      ],
      error: null,
    })

    await expect(
      verifyFestivalAccessCode(' hurricane2026 '),
    ).resolves.toEqual({
      isValid: true,
      version: '2026-07-01 10:00:00+00',
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_verify_festival_access_code', {
      p_access_code: 'HURRICANE2026',
    })
  })

  it('laedt die Festivalcode-Version ohne Codewert', async () => {
    rpcMock.mockResolvedValue({
      data: '2026-07-01 10:00:00+00',
      error: null,
    })

    await expect(loadFestivalAccessVersion()).resolves.toBe(
      '2026-07-01 10:00:00+00',
    )
    expect(rpcMock).toHaveBeenCalledWith('ha_get_festival_access_version')
  })

  it('laedt und speichert den Festivalcode ueber Admin RPCs', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          access_code: 'HURRICANE2026',
          access_version: '2026-07-01 10:00:00+00',
        },
      ],
      error: null,
    })

    await expect(loadFestivalAccessCode(participantContext)).resolves.toEqual({
      code: 'HURRICANE2026',
      version: '2026-07-01 10:00:00+00',
    })
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      'ha_get_festival_access_code',
      expectedParticipantRpcContext,
    )

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          access_code: 'NEUERCODE',
          access_version: '2026-07-01 10:05:00+00',
        },
      ],
      error: null,
    })

    await expect(
      updateFestivalAccessCode(' neuercode ', participantContext),
    ).resolves.toEqual({
      code: 'NEUERCODE',
      version: '2026-07-01 10:05:00+00',
    })
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'ha_update_festival_access_code', {
      ...expectedParticipantRpcContext,
      p_access_code: 'NEUERCODE',
    })
  })

  it('archiviert das Festival ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: '8e560706-5e2f-4b50-9e41-381625fd8102',
      error: null,
    })

    await expect(archiveFestival('ALICE42')).resolves.toBe(
      '8e560706-5e2f-4b50-9e41-381625fd8102',
    )
    expect(rpcMock).toHaveBeenCalledWith('ha_archive_festival', {
      p_admin_access_code: 'ALICE42',
    })
  })

  it('laedt Festivaldokumente mit signierter Anzeige URL', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          document_type: 'timetable',
          title: 'Timetable',
          file_path: 'current/timetable/file.pdf',
          mime_type: 'application/pdf',
          updated_at: '2026-07-03T10:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(loadFestivalDocuments(participantContext)).resolves.toEqual([
      {
        documentType: 'timetable',
        title: 'Timetable',
        filePath: 'current/timetable/file.pdf',
        mimeType: 'application/pdf',
        updatedAt: '2026-07-03T10:00:00.000Z',
        displayUrl: 'https://example.test/document.pdf',
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_list_festival_documents',
      expectedParticipantRpcContext,
    )
    expect(storageFromMock).toHaveBeenCalledWith('festival-documents')
    expect(createSignedUrlMock).toHaveBeenCalledWith(
      'current/timetable/file.pdf',
      3600,
    )
  })

  it('laedt Festivaldokumente fuer die Adminverwaltung', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          document_type: 'site_map',
          title: 'Gelaendeplan',
          file_path: 'current/site_map/map.png',
          mime_type: 'image/png',
          updated_at: '2026-07-03T10:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(
      loadAdminFestivalDocuments(participantContext),
    ).resolves.toMatchObject([
      {
        documentType: 'site_map',
        title: 'Gelaendeplan',
        filePath: 'current/site_map/map.png',
        mimeType: 'image/png',
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_admin_list_festival_documents',
      expectedParticipantRpcContext,
    )
  })

  it('laedt Festivaldokumente in Storage hoch und speichert Metadaten', async () => {
    const file = new File(['pdf'], 'Plan 2026.pdf', {
      type: 'application/pdf',
    })
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          document_type: 'timetable',
          title: 'Timetable',
          file_path: 'current/timetable/generated-plan-2026.pdf',
          mime_type: 'application/pdf',
          expires_at: '2026-07-03T10:10:00.000Z',
        },
      ],
      error: null,
    })
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          document_type: 'timetable',
          title: 'Timetable',
          file_path: 'current/timetable/generated-plan-2026.pdf',
          mime_type: 'application/pdf',
          updated_at: '2026-07-03T10:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(
      uploadFestivalDocument(
        {
          documentType: 'timetable',
          title: 'Timetable',
          file,
        },
        participantContext,
      ),
    ).resolves.toMatchObject({
      documentType: 'timetable',
      title: 'Timetable',
      mimeType: 'application/pdf',
    })
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      'ha_create_festival_document_upload',
      {
        ...expectedParticipantRpcContext,
        p_document_type: 'timetable',
        p_title: 'Timetable',
        p_file_name: 'plan-2026.pdf',
        p_mime_type: 'application/pdf',
      },
    )
    expect(uploadMock).toHaveBeenCalledWith(
      'current/timetable/generated-plan-2026.pdf',
      file,
      {
        contentType: 'application/pdf',
        upsert: false,
      },
    )
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_upsert_festival_document',
      expect.objectContaining({
        ...expectedParticipantRpcContext,
        p_document_type: 'timetable',
        p_title: 'Timetable',
        p_file_path: 'current/timetable/generated-plan-2026.pdf',
        p_mime_type: 'application/pdf',
      }),
    )
  })

  it('loescht Festivaldokumente ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: null,
    })

    await expect(
      deleteFestivalDocument('site_map', participantContext),
    ).resolves.toBeUndefined()
    expect(rpcMock).toHaveBeenCalledWith('ha_delete_festival_document', {
      ...expectedParticipantRpcContext,
      p_document_type: 'site_map',
    })
  })

  it('validiert unterstuetzte Campstandort Links clientseitig', () => {
    expect(isSupportedCampLocationLink('https://maps.app.goo.gl/camp')).toBe(true)
    expect(
      isSupportedCampLocationLink('https://www.google.com/maps/place/camp'),
    ).toBe(true)
    expect(isSupportedCampLocationLink('https://wa.me/491701234567')).toBe(true)
    expect(isSupportedCampLocationLink('https://example.com/camp')).toBe(false)
    expect(isSupportedCampLocationLink('http://maps.app.goo.gl/camp')).toBe(false)
  })

  it('laedt den Campstandort fuer Teilnehmende und Admins', async () => {
    rpcMock.mockResolvedValueOnce({
      data: 'https://maps.app.goo.gl/camp',
      error: null,
    })

    await expect(loadCampLocationLink(participantContext)).resolves.toBe(
      'https://maps.app.goo.gl/camp',
    )
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      'ha_get_camp_location_link',
      expectedParticipantRpcContext,
    )

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(loadAdminCampLocationLink(participantContext)).resolves.toBeNull()
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_admin_get_camp_location_link',
      expectedParticipantRpcContext,
    )
  })

  it('speichert und loescht den Campstandort ueber Admin RPCs', async () => {
    rpcMock.mockResolvedValueOnce({
      data: 'https://wa.me/491701234567',
      error: null,
    })

    await expect(
      updateCampLocationLink(' https://wa.me/491701234567 ', participantContext),
    ).resolves.toBe('https://wa.me/491701234567')
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'ha_update_camp_location_link', {
      ...expectedParticipantRpcContext,
      p_link: 'https://wa.me/491701234567',
    })

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(deleteCampLocationLink(participantContext)).resolves.toBeUndefined()
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_delete_camp_location_link',
      expectedParticipantRpcContext,
    )
  })

  it('sendet ungueltige Campstandort Links nicht an Supabase', async () => {
    await expect(
      updateCampLocationLink('https://example.com/camp', participantContext),
    ).rejects.toThrow('unsupported camp location link')
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('validiert und normalisiert Spotify Playlist Links clientseitig', () => {
    const playlistId = '37i9dQZF1DXcBWIGoYBM5M'

    expect(
      normalizeSpotifyPlaylistLink(
        `https://open.spotify.com/playlist/${playlistId}?si=test`,
      ),
    ).toEqual({
      provider: 'spotify',
      playlistId,
      externalUrl: `https://open.spotify.com/playlist/${playlistId}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
    })
    expect(isSupportedMusicPlaylistLink(`spotify:playlist:${playlistId}`)).toBe(
      true,
    )
    expect(
      isSupportedMusicPlaylistLink('https://open.spotify.com/album/abc'),
    ).toBe(false)
    expect(
      isSupportedMusicPlaylistLink('https://example.com/playlist/37i9d'),
    ).toBe(false)
  })

  it('laedt die Festival Playlist fuer Teilnehmende und Admins', async () => {
    const playlistRow = {
      provider: 'spotify',
      playlist_id: '37i9dQZF1DXcBWIGoYBM5M',
      external_url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      embed_url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
    }

    rpcMock.mockResolvedValueOnce({
      data: [playlistRow],
      error: null,
    })

    await expect(loadMusicPlaylist(participantContext)).resolves.toEqual({
      provider: 'spotify',
      playlistId: '37i9dQZF1DXcBWIGoYBM5M',
      externalUrl: playlistRow.external_url,
      embedUrl: playlistRow.embed_url,
    })
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      'ha_get_music_playlist',
      expectedParticipantRpcContext,
    )

    rpcMock.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    await expect(loadAdminMusicPlaylist(participantContext)).resolves.toBeNull()
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_admin_get_music_playlist',
      expectedParticipantRpcContext,
    )
  })

  it('speichert und loescht die Festival Playlist ueber Admin RPCs', async () => {
    const playlistId = '37i9dQZF1DXcBWIGoYBM5M'
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          provider: 'spotify',
          playlist_id: playlistId,
          external_url: `https://open.spotify.com/playlist/${playlistId}`,
          embed_url: `https://open.spotify.com/embed/playlist/${playlistId}`,
        },
      ],
      error: null,
    })

    await expect(
      updateMusicPlaylist(
        ` https://open.spotify.com/playlist/${playlistId}?si=abc `,
        participantContext,
      ),
    ).resolves.toMatchObject({
      provider: 'spotify',
      playlistId,
    })
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'ha_update_music_playlist', {
      ...expectedParticipantRpcContext,
      p_link: `https://open.spotify.com/playlist/${playlistId}?si=abc`,
    })

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(deleteMusicPlaylist(participantContext)).resolves.toBeUndefined()
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_delete_music_playlist',
      expectedParticipantRpcContext,
    )
  })

  it('sendet ungueltige Spotify Playlist Links nicht an Supabase', async () => {
    await expect(
      updateMusicPlaylist('https://open.spotify.com/album/abc', participantContext),
    ).rejects.toThrow('unsupported music playlist link')
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('laedt oder erstellt eine Bingokarte fuer eine aktive Runde', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'round-1',
          started_at: '2026-07-04T12:00:00.000Z',
          card_id: 'card-1',
          numbers: Array.from({ length: 25 }, (_, index) => index + 1),
          marked_numbers: [1, 7, 25],
        },
      ],
      error: null,
    })

    await expect(loadOrCreateBingoCard(participantContext)).resolves.toEqual({
      id: 'round-1',
      startedAt: '2026-07-04T12:00:00.000Z',
      cardId: 'card-1',
      numbers: Array.from({ length: 25 }, (_, index) => index + 1),
      markedNumbers: [1, 7, 25],
    })
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_get_or_create_bingo_card',
      expectedParticipantRpcContext,
    )
  })

  it('gibt null zurueck, wenn keine aktive Bingorunde existiert', async () => {
    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    })

    await expect(loadOrCreateBingoCard(participantContext)).resolves.toBeNull()
  })

  it('speichert und entfernt Bingo Markierungen ueber RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [3, 17],
      error: null,
    })

    await expect(setBingoMark(17, true, participantContext)).resolves.toEqual([
      3,
      17,
    ])
    expect(rpcMock).toHaveBeenCalledWith('ha_set_bingo_mark', {
      ...expectedParticipantRpcContext,
      p_number: 17,
      p_is_marked: true,
    })
  })

  it('verwaltet Bingorunden ueber Admin RPCs', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'round-1',
          started_at: '2026-07-04T12:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(loadAdminBingoRound(participantContext)).resolves.toEqual({
      id: 'round-1',
      startedAt: '2026-07-04T12:00:00.000Z',
    })
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      'ha_admin_get_bingo_round',
      expectedParticipantRpcContext,
    )

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'round-2',
          started_at: '2026-07-04T12:10:00.000Z',
        },
      ],
      error: null,
    })

    await expect(startBingoRound(participantContext)).resolves.toEqual({
      id: 'round-2',
      startedAt: '2026-07-04T12:10:00.000Z',
    })
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_start_bingo_round',
      expectedParticipantRpcContext,
    )

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(closeBingoRound(participantContext)).resolves.toBeUndefined()
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      'ha_close_bingo_round',
      expectedParticipantRpcContext,
    )
  })

  it('laedt Kategorien ueber eine geschuetzte RPC Funktion', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'cat-1',
          title: 'Beste Energie',
          description: 'Offene Kategorie',
          status: 'open',
        },
      ],
      error: null,
    })

    await expect(loadCategories(participantContext)).resolves.toEqual([
      {
        id: 'cat-1',
        title: 'Beste Energie',
        description: 'Offene Kategorie',
        status: 'open',
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_list_categories',
      expectedParticipantRpcContext,
    )
  })

  it('speichert Kategorie-Status ueber die Admin RPC Funktion', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'cat-1',
          title: 'Beste Energie',
          description: 'Offene Kategorie',
          status: 'closed',
        },
      ],
      error: null,
    })

    await expect(
      updateCategoryStatus('cat-1', 'closed', participantContext),
    ).resolves.toEqual({
      id: 'cat-1',
      title: 'Beste Energie',
      description: 'Offene Kategorie',
      status: 'closed',
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_update_category_status', {
      ...expectedParticipantRpcContext,
      p_category_id: 'cat-1',
      p_status: 'closed',
    })
  })

  it('laedt Kategorien fuer die Verwaltung ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'cat-1',
          title: 'Beste Energie',
          description: 'Offene Kategorie',
          status: 'open',
          sort_order: 2,
        },
      ],
      error: null,
    })

    await expect(loadAdminCategories(participantContext)).resolves.toEqual([
      {
        id: 'cat-1',
        title: 'Beste Energie',
        description: 'Offene Kategorie',
        status: 'open',
        sortOrder: 2,
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_admin_list_categories',
      expectedParticipantRpcContext,
    )
  })

  it('legt Kategorien ueber Admin RPC an', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'cat-2',
          title: 'Beste Crew',
          description: 'Teamkategorie',
          status: 'upcoming',
          sort_order: 3,
        },
      ],
      error: null,
    })

    await expect(
      createCategory(
        {
          title: 'Beste Crew',
          description: 'Teamkategorie',
          status: 'upcoming',
          sortOrder: 3,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: 'cat-2',
      title: 'Beste Crew',
      description: 'Teamkategorie',
      status: 'upcoming',
      sortOrder: 3,
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_create_category', {
      ...expectedParticipantRpcContext,
      p_title: 'Beste Crew',
      p_description: 'Teamkategorie',
      p_status: 'upcoming',
      p_sort_order: 3,
    })
  })

  it('bearbeitet Kategorien ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'cat-2',
          title: 'Beste Crew Neu',
          description: 'Aktualisierte Teamkategorie',
          status: 'closed',
          sort_order: 4,
        },
      ],
      error: null,
    })

    await expect(
      updateCategory(
        {
          id: 'cat-2',
          title: 'Beste Crew Neu',
          description: 'Aktualisierte Teamkategorie',
          status: 'closed',
          sortOrder: 4,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: 'cat-2',
      title: 'Beste Crew Neu',
      description: 'Aktualisierte Teamkategorie',
      status: 'closed',
      sortOrder: 4,
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_update_category', {
      ...expectedParticipantRpcContext,
      p_category_id: 'cat-2',
      p_title: 'Beste Crew Neu',
      p_description: 'Aktualisierte Teamkategorie',
      p_status: 'closed',
      p_sort_order: 4,
    })
  })

  it('loescht Kategorien ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: null,
    })

    await expect(
      deleteCategory('cat-2', participantContext),
    ).resolves.toBeUndefined()
    expect(rpcMock).toHaveBeenCalledWith('ha_delete_category', {
      ...expectedParticipantRpcContext,
      p_category_id: 'cat-2',
    })
  })

  it('reicht Admin RPC Fehler aus der Kategorienverwaltung weiter', async () => {
    const error = new Error('category cannot be deleted while votes exist')

    rpcMock.mockResolvedValue({
      data: null,
      error,
    })

    await expect(
      deleteCategory('cat-2', participantContext),
    ).rejects.toThrow('category cannot be deleted while votes exist')
  })

  it('laedt Teilnehmer ohne Access Codes ueber eine geschuetzte RPC Funktion', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'alice',
          name: 'alice',
          display_name: 'Alice',
          is_admin: false,
          is_active: true,
        },
      ],
      error: null,
    })

    await expect(loadParticipants(participantContext)).resolves.toEqual([
      {
        id: 'alice',
        name: 'alice',
        displayName: 'Alice',
        accessCode: '',
        isAdmin: false,
        isActive: true,
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_list_participants',
      expectedParticipantRpcContext,
    )
  })

  it('enthaelt eine feste Avatarbibliothek mit Default Avatar', () => {
    const avatarFiles = readdirSync('src/assets/avatars').filter((fileName) =>
      /^avatar-\d{3}\.svg$/.test(fileName),
    )

    expect(avatarFiles.length).toBeGreaterThanOrEqual(50)
    expect(avatars).toHaveLength(52)
    expect(avatars.length).toBeGreaterThanOrEqual(50)
    expect(avatars.every((avatar) => avatar.imageSrc.length > 0)).toBe(true)
    expect(new Set(avatars.map((avatar) => avatar.imageSrc)).size).toBe(
      avatars.length,
    )
    expect(avatarById()).toEqual(avatarById(defaultAvatarId))
    expect(avatarById('unbekannt')).toEqual(avatarById(defaultAvatarId))
  })

  it('meldet Teilnehmer ueber geschuetzten Login RPC an', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          status: 'success',
          locked_until: null,
          id: 'alice',
          name: 'alice',
          display_name: 'Alice',
          is_admin: true,
          is_active: true,
        },
      ],
      error: null,
    })

    await expect(loginParticipant(' alice42 ')).resolves.toEqual({
      status: 'success',
      participant: {
        id: 'alice',
        name: 'alice',
        displayName: 'Alice',
        accessCode: 'ALICE42',
        isAdmin: true,
        isActive: true,
      },
      lockedUntil: null,
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_login_participant', {
      p_access_code: 'ALICE42',
    })
  })

  it('gibt ungueltige Logins generisch aus dem Login RPC weiter', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          status: 'invalid',
          locked_until: null,
          id: null,
          name: null,
          display_name: null,
          is_admin: null,
          is_active: null,
        },
      ],
      error: null,
    })

    await expect(loginParticipant('FALSCH')).resolves.toEqual({
      status: 'invalid',
      participant: null,
      lockedUntil: null,
    })
  })

  it('gibt temporaere Login Sperren aus dem Login RPC weiter', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          status: 'blocked',
          locked_until: '2026-06-30T12:00:30.000Z',
          id: null,
          name: null,
          display_name: null,
          is_admin: null,
          is_active: null,
        },
      ],
      error: null,
    })

    await expect(loginParticipant('FALSCH')).resolves.toEqual({
      status: 'blocked',
      participant: null,
      lockedUntil: '2026-06-30T12:00:30.000Z',
    })
  })

  it('laedt aktive und deaktivierte Teilnehmer fuer die Verwaltung ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [
        participantRow,
        {
          ...participantRow,
          id: 'bob',
          name: 'bob',
          display_name: 'Bob',
          access_code: 'BOB42',
          is_active: false,
        },
      ],
      error: null,
    })

    await expect(loadAdminParticipants(participantContext)).resolves.toEqual([
      mappedParticipant,
      {
        ...mappedParticipant,
        id: 'bob',
        name: 'bob',
        displayName: 'Bob',
        accessCode: 'BOB42',
        isActive: false,
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_admin_list_participants',
      expectedParticipantRpcContext,
    )
  })

  it('legt Teilnehmer ueber Admin RPC an und erlaubt automatisch erzeugte Codes', async () => {
    rpcMock.mockResolvedValue({
      data: [participantRow],
      error: null,
    })

    await expect(
      createParticipant({ displayName: 'Alice' }, participantContext),
    ).resolves.toEqual(mappedParticipant)
    expect(rpcMock).toHaveBeenCalledWith('ha_create_participant', {
      ...expectedParticipantRpcContext,
      p_display_name: 'Alice',
      p_access_code: null,
    })
  })

  it('laedt einen vorgeschlagenen Teilnehmercode ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: 'NEU23456',
      error: null,
    })

    await expect(
      suggestParticipantAccessCode(participantContext),
    ).resolves.toBe('NEU23456')
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_suggest_participant_access_code',
      expectedParticipantRpcContext,
    )
  })

  it('legt Teilnehmer mit ueberschriebenem Code ueber Admin RPC an', async () => {
    rpcMock.mockResolvedValue({
      data: [participantRow],
      error: null,
    })

    await expect(
      createParticipant(
        { displayName: 'Alice', accessCode: 'WUNSCH42' },
        participantContext,
      ),
    ).resolves.toEqual(mappedParticipant)
    expect(rpcMock).toHaveBeenCalledWith('ha_create_participant', {
      ...expectedParticipantRpcContext,
      p_display_name: 'Alice',
      p_access_code: 'WUNSCH42',
    })
  })

  it('bearbeitet Teilnehmer ueber Admin RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          ...participantRow,
          display_name: 'Alice Neu',
          access_code: 'NEU42',
        },
      ],
      error: null,
    })

    await expect(
      updateParticipant(
        { id: 'alice', displayName: 'Alice Neu', accessCode: 'NEU42' },
        participantContext,
      ),
    ).resolves.toEqual({
      ...mappedParticipant,
      displayName: 'Alice Neu',
      accessCode: 'NEU42',
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_update_participant', {
      ...expectedParticipantRpcContext,
      p_participant_id: 'alice',
      p_display_name: 'Alice Neu',
      p_access_code: 'NEU42',
    })
  })

  it('speichert den eigenen Avatar ueber Teilnehmer RPC', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          ...participantRow,
          avatar_id: 'neon-tent',
        },
      ],
      error: null,
    })

    await expect(
      updateParticipantAvatar(
        { participantId: 'alice', avatarId: 'neon-tent' },
        participantContext,
      ),
    ).resolves.toEqual({
      ...mappedParticipant,
      avatarId: 'neon-tent',
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_update_participant_avatar', {
      ...expectedParticipantRpcContext,
      p_participant_id: 'alice',
      p_avatar_id: 'neon-tent',
    })
  })

  it('deaktiviert und reaktiviert Teilnehmer ueber Admin RPCs', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ ...participantRow, is_active: false }],
      error: null,
    })

    await expect(
      deactivateParticipant('alice', participantContext),
    ).resolves.toEqual({
      ...mappedParticipant,
      isActive: false,
    })
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'ha_deactivate_participant', {
      ...expectedParticipantRpcContext,
      p_participant_id: 'alice',
    })

    rpcMock.mockResolvedValueOnce({
      data: [participantRow],
      error: null,
    })

    await expect(
      reactivateParticipant('alice', participantContext),
    ).resolves.toEqual(mappedParticipant)
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'ha_reactivate_participant', {
      ...expectedParticipantRpcContext,
      p_participant_id: 'alice',
    })
  })

  it('reicht Admin RPC Fehler aus der Teilnehmerverwaltung weiter', async () => {
    const error = new Error('participant access code already exists')

    rpcMock.mockResolvedValue({
      data: null,
      error,
    })

    await expect(
      createParticipant(
        { displayName: 'Alice', accessCode: 'ALICE42' },
        participantContext,
      ),
    ).rejects.toThrow('participant access code already exists')
  })

  it('laedt Ergebnisstimmen und einzelne Teilnehmerstimmen ueber RPC Funktionen', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          voter_id: 'alice',
          voted_for_id: 'bob',
          category_id: 'cat-1',
          timestamp: '2026-06-26T12:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(loadVotes(participantContext)).resolves.toEqual([
      {
        voterId: 'alice',
        votedForId: 'bob',
        categoryId: 'cat-1',
        timestamp: '2026-06-26T12:00:00.000Z',
      },
    ])

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          voter_id: 'alice',
          voted_for_id: 'carla',
          category_id: 'cat-2',
          timestamp: '2026-06-26T13:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(
      loadVotesForParticipant('alice', participantContext),
    ).resolves.toEqual([
      {
        voterId: 'alice',
        votedForId: 'carla',
        categoryId: 'cat-2',
        timestamp: '2026-06-26T13:00:00.000Z',
      },
    ])
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      'ha_list_result_votes',
      expectedParticipantRpcContext,
    )
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'ha_list_participant_votes', {
      ...expectedParticipantRpcContext,
      p_voter_id: 'alice',
    })
  })

  it('speichert und loescht Stimmen ueber geschuetzte RPC Funktionen', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          voter_id: 'alice',
          voted_for_id: 'bob',
          category_id: 'cat-1',
          timestamp: '2026-06-26T12:00:00.000Z',
        },
      ],
      error: null,
    })

    await expect(
      saveVote(
        {
          voterId: 'alice',
          votedForId: 'bob',
          categoryId: 'cat-1',
          timestamp: '2026-06-26T12:00:00.000Z',
        },
        participantContext,
      ),
    ).resolves.toEqual({
      voterId: 'alice',
      votedForId: 'bob',
      categoryId: 'cat-1',
      timestamp: '2026-06-26T12:00:00.000Z',
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_save_vote', {
      ...expectedParticipantRpcContext,
      p_voter_id: 'alice',
      p_voted_for_id: 'bob',
      p_category_id: 'cat-1',
      p_timestamp: '2026-06-26T12:00:00.000Z',
    })

    rpcMock.mockResolvedValueOnce({ data: null, error: null })

    await expect(
      deleteVotesForCategory('cat-1', participantContext),
    ).resolves.toBeUndefined()
    expect(rpcMock).toHaveBeenLastCalledWith('ha_delete_category_votes', {
      ...expectedParticipantRpcContext,
      p_category_id: 'cat-1',
    })
  })

  it('laedt die ewige Tabelle ueber eine geschuetzte RPC Funktion', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          participant_id: 'bob',
          participant_name: 'Bob',
          total_points: '18',
        },
      ],
      error: null,
    })

    await expect(loadAllTimeStandings(participantContext)).resolves.toEqual([
      {
        participantId: 'bob',
        participantName: 'Bob',
        totalPoints: 18,
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith(
      'ha_list_all_time_standings',
      expectedParticipantRpcContext,
    )
  })

  it('laedt Exportdaten ohne Teilnehmercodes ueber bestehende geschuetzte RPC Funktionen', async () => {
    const exportedAt = new Date('2026-07-01T10:11:12.000Z')

    rpcMock
      .mockResolvedValueOnce({
        data: 'Hurricane Awards 2026',
        error: null,
      })
      .mockResolvedValueOnce({
        data: [participantRow],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'cat-1',
            title: 'Beste Energie',
            description: 'Offene Kategorie',
            status: 'open',
            sort_order: 2,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            voter_id: 'alice',
            voted_for_id: 'bob',
            category_id: 'cat-1',
            timestamp: '2026-06-26T12:00:00.000Z',
          },
        ],
        error: null,
      })

    await expect(
      loadFestivalExportData(
        participantContext,
        {
          type: 'active',
          festivalId: 'hurricane-awards-2026',
        },
        exportedAt,
      ),
    ).resolves.toEqual({
      formatVersion: 1,
      exportedAt: '2026-07-01T10:11:12.000Z',
      festival: {
        id: 'hurricane-awards-2026',
        name: 'Hurricane Awards 2026',
        source: 'active',
      },
      participants: [
        {
          id: 'alice',
          name: 'alice',
          displayName: 'Alice',
          isAdmin: false,
          isActive: true,
        },
      ],
      categories: [
        {
          id: 'cat-1',
          title: 'Beste Energie',
          description: 'Offene Kategorie',
          status: 'open',
          sortOrder: 2,
        },
      ],
      votes: [
        {
          voterId: 'alice',
          votedForId: 'bob',
          categoryId: 'cat-1',
          timestamp: '2026-06-26T12:00:00.000Z',
        },
      ],
    })
    expect(rpcMock).toHaveBeenNthCalledWith(1, 'ha_get_festival_name')
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      'ha_admin_list_participants',
      expectedParticipantRpcContext,
    )
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      'ha_admin_list_categories',
      expectedParticipantRpcContext,
    )
    expect(rpcMock).toHaveBeenNthCalledWith(
      4,
      'ha_list_result_votes',
      expectedParticipantRpcContext,
    )
  })

  it('nimmt Teilnehmercodes nur mit expliziter Exportoption auf', async () => {
    const exportedAt = new Date('2026-07-01T10:11:12.000Z')
    const exportData = createFestivalExportData({
      festivalName: 'Hurricane Crew Awards',
      festivalSource: {
        type: 'active',
        festivalId: 'hurricane-awards-2026',
      },
      participants: [mappedParticipant],
      categories: [],
      votes: [],
      exportedAt,
      options: {
        includeParticipantAccessCodes: true,
      },
    })

    expect(exportData.participants).toEqual([mappedParticipant])
  })

  it('formatiert Export JSON lesbar und erzeugt stabile Dateinamen', () => {
    const exportedAt = new Date('2026-07-01T10:11:12.000Z')
    const exportData = createFestivalExportData({
      festivalName: 'Hurricane Crew Awards!',
      festivalSource: {
        type: 'active',
        festivalId: 'hurricane-awards-2026',
      },
      participants: [mappedParticipant],
      categories: [],
      votes: [],
      exportedAt,
    })

    expect(serializeFestivalExport(exportData)).toBe(
      `${JSON.stringify(exportData, null, 2)}\n`,
    )
    expect(
      festivalExportFileName('Hurricane Crew Awards!', exportedAt),
    ).toBe('festival-awards-hurricane-crew-awards-2026-07-01.json')
  })
})
