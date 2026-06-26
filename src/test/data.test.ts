import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { loadAllTimeStandings } from '../data/allTimeStandings'
import { loadCategories, updateCategoryStatus } from '../data/categories'
import { loadParticipants } from '../data/participants'
import {
  deleteVotesForCategory,
  loadVotes,
  loadVotesForParticipant,
  saveVote,
} from '../data/votes'

beforeEach(() => {
  fromMock.mockReset()
})

describe('Supabase Datenzugriffe', () => {
  it('laedt Kategorien sortiert und mappt Datenbankfelder', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'cat-1',
          title: 'Beste Energie',
          description: 'Offene Kategorie',
          status: 'open',
          sort_order: 10,
        },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    fromMock.mockReturnValue({ select })

    await expect(loadCategories()).resolves.toEqual([
      {
        id: 'cat-1',
        title: 'Beste Energie',
        description: 'Offene Kategorie',
        status: 'open',
      },
    ])
    expect(fromMock).toHaveBeenCalledWith('categories')
    expect(select).toHaveBeenCalledWith('id, title, description, status, sort_order')
    expect(order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })

  it('speichert Kategorie-Status und gibt die aktualisierte Kategorie zurueck', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'cat-1',
        title: 'Beste Energie',
        description: 'Offene Kategorie',
        status: 'closed',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValue({ update })

    await expect(updateCategoryStatus('cat-1', 'closed')).resolves.toEqual({
      id: 'cat-1',
      title: 'Beste Energie',
      description: 'Offene Kategorie',
      status: 'closed',
    })
    expect(fromMock).toHaveBeenCalledWith('categories')
    expect(update).toHaveBeenCalledWith({ status: 'closed' })
    expect(eq).toHaveBeenCalledWith('id', 'cat-1')
  })

  it('laedt Teilnehmer alphabetisch und mappt Access Codes', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'alice',
          name: 'alice',
          display_name: 'Alice',
          access_code: 'ALICE42',
        },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    fromMock.mockReturnValue({ select })

    await expect(loadParticipants()).resolves.toEqual([
      {
        id: 'alice',
        name: 'alice',
        displayName: 'Alice',
        accessCode: 'ALICE42',
      },
    ])
    expect(fromMock).toHaveBeenCalledWith('participants')
    expect(order).toHaveBeenCalledWith('name')
  })

  it('laedt alle Stimmen und einzelne Teilnehmerstimmen aus Supabase', async () => {
    const selectAll = vi.fn().mockResolvedValue({
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
    fromMock.mockReturnValueOnce({ select: selectAll })

    await expect(loadVotes()).resolves.toEqual([
      {
        voterId: 'alice',
        votedForId: 'bob',
        categoryId: 'cat-1',
        timestamp: '2026-06-26T12:00:00.000Z',
      },
    ])

    const eq = vi.fn().mockResolvedValue({
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
    const selectForParticipant = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValueOnce({ select: selectForParticipant })

    await expect(loadVotesForParticipant('alice')).resolves.toEqual([
      {
        voterId: 'alice',
        votedForId: 'carla',
        categoryId: 'cat-2',
        timestamp: '2026-06-26T13:00:00.000Z',
      },
    ])
    expect(eq).toHaveBeenCalledWith('voter_id', 'alice')
  })

  it('speichert und loescht Stimmen mit den fachlichen Schluesseln', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        voter_id: 'alice',
        voted_for_id: 'bob',
        category_id: 'cat-1',
        timestamp: '2026-06-26T12:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    fromMock.mockReturnValueOnce({ insert })

    await expect(
      saveVote({
        voterId: 'alice',
        votedForId: 'bob',
        categoryId: 'cat-1',
        timestamp: '2026-06-26T12:00:00.000Z',
      }),
    ).resolves.toEqual({
      voterId: 'alice',
      votedForId: 'bob',
      categoryId: 'cat-1',
      timestamp: '2026-06-26T12:00:00.000Z',
    })
    expect(insert).toHaveBeenCalledWith({
      voter_id: 'alice',
      voted_for_id: 'bob',
      category_id: 'cat-1',
      timestamp: '2026-06-26T12:00:00.000Z',
    })

    const eq = vi.fn().mockResolvedValue({ error: null })
    const deleteMock = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValueOnce({ delete: deleteMock })

    await expect(deleteVotesForCategory('cat-1')).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith('category_id', 'cat-1')
  })

  it('laedt die ewige Tabelle nach Gesamtpunkten und Namen sortiert', async () => {
    const secondOrder = vi.fn().mockResolvedValue({
      data: [
        {
          participant_id: 'bob',
          participant_name: 'Bob',
          total_points: '18',
        },
      ],
      error: null,
    })
    const firstOrder = vi.fn().mockReturnValue({ order: secondOrder })
    const select = vi.fn().mockReturnValue({ order: firstOrder })
    fromMock.mockReturnValue({ select })

    await expect(loadAllTimeStandings()).resolves.toEqual([
      {
        participantId: 'bob',
        participantName: 'Bob',
        totalPoints: 18,
      },
    ])
    expect(fromMock).toHaveBeenCalledWith('all_time_standings')
    expect(firstOrder).toHaveBeenCalledWith('total_points', {
      ascending: false,
    })
    expect(secondOrder).toHaveBeenCalledWith('participant_name', {
      ascending: true,
    })
  })
})
