import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import {
  createCategory,
  deleteCategory,
  loadAdminCategories,
  loadCategories,
  updateCategory,
  updateCategoryStatus,
  type Category,
} from '../data/categories'
import {
  createParticipant,
  deactivateParticipant,
  findParticipantByAccessCode,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  type Participant,
  updateParticipant,
} from '../data/participants'
import {
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from '../data/votes'
import { loginAttemptGuardConfig } from '../lib/loginAttemptGuard'
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from '../data/allTimeStandings'
import {
  archiveFestival,
  loadFestivalName,
  updateFestivalName,
} from '../data/festival'
import i18n from '../i18n'

vi.mock('../data/categories', () => ({
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  loadAdminCategories: vi.fn(),
  loadCategories: vi.fn(),
  updateCategory: vi.fn(),
  updateCategoryStatus: vi.fn(),
}))

vi.mock('../data/participants', () => ({
  createParticipant: vi.fn(),
  deactivateParticipant: vi.fn(),
  findParticipantByAccessCode: vi.fn(),
  loadAdminParticipants: vi.fn(),
  loadParticipants: vi.fn(),
  reactivateParticipant: vi.fn(),
  suggestParticipantAccessCode: vi.fn(),
  updateParticipant: vi.fn(),
}))

vi.mock('../data/votes', () => ({
  loadVotes: vi.fn(),
  loadVotesForParticipant: vi.fn(),
  saveVote: vi.fn(),
}))

vi.mock('../data/allTimeStandings', () => ({
  loadAllTimeStandings: vi.fn(),
}))

vi.mock('../data/festival', () => ({
  archiveFestival: vi.fn(),
  loadFestivalName: vi.fn(),
  updateFestivalName: vi.fn(),
}))

const participants: Participant[] = [
  {
    id: 'alice',
    name: 'alice',
    displayName: 'Alice',
    accessCode: 'ALICE42',
    isAdmin: true,
    isActive: true,
  },
  {
    id: 'bob',
    name: 'bob',
    displayName: 'Bob',
    accessCode: 'BOB42',
    isAdmin: false,
    isActive: true,
  },
  {
    id: 'carla',
    name: 'carla',
    displayName: 'Carla',
    accessCode: 'CARLA42',
    isAdmin: false,
    isActive: true,
  },
]

const categories: Category[] = [
  {
    id: 'upcoming-category',
    title: 'Bester Camp-Aufbau',
    description: 'Noch nicht freigeschaltet.',
    status: 'upcoming',
    sortOrder: 1,
  },
  {
    id: 'open-category',
    title: 'Beste Festival-Energie',
    description: 'Aktuell offen.',
    status: 'open',
    sortOrder: 2,
  },
  {
    id: 'closed-category',
    title: 'Beste Regenjacke',
    description: 'Schon beendet.',
    status: 'closed',
    sortOrder: 3,
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

const loginAttemptGuardStorageKey =
  'hurricane-awards:hurricane-awards-2026:login-attempt-guard'
const festivalAccessStorageKey =
  'hurricane-awards:hurricane-awards-2026:festival-access'

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
  loadedFestivalName = 'Hurricane Awards 2026',
  loadedParticipants = participants,
  loadedAdminParticipants = loadedParticipants,
  loadedCategories = categories,
  loadedVotes = [],
  participantVotes = [],
  loadedStandings = standings,
}: {
  loadedFestivalName?: string
  loadedParticipants?: Participant[]
  loadedAdminParticipants?: Participant[]
  loadedCategories?: Category[]
  loadedVotes?: Vote[]
  participantVotes?: Vote[]
  loadedStandings?: AllTimeStanding[]
} = {}) {
  vi.mocked(loadFestivalName).mockResolvedValue(loadedFestivalName)
  vi.mocked(loadParticipants).mockResolvedValue(loadedParticipants)
  vi.mocked(loadAdminParticipants).mockResolvedValue(loadedAdminParticipants)
  vi.mocked(findParticipantByAccessCode).mockImplementation(async (accessCode) => {
    return (
      loadedParticipants.find(
        (participant) => participant.accessCode === accessCode,
      ) ?? null
    )
  })
  vi.mocked(loadCategories).mockResolvedValue(loadedCategories)
  vi.mocked(loadAdminCategories).mockResolvedValue(loadedCategories)
  vi.mocked(loadVotes).mockResolvedValue(loadedVotes)
  vi.mocked(loadVotesForParticipant).mockResolvedValue(participantVotes)
  vi.mocked(loadAllTimeStandings).mockResolvedValue(loadedStandings)
  vi.mocked(suggestParticipantAccessCode).mockResolvedValue('NEU23456')
  vi.mocked(createParticipant).mockImplementation(async (input) => ({
    id: input.displayName.toLowerCase().replace(/\s+/g, '-'),
    name: input.displayName.toLowerCase().replace(/\s+/g, '-'),
    displayName: input.displayName,
    accessCode: input.accessCode ?? 'NEU23456',
    isAdmin: false,
    isActive: true,
  }))
  vi.mocked(updateParticipant).mockImplementation(async (input) => {
    const participant = loadedAdminParticipants.find(
      (currentParticipant) => currentParticipant.id === input.id,
    )

    if (!participant) {
      throw new Error('Unknown participant')
    }

    return {
      ...participant,
      displayName: input.displayName ?? participant.displayName,
      accessCode: input.accessCode ?? participant.accessCode,
    }
  })
  vi.mocked(deactivateParticipant).mockImplementation(async (participantId) => {
    const participant = loadedAdminParticipants.find(
      (currentParticipant) => currentParticipant.id === participantId,
    )

    if (!participant) {
      throw new Error('Unknown participant')
    }

    return { ...participant, isActive: false }
  })
  vi.mocked(reactivateParticipant).mockImplementation(async (participantId) => {
    const participant = loadedAdminParticipants.find(
      (currentParticipant) => currentParticipant.id === participantId,
    )

    if (!participant) {
      throw new Error('Unknown participant')
    }

    return { ...participant, isActive: true }
  })
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
  vi.mocked(updateCategory).mockImplementation(async (input) => {
    const category = loadedCategories.find(
      (currentCategory) => currentCategory.id === input.id,
    )

    if (!category) {
      throw new Error('Unknown category')
    }

    return {
      ...category,
      title: input.title ?? category.title,
      description: input.description ?? category.description,
      status: input.status ?? category.status,
      sortOrder: input.sortOrder ?? category.sortOrder,
    }
  })
  vi.mocked(createCategory).mockImplementation(async (input) => ({
    id: input.title.toLowerCase().replace(/\s+/g, '-'),
    title: input.title,
    description: input.description ?? '',
    status: input.status ?? 'upcoming',
    sortOrder: input.sortOrder,
  }))
  vi.mocked(deleteCategory).mockResolvedValue()
  vi.mocked(saveVote).mockImplementation(async (savedVote) => savedVote)
  vi.mocked(updateFestivalName).mockImplementation(async (name) => name)
  vi.mocked(archiveFestival).mockResolvedValue(
    '8e560706-5e2f-4b50-9e41-381625fd8102',
  )
}

async function renderLoadedApp() {
  const view = render(<App />)

  await waitFor(() => {
    expect(screen.getByRole('main')).toBeVisible()
  })

  return view
}

async function unlockFestivalWith(code = 'HURRICANE2026') {
  const user = userEvent.setup()

  await user.type(
    screen.getByRole('textbox', { name: /^festivalcode$/i }),
    code,
  )
  await user.click(screen.getByRole('button', { name: /festival freischalten/i }))

  return user
}

async function loginWith(code: string) {
  const user = screen.queryByRole('textbox', { name: /^teilnehmercode$/i })
    ? userEvent.setup()
    : await unlockFestivalWith()

  await user.clear(screen.getByRole('textbox', { name: /^teilnehmercode$/i }))
  await user.type(
    screen.getByRole('textbox', { name: /^teilnehmercode$/i }),
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
  vi.useRealTimers()
  vi.clearAllMocks()
  loginAttemptGuardConfig.maxInvalidAttempts = 3
  loginAttemptGuardConfig.lockDurationMs = 30_000
  localStorage.clear()
  await i18n.changeLanguage('de')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  mockLoadedData()
})

afterEach(() => {
  vi.useRealTimers()
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
  it('zeigt vor der Festivalfreischaltung nur Festivalname und Festivalcodeformular', async () => {
    await renderLoadedApp()

    expect(
      await screen.findByRole('heading', { name: 'Hurricane Awards 2026' }),
    ).toBeVisible()
    expect(screen.getByRole('textbox', { name: /^festivalcode$/i })).toBeVisible()
    expect(
      screen.getByRole('button', { name: /festival freischalten/i }),
    ).toBeVisible()
    expect(
      screen.queryByRole('textbox', { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /ergebnisse/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /gesamtclassement/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument()
    expect(loadParticipants).not.toHaveBeenCalled()
    expect(loadVotes).not.toHaveBeenCalled()
    expect(loadAllTimeStandings).not.toHaveBeenCalled()
    expect(loadFestivalName).toHaveBeenCalled()
  })

  it('zeigt nach gueltigem Festivalcode den Teilnehmerlogin und speichert die Freischaltung', async () => {
    await renderLoadedApp()

    await unlockFestivalWith(' hurricane2026 ')

    expect(localStorage.getItem(festivalAccessStorageKey)).toBe('unlocked')
    expect(
      await screen.findByRole('textbox', { name: /^teilnehmercode$/i }),
    ).toBeVisible()
    expect(loadParticipants).not.toHaveBeenCalled()
    expect(loadVotes).not.toHaveBeenCalled()
  })

  it('verhindert Zugriff mit ungueltigem Festivalcode', async () => {
    await renderLoadedApp()

    await unlockFestivalWith('FALSCH')

    expect(screen.getByRole('alert')).toHaveTextContent(/festivalcode ist ungültig/i)
    expect(localStorage.getItem(festivalAccessStorageKey)).toBeNull()
    expect(
      screen.queryByRole('textbox', { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
    expect(loadParticipants).not.toHaveBeenCalled()
    expect(loadVotes).not.toHaveBeenCalled()
    expect(loadAllTimeStandings).not.toHaveBeenCalled()
  })

  it('ueberspringt den Festivalcode nach gespeicherter Freischaltung', async () => {
    localStorage.setItem(festivalAccessStorageKey, 'unlocked')

    render(<App />)

    expect(
      await screen.findByRole('textbox', { name: /^teilnehmercode$/i }),
    ).toBeVisible()
    expect(
      screen.queryByRole('textbox', { name: /^festivalcode$/i }),
    ).not.toBeInTheDocument()
  })

  it('erlaubt Zugriff mit gueltigem Teilnehmercode', async () => {
    await renderLoadedApp()

    await loginWith(' alice42 ')

    const identitySection = sectionForHeading(/teilnehmercode/i)
    expect(await within(identitySection).findByText(/angemeldet als:/i)).toBeVisible()
    expect(within(identitySection).getByText('Alice')).toBeVisible()
    expect(findParticipantByAccessCode).toHaveBeenCalledWith('ALICE42')
    expect(loadVotesForParticipant).toHaveBeenCalledWith('alice', {
      participantAccessCode: 'ALICE42',
    })
  })

  it('verhindert Zugriff mit ungueltigem Teilnehmercode', async () => {
    await renderLoadedApp()

    await loginWith('FALSCH')

    expect(screen.getByText(/code konnte nicht bestätigt/i)).toBeVisible()
    expect(screen.queryByText(/angemeldet als:/i)).not.toBeInTheDocument()
    expect(findParticipantByAccessCode).toHaveBeenCalledWith('FALSCH')
    expect(loadVotesForParticipant).not.toHaveBeenCalled()
  })

  it('sperrt die Codeeingabe nach mehreren ungueltigen Versuchen kurzzeitig', async () => {
    await renderLoadedApp()
    await unlockFestivalWith()
    loginAttemptGuardConfig.lockDurationMs = 1_000

    for (const code of ['FALSCH1', 'FALSCH2', 'FALSCH3']) {
      const input = screen.getByRole('textbox', { name: /^teilnehmercode$/i })

      fireEvent.change(input, { target: { value: code } })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /code/i }))
      })
    }

    expect(screen.getByText(/code konnte nicht bestätigt/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /code/i })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: /^teilnehmercode$/i })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/1 sekunden/i)
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
    expect(loadParticipants).not.toHaveBeenCalled()
    expect(loadVotes).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /code/i })).toBeEnabled()
    }, { timeout: 2000 })
    expect(screen.getByRole('textbox', { name: /^teilnehmercode$/i })).toBeEnabled()
  })

  it('beruecksichtigt persistierte Fehlversuche nach einem Reload', async () => {
    const firstRender = await renderLoadedApp()
    await unlockFestivalWith()

    for (const code of ['FALSCH1', 'FALSCH2']) {
      fireEvent.change(screen.getByRole('textbox', { name: /^teilnehmercode$/i }), {
        target: { value: code },
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /code/i }))
      })
    }

    expect(localStorage.getItem(loginAttemptGuardStorageKey)).toContain(
      '"invalidAttempts":2',
    )

    firstRender.unmount()
    await renderLoadedApp()

    fireEvent.change(screen.getByRole('textbox', { name: /^teilnehmercode$/i }), {
      target: { value: 'FALSCH3' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /code/i }))
    })

    expect(screen.getByRole('button', { name: /code/i })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/sekunden/i)
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
  })

  it('haelt eine aktive Sperre nach einem Reload aufrecht', async () => {
    localStorage.setItem(festivalAccessStorageKey, 'unlocked')
    localStorage.setItem(
      loginAttemptGuardStorageKey,
      JSON.stringify({
        invalidAttempts: 0,
        lockedUntil: Date.now() + 10_000,
      }),
    )

    await renderLoadedApp()

    expect(screen.getByRole('button', { name: /code/i })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: /^teilnehmercode$/i })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/10 sekunden|9 sekunden/i)
    expect(screen.queryByRole('heading', { name: /abstimmung/i })).not.toBeInTheDocument()
  })

  it('bereinigt abgelaufene und ungueltige Sperrdaten beim Laden', async () => {
    localStorage.setItem(festivalAccessStorageKey, 'unlocked')
    localStorage.setItem(
      loginAttemptGuardStorageKey,
      JSON.stringify({
        invalidAttempts: 0,
        lockedUntil: Date.now() - 1_000,
      }),
    )

    const expiredRender = await renderLoadedApp()

    expect(screen.getByRole('button', { name: /code/i })).toBeEnabled()
    expect(localStorage.getItem(loginAttemptGuardStorageKey)).toBeNull()

    expiredRender.unmount()
    localStorage.setItem(loginAttemptGuardStorageKey, '{kaputt')

    await renderLoadedApp()

    expect(screen.getByRole('button', { name: /code/i })).toBeEnabled()
    expect(localStorage.getItem(loginAttemptGuardStorageKey)).toBeNull()
  })

  it('setzt Fehlversuche bei erfolgreichem Login zurueck', async () => {
    await renderLoadedApp()
    const user = await unlockFestivalWith()

    for (const code of ['FALSCH1', 'FALSCH2']) {
      await user.clear(screen.getByRole('textbox', { name: /^teilnehmercode$/i }))
      await user.type(screen.getByRole('textbox', { name: /^teilnehmercode$/i }), code)
      await user.click(screen.getByRole('button', { name: /code/i }))
    }

    await user.clear(screen.getByRole('textbox', { name: /^teilnehmercode$/i }))
    await user.type(screen.getByRole('textbox', { name: /^teilnehmercode$/i }), 'ALICE42')
    await user.click(screen.getByRole('button', { name: /code/i }))

    const identitySection = sectionForHeading(/teilnehmercode/i)
    expect(await within(identitySection).findByText(/angemeldet als:/i)).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(localStorage.getItem(loginAttemptGuardStorageKey)).toBeNull()
  })

  it('erhaelt die Anmeldung nach einem Neuladen lokal', async () => {
    localStorage.setItem(festivalAccessStorageKey, 'unlocked')
    localStorage.setItem(
      'hurricane-awards:hurricane-awards-2026:participant',
      JSON.stringify(participants[0]),
    )

    render(<App />)

    expect(await screen.findByText(/angemeldet als:/i)).toBeVisible()
    const identitySection = sectionForHeading(/teilnehmercode/i)
    expect(within(identitySection).getByText('Alice')).toBeVisible()
    expect(loadParticipants).toHaveBeenCalled()
    expect(loadVotesForParticipant).toHaveBeenCalledWith('alice', {
      participantAccessCode: 'ALICE42',
    })
  })

  it('meldet ab und blendet geschuetzte Inhalte wieder aus', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /abmelden/i }))

    expect(
      await screen.findByRole('heading', { name: 'Hurricane Awards 2026' }),
    ).toBeVisible()
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

    expect(saveVote).toHaveBeenCalledWith(
      {
        voterId: 'alice',
        votedForId: 'bob',
        categoryId: 'open-category',
        timestamp: expect.any(String),
      },
      { participantAccessCode: 'ALICE42' },
    )
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
  it('blendet Adminfunktionen fuer normale Teilnehmer aus', async () => {
    await renderLoadedApp()
    await loginWith('BOB42')

    expect(screen.queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /festival archivieren/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()
    expect(loadAdminCategories).not.toHaveBeenCalled()
    expect(updateCategory).not.toHaveBeenCalled()
    expect(updateCategoryStatus).not.toHaveBeenCalled()
    expect(archiveFestival).not.toHaveBeenCalled()
  })

  it('macht Admin-Aktionen erst in der Admin-Ansicht verfuegbar', async () => {
    await renderLoadedApp()
    await loginWith('ALICE42')

    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /^admin$/i }))

    expect(await screen.findAllByLabelText(/status/i)).toHaveLength(3)
    expect(
      screen.getAllByRole('button', { name: /^löschen$/i }),
    ).toHaveLength(3)
    expect(loadAdminCategories).toHaveBeenCalledWith({
      participantAccessCode: 'ALICE42',
    })
  })

  it('zeigt die Teilnehmerverwaltung mit aktiven und deaktivierten Teilnehmern', async () => {
    mockLoadedData({
      loadedAdminParticipants: [
        participants[0],
        { ...participants[1], isActive: false },
      ],
    })
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const participantsSection = sectionForHeading(/^teilnehmer$/i)

    expect(await within(participantsSection).findByText('Alice')).toBeVisible()
    expect(within(participantsSection).getByText('ALICE42')).toBeVisible()
    expect(within(participantsSection).getByText('Bob')).toBeVisible()
    expect(within(participantsSection).getByText('BOB42')).toBeVisible()
    expect(within(participantsSection).getByText('Aktiv')).toBeVisible()
    expect(within(participantsSection).getByText('Deaktiviert')).toBeVisible()
    expect(loadAdminParticipants).toHaveBeenCalledWith({
      participantAccessCode: 'ALICE42',
    })
  })

  it('bearbeitet den Festivalnamen und zeigt ihn sofort in der App', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const festivalSection = sectionForHeading(/^festival$/i)
    const nameInput = within(festivalSection).getByLabelText(/^festivalname$/i)

    expect(nameInput).toHaveValue('Hurricane Awards 2026')

    await user.clear(nameInput)
    await user.type(nameInput, 'Hurricane Crew Awards')
    await user.click(
      within(festivalSection).getByRole('button', {
        name: /festivalname speichern/i,
      }),
    )

    expect(updateFestivalName).toHaveBeenCalledWith(
      'Hurricane Crew Awards',
      { participantAccessCode: 'ALICE42' },
    )
    expect(
      await screen.findByRole('heading', { name: 'Hurricane Crew Awards' }),
    ).toBeVisible()
    expect(
      screen.getByRole('main', {
        name: /hurricane crew awards mit 3 teilnehmenden/i,
      }),
    ).toBeVisible()
  })

  it('validiert einen leeren Festivalnamen clientseitig', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const festivalSection = sectionForHeading(/^festival$/i)
    const nameInput = within(festivalSection).getByLabelText(/^festivalname$/i)

    await user.clear(nameInput)
    await user.click(
      within(festivalSection).getByRole('button', {
        name: /festivalname speichern/i,
      }),
    )

    expect(updateFestivalName).not.toHaveBeenCalled()
    expect(
      await within(festivalSection).findByText(/festivalname ist erforderlich/i),
    ).toBeVisible()
  })

  it('archiviert das Festival im Adminbereich nach Bestaetigung', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const festivalSection = sectionForHeading(/^festival$/i)
    await user.click(
      within(festivalSection).getByRole('button', {
        name: /festival archivieren/i,
      }),
    )

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('wirklich archivieren'),
    )
    expect(archiveFestival).toHaveBeenCalledWith('ALICE42')
    expect(
      await within(festivalSection).findByText(
        /archiv id: 8e560706-5e2f-4b50-9e41-381625fd8102/i,
      ),
    ).toBeVisible()
  })

  it('legt Teilnehmer im Adminbereich an und aktualisiert die Liste', async () => {
    const newParticipant = {
      id: 'dina',
      name: 'dina',
      displayName: 'Dina',
      accessCode: 'NEU23456',
      isAdmin: false,
      isActive: true,
    }

    mockLoadedData()
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(participants)
      .mockResolvedValueOnce([...participants, newParticipant])
    vi.mocked(createParticipant).mockResolvedValue(newParticipant)

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))
    await user.click(
      await screen.findByRole('button', { name: /teilnehmer anlegen/i }),
    )

    expect(suggestParticipantAccessCode).toHaveBeenCalledWith({
      participantAccessCode: 'ALICE42',
    })
    expect(screen.getByLabelText(/^teilnehmercode$/i)).toHaveValue('NEU23456')

    await user.type(screen.getByLabelText(/^anzeigename$/i), 'Dina')
    await user.click(screen.getByRole('button', { name: /^speichern$/i }))

    expect(createParticipant).toHaveBeenCalledWith(
      { displayName: 'Dina', accessCode: 'NEU23456' },
      { participantAccessCode: 'ALICE42' },
    )
    expect(await screen.findByText('Dina')).toBeVisible()
  })

  it('bearbeitet Teilnehmer im Adminbereich', async () => {
    const updatedParticipant = {
      ...participants[1],
      displayName: 'Bobby',
      accessCode: 'BOBBY42',
    }

    mockLoadedData()
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(participants)
      .mockResolvedValueOnce([participants[0], updatedParticipant, participants[2]])
    vi.mocked(updateParticipant).mockResolvedValue(updatedParticipant)

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const participantsSection = sectionForHeading(/^teilnehmer$/i)
    const bobCard = (await within(participantsSection).findByText('Bob')).closest(
      'article',
    )

    expect(bobCard).not.toBeNull()

    await user.click(
      within(bobCard as HTMLElement).getByRole('button', { name: /bearbeiten/i }),
    )
    await user.clear(screen.getByLabelText(/^anzeigename$/i))
    await user.type(screen.getByLabelText(/^anzeigename$/i), 'Bobby')
    await user.clear(screen.getByLabelText(/^teilnehmercode$/i))
    await user.type(screen.getByLabelText(/^teilnehmercode$/i), 'BOBBY42')
    await user.click(screen.getByRole('button', { name: /^speichern$/i }))

    expect(updateParticipant).toHaveBeenCalledWith(
      { id: 'bob', displayName: 'Bobby', accessCode: 'BOBBY42' },
      { participantAccessCode: 'ALICE42' },
    )
    expect(await screen.findByText('Bobby')).toBeVisible()
  })

  it('deaktiviert aktive Teilnehmer nach Bestaetigung', async () => {
    mockLoadedData()
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(participants)
      .mockResolvedValueOnce([
        participants[0],
        { ...participants[1], isActive: false },
        participants[2],
      ])

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const participantsSection = sectionForHeading(/^teilnehmer$/i)
    const bobCard = (await within(participantsSection).findByText('Bob')).closest(
      'article',
    )

    expect(bobCard).not.toBeNull()

    await user.click(
      within(bobCard as HTMLElement).getByRole('button', {
        name: /deaktivieren/i,
      }),
    )

    expect(window.confirm).toHaveBeenCalled()
    expect(deactivateParticipant).toHaveBeenCalledWith('bob', {
      participantAccessCode: 'ALICE42',
    })
    expect(await within(participantsSection).findByText('Deaktiviert')).toBeVisible()
  })

  it('reaktiviert deaktivierte Teilnehmer', async () => {
    const inactiveParticipants = [
      participants[0],
      { ...participants[1], isActive: false },
      participants[2],
    ]

    mockLoadedData({ loadedAdminParticipants: inactiveParticipants })
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(inactiveParticipants)
      .mockResolvedValueOnce(participants)

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const participantsSection = sectionForHeading(/^teilnehmer$/i)
    const bobCard = (await within(participantsSection).findByText('Bob')).closest(
      'article',
    )

    expect(bobCard).not.toBeNull()

    await user.click(
      within(bobCard as HTMLElement).getByRole('button', {
        name: /reaktivieren/i,
      }),
    )

    expect(reactivateParticipant).toHaveBeenCalledWith('bob', {
      participantAccessCode: 'ALICE42',
    })
    await waitFor(() => {
      expect(within(participantsSection).getAllByText('Aktiv').length).toBeGreaterThan(1)
    })
  })

  it('zeigt Fehler beim Laden und Speichern der Teilnehmerverwaltung', async () => {
    mockLoadedData()
    vi.mocked(loadAdminParticipants).mockRejectedValueOnce(
      new Error('load failed'),
    )
    vi.mocked(createParticipant).mockRejectedValueOnce(
      new Error('participant access code already exists'),
    )

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    expect(
      await screen.findByText(/teilnehmerverwaltung konnte gerade nicht geladen/i),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: /teilnehmer anlegen/i }))
    await user.type(screen.getByLabelText(/^anzeigename$/i), 'Dina')
    await user.click(screen.getByRole('button', { name: /^speichern$/i }))

    expect(
      await screen.findByText(/teilnehmercode ist bereits vergeben/i),
    ).toBeVisible()
  })

  it('aendert den Kategorie-Status ueber den Admin-Bereich', async () => {
    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))
    const statusSelects = await screen.findAllByLabelText(/status/i)

    await user.selectOptions(statusSelects[0], 'open')

    expect(updateCategory).toHaveBeenCalledWith(
      { id: 'upcoming-category', status: 'open' },
      { participantAccessCode: 'ALICE42' },
    )
    const adminSection = sectionForHeading(/^kategorien$/i)
    const updatedCard = within(adminSection)
      .getByRole('heading', { name: 'Bester Camp-Aufbau' })
      .closest('article')

    expect(updatedCard).not.toBeNull()
    expect(
      within(updatedCard as HTMLElement).getByText(/^offen$/i),
    ).toBeVisible()
  })

  it('legt Kategorien im Adminbereich an und aktualisiert die Liste', async () => {
    const newCategory: Category = {
      id: 'new-category',
      title: 'Beste Playlist',
      description: 'Soundtrack des Wochenendes.',
      status: 'upcoming',
      sortOrder: 4,
    }

    mockLoadedData()
    vi.mocked(loadAdminCategories)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([...categories, newCategory])
    vi.mocked(loadCategories).mockResolvedValueOnce(categories)
    vi.mocked(createCategory).mockResolvedValue(newCategory)

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))
    await user.click(
      await screen.findByRole('button', { name: /kategorie anlegen/i }),
    )

    await user.type(screen.getByLabelText(/^titel$/i), 'Beste Playlist')
    await user.type(
      screen.getByLabelText(/^beschreibung$/i),
      'Soundtrack des Wochenendes.',
    )
    await user.type(screen.getByLabelText(/^sortierung$/i), '4')
    await user.click(screen.getByRole('button', { name: /^speichern$/i }))

    expect(createCategory).toHaveBeenCalledWith(
      {
        title: 'Beste Playlist',
        description: 'Soundtrack des Wochenendes.',
        status: 'upcoming',
        sortOrder: 4,
      },
      { participantAccessCode: 'ALICE42' },
    )
    expect(await screen.findByText('Beste Playlist')).toBeVisible()
  })

  it('bearbeitet Kategorien im Adminbereich', async () => {
    const updatedCategory: Category = {
      ...categories[1],
      title: 'Beste Festival-Laune',
      description: 'Aktualisierte Beschreibung.',
      status: 'closed',
      sortOrder: 5,
    }

    mockLoadedData()
    vi.mocked(loadAdminCategories)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([categories[0], updatedCategory, categories[2]])
    vi.mocked(updateCategory).mockResolvedValue(updatedCategory)

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const adminSection = sectionForHeading(/^kategorien$/i)
    const categoryCard = (
      await within(adminSection).findByRole('heading', {
        name: 'Beste Festival-Energie',
      })
    ).closest('article')

    expect(categoryCard).not.toBeNull()

    await user.click(
      within(categoryCard as HTMLElement).getByRole('button', {
        name: /bearbeiten/i,
      }),
    )
    await user.clear(screen.getByLabelText(/^titel$/i))
    await user.type(screen.getByLabelText(/^titel$/i), 'Beste Festival-Laune')
    await user.clear(screen.getByLabelText(/^beschreibung$/i))
    await user.type(
      screen.getByLabelText(/^beschreibung$/i),
      'Aktualisierte Beschreibung.',
    )
    await user.selectOptions(screen.getByLabelText(/^status$/i), 'closed')
    await user.clear(screen.getByLabelText(/^sortierung$/i))
    await user.type(screen.getByLabelText(/^sortierung$/i), '5')
    await user.click(screen.getByRole('button', { name: /^speichern$/i }))

    expect(updateCategory).toHaveBeenCalledWith(
      {
        id: 'open-category',
        title: 'Beste Festival-Laune',
        description: 'Aktualisierte Beschreibung.',
        status: 'closed',
        sortOrder: 5,
      },
      { participantAccessCode: 'ALICE42' },
    )
    expect(await screen.findByText('Beste Festival-Laune')).toBeVisible()
  })

  it('loescht Kategorien nach Bestaetigung und aktualisiert die Liste', async () => {
    mockLoadedData()
    vi.mocked(loadAdminCategories)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([categories[0], categories[1]])
    vi.mocked(loadCategories).mockResolvedValueOnce(categories)

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const adminSection = sectionForHeading(/^kategorien$/i)
    const categoryCard = (
      await within(adminSection).findByRole('heading', {
        name: 'Beste Regenjacke',
      })
    ).closest('article')

    expect(categoryCard).not.toBeNull()

    await user.click(
      within(categoryCard as HTMLElement).getByRole('button', {
        name: /^löschen$/i,
      }),
    )

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Beste Regenjacke'),
    )
    expect(deleteCategory).toHaveBeenCalledWith('closed-category', {
      participantAccessCode: 'ALICE42',
    })
    await waitFor(() => {
      expect(
        within(adminSection).queryByRole('heading', {
          name: 'Beste Regenjacke',
        }),
      ).not.toBeInTheDocument()
    })
  })

  it('zeigt Fehler aus der Kategorienverwaltung verstaendlich an', async () => {
    mockLoadedData()
    vi.mocked(deleteCategory).mockRejectedValueOnce(
      new Error('category cannot be deleted while votes exist'),
    )

    await renderLoadedApp()
    const user = await loginWith('ALICE42')

    await user.click(screen.getByRole('button', { name: /^admin$/i }))

    const adminSection = sectionForHeading(/^kategorien$/i)
    const categoryCard = (
      await within(adminSection).findByRole('heading', {
        name: 'Beste Festival-Energie',
      })
    ).closest('article')

    expect(categoryCard).not.toBeNull()

    await user.click(
      within(categoryCard as HTMLElement).getByRole('button', {
        name: /^löschen$/i,
      }),
    )

    expect(
      await screen.findByText(/solange stimmen vorhanden sind/i),
    ).toBeVisible()
  })

  it('bricht das Loeschen ab, wenn die Bestaetigung ausbleibt', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    await renderLoadedApp()
    await loginWith('ALICE42')

    await userEvent.click(screen.getByRole('button', { name: /^admin$/i }))
    await userEvent.click(
      screen.getAllByRole('button', { name: /^löschen$/i })[1],
    )

    expect(deleteCategory).not.toHaveBeenCalled()
  })

  it('laedt Teilnehmerverwaltung nicht fuer normale Teilnehmer', async () => {
    await renderLoadedApp()
    await loginWith('BOB42')

    expect(loadAdminParticipants).not.toHaveBeenCalled()
    expect(loadAdminCategories).not.toHaveBeenCalled()
  })
})
