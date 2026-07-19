import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Timetable } from "../data/timetable";

type ArtistDetailProps = {
  timetable: Timetable | null;
  actId: string;
  loadError: string;
  favoriteError: string;
  isLoading: boolean;
  isSavingFavorite: boolean;
  backButton: ReactNode;
  onToggleFavorite: (performanceIds: string[], isFavorite: boolean) => void;
};

export function ArtistDetail({
  timetable,
  actId,
  loadError,
  favoriteError,
  isLoading,
  isSavingFavorite,
  backButton,
  onToggleFavorite,
}: ArtistDetailProps) {
  const { t, i18n } = useTranslation();
  const act = timetable?.acts.find((entry) => entry.id === actId) ?? null;
  const performances = useMemo(
    () =>
      (timetable?.performances ?? [])
        .filter((performance) => performance.actId === actId)
        .slice()
        .sort(
          (first, second) =>
            Date.parse(first.startsAt) - Date.parse(second.startsAt),
        ),
    [actId, timetable?.performances],
  );
  const favoriteIds = new Set(timetable?.favoritePerformanceIds ?? []);
  const isFavorite =
    performances.length > 0 &&
    performances.every((performance) => favoriteIds.has(performance.id));
  const dayById = new Map(
    timetable?.festivalDays.map((day) => [day.id, day]) ?? [],
  );
  const stageById = new Map(
    timetable?.stages.map((stage) => [stage.id, stage]) ?? [],
  );
  const locale = i18n.language.startsWith("nl") ? "nl-NL" : "de-DE";

  return (
    <section
      className="artist-detail"
      id="main-artist-detail"
      aria-labelledby="artist-detail-title"
    >
      {backButton}

      {isLoading ? (
        <p className="artist-detail__notice" role="status">
          {t("artistDetail.loading")}
        </p>
      ) : loadError ? (
        <p className="artist-detail__notice artist-detail__notice--error" role="alert">
          {loadError}
        </p>
      ) : !act ? (
        <p className="artist-detail__notice artist-detail__notice--error" role="alert">
          {t("artistDetail.notFound")}
        </p>
      ) : (
        <div className="artist-detail__content">
          <header className="artist-detail__header">
            <p>{t("artistDetail.eyebrow")}</p>
            <h2 id="artist-detail-title">{act.name}</h2>
            <button
              type="button"
              className="artist-detail__favorite"
              disabled={performances.length === 0 || isSavingFavorite}
              aria-pressed={isFavorite}
              onClick={() =>
                onToggleFavorite(
                  performances.map((performance) => performance.id),
                  isFavorite,
                )
              }
            >
              {isSavingFavorite
                ? t("artistDetail.favorite.saving")
                : isFavorite
                  ? t("artistDetail.favorite.remove")
                  : t("artistDetail.favorite.add")}
            </button>
          </header>

          {favoriteError ? (
            <p className="artist-detail__notice artist-detail__notice--error" role="alert">
              {favoriteError}
            </p>
          ) : null}

          <div className="artist-detail__performances">
            <h3>{t("artistDetail.performances.title")}</h3>
            {performances.length === 0 ? (
              <p className="artist-detail__notice">
                {t("artistDetail.performances.empty")}
              </p>
            ) : (
              <ul>
                {performances.map((performance) => {
                  const day = dayById.get(performance.festivalDayId);
                  const stage = stageById.get(performance.stageId);
                  const date = new Intl.DateTimeFormat(locale, {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "Europe/Berlin",
                  }).format(new Date(performance.startsAt));
                  const start = performance.startsAt.slice(11, 16);
                  const end = performance.endsAt?.slice(11, 16);

                  return (
                    <li key={performance.id}>
                      <strong>{day?.label ?? date}</strong>
                      {day?.label ? <span>{date}</span> : null}
                      <span>
                        {end
                          ? t("artistDetail.performances.timeRange", { start, end })
                          : t("artistDetail.performances.startTime", { start })}
                      </span>
                      <span>
                        {t("artistDetail.performances.stage", {
                          stage: stage?.name ?? t("artistDetail.performances.unknownStage"),
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
