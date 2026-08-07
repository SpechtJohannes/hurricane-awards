import { useTranslation } from "react-i18next";
import type { RandomPairingParticipantAssignment } from "../data/randomPairings";
import { SectionHeader } from "./SectionHeader";

type RandomPairingsProps = {
  assignments: RandomPairingParticipantAssignment[];
  error: string;
  isLoading: boolean;
};

export function RandomPairings({
  assignments,
  error,
  isLoading,
}: Readonly<RandomPairingsProps>) {
  const { t } = useTranslation();

  return (
    <section
      className="random-pairings"
      id="main-random-pairings"
      aria-labelledby="random-pairings-title"
    >
      <SectionHeader
        title={t("randomPairings.title")}
        titleId="random-pairings-title"
        eyebrow={t("randomPairings.eyebrow")}
        description={t("randomPairings.description")}
        width="narrow"
      />

      {error ? (
        <p
          className="random-pairings__notice random-pairings__notice--error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="random-pairings__notice">{t("randomPairings.loading")}</p>
      ) : null}
      {!isLoading && assignments.length === 0 ? (
        <p className="random-pairings__notice">{t("randomPairings.empty")}</p>
      ) : null}
      {!isLoading && assignments.length > 0 ? (
        <div className="random-pairings__list">
          {assignments.map((assignment) => (
            <article
              className="random-pairings__card"
              key={assignment.actionId}
            >
              <h3>{assignment.actionName}</h3>
              <p>{t("randomPairings.assignedTo")}</p>
              <strong>{assignment.assignedParticipantName}</strong>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
