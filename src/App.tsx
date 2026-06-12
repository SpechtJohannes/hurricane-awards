import { useEffect, useState, type FormEvent } from 'react'
import {
  loadCategories,
  type Category,
  type CategoryStatus,
} from './data/categories'
import { loadParticipants, type Participant } from './data/participants'
import {
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
  const [votesError, setVotesError] = useState('')
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
    </main>
  )
}

export default App
