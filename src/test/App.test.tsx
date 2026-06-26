import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import {
  loadCategories,
  updateCategoryStatus,
  type Category,
} from '../data/categories'
import {
  findParticipantByAccessCode,
  loadParticipants,
  type Participant,
} from '../data/participants'
import {
  deleteVotesForCategory,
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from '../data/votes'
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from '../data/allTimeStandings'
import i18n from '../i18n'

vi.mock('../data/categories', () => ({
  loadCategories: vi.fn(),
  updateCategoryStatus: vi.fn(),
}))

vi.mock('../data/participants', () => ({
  findParticipantByAccessCode: vi.fn(),
  loadParticipants: vi.fn(),
}))

vi.mock('../data/votes', () => ({
  deleteVotesForCategory: vi.fn(),
  loadVotes: vi.fn(),
  loadVotesForParticipant: vi.fn(),
  saveVote: vi.fn(),
}))

vi.mock('../data/allTimeStandings', () => ({
  loadAllTimeStandings: vi.fn(),
}))

const participants: Participant[] = [
  {
    id: 'alice',
    name: 'alice',
    displayName: 'Alice',
    accessCode: 'ALICE42',
  },
  {
    id: 'bob',
    name: 'bob',
    displayName: 'Bob',
    accessCode: 'BOB42',
  },
  {
    id: 'carla',
    name: 'carla',
    displayName: 'Carla',
    accessCode: 'CARLA42',
  },
]

const categories: Category[] = [
  {
    id: 'upcoming-category',
    title: 'Bester Camp-Aufbau',
    description: 'Noch nicht freigeschaltet.',
    status: 'upcoming',
  },
  {
    id: 'open-category',
    title: 'Beste Festival-Energie',
    description: 'Aktuell offen.',
    status: 'open',
  },
  {
    id: 'closed-category',
    title: 'Beste Regenjacke',
    description: 'Schon beendet.',
    status: 'closed',
  },
]

const standings: AllTimeStanding[] = [
  {
    participantId: 'bob',
    participantName: 'Bob',
    totalPoints: 18,
  },
  {
    participantId: 'alice',
    participantName: 'Alice',
    totalPoints: 12,
  },
]

function vote(overrides: Partial<Vote> = {}): Vote {
  return {
    voterId: 'alice',
    votedForId: 'bob',
    categoryId: 'open-category',
    timestamp: '2026-06-26T12:00:00.000Z',
    ...overrides,
  }
}

function mockLoadedData({
  loadedParticipants = participants,
  loadedCategories = categories,
  loadedVotes = [],
  participantVotes = [],
  loadedStandings = standings,
}: {
  loadedParticipants?: Participant[]
  loadedCategories?: Category[]
  loadedVotes?: Vote[]
  participantVotes?: Vote[]
  loadedStandings?: AllTimeStanding[]
} = {}) {
  vi.mocked(loadParticipants).mockResolvedValue(loadedParticipants)
  vi.mocked(findParticipantByAccessCode).mockImplementation(async (accessCode) => {
    return (
      loadedParticipants.find(
        (participant) => participant.accessCode === accessCode,
      ) ?? null
    )
  })
  vi.mocked(loadCategories).mockResolvedValue(loadedCategories)
  vi.mocked(loadVotes).mockResolvedValue(loadedVotes)
  vi.mocked(loadVotesForParticipant).mockResolvedValue(participantVotes)
  vi.mocked(loadAllTimeStandings).mockResolvedValue(loadedStandings)
  vi.mocked(updateCategoryStatus).mockImplementation(
    async (categoryId, status) => {
      const category = loadedCategories.find(
        (currentCategory) => currentCategory.id === categoryId,
      )

      if (!category) {
        throw new Error('Unknown category')
      }

      return { ...category, status }
    },
  )
  vi.mocked(saveVote).mockImplementation(async (savedVote) => savedVote)
  vi.mocked(deleteVotesForCategory).mockResolvedValue()
}

async function renderLoadedApp() {
  render(<App />)

  await screen.findByRole('main', {
    name: /hurricane awards 2026 anmeldung/i,
  })
}

async function loginWith(code: string) {
  const user = userEvent.setup()

  await user.type(
    screen.getByRole('textbox', { name: /^festival code$/i }),
    code,
  )
  await user.click(screen.getByRole('button', { name: /code/i }))

  await waitFor(() => {
    expect(screen.queryByText('Lade...')).not.toBeInTheDocument()
  })

  return user
}

function sectionForHeading(name: RegExp) {
  const heading = screen.getByRole('heading', { name })
  const section = heading.closest('section')

  expect(section).not.toBeNull()

  return section as HTMLElement
}

beforeEach(async () => {
  vi.clearAllMocks()
  localStorage.clear()
  await i18n.changeLanguage('de')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mockLoadedData()
})

describe('Sprachumschaltung', () => {
  it('schaltet feste UI-Texte auf Niederlaendisch um und speichert die Auswahl', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    await userEvent.click(
      screen.getByRole('button', { name: /niederl/i }),
    )

    expect(
      await screen.findByRole('main', {
        name: /hurricane awards 2026 met 3 deelnemers/i,
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: /stemming/i }),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: /nederlands/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(localStorage.getItem('hurricane-awards-language')).toBe('nl')
  })

  it('laesst Datenbankinhalte beim Sprachwechsel unveraendert', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    await userEvent.click(screen.getByRole('button', { name: /niederl/i }))

    expect(screen.getByText('Beste Festival-Energie')).toBeVisible()
    expect(screen.getByText('Aktuell offen.')).toBeVisible()
  })
})

