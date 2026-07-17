import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
  Tournament,
  TournamentBracketMatch,
  TournamentBracketSlot,
} from "../data/tournaments";
import { ParticipantName } from "./Avatar";

type TournamentBracketProps = {
  tournament: Tournament;
  onSetWinner?: (matchId: string, winnerParticipantId: string) => Promise<void>;
  savingMatchId?: string | null;
};

type ResolvedParticipant = { id: string; name: string };

function resolveBracket(tournament: Tournament) {
  const participants = new Map<string, ResolvedParticipant>();
  const winners = new Map<string, ResolvedParticipant>();
  const matchParticipants = new Map<string, ResolvedParticipant[]>();

  for (const round of tournament.bracket.rounds) {
    for (const match of round.matches) {
      for (const slot of [match.participantA, match.participantB]) {
        if (slot.participant) {
          participants.set(slot.participant.participantId, {
            id: slot.participant.participantId,
            name: slot.participant.participantName,
          });
        }
      }
    }
    for (const bye of round.byes ?? []) {
      participants.set(bye.participantId, {
        id: bye.participantId,
        name: bye.participantName,
      });
    }
  }

  for (const round of tournament.bracket.rounds) {
    for (const match of round.matches) {
      const resolved = [match.participantA, match.participantB]
        .map((slot) =>
          slot.participant
            ? participants.get(slot.participant.participantId)
            : winners.get(slot.sourceMatchId ?? ""),
        )
        .filter((participant): participant is ResolvedParticipant =>
          Boolean(participant),
        );
      matchParticipants.set(match.id, resolved);

      if (match.winnerParticipantId) {
        const winner = resolved.find(
          (participant) => participant.id === match.winnerParticipantId,
        );
        if (winner) winners.set(match.id, winner);
      }
    }
  }

  return { winners, matchParticipants };
}

function slotLabel(
  slot: TournamentBracketSlot,
  winners: Map<string, ResolvedParticipant>,
  openLabel: string,
) {
  if (slot.participant) {
    return {
      text: slot.participant.participantName,
      isOpen: false,
      participantId: slot.participant.participantId,
    };
  }

  if (slot.sourceMatchId) {
    return {
      text: winners.get(slot.sourceMatchId)?.name ?? openLabel,
      isOpen: !winners.has(slot.sourceMatchId),
      participantId: winners.get(slot.sourceMatchId)?.id,
    };
  }

  return null;
}

function MatchSlot({
  match,
  slot,
  winners,
  openLabel,
}: {
  match: TournamentBracketMatch;
  slot: TournamentBracketSlot;
  winners: Map<string, ResolvedParticipant>;
  openLabel: string;
}) {
  const label = slotLabel(slot, winners, openLabel);

  if (!label) {
    return null;
  }

  const isWinner = label.participantId === match.winnerParticipantId;

  return (
    <div className={`tournament-match__slot${isWinner ? " is-winner" : ""}`}>
      <ParticipantName name={label.text} />
    </div>
  );
}

function roundLabel(
  round: Tournament["bracket"]["rounds"][number],
  tournament: Tournament,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const mainRoundIndex = tournament.bracket.rounds.findIndex(
    (currentRound) => currentRound.round === round.round,
  );
  const remainingRounds = tournament.bracket.rounds.length - mainRoundIndex;

  if (remainingRounds === 1) {
    return t("tournaments.bracket.final");
  }

  if (remainingRounds === 2) {
    return t("tournaments.bracket.semiFinal");
  }

  if (remainingRounds === 3) {
    return t("tournaments.bracket.quarterFinal");
  }

  if (remainingRounds === 4) {
    return t("tournaments.bracket.roundOf16");
  }

  return t("tournaments.bracket.round", {
    round: mainRoundIndex + 1,
  });
}

export function TournamentBracket({
  tournament,
  onSetWinner,
  savingMatchId,
}: TournamentBracketProps) {
  const { t } = useTranslation();
  const { winners, matchParticipants } = useMemo(
    () => resolveBracket(tournament),
    [tournament],
  );
  const openLabel = t("tournaments.bracket.openSlot");
  const finalMatch = tournament.bracket.rounds.at(-1)?.matches[0];
  const champion = finalMatch ? winners.get(finalMatch.id) : undefined;

  if (tournament.bracket.rounds.length === 0) {
    return (
      <p className="tournaments__notice">{t("tournaments.bracket.empty")}</p>
    );
  }

  return (
    <div
      className="tournament-bracket"
      aria-label={t("tournaments.bracket.label", { name: tournament.name })}
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
                  {t("tournaments.bracket.byeNotice", {
                    name: participant.participantName,
                  })}
                </p>
              ))}
              {round.matches
                .filter((match) => {
                  const labels = [
                    slotLabel(match.participantA, winners, openLabel),
                    slotLabel(match.participantB, winners, openLabel),
                  ].filter(Boolean);

                  return (
                    labels.length > 0 && !labels.every((label) => label?.isOpen)
                  );
                })
                .map((match) => (
                  <article
                    className={`tournament-match${
                      match.winnerParticipantId ? " is-completed" : ""
                    }`}
                    key={match.id}
                  >
                    <p className="tournament-match__label">
                      {t("tournaments.bracket.match", {
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
                    {onSetWinner &&
                    matchParticipants.get(match.id)?.length === 2 ? (
                      <label className="tournament-match__winner">
                        <span>{t("admin.tournaments.winnerLabel")}</span>
                        <select
                          aria-label={t("admin.tournaments.winnerForMatch", {
                            match: match.position,
                            round: roundLabel(round, tournament, t),
                          })}
                          value={match.winnerParticipantId ?? ""}
                          disabled={savingMatchId !== null}
                          onChange={(event) => {
                            if (event.target.value) {
                              void onSetWinner(match.id, event.target.value);
                            }
                          }}
                        >
                          <option value="">
                            {t("admin.tournaments.selectWinner")}
                          </option>
                          {matchParticipants
                            .get(match.id)
                            ?.map((participant) => (
                              <option
                                value={participant.id}
                                key={participant.id}
                              >
                                {participant.name}
                              </option>
                            ))}
                        </select>
                      </label>
                    ) : null}
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
      {champion ? (
        <p className="tournament-bracket__champion" role="status">
          {t("tournaments.bracket.champion", { name: champion.name })}
        </p>
      ) : null}
    </div>
  );
}
