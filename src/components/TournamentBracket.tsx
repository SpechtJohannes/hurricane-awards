import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  Tournament,
  TournamentBracketMatch,
  TournamentBracketSlot,
} from '../data/tournaments'
import { ParticipantName } from './Avatar'

type TournamentBracketProps = {
  tournament: Tournament
}

function winnerNamesByMatch(tournament: Tournament) {
  const participantNames = new Map<string, string>()
  const winners = new Map<string, string>()

  for (const round of tournament.bracket.rounds) {
    for (const match of round.matches) {
      for (const slot of [match.participantA, match.participantB]) {
        if (slot.participant) {
          participantNames.set(
            slot.participant.participantId,
            slot.participant.participantName,
          )
        }
      }
    }
  }

  for (const round of tournament.bracket.rounds) {
    for (const match of round.matches) {
      if (match.winnerParticipantId) {
        winners.set(
          match.id,
          participantNames.get(match.winnerParticipantId) ??
            match.winnerParticipantId,
        )
      }
    }
  }

  return winners
}

function slotLabel(
  slot: TournamentBracketSlot,
  winners: Map<string, string>,
  openLabel: string,
) {
  if (slot.participant) {
    return {
      text: slot.participant.participantName,
      isOpen: false,
    }
  }

  if (slot.sourceMatchId) {
    return {
      text: winners.get(slot.sourceMatchId) ?? openLabel,
      isOpen: !winners.has(slot.sourceMatchId),
    }
  }

  return null
}

function MatchSlot({
  match,
  slot,
  winners,
  openLabel,
}: {
  match: TournamentBracketMatch
  slot: TournamentBracketSlot
  winners: Map<string, string>
  openLabel: string
}) {
  const label = slotLabel(slot, winners, openLabel)

  if (!label) {
    return null
  }

  const isWinner =
    slot.participant?.participantId === match.winnerParticipantId ||
    (slot.sourceMatchId
      ? winners.get(slot.sourceMatchId) === label.text
      : false)

  return (
    <div className={`tournament-match__slot${isWinner ? ' is-winner' : ''}`}>
      <ParticipantName name={label.text} />
    </div>
  )
}

function roundLabel(
  round: Tournament['bracket']['rounds'][number],
  tournament: Tournament,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const mainRoundIndex = tournament.bracket.rounds.findIndex(
    (currentRound) => currentRound.round === round.round,
  )
  const remainingRounds = tournament.bracket.rounds.length - mainRoundIndex

  if (remainingRounds === 1) {
    return t('tournaments.bracket.final')
  }

  if (remainingRounds === 2) {
    return t('tournaments.bracket.semiFinal')
  }

  if (remainingRounds === 3) {
    return t('tournaments.bracket.quarterFinal')
  }

  if (remainingRounds === 4) {
    return t('tournaments.bracket.roundOf16')
  }

  return t('tournaments.bracket.round', {
    round: mainRoundIndex + 1,
  })
}

export function TournamentBracket({ tournament }: TournamentBracketProps) {
  const { t } = useTranslation()
  const winners = useMemo(() => winnerNamesByMatch(tournament), [tournament])
  const openLabel = t('tournaments.bracket.openSlot')

  if (tournament.bracket.rounds.length === 0) {
    return (
      <p className="tournaments__notice">{t('tournaments.bracket.empty')}</p>
    )
  }

  return (
    <div
      className="tournament-bracket"
      aria-label={t('tournaments.bracket.label', { name: tournament.name })}
    >
      <div className="tournament-bracket__rounds">
        {tournament.bracket.rounds.map((round) => (
          <section className="tournament-round" key={round.round}>
            <h4>{roundLabel(round, tournament, t)}</h4>
            <div className="tournament-round__matches">
              {round.byes?.map((participant) => (
                <p
                  className="tournaments__notice"
                  key={`bye-${participant.participantId}`}
                >
                  {t('tournaments.bracket.byeNotice', {
                    name: participant.participantName,
                  })}
                </p>
              ))}
              {round.matches
                .filter((match) => {
                  const labels = [
                    slotLabel(match.participantA, winners, openLabel),
                    slotLabel(match.participantB, winners, openLabel),
                  ].filter(Boolean)

                  return (
                    labels.length > 0 &&
                    !labels.every((label) => label?.isOpen)
                  )
                })
                .map((match) => (
                  <article className="tournament-match" key={match.id}>
                    <p className="tournament-match__label">
                      {t('tournaments.bracket.match', {
                        position: match.position,
                      })}
                    </p>
                    <MatchSlot
                      match={match}
                      slot={match.participantA}
                      winners={winners}
                      openLabel={openLabel}
                    />
                    <MatchSlot
                      match={match}
                      slot={match.participantB}
                      winners={winners}
                      openLabel={openLabel}
                    />
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