describe('Login', () => {
  it('zeigt vor der Anmeldung nur Festivalname und Codeformular', async () => {
    await renderLoadedApp()

    expect(
      screen.getByRole('heading', { name: 'Hurricane Awards 2026' }),
    ).toBeVisible()
    expect(screen.getByRole('textbox', { name: /^festival code$/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /code/i })).toBeVisible()
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /ergebnisse/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /gesamtclassement/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument()
    expect(loadParticipants).not.toHaveBeenCalled()
    expect(loadVotes).not.toHaveBeenCalled()
    expect(loadAllTimeStandings).not.toHaveBeenCalled()
  })

  it('erlaubt Zugriff mit gueltigem Teilnehmercode', async () => {
    await renderLoadedApp()

    await loginWith(' alice42 ')

    const identitySection = sectionForHeading(/festival code/i)
    expect(await within(identitySection).findByText(/angemeldet als:/i)).toBeVisible()
    expect(within(identitySection).getByText('Alice')).toBeVisible()
    expect(findParticipantByAccessCode).toHaveBeenCalledWith('ALICE42')
    expect(loadVotesForParticipant).toHaveBeenCalledWith('alice')
  })

  it('verhindert Zugriff mit ungueltigem Teilnehmercode', async () => {
    await renderLoadedApp()

    await loginWith('FALSCH')

    expect(screen.getByText(/code passt leider/i)).toBeVisible()
    expect(screen.queryByText(/angemeldet als:/i)).not.toBeInTheDocument()
    expect(findParticipantByAccessCode).toHaveBeenCalledWith('FALSCH')
    expect(loadVotesForParticipant).not.toHaveBeenCalled()
  })

  it('erhaelt die Anmeldung nach einem Neuladen lokal', async () => {
    localStorage.setItem(
      'hurricane-awards:hurricane-awards-2026:participant',
      JSON.stringify(participants[0]),
    )

    render(<App />)

    expect(await screen.findByText(/angemeldet als:/i)).toBeVisible()
    const identitySection = sectionForHeading(/festival code/i)
    expect(within(identitySection).getByText('Alice')).toBeVisible()
    expect(loadParticipants).toHaveBeenCalled()
    expect(loadVotesForParticipant).toHaveBeenCalledWith('alice')
  })

  it('meldet ab und blendet geschuetzte Inhalte wieder aus', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /abmelden/i }))

    expect(screen.getByRole('heading', { name: 'Hurricane Awards 2026' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
    expect(
      localStorage.getItem('hurricane-awards:hurricane-awards-2026:participant'),
    ).toBeNull()
  })
})

describe('Kategorien', () => {
  it('laedt Kategorien und macht nur offene Kategorien abstimmbar', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    const votingSection = sectionForHeading(/abstimmung/i)

    expect(
      within(votingSection).getByRole('heading', {
        name: 'Beste Festival-Energie',
      }),
    ).toBeVisible()
    expect(
      within(votingSection).queryByRole('heading', {
        name: 'Bester Camp-Aufbau',
      }),
    ).not.toBeInTheDocument()
    expect(
      within(votingSection).queryByRole('heading', {
        name: 'Beste Regenjacke',
      }),
    ).not.toBeInTheDocument()
    expect(within(votingSection).getByLabelText(/stimme geht an/i)).toBeVisible()
  })

  it('schliesst die angemeldete Person als Stimmziel aus', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    const votingSection = sectionForHeading(/abstimmung/i)
    const voteSelect = within(votingSection).getByLabelText(/stimme geht an/i)

    expect(within(voteSelect).queryByRole('option', { name: 'Alice' })).toBeNull()
    expect(within(voteSelect).getByRole('option', { name: 'Bob' })).toBeVisible()
    expect(
      within(votingSection).queryByRole('button', { name: /stimme abgeben/i }),
    ).not.toBeInTheDocument()
  })
})

describe('Voting', () => {
  it('gibt eine Stimme erfolgreich ab', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    const votingSection = sectionForHeading(/abstimmung/i)
    await user.selectOptions(
      within(votingSection).getByLabelText(/stimme geht an/i),
      'bob',
    )
    await user.click(
      within(votingSection).getByRole('button', { name: /stimme abgeben/i }),
    )

    expect(saveVote).toHaveBeenCalledWith({
      voterId: 'alice',
      votedForId: 'bob',
      categoryId: 'open-category',
      timestamp: expect.any(String),
    })
    expect(await within(votingSection).findByText(/bereits abgestimmt/i)).toBeVisible()
  })

  it('behandelt eine bestehende Stimme als bereits abgegeben', async () => {
    mockLoadedData({
      participantVotes: [vote()],
      loadedVotes: [vote()],
    })
    await renderLoadedApp()

    await loginWith('ALICE42')

    const votingSection = sectionForHeading(/abstimmung/i)
    expect(within(votingSection).getByText(/bereits abgestimmt/i)).toBeVisible()
    expect(
      within(votingSection).queryByRole('button', { name: /stimme abgeben/i }),
    ).not.toBeInTheDocument()
  })
})

