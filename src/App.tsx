import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createCategory,
  deleteCategory,
  loadAdminCategories,
  loadCategories,
  updateCategory,
  type Category,
  type CategoryStatus,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './data/categories'
import {
  createParticipant,
  deactivateParticipant,
  findParticipantByAccessCode,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  updateParticipant,
  type Participant,
} from './data/participants'
import {
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from './data/votes'
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from './data/allTimeStandings'
import {
  archiveFestival,
  loadFestivalName,
  updateFestivalName,
} from './data/festival'
import {
  clearStoredLoginAttemptGuard,
  getLoginLockRemainingMs,
  readStoredLoginAttemptGuard,
  registerInvalidLoginAttempt,
  resetLoginAttemptGuard,
  storeLoginAttemptGuard,
  type LoginAttemptGuardState,
} from './lib/loginAttemptGuard'
import { activeFestival, festivalStorageKey } from './config/festivals'
import {
  AdminParticipants,
  type ParticipantFormState,
} from './components/AdminParticipants'
import { AdminFestival } from './components/AdminFestival'
import { AdminCategories } from './components/AdminCategories'
import { useFestivalAccess } from './hooks/useFestivalAccess'
import i18n from './i18n'
import { supportedLanguages, type SupportedLanguage } from './i18n'
import './App.css'

type CategoryResult = {
  participant: Participant
  voteCount: number
}

const fallbackFestivalName = ''

const authenticatedParticipantStorageKey = festivalStorageKey(
  activeFestival.id,
  'participant',
)
const loginAttemptGuardStorageKey = festivalStorageKey(
  activeFestival.id,
  'login-attempt-guard',
)

function readStoredParticipant(): Participant | null {
  const storedParticipant = localStorage.getItem(authenticatedParticipantStorageKey)

  if (!storedParticipant) {
    return null
  }

  try {
    const parsedParticipant = JSON.parse(storedParticipant) as Partial<Participant>

    if (
      typeof parsedParticipant.id === 'string' &&
      typeof parsedParticipant.name === 'string' &&
      typeof parsedParticipant.displayName === 'string' &&
      typeof parsedParticipant.accessCode === 'string'
    ) {
      return {
        id: parsedParticipant.id,
        name: parsedParticipant.name,
        displayName: parsedParticipant.displayName,
        accessCode: parsedParticipant.accessCode,
        isAdmin: parsedParticipant.isAdmin === true,
        isActive: parsedParticipant.isActive !== false,
      }
    }
  } catch {
    localStorage.removeItem(authenticatedParticipantStorageKey)
  }

  return null
}

function storeAuthenticatedParticipant(participant: Participant) {
  localStorage.setItem(
    authenticatedParticipantStorageKey,
    JSON.stringify(participant),
  )
}

function clearStoredParticipant() {
  localStorage.removeItem(authenticatedParticipantStorageKey)
}

type ResultCardProps = {
  category: Category
  results: CategoryResult[]
  highestVoteCount: number
}

function ResultCard({ category, results, highestVoteCount }: ResultCardProps) {
  const { t } = useTranslation()
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t('status.upcoming'),
    open: t('status.open'),
    closed: t('status.closed'),
  }
  const isClosed = category.status === 'closed'
  const [isClosedResultExpanded, setIsClosedResultExpanded] = useState(false)
  const isCollapsed = isClosed && !isClosedResultExpanded
  const resultListId = `result-list-${category.id}`
  const leaders = results.filter(
    ({ voteCount }) => highestVoteCount > 0 && voteCount === highestVoteCount,
  )

  return (
    <article
      className={`result-card${isCollapsed ? ' result-card--collapsed' : ''}`}
    >
      <div className="result-card__header">
        <div>
          <h3>{category.title}</h3>
          {isClosed ? (
            <span className="result-card__status">{statusLabels.closed}</span>
          ) : null}
        </div>

        {isClosed ? (
          <button
            className="result-card__toggle"
            type="button"
            onClick={() => setIsClosedResultExpanded((isExpanded) => !isExpanded)}
            aria-expanded={!isCollapsed}
            aria-controls={resultListId}
            aria-label={`${category.title} ${
              isCollapsed ? t('results.expand') : t('results.collapse')
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
              <path d="m6.7 9.3 5.3 5.29 5.3-5.3 1.4 1.42-6.7 6.7-6.7-6.7 1.4-1.42Z" />
            </svg>
          </button>
        ) : null}
      </div>

      {isCollapsed ? (
        <div className="result-card__leaders">
          <span>{t('results.leading')}</span>
          {leaders.length > 0 ? (
            <ul>
              {leaders.map(({ participant, voteCount }) => (
                <li key={participant.id}>
                  <strong>{participant.displayName}</strong>
                  <span>{voteCount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t('results.emptyCategory')}</p>
          )}
        </div>
      ) : null}

      <div className="result-card__list" id={resultListId} hidden={isCollapsed}>
        {results.map(({ participant, voteCount }) => {
          const width =
            highestVoteCount > 0
              ? `${(voteCount / highestVoteCount) * 100}%`
              : '0%'
          const isLeader =
            highestVoteCount > 0 && voteCount === highestVoteCount

          return (
            <div
              className={`result-card__row${
                isLeader ? ' result-card__row--leader' : ''
              }`}
              key={participant.id}
            >
              <div className="result-card__label">
                <span>{participant.displayName}</span>
                <strong>{voteCount}</strong>
              </div>
              <div className="result-card__bar" aria-hidden="true">
                <span style={{ width }} />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const activeLanguage = i18n.resolvedLanguage?.split('-')[0] ?? 'de'

  function changeLanguage(language: SupportedLanguage) {
    void i18n.changeLanguage(language)
  }

  return (
    <div className="language-switcher" aria-label={t('language.label')}>
      {supportedLanguages.map((language) => (
        <button
          className={
            activeLanguage === language ? 'language-switcher__button is-active' : 'language-switcher__button'
          }
          type="button"
          key={language}
          onClick={() => changeLanguage(language)}
          aria-pressed={activeLanguage === language}
          aria-label={t(`language.${language}`)}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

type FestivalAccessProps = {
  festivalName: string
  onUnlock: (code: string) => boolean
}

function FestivalAccess({ festivalName, onUnlock }: FestivalAccessProps) {
  const { t } = useTranslation()
  const [festivalCode, setFestivalCode] = useState('')
  const [festivalCodeError, setFestivalCodeError] = useState('')

  function submitFestivalCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onUnlock(festivalCode)) {
      setFestivalCodeError(t('festivalAccess.errors.invalidCode'))
      return
    }

    setFestivalCode('')
    setFestivalCodeError('')
  }

  return (
    <main
      className="home home--locked"
      aria-label={t('festivalAccess.ariaLabel', {
        festivalName: festivalName || t('common.loading'),
      })}
    >
      <header className="hero hero--locked" aria-labelledby="hero-title">
        <div className="hero__content hero__content--locked">
          <h1 id="hero-title">{festivalName || t('common.loading')}</h1>
          <form
            className="identity__form identity__form--locked"
            onSubmit={submitFestivalCode}
          >
            <label htmlFor="festival-access-code">
              {t('festivalAccess.codeLabel')}
            </label>
            <input
              id="festival-access-code"
              type="text"
              value={festivalCode}
              onChange={(event) => {
                setFestivalCode(event.target.value)
                setFestivalCodeError('')
              }}
              autoComplete="off"
              inputMode="text"
              placeholder={t('festivalAccess.codePlaceholder')}
            />
            {festivalCodeError ? (
              <p className="identity__error" role="alert">
                {festivalCodeError}
              </p>
            ) : null}
            <button className="identity__submit" type="submit">
              {t('festivalAccess.submit')}
            </button>
          </form>
        </div>

        <div className="stage-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>
    </main>
  )
}

function App() {
  const { t } = useTranslation()
  const festivalAccess = useFestivalAccess(activeFestival)
  const [festivalName, setFestivalName] = useState(fallbackFestivalName)
  const [festivalNameError, setFestivalNameError] = useState('')
  const [isSavingFestivalName, setIsSavingFestivalName] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(
    () => (festivalAccess.isUnlocked ? readStoredParticipant() : null),
  )
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [participantsError, setParticipantsError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminCategories, setAdminCategories] = useState<Category[]>([])
  const [adminCategoriesError, setAdminCategoriesError] = useState('')
  const [isLoadingAdminCategories, setIsLoadingAdminCategories] =
    useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  )
  const [adminParticipants, setAdminParticipants] = useState<Participant[]>([])
  const [adminParticipantsError, setAdminParticipantsError] = useState('')
  const [isLoadingAdminParticipants, setIsLoadingAdminParticipants] =
    useState(false)
  const [participantForm, setParticipantForm] =
    useState<ParticipantFormState | null>(null)
  const [participantFormError, setParticipantFormError] = useState('')
  const [isSavingParticipant, setIsSavingParticipant] = useState(false)
  const [togglingParticipantId, setTogglingParticipantId] = useState<
    string | null
  >(null)
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [isAdminVisible, setIsAdminVisible] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(Boolean(selectedParticipant))
  const [isSubmittingAccessCode, setIsSubmittingAccessCode] = useState(false)
  const [loginAttemptGuard, setLoginAttemptGuard] =
    useState<LoginAttemptGuardState>(() =>
      readStoredLoginAttemptGuard(
        localStorage,
        loginAttemptGuardStorageKey,
        Date.now(),
      ),
    )
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())
  const participantCount = participants.length
  const displayedFestivalName = festivalName || t('common.loading')
  const openCategories = categories.filter((category) => category.status === 'open')
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t('status.upcoming'),
    open: t('status.open'),
    closed: t('status.closed'),
  }
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState('')
  const [votes, setVotes] = useState<Vote[]>([])
  const [allVotes, setAllVotes] = useState<Vote[]>([])
  const [votesError, setVotesError] = useState('')
  const [resultsError, setResultsError] = useState('')
  const [allTimeStandings, setAllTimeStandings] = useState<AllTimeStanding[]>([])
  const [standingsError, setStandingsError] = useState('')
  const [isStandingsLoading, setIsStandingsLoading] = useState(
    Boolean(selectedParticipant),
  )
  const [selectedVotesByCategory, setSelectedVotesByCategory] = useState<
    Record<string, string>
  >({})
  const [submittingCategoryId, setSubmittingCategoryId] = useState<string | null>(
    null,
  )
  const loginLockRemainingMs = getLoginLockRemainingMs(
    loginAttemptGuard,
    currentTimeMs,
  )
  const loginLockRemainingSeconds = Math.ceil(loginLockRemainingMs / 1000)
  const isLoginLocked = loginLockRemainingMs > 0

  useEffect(() => {
    let isCurrent = true

    async function loadName() {
      setFestivalNameError('')

      try {
        const loadedFestivalName = await loadFestivalName()

        if (isCurrent) {
          setFestivalName(loadedFestivalName)
        }
      } catch {
        if (isCurrent) {
          setFestivalNameError(i18n.t('festival.errors.load'))
        }
      }
    }

    void loadName()

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!isLoginLocked) {
      return
    }

    const timerId = window.setInterval(() => {
      const now = Date.now()

      setCurrentTimeMs(now)

      if (getLoginLockRemainingMs(loginAttemptGuard, now) === 0) {
        setLoginAttemptGuard(resetLoginAttemptGuard())
        clearStoredLoginAttemptGuard(localStorage, loginAttemptGuardStorageKey)
      }
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [isLoginLocked, loginAttemptGuard])

  useEffect(() => {
    if (!festivalAccess.isUnlocked || !selectedParticipant) {
      return
    }

    const authenticatedParticipant = selectedParticipant
    let isCurrent = true

    async function loadData() {
      const accessContext = {
        participantAccessCode: authenticatedParticipant.accessCode,
      }

      setIsLoadingData(true)
      setIsStandingsLoading(true)
      setParticipantsError('')
      setCategoriesError('')
      setVotesError('')
      setResultsError('')
      setStandingsError('')

      try {
        const [
          loadedParticipants,
          loadedCategories,
          loadedParticipantVotes,
        ] = await Promise.all([
          loadParticipants(accessContext),
          loadCategories(accessContext),
          loadVotesForParticipant(authenticatedParticipant.id, accessContext),
        ])

        if (isCurrent) {
          setParticipants(loadedParticipants)
          setCategories(loadedCategories)
          setVotes(loadedParticipantVotes)
        }
      } catch {
        if (isCurrent) {
          setParticipantsError(
            i18n.t('identity.errors.participantsLoad'),
          )
          setCategoriesError(
            i18n.t('admin.errors.categoriesLoad'),
          )
          setVotesError(i18n.t('identity.errors.participantVotesLoad'))
        }
      }

      try {
        const loadedVotes = await loadVotes(accessContext)

        if (isCurrent) {
          setAllVotes(loadedVotes)
        }
      } catch {
        if (isCurrent) {
          setResultsError(i18n.t('results.errors.load'))
        }
      } finally {
        if (isCurrent) {
          setIsLoadingData(false)
        }
      }

      try {
        const loadedStandings = await loadAllTimeStandings(accessContext)

        if (isCurrent) {
          setAllTimeStandings(loadedStandings)
        }
      } catch {
        if (isCurrent) {
          setStandingsError(
            i18n.t('standings.errors.load'),
          )
        }
      } finally {
        if (isCurrent) {
          setIsStandingsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isCurrent = false
    }
  }, [festivalAccess.isUnlocked, selectedParticipant])

  const resultsByCategory = useMemo(
    () =>
      categories.map((category) => {
        const results = participants
          .map((participant) => ({
            participant,
            voteCount: allVotes.filter(
              (vote) =>
                vote.categoryId === category.id &&
                vote.votedForId === participant.id,
            ).length,
          }))
          .sort((firstResult, secondResult) => {
            if (secondResult.voteCount !== firstResult.voteCount) {
              return secondResult.voteCount - firstResult.voteCount
            }

            return firstResult.participant.displayName.localeCompare(
              secondResult.participant.displayName,
            )
          })

        const highestVoteCount = results[0]?.voteCount ?? 0

        return {
          category,
          results,
          highestVoteCount,
        }
      }),
    [allVotes, categories, participants],
  )

  const hasVotes = allVotes.length > 0

  async function submitAccessCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const now = Date.now()

    if (getLoginLockRemainingMs(loginAttemptGuard, now) > 0) {
      setCurrentTimeMs(now)
      return
    }

    const normalizedAccessCode = accessCode.trim().toUpperCase()

    if (!normalizedAccessCode) {
      setAccessCodeError(t('identity.errors.invalidAccessCode'))
      return
    }

    setIsSubmittingAccessCode(true)
    setAccessCodeError('')

    try {
      const participant = await findParticipantByAccessCode(normalizedAccessCode)

      if (!participant) {
        setAccessCodeError(
          t('identity.errors.invalidAccessCode'),
        )
        const updatedGuard = registerInvalidLoginAttempt(
          loginAttemptGuard,
          Date.now(),
        )

        setLoginAttemptGuard(updatedGuard)
        storeLoginAttemptGuard(
          localStorage,
          loginAttemptGuardStorageKey,
          updatedGuard,
        )
        setCurrentTimeMs(Date.now())
        return
      }

      setLoginAttemptGuard(resetLoginAttemptGuard())
      clearStoredLoginAttemptGuard(localStorage, loginAttemptGuardStorageKey)
      storeAuthenticatedParticipant(participant)
      setSelectedParticipant(participant)
      setSelectedVotesByCategory({})
      setAccessCode('')
      setAccessCodeError('')
      setVotesError('')
    } catch {
      setAccessCodeError(t('identity.errors.accessCodeLoad'))
    } finally {
      setIsSubmittingAccessCode(false)
    }
  }

  function logout() {
    clearStoredParticipant()
    setSelectedParticipant(null)
    setAccessCode('')
    setAccessCodeError('')
    setVotes([])
    setVotesError('')
    setLoginAttemptGuard(resetLoginAttemptGuard())
    clearStoredLoginAttemptGuard(localStorage, loginAttemptGuardStorageKey)
    setCurrentTimeMs(Date.now())
    setParticipantsError('')
    setCategoriesError('')
    setResultsError('')
    setStandingsError('')
    setAdminError('')
    setAdminCategories([])
    setAdminCategoriesError('')
    setAdminParticipants([])
    setAdminParticipantsError('')
    setParticipantForm(null)
    setParticipantFormError('')
    setIsAdminVisible(false)
    setSelectedVotesByCategory({})

    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      )
    }
  }

  function selectVote(categoryId: string, votedForId: string) {
    setSelectedVotesByCategory((currentVotes) => ({
      ...currentVotes,
      [categoryId]: votedForId,
    }))
  }

  function toggleAdminView() {
    if (!selectedParticipant?.isAdmin) {
      return
    }

    setIsAdminVisible((isVisible) => {
      if (!isVisible) {
        void reloadAdminCategories()
        void reloadAdminParticipants()

        window.setTimeout(() => {
          document.getElementById('admin')?.scrollIntoView({ behavior: 'smooth' })
        })
      }

      return !isVisible
    })
  }

  function getParticipantAdminContext() {
    if (!selectedParticipant?.isAdmin) {
      return null
    }

    return {
      participantAccessCode: selectedParticipant.accessCode,
    }
  }

  function participantMutationErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('participant access code already exists')) {
      return t('admin.participants.errors.duplicateCode')
    }

    if (message.includes('display name is required')) {
      return t('admin.participants.errors.displayNameRequired')
    }

    if (message.includes('participant access code is required')) {
      return t('admin.participants.errors.accessCodeRequired')
    }

    return t('admin.participants.errors.save')
  }

  function categoryMutationErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('category title is required')) {
      return t('admin.categories.errors.titleRequired')
    }

    if (message.includes('invalid status')) {
      return t('admin.categories.errors.invalidStatus')
    }

    if (message.includes('category cannot be deleted while votes exist')) {
      return t('admin.categories.errors.deleteHasVotes')
    }

    return t('admin.categories.errors.save')
  }

  function festivalNameMutationErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('festival name is required')) {
      return t('admin.festival.errors.nameRequired')
    }

    return t('admin.festival.errors.save')
  }

  async function reloadCategoriesForAdminChange() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const [loadedAdminCategories, loadedCategories] = await Promise.all([
      loadAdminCategories(adminContext),
      loadCategories(adminContext),
    ])

    setAdminCategories(loadedAdminCategories)
    setCategories(loadedCategories)
  }

  async function reloadAdminCategories() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminCategories(true)
    setAdminCategoriesError('')

    try {
      const loadedAdminCategories = await loadAdminCategories(adminContext)

      setAdminCategories(loadedAdminCategories)
    } catch {
      setAdminCategoriesError(t('admin.categories.errors.load'))
    } finally {
      setIsLoadingAdminCategories(false)
    }
  }

  async function reloadAdminParticipants() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminParticipants(true)
    setAdminParticipantsError('')

    try {
      const loadedAdminParticipants = await loadAdminParticipants(adminContext)

      setAdminParticipants(loadedAdminParticipants)
    } catch {
      setAdminParticipantsError(t('admin.participants.errors.load'))
    } finally {
      setIsLoadingAdminParticipants(false)
    }
  }

  async function saveFestivalName(name: string) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsSavingFestivalName(true)
    setFestivalNameError('')

    try {
      const savedFestivalName = await updateFestivalName(name, adminContext)

      setFestivalName(savedFestivalName)
    } catch (error) {
      throw new Error(festivalNameMutationErrorMessage(error), { cause: error })
    } finally {
      setIsSavingFestivalName(false)
    }
  }

  async function archiveCurrentFestival() {
    if (!selectedParticipant?.isAdmin) {
      return ''
    }

    return archiveFestival(selectedParticipant.accessCode)
  }

  async function startCreateParticipant() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setParticipantFormError('')
    setParticipantForm({
      id: null,
      displayName: '',
      accessCode: '',
    })

    try {
      const suggestedAccessCode = await suggestParticipantAccessCode(adminContext)

      setParticipantForm((currentForm) =>
        currentForm && currentForm.id === null
          ? { ...currentForm, accessCode: suggestedAccessCode }
          : currentForm,
      )
    } catch {
      setParticipantFormError(t('admin.participants.errors.codeSuggest'))
    }
  }

  function startEditParticipant(participant: Participant) {
    setParticipantFormError('')
    setParticipantForm({
      id: participant.id,
      displayName: participant.displayName,
      accessCode: participant.accessCode,
    })
  }

  function cancelParticipantForm() {
    setParticipantForm(null)
    setParticipantFormError('')
  }

  async function submitParticipantForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const adminContext = getParticipantAdminContext()

    if (!adminContext || !participantForm) {
      return
    }

    const displayName = participantForm.displayName.trim()
    const accessCode = participantForm.accessCode.trim().toUpperCase()

    if (!displayName) {
      setParticipantFormError(t('admin.participants.errors.displayNameRequired'))
      return
    }

    if (!accessCode) {
      setParticipantFormError(t('admin.participants.errors.accessCodeRequired'))
      return
    }

    setIsSavingParticipant(true)
    setParticipantFormError('')

    try {
      if (participantForm.id) {
        await updateParticipant(
          {
            id: participantForm.id,
            displayName,
            accessCode,
          },
          adminContext,
        )
      } else {
        await createParticipant(
          {
            displayName,
            accessCode,
          },
          adminContext,
        )
      }

      setParticipantForm(null)
      await reloadAdminParticipants()
    } catch (error) {
      setParticipantFormError(participantMutationErrorMessage(error))
    } finally {
      setIsSavingParticipant(false)
    }
  }

  async function deactivateAdminParticipant(participant: Participant) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext || !participant.isActive) {
      return
    }

    const shouldDeactivate = window.confirm(
      t('admin.participants.confirmDeactivate', {
        name: participant.displayName,
      }),
    )

    if (!shouldDeactivate) {
      return
    }

    setTogglingParticipantId(participant.id)
    setAdminParticipantsError('')

    try {
      await deactivateParticipant(participant.id, adminContext)
      await reloadAdminParticipants()
    } catch {
      setAdminParticipantsError(t('admin.participants.errors.deactivate'))
    } finally {
      setTogglingParticipantId(null)
    }
  }

  async function reactivateAdminParticipant(participant: Participant) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext || participant.isActive) {
      return
    }

    setTogglingParticipantId(participant.id)
    setAdminParticipantsError('')

    try {
      await reactivateParticipant(participant.id, adminContext)
      await reloadAdminParticipants()
    } catch {
      setAdminParticipantsError(t('admin.participants.errors.reactivate'))
    } finally {
      setTogglingParticipantId(null)
    }
  }

  async function createAdminCategory(input: CreateCategoryInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminCategoriesError('')

    try {
      await createCategory(input, adminContext)
      await reloadCategoriesForAdminChange()
    } catch (error) {
      throw new Error(categoryMutationErrorMessage(error), { cause: error })
    }
  }

  async function updateAdminCategory(input: UpdateCategoryInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminCategoriesError('')

    try {
      await updateCategory(input, adminContext)
      await reloadCategoriesForAdminChange()
    } catch (error) {
      throw new Error(categoryMutationErrorMessage(error), { cause: error })
    }
  }

  async function changeCategoryStatus(
    categoryId: string,
    status: CategoryStatus,
  ) {
    if (!selectedParticipant?.isAdmin) {
      return
    }

    const previousCategories = categories
    const previousAdminCategories = adminCategories

    setAdminError('')
    setUpdatingCategoryId(categoryId)
    setCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    )
    setAdminCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    )

    try {
      const updatedCategory = await updateCategory(
        {
          id: categoryId,
          status,
        },
        {
          participantAccessCode: selectedParticipant.accessCode,
        },
      )

      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      )
      setAdminCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      )
    } catch {
      setCategories(previousCategories)
      setAdminCategories(previousAdminCategories)
      setAdminError(t('admin.errors.statusSave'))
    } finally {
      setUpdatingCategoryId(null)
    }
  }

  async function deleteAdminCategory(category: Category) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldDelete = window.confirm(
      t('admin.categories.confirmDelete', {
        title: category.title,
      }),
    )

    if (!shouldDelete) {
      return
    }

    setDeletingCategoryId(category.id)
    setAdminCategoriesError('')

    try {
      await deleteCategory(category.id, adminContext)
      await reloadCategoriesForAdminChange()
    } catch (error) {
      setAdminCategoriesError(categoryMutationErrorMessage(error))
    } finally {
      setDeletingCategoryId(null)
    }
  }

  async function submitVote(categoryId: string) {
    if (!selectedParticipant) {
      return
    }

    const votedForId = selectedVotesByCategory[categoryId]
    const hasAlreadyVoted = votes.some(
      (vote) =>
        vote.voterId === selectedParticipant.id && vote.categoryId === categoryId,
    )

    if (!votedForId || votedForId === selectedParticipant.id || hasAlreadyVoted) {
      return
    }

    const vote = {
      voterId: selectedParticipant.id,
      votedForId,
      categoryId,
      timestamp: new Date().toISOString(),
    }

    setSubmittingCategoryId(categoryId)
    setVotesError('')

    try {
      const savedVote = await saveVote(vote, {
        participantAccessCode: selectedParticipant.accessCode,
      })

      setVotes((currentVotes) => [...currentVotes, savedVote])
      setAllVotes((currentVotes) => [...currentVotes, savedVote])
      setSelectedVotesByCategory((currentVotes) => {
        const remainingVotes = { ...currentVotes }
        delete remainingVotes[categoryId]

        return remainingVotes
      })
    } catch {
      setVotesError(t('categories.errors.voteSave'))
    } finally {
      setSubmittingCategoryId(null)
    }
  }

  if (!festivalAccess.isUnlocked) {
    return (
      <FestivalAccess
        festivalName={festivalName}
        onUnlock={festivalAccess.unlock}
      />
    )
  }

  if (!selectedParticipant) {
    return (
      <main
        className="home home--locked"
        aria-label={t('app.lockedAriaLabel', {
          festivalName: displayedFestivalName,
        })}
      >
        <header className="hero hero--locked" aria-labelledby="hero-title">
          <div className="hero__content hero__content--locked">
            <h1 id="hero-title">{displayedFestivalName}</h1>
            <form
              className="identity__form identity__form--locked"
              onSubmit={submitAccessCode}
            >
              <label htmlFor="participant-access-code">
                {t('identity.participantCodeLabel')}
              </label>
              <input
                id="participant-access-code"
                type="text"
                value={accessCode}
                disabled={isSubmittingAccessCode || isLoginLocked}
                onChange={(event) => {
                  setAccessCode(event.target.value)
                  setAccessCodeError('')
                }}
                autoComplete="off"
                inputMode="text"
                placeholder={t('identity.participantCodePlaceholder')}
              />
              {accessCodeError ? (
                <p className="identity__error">{accessCodeError}</p>
              ) : null}
              {isLoginLocked ? (
                <p className="identity__error" role="status">
                  {t('identity.locked', {
                    seconds: loginLockRemainingSeconds,
                  })}
                </p>
              ) : null}
              <button
                className="identity__submit"
                type="submit"
                disabled={isSubmittingAccessCode || isLoginLocked}
              >
                {isSubmittingAccessCode ? t('common.loading') : t('identity.submit')}
              </button>
            </form>
          </div>

          <div className="stage-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>
      </main>
    )
  }

  return (
    <main
      className="home"
      aria-label={t('app.ariaLabel', {
        count: participantCount,
        festivalName: displayedFestivalName,
      })}
    >
      <header className="hero" aria-labelledby="hero-title">
        <div className="hero__actions">
          <LanguageSwitcher />
          {selectedParticipant.isAdmin ? (
            <button
              className="hero__admin"
              type="button"
              onClick={toggleAdminView}
              aria-expanded={isAdminVisible}
              aria-controls="admin"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94L14.39 2.8a.49.49 0 0 0-.49-.4h-3.8a.49.49 0 0 0-.49.4l-.36 2.52a7.2 7.2 0 0 0-1.62.94L5.24 5.3a.5.5 0 0 0-.61.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.43 7.43 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.5.39 1.04.7 1.62.94l.36 2.52c.04.24.24.4.49.4h3.8c.25 0 .45-.16.49-.4l.36-2.52a7.2 7.2 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
              </svg>
              <span>{isAdminVisible ? t('hero.adminClose') : t('hero.admin')}</span>
            </button>
          ) : null}
        </div>

        <div className="hero__content">
          <p className="hero__eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title">{displayedFestivalName}</h1>
          <p className="hero__subtitle">{t('hero.subtitle')}</p>
          <a className="hero__button" href="#abstimmung">
            {t('hero.voteCta')}
          </a>
        </div>

        <div className="stage-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>

      <section
        className="identity"
        id="person-auswahl"
        aria-labelledby="identity-title"
      >
        <div className="identity__content">
          <h2 id="identity-title">{t('identity.title')}</h2>

          {selectedParticipant ? (
            <div className="identity__selected">
              <p>
                {t('identity.loggedInAs')}{' '}
                <strong>{selectedParticipant.displayName}</strong>
              </p>
              <button
                className="identity__change"
                type="button"
                onClick={logout}
              >
                {t('identity.logout')}
              </button>
            </div>
          ) : (
            <form className="identity__form" onSubmit={submitAccessCode}>
              <label htmlFor="participant-access-code">
                {t('identity.participantCodeLabel')}
              </label>
              <input
                id="participant-access-code"
                type="text"
                value={accessCode}
                disabled={isLoadingData || Boolean(participantsError)}
                onChange={(event) => {
                  setAccessCode(event.target.value)
                  setAccessCodeError('')
                }}
                autoComplete="off"
                inputMode="text"
                placeholder={t('identity.participantCodePlaceholder')}
              />
              {accessCodeError ? (
                <p className="identity__error">{accessCodeError}</p>
              ) : null}
              {participantsError ? (
                <p className="identity__error">{participantsError}</p>
              ) : null}
              <button
                className="identity__submit"
                type="submit"
                disabled={isLoadingData || Boolean(participantsError)}
              >
                {isLoadingData ? t('common.loading') : t('identity.submit')}
              </button>
            </form>
          )}
        </div>
      </section>

      {selectedParticipant.isAdmin && isAdminVisible ? (
        <section className="admin" id="admin" aria-labelledby="admin-title">
          <AdminFestival
            key={festivalName}
            festivalName={festivalName}
            error={festivalNameError}
            isSaving={isSavingFestivalName}
            onSave={saveFestivalName}
            onArchive={archiveCurrentFestival}
          />

          {adminError ? <p className="admin__notice">{adminError}</p> : null}
          {categoriesError ? (
            <p className="admin__notice">{categoriesError}</p>
          ) : null}

          <AdminCategories
            categories={adminCategories}
            error={adminCategoriesError}
            isLoading={isLoadingAdminCategories}
            updatingCategoryId={updatingCategoryId}
            deletingCategoryId={deletingCategoryId}
            onCreate={createAdminCategory}
            onUpdate={updateAdminCategory}
            onChangeStatus={changeCategoryStatus}
            onDelete={deleteAdminCategory}
          />

          <AdminParticipants
            participants={adminParticipants}
            error={adminParticipantsError}
            isLoading={isLoadingAdminParticipants}
            form={participantForm}
            formError={participantFormError}
            isSaving={isSavingParticipant}
            togglingParticipantId={togglingParticipantId}
            onCreate={startCreateParticipant}
            onEdit={startEditParticipant}
            onCancelForm={cancelParticipantForm}
            onSubmitForm={submitParticipantForm}
            onChangeForm={setParticipantForm}
            onClearFormError={() => setParticipantFormError('')}
            onDeactivate={deactivateAdminParticipant}
            onReactivate={reactivateAdminParticipant}
          />
        </section>
      ) : null}

      <section className="categories" id="abstimmung" aria-labelledby="categories-title">
        <div className="categories__header">
          <p className="categories__eyebrow">
            {t('categories.eyebrow', { count: participantCount })}
          </p>
          <h2 id="categories-title">{t('categories.title')}</h2>
        </div>

        {votesError ? <p className="categories__notice">{votesError}</p> : null}
        {categoriesError ? (
          <p className="categories__notice">{categoriesError}</p>
        ) : null}

        {!selectedParticipant ? (
          <p className="categories__notice">
            {t('categories.loginRequired')}
          </p>
        ) : (
          <div className="categories__grid">
            {openCategories.map((category) => {
              const eligibleParticipants = participants.filter(
                (participant) => participant.id !== selectedParticipant.id,
              )
              const selectedVote = selectedVotesByCategory[category.id] ?? ''
              const hasAlreadyVoted = votes.some(
                (vote) =>
                  vote.voterId === selectedParticipant.id &&
                  vote.categoryId === category.id,
              )

              return (
                <article className="category-card" key={category.id}>
                  <div className="category-card__topline">
                    <span
                      className={`category-card__status category-card__status--${category.status}`}
                    >
                      {statusLabels[category.status]}
                    </span>
                  </div>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>

                  {hasAlreadyVoted ? (
                    <p className="category-card__voted">
                      {t('categories.alreadyVoted')}
                    </p>
                  ) : (
                    <div className="category-card__vote">
                      <label htmlFor={`vote-${category.id}`}>
                        {t('categories.voteTargetLabel')}
                      </label>
                      <select
                        id={`vote-${category.id}`}
                        value={selectedVote}
                        onChange={(event) =>
                          selectVote(category.id, event.target.value)
                        }
                      >
                        <option value="">{t('categories.selectPerson')}</option>
                        {eligibleParticipants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.displayName}
                          </option>
                        ))}
                      </select>

                      {selectedVote ? (
                        <button
                          className="category-card__submit"
                          type="button"
                          disabled={submittingCategoryId === category.id}
                          onClick={() => submitVote(category.id)}
                        >
                          {submittingCategoryId === category.id
                            ? t('common.saving')
                            : t('categories.submitVote')}
                        </button>
                      ) : null}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="results" id="ergebnisse" aria-labelledby="results-title">
        <div className="results__header">
          <p className="results__eyebrow">{t('results.eyebrow')}</p>
          <h2 id="results-title">{t('results.title')}</h2>
        </div>

        {resultsError ? <p className="results__notice">{resultsError}</p> : null}

        {!hasVotes ? (
          <p className="results__notice">{t('results.empty')}</p>
        ) : (
          <div className="results__grid">
            {resultsByCategory.map(({ category, results, highestVoteCount }) => (
              <ResultCard
                category={category}
                results={results}
                highestVoteCount={highestVoteCount}
                key={`${category.id}-${category.status}`}
              />
            ))}
          </div>
        )}
      </section>

      <section
        className="standings"
        id="gesamtclassement"
        aria-labelledby="standings-title"
      >
        <div className="standings__header">
          <p className="standings__eyebrow">{t('standings.eyebrow')}</p>
          <h2 id="standings-title">{t('standings.title')}</h2>
        </div>

        {isStandingsLoading ? (
          <p className="standings__notice" role="status">
            {t('standings.loading')}
          </p>
        ) : standingsError ? (
          <p className="standings__notice standings__notice--error" role="alert">
            {standingsError}
          </p>
        ) : allTimeStandings.length === 0 ? (
          <p className="standings__notice">{t('standings.empty')}</p>
        ) : (
          <div
            className="standings__table"
            role="table"
            aria-label={t('standings.title')}
          >
            <div className="standings__columns" role="row">
              <span role="columnheader">{t('standings.columns.rank')}</span>
              <span role="columnheader">{t('standings.columns.name')}</span>
              <span role="columnheader">{t('standings.columns.points')}</span>
            </div>
            <ol>
              {allTimeStandings.map((standing, index) => (
                <li key={standing.participantId} role="row">
                  <span
                    className="standings__rank"
                    role="cell"
                    aria-label={t('standings.rankLabel', { rank: index + 1 })}
                  >
                    {index + 1}
                  </span>
                  <strong role="cell">{standing.participantName}</strong>
                  <span className="standings__points" role="cell">
                    {standing.totalPoints}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
