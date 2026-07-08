import { useTranslation } from 'react-i18next'
import type { Tournament } from '../data/tournaments'
import { SectionHeader } from './SectionHeader'
import { TournamentBracket } from './TournamentBracket'

type TournamentsProps = {
  tournaments: Tournament[]
  error: string
  isLoading: boolean
}

export function Tournaments({ tournaments, error, isLoading }: TournamentsProps) {
  const { t } = useTranslation()

  return (
    <section
      className="tournaments"
      id="main-tournaments"
      aria-labelledby="tournaments-title"
    >
      <SectionHeader
        title={t('tournaments.title')}
        titleId="tournaments-title"
        eyebrow={t('tournaments.eyebrow')}
        description={t('tournaments.description')}
        width="narrow"
      />

      {error ? (
        <p className="tournaments__notice tournaments__notice--error" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="tournaments__notice">{t('tournaments.loading')}</p>
      ) : tournaments.length === 0 ? (
        <p className="tournaments__notice">{t('tournaments.empty')}</p>
      ) : (
        <div className="tournaments__list">
          {tournaments.map((tournament) => (
            <article className="tournament-card" key={tournament.id}>
              <div className="tournament-card__header">
                <div>
                  <h3>{tournament.name}</h3>
                  <p>
                    {t('tournaments.participantCount', {
                      count: tournament.selectedParticipantIds.length,
                    })}
                  </p>
                </div>
              </div>
              <TournamentBracket tournament={tournament} />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