describe('Ergebnisse', () => {
  it('zaehlt Stimmen und sortiert nach Punktzahl', async () => {
    mockLoadedData({
      loadedCategories: [categories[1]],
      loadedVotes: [
        vote({ voterId: 'alice', votedForId: 'bob' }),
        vote({ voterId: 'carla', votedForId: 'bob' }),
        vote({ voterId: 'bob', votedForId: 'carla' }),
      ],
      loadedStandings: [],
    })

    await renderLoadedApp()
    await loginWith('ALICE42')

    const resultsSection = sectionForHeading(/ergebnisse/i)
    expect(within(resultsSection).getByText('Beste Festival-Energie')).toBeVisible()
    expect(within(resultsSection).getByText('2')).toBeVisible()
    expect(within(resultsSection).getByText('1')).toBeVisible()
    expect(within(resultsSection).getByText('0')).toBeVisible()

    const bobResult = within(resultsSection).getByText('Bob')
    const carlaResult = within(resultsSection).getByText('Carla')
    const aliceResult = within(resultsSection).getByText('Alice')

    expect(
      bobResult.compareDocumentPosition(carlaResult) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      carlaResult.compareDocumentPosition(aliceResult) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('stellt leere Ergebnisse korrekt dar', async () => {
    mockLoadedData({ loadedVotes: [], loadedStandings: [] })

    await renderLoadedApp()
    await loginWith('ALICE42')

    expect(screen.getByText(/noch keine stimmen abgegeben/i)).toBeVisible()
  })
})

describe('Ewige Tabelle', () => {
  it('laedt und zeigt Daten in geladener Rangfolge', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    const standingsSection = sectionForHeading(/gesamtclassement/i)
    const rows = within(standingsSection).getAllByRole('row')

    expect(within(rows[1]).getByText('Bob')).toBeVisible()
    expect(within(rows[1]).getByText('18')).toBeVisible()
    expect(within(rows[2]).getByText('Alice')).toBeVisible()
    expect(within(rows[2]).getByText('12')).toBeVisible()
  })

  it('stellt leere Daten korrekt dar', async () => {
    mockLoadedData({ loadedStandings: [] })

    await renderLoadedApp()
    await loginWith('ALICE42')

    expect(screen.getByText(/noch keine gesamtpunkte vorhanden/i)).toBeVisible()
  })
})

describe('Admin', () => {
  it('macht Admin-Aktionen erst in der Admin-Ansicht verfuegbar', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^admin$/i }))

    expect(await screen.findAllByLabelText(/status/i)).toHaveLength(3)
    expect(
      screen.getAllByRole('button', { name: /stimmen zur/i }),
    ).toHaveLength(3)
  })

  it('aendert den Kategorie-Status ueber den Admin-Bereich', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))
    const statusSelects = await screen.findAllByLabelText(/status/i)

    await user.selectOptions(statusSelects[0], 'open')

    expect(updateCategoryStatus).toHaveBeenCalledWith(
      'upcoming-category',
      'open',
    )
    const adminSection = sectionForHeading(/^kategorien$/i)
    const updatedCard = within(adminSection)
      .getByRole('heading', { name: 'Bester Camp-Aufbau' })
      .closest('article')

    expect(updatedCard).not.toBeNull()
    expect(
      within(updatedCard as HTMLElement).getByText(/aktueller status: offen/i),
    ).toBeVisible()
  })

  it('loescht Kategorie-Stimmen nach Bestaetigung und laedt Daten neu', async () => {
    mockLoadedData({
      participantVotes: [vote()],
      loadedVotes: [vote()],
    })
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))
    await user.click(screen.getAllByRole('button', { name: /stimmen zur/i })[1])

    expect(window.confirm).toHaveBeenCalled()
    expect(deleteVotesForCategory).toHaveBeenCalledWith('open-category')
    await waitFor(() => {
      expect(loadCategories).toHaveBeenCalledTimes(2)
      expect(loadVotes).toHaveBeenCalledTimes(2)
      expect(loadVotesForParticipant).toHaveBeenCalledTimes(2)
    })
  })

  it('bricht das Loeschen ab, wenn die Bestaetigung ausbleibt', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    await renderLoadedApp()
    await loginWith('ALICE42')

    await userEvent.click(screen.getByRole('button', { name: /^admin$/i }))
    await userEvent.click(
      screen.getAllByRole('button', { name: /stimmen zur/i })[1],
    )

    expect(deleteVotesForCategory).not.toHaveBeenCalled()
  })
})
