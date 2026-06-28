import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}))

import { loadAllTimeStandings } from '../data/allTimeStandings'
import { loadCategories, updateCategoryStatus } from '../data/categories'
import {
  createParticipant,
  deactivateParticipant,
  findParticipantByAccessCode,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  updateParticipant,
} from '../data/participants'
import {
  deleteVotesForCategory,
  loadVotes,
  loadVotesForParticipant,
  saveVote,
} from '../data/votes'

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
})

describe('Supabase Datenzugriffe', () => {
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

  it('findet den angemeldeten Teilnehmer ueber Codepruefung auf dem Server', async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: 'alice',
          name: 'alice',
          display_name: 'Alice',
          is_admin: true,
          is_active: true,
        },
      ],
      error: null,
    })

    await expect(findParticipantByAccessCode('ALICE42')).resolves.toEqual({
      id: 'alice',
      name: 'alice',
      displayName: 'Alice',
      accessCode: 'ALICE42',
      isAdmin: true,
      isActive: true,
    })
    expect(rpcMock).toHaveBeenCalledWith('ha_find_participant', {
      p_access_code: 'ALICE42',
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
})
