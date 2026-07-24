import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type {
  Timetable,
  TimetableAct,
  TimetablePerformance,
} from "../data/timetable";
import type { ActArtistTag } from "../data/artistTags";

type ArtistDetailProps = {
  timetable: Timetable | null;
  actId: string;
  artistTags: ActArtistTag[];
  loadError: string;
  favoriteError: string;
  isLoading: boolean;
  isSavingFavorite: boolean;
  backButton: ReactNode;
  onToggleFavorite: (performanceIds: string[], isFavorite: boolean) => void;
};

type ArtistContentProps = {
  act: TimetableAct;
  assignedTags: ActArtistTag[];
  performances: TimetablePerformance[];
  timetable: Timetable | null;
  favoriteError: string;
  isFavorite: boolean;
  isSavingFavorite: boolean;
  locale: string;
  onToggleFavorite: (performanceIds: string[], isFavorite: boolean) => void;
};

function favoriteButtonLabel(
  isSavingFavorite: boolean,
  isFavorite: boolean,
  labels: { saving: string; remove: string; add: string },
) {
  if (isSavingFavorite) return labels.saving;
  if (isFavorite) return labels.remove;
  return labels.add;
}

function ArtistPerformances({
  performances,
  timetable,
  locale,
}: Pick<ArtistContentProps, "performances" | "timetable" | "locale">) {
  const { t } = useTranslation();
  const dayById = new Map(
    timetable?.festivalDays.map((day) => [day.id, day]) ?? [],
  );
  const stageById = new Map(
    timetable?.stages.map((stage) => [stage.id, stage]) ?? [],
  );

  if (performances.length === 0) {
    return (
      <div className="artist-detail__performances">
        <h3>{t("artistDetail.performances.title")}</h3>
        <p className="artist-detail__notice">
          {t("artistDetail.performances.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="artist-detail__performances">
      <h3>{t("artistDetail.performances.title")}</h3>
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
          const time = end
            ? t("artistDetail.performances.timeRange", { start, end })
            : t("artistDetail.performances.startTime", { start });

          return (
            <li key={performance.id}>
              <strong>{day?.label ?? date}</strong>
              {day?.label ? <span>{date}</span> : null}
              <span>{time}</span>
              <span>
                {t("artistDetail.performances.stage", {
                  stage:
                    stage?.name ??
                    t("artistDetail.performances.unknownStage"),
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ArtistContent({
  act,
  assignedTags,
  performances,
  timetable,
  favoriteError,
  isFavorite,
  isSavingFavorite,
  locale,
  onToggleFavorite,
}: ArtistContentProps) {
  const { t } = useTranslation();
  const performanceIds = performances.map((performance) => performance.id);
  const favoriteLabel = favoriteButtonLabel(isSavingFavorite, isFavorite, {
    saving: t("artistDetail.favorite.saving"),
    remove: t("artistDetail.favorite.remove"),
    add: t("artistDetail.favorite.add"),
  });

  return (
    <div className="artist-detail__content">
      <header className="artist-detail__header">
        <p>{t("artistDetail.eyebrow")}</p>
        <h2 id="artist-detail-title">{act.name}</h2>
        {act.description ? (
          <span className="artist-detail__description">{act.description}</span>
        ) : null}
        <button
          type="button"
          className="artist-detail__favorite"
          disabled={performances.length === 0 || isSavingFavorite}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(performanceIds, isFavorite)}
        >
          {favoriteLabel}
        </button>
      </header>

      {assignedTags.length > 0 ? (
        <div
          className="artist-detail__tags"
          aria-label={t("artistDetail.tags.label")}
        >
          {assignedTags.map((tag) => (
            <span key={tag.id}>{tag.name}</span>
          ))}
        </div>
      ) : null}

      {favoriteError ? (
        <p
          className="artist-detail__notice artist-detail__notice--error"
          role="alert"
        >
          {favoriteError}
        </p>
      ) : null}

      <ArtistPerformances
        performances={performances}
        timetable={timetable}
        locale={locale}
      />
    </div>
  );
}

function ArtistDetailBody({
  timetable,
  actId,
  artistTags,
  loadError,
  favoriteError,
  isLoading,
  isSavingFavorite,
  onToggleFavorite,
}: Omit<ArtistDetailProps, "backButton">) {
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

  if (isLoading) {
    return (
      <p className="artist-detail__notice" role="status">
        {t("artistDetail.loading")}
      </p>
    );
  }
  if (loadError) {
    return (
      <p
        className="artist-detail__notice artist-detail__notice--error"
        role="alert"
      >
        {loadError}
      </p>
    );
  }
  if (!act) {
    return (
      <p
        className="artist-detail__notice artist-detail__notice--error"
        role="alert"
      >
        {t("artistDetail.notFound")}
      </p>
    );
  }

  const favoriteIds = new Set(timetable?.favoritePerformanceIds ?? []);
  const isFavorite =
    performances.length > 0 &&
    performances.every((performance) => favoriteIds.has(performance.id));

  return (
    <ArtistContent
      act={act}
      assignedTags={artistTags.filter((tag) => tag.actId === actId)}
      performances={performances}
      timetable={timetable}
      favoriteError={favoriteError}
      isFavorite={isFavorite}
      isSavingFavorite={isSavingFavorite}
      locale={i18n.language.startsWith("nl") ? "nl-NL" : "de-DE"}
      onToggleFavorite={onToggleFavorite}
    />
  );
}

export function ArtistDetail({
  timetable,
  actId,
  artistTags,
  loadError,
  favoriteError,
  isLoading,
  isSavingFavorite,
  backButton,
  onToggleFavorite,
}: ArtistDetailProps) {
  return (
    <section
      className="artist-detail"
      id="main-artist-detail"
      aria-labelledby="artist-detail-title"
    >
      {backButton}
      <ArtistDetailBody
        timetable={timetable}
        actId={actId}
        artistTags={artistTags}
        loadError={loadError}
        favoriteError={favoriteError}
        isLoading={isLoading}
        isSavingFavorite={isSavingFavorite}
        onToggleFavorite={onToggleFavorite}
      />
    </section>
  );
}
