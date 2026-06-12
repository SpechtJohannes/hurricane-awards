import { useState } from 'react'
import { categories, type CategoryStatus } from './data/categories'
import { participants, type Participant } from './data/participants'
import './App.css'

const selectedParticipantStorageKey = 'hurricane-awards:selected-participant-id'

const statusLabels: Record<CategoryStatus, string> = {
  upcoming: 'Demnächst',
  open: 'Offen',
  closed: 'Geschlossen',
}

function getStoredParticipant(): Participant | null {
  const storedParticipantId = localStorage.getItem(selectedParticipantStorageKey)

  return (
    participants.find((participant) => participant.id === storedParticipantId) ??
    null
  )
}

function App() {
  const participantCount = participants.length
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(getStoredParticipant)

  function selectParticipant(participant: Participant) {
    localStorage.setItem(selectedParticipantStorageKey, participant.id)
    setSelectedParticipant(participant)
  }

  function changeParticipant() {
    localStorage.removeItem(selectedParticipantStorageKey)
    setSelectedParticipant(null)
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
          <h2 id="identity-title">Wer bist du?</h2>

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
            <div className="identity__grid">
              {participants.map((participant) => (
                <button
                  className="identity__participant"
                  key={participant.id}
                  type="button"
                  onClick={() => selectParticipant(participant)}
                >
                  {participant.displayName}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="categories" id="abstimmung" aria-labelledby="categories-title">
        <div className="categories__header">
          <p className="categories__eyebrow">{participantCount} Teilnehmende</p>
          <h2 id="categories-title">Award Kategorien</h2>
        </div>

        <div className="categories__grid">
          {categories.map((category) => (
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
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
