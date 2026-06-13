import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  loadCategories,
  type Category,
  type CategoryStatus,
} from './data/categories'
import { loadParticipants, type Participant } from './data/participants'
import {
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from './data/votes'
import './App.css'

const statusLabels: Record<CategoryStatus, string> = {
  upcoming: 'Demnächst',
  open: 'Offen',
  closed: 'Geschlossen',
}

function App() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [participantsError, setParticipantsError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
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
            'Die Teilnehmer konnten gerade nicht geladen werden.',
          )
          setCategoriesError(
            'Die Kategorien konnten gerade nicht geladen werden.',
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
          setResultsError('Die Ergebnisse konnten gerade nicht geladen werden.')
        }
      } finally {
        if (isCurrent) {
          setIsLoadingData(false)
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
        'Der Code passt leider zu niemandem. Schau nochmal auf deinen Festival Code.',
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
      setVotesError('Deine bisherigen Stimmen konnten nicht geladen werden.')
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
      setVotesError('Deine Stimme konnte gerade nicht gespeichert werden.')
    } finally {
      setSubmittingCategoryId(null)
    }
  }

  return (
    <main
      className="home"
      aria-label={`Hurricane Awards 2026 mit ${participantCount} Teilnehmenden`}
    >
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__content">
          <p className="hero__eyebrow">Live aus dem Freundeskreis</p>
          <h1 id="hero-title">Hurricane Awards 2026</h1>
          <p className="hero__subtitle">
            Ein entspanntes Wochenende mit Freunden? Nein. Dies ist ein
            knallharter Wettbewerb.
          </p>
          <a className="hero__button" href="#abstimmung">
            Zur Abstimmung
          </a>
        </div>

        <div className="stage-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section
        className="identity"
        id="person-auswahl"
        aria-labelledby="identity-title"
      >
        <div className="identity__content">
          <h2 id="identity-title">Gib deinen Festival Code ein</h2>

          {selectedParticipant ? (
            <div className="identity__selected">
              <p>
                Angemeldet als:{' '}
                <strong>{selectedParticipant.displayName}</strong>
              </p>
              <button
                className="identity__change"
                type="button"
                onClick={changeParticipant}
              >
                Person wechseln
              </button>
            </div>
          ) : (
            <form className="identity__form" onSubmit={submitAccessCode}>
              <label htmlFor="festival-code">Festival Code</label>
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
                placeholder="Code hier eingeben"
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
                {isLoadingData ? 'Lade...' : 'Code prüfen'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="categories" id="abstimmung" aria-labelledby="categories-title">
        <div className="categories__header">
          <p className="categories__eyebrow">{participantCount} Teilnehmende</p>
          <h2 id="categories-title">Abstimmung</h2>
        </div>

        {votesError ? <p className="categories__notice">{votesError}</p> : null}
        {categoriesError ? (
          <p className="categories__notice">{categoriesError}</p>
        ) : null}

        {!selectedParticipant ? (
          <p className="categories__notice">
            Gib zuerst deinen Festival Code ein. Danach kannst du abstimmen.
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
                      Du hast bereits abgestimmt.
                    </p>
                  ) : (
                    <div className="category-card__vote">
                      <label htmlFor={`vote-${category.id}`}>
                        Stimme geht an
                      </label>
                      <select
                        id={`vote-${category.id}`}
                        value={selectedVote}
                        onChange={(event) =>
                          selectVote(category.id, event.target.value)
                        }
                      >
                        <option value="">Person auswählen</option>
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
                            ? 'Speichere...'
                            : 'Stimme abgeben'}
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
          <p className="results__eyebrow">Zwischenstand</p>
          <h2 id="results-title">Ergebnisse</h2>
        </div>

        {resultsError ? <p className="results__notice">{resultsError}</p> : null}

        {!hasVotes ? (
          <p className="results__notice">Noch keine Stimmen abgegeben.</p>
        ) : (
          <div className="results__grid">
            {resultsByCategory.map(({ category, results, highestVoteCount }) => (
              <article className="result-card" key={category.id}>
                <h3>{category.title}</h3>

                <div className="result-card__list">
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
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
