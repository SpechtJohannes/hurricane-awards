import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  loadCategories,
  updateCategoryStatus,
  type Category,
  type CategoryStatus,
} from './data/categories'
import { loadParticipants, type Participant } from './data/participants'
import {
  deleteVotesForCategory,
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from './data/votes'
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from './data/allTimeStandings'
import { t } from './i18n'
import './App.css'

const statusLabels: Record<CategoryStatus, string> = {
  upcoming: t('status.upcoming'),
  open: t('status.open'),
  closed: t('status.closed'),
}

type CategoryResult = {
  participant: Participant
  voteCount: number
}

type ResultCardProps = {
  category: Category
  results: CategoryResult[]
  highestVoteCount: number
}

function ResultCard({ category, results, highestVoteCount }: ResultCardProps) {
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

function App() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [participantsError, setParticipantsError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
  const [adminError, setAdminError] = useState('')
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [resettingCategoryId, setResettingCategoryId] = useState<string | null>(
    null,
  )
  const [isAdminVisible, setIsAdminVisible] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const participantCount = participants.length
  const openCategories = categories.filter((category) => category.status === 'open')
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(
    null,
  )
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState('')
  const [votes, setVotes] = useState<Vote[]>([])
  const [allVotes, setAllVotes] = useState<Vote[]>([])
  const [votesError, setVotesError] = useState('')
  const [resultsError, setResultsError] = useState('')
  const [allTimeStandings, setAllTimeStandings] = useState<AllTimeStanding[]>([])
  const [standingsError, setStandingsError] = useState('')
  const [isStandingsLoading, setIsStandingsLoading] = useState(true)
  const [selectedVotesByCategory, setSelectedVotesByCategory] = useState<
    Record<string, string>
  >({})
  const [submittingCategoryId, setSubmittingCategoryId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    let isCurrent = true

    async function loadData() {
      try {
        const [loadedParticipants, loadedCategories] = await Promise.all([
          loadParticipants(),
          loadCategories(),
        ])

        if (isCurrent) {
          setParticipants(loadedParticipants)
          setCategories(loadedCategories)
        }
      } catch {
        if (isCurrent) {
          setParticipantsError(
            t('identity.errors.participantsLoad'),
          )
          setCategoriesError(
            t('admin.errors.categoriesLoad'),
          )
        }
      }

      try {
        const loadedVotes = await loadVotes()

        if (isCurrent) {
          setAllVotes(loadedVotes)
        }
      } catch {
        if (isCurrent) {
          setResultsError(t('results.errors.load'))
        }
      } finally {
        if (isCurrent) {
          setIsLoadingData(false)
        }
      }

      try {
        const loadedStandings = await loadAllTimeStandings()

        if (isCurrent) {
          setAllTimeStandings(loadedStandings)
        }
      } catch {
        if (isCurrent) {
          setStandingsError(
            t('standings.errors.load'),
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
  }, [])

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

    const normalizedAccessCode = accessCode.trim().toUpperCase()
    const participant = participants.find(
      (currentParticipant) =>
        currentParticipant.accessCode === normalizedAccessCode,
    )

    if (!participant) {
      setAccessCodeError(
        t('identity.errors.invalidAccessCode'),
      )
      return
    }

    setSelectedParticipant(participant)
    setSelectedVotesByCategory({})
    setAccessCode('')
    setAccessCodeError('')
    setVotesError('')

    try {
      setVotes(await loadVotesForParticipant(participant.id))
    } catch {
      setVotesError(t('identity.errors.participantVotesLoad'))
    }
  }

  function changeParticipant() {
    setSelectedParticipant(null)
    setAccessCode('')
    setAccessCodeError('')
    setVotes([])
    setVotesError('')
    setSelectedVotesByCategory({})
  }

  function selectVote(categoryId: string, votedForId: string) {
    setSelectedVotesByCategory((currentVotes) => ({
      ...currentVotes,
      [categoryId]: votedForId,
    }))
  }

  function toggleAdminView() {
    setIsAdminVisible((isVisible) => {
      if (!isVisible) {
        window.setTimeout(() => {
          document.getElementById('admin')?.scrollIntoView({ behavior: 'smooth' })
        })
      }

      return !isVisible
    })
  }

  async function changeCategoryStatus(
    categoryId: string,
    status: CategoryStatus,
  ) {
    const previousCategories = categories

    setAdminError('')
    setUpdatingCategoryId(categoryId)
    setCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    )

    try {
      const updatedCategory = await updateCategoryStatus(categoryId, status)

      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      )
    } catch {
      setCategories(previousCategories)
      setAdminError(t('admin.errors.statusSave'))
    } finally {
      setUpdatingCategoryId(null)
    }
  }

  async function resetCategoryVotes(categoryId: string) {
    const shouldReset = window.confirm(
      t('admin.confirmResetVotes'),
    )

    if (!shouldReset) {
      return
    }

    setAdminError('')
    setResultsError('')
    setResettingCategoryId(categoryId)

    try {
      await deleteVotesForCategory(categoryId)

      const [loadedCategories, loadedVotes, loadedParticipantVotes] =
        await Promise.all([
          loadCategories(),
          loadVotes(),
          selectedParticipant
            ? loadVotesForParticipant(selectedParticipant.id)
            : Promise.resolve<Vote[]>([]),
        ])

      setCategories(loadedCategories)
      setAllVotes(loadedVotes)

      if (selectedParticipant) {
        setVotes(loadedParticipantVotes)
      }
    } catch {
      setAdminError(t('admin.errors.votesDelete'))
    } finally {
      setResettingCategoryId(null)
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
      const savedVote = await saveVote(vote)

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

  return (
    <main
      className="home"
      aria-label={t('app.ariaLabel', { count: participantCount })}
    >
      <header className="hero" aria-labelledby="hero-title">
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

        <div className="hero__content">
          <p className="hero__eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title">{t('hero.title')}</h1>
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
                onClick={changeParticipant}
              >
                {t('identity.changePerson')}
              </button>
            </div>
          ) : (
            <form className="identity__form" onSubmit={submitAccessCode}>
              <label htmlFor="festival-code">
                {t('identity.festivalCodeLabel')}
              </label>
              <input
                id="festival-code"
                type="text"
                value={accessCode}
                disabled={isLoadingData || Boolean(participantsError)}
                onChange={(event) => {
                  setAccessCode(event.target.value)
                  setAccessCodeError('')
                }}
                autoComplete="off"
                inputMode="text"
                placeholder={t('identity.festivalCodePlaceholder')}
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

      {isAdminVisible ? (
        <section className="admin" id="admin" aria-labelledby="admin-title">
          <div className="admin__header">
            <p className="admin__eyebrow">{t('admin.eyebrow')}</p>
            <h2 id="admin-title">{t('admin.title')}</h2>
          </div>

          {adminError ? <p className="admin__notice">{adminError}</p> : null}
          {categoriesError ? (
            <p className="admin__notice">{categoriesError}</p>
          ) : null}

          <div className="admin__list">
            {categories.map((category) => (
              <article className="admin-card" key={category.id}>
                <div>
                  <h3>{category.title}</h3>
                  <p>
                    {t('admin.currentStatus', {
                      status: statusLabels[category.status],
                    })}
                  </p>
                </div>

                <label>
                  {t('admin.changeStatus')}
                  <select
                    value={category.status}
                    disabled={
                      updatingCategoryId === category.id ||
                      resettingCategoryId === category.id
                    }
                    onChange={(event) =>
                      changeCategoryStatus(
                        category.id,
                        event.target.value as CategoryStatus,
                      )
                    }
                  >
                    <option value="upcoming">
                      {t('admin.statusOptions.upcoming')}
                    </option>
                    <option value="open">{t('admin.statusOptions.open')}</option>
                    <option value="closed">
                      {t('admin.statusOptions.closed')}
                    </option>
                  </select>
                </label>

                <button
                  className="admin-card__reset"
                  type="button"
                  disabled={resettingCategoryId === category.id}
                  onClick={() => resetCategoryVotes(category.id)}
                >
                  {resettingCategoryId === category.id
                    ? t('admin.resettingVotes')
                    : t('admin.resetVotes')}
                </button>
              </article>
            ))}
          </div>
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
