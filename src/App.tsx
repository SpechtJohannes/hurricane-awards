import { participants } from './data/participants'
import './App.css'

function App() {
  const participantCount = participants.length

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
    </main>
  )
}

export default App
