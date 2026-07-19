import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Category } from "../data/categories";
import type { Timetable } from "../data/timetable";
import { EventStatusCard } from "./EventStatusCard";
import { WeatherCard } from "./WeatherCard";

type DashboardHeroProps = {
  festivalName: string;
  participantName: string | null;
  isAuthenticated: boolean;
  eventStartDate: string | null;
  eventEndDate: string | null;
  referenceInstant: Date;
  timetable: Timetable | null;
  activeCategory: Category | null;
  showEventStatus: boolean;
  participantAccessCode?: string | null;
  onOpenTimetable: () => void;
  onOpenVoting: () => void;
};

function nextFavoritePerformance(
  timetable: Timetable | null,
  referenceInstant: Date,
) {
  if (!timetable) return null;

  const favoriteIds = new Set(timetable.favoritePerformanceIds);
  return (
    timetable.performances
      .filter(
        (performance) =>
          favoriteIds.has(performance.id) &&
          Date.parse(performance.startsAt) > referenceInstant.getTime(),
      )
      .sort(
        (first, second) =>
          Date.parse(first.startsAt) - Date.parse(second.startsAt),
      )[0] ?? null
  );
}

export function DashboardHero({
  festivalName,
  participantName,
  isAuthenticated,
  eventStartDate,
  eventEndDate,
  referenceInstant,
  timetable,
  activeCategory,
  showEventStatus,
  participantAccessCode = null,
  onOpenTimetable,
  onOpenVoting,
}: DashboardHeroProps) {
  const { t, i18n } = useTranslation();
  const greetingName = participantName ?? t("dashboard.guestName");
  const nextFavorite = useMemo(
    () => nextFavoritePerformance(timetable, referenceInstant),
    [referenceInstant, timetable],
  );
  const act = nextFavorite
    ? timetable?.acts.find((entry) => entry.id === nextFavorite.actId)
    : null;
  const stage = nextFavorite
    ? timetable?.stages.find((entry) => entry.id === nextFavorite.stageId)
    : null;
  const locale = i18n.resolvedLanguage?.startsWith("nl") ? "nl-NL" : "de-DE";
  const favoriteTime = nextFavorite
    ? new Intl.DateTimeFormat(locale, {
        timeZone: "Europe/Berlin",
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(nextFavorite.startsAt))
    : null;

  return (
    <div className="dashboard-hero" data-testid="dashboard-hero">
      <div className="dashboard-hero__intro">
        <p className="dashboard__eyebrow">{t("dashboard.eyebrow")}</p>
        <p className="dashboard-hero__festival-label">
          {t("dashboard.festivalLabel")}
        </p>
        <p className="dashboard-hero__festival">{festivalName}</p>
        <h2 id="dashboard-title">
          {t("dashboard.greeting", { name: greetingName })}
        </h2>
        <p className="dashboard-hero__description">
          {isAuthenticated
            ? t("dashboard.description")
            : t("dashboard.guestDescription")}
        </p>
      </div>

      <div className="dashboard-hero__modules">
        <WeatherCard participantAccessCode={participantAccessCode} />
        {showEventStatus ? (
          eventStartDate && eventEndDate ? (
            <EventStatusCard
              startDate={eventStartDate}
              endDate={eventEndDate}
              referenceInstant={referenceInstant}
            />
          ) : (
            <article
              className="dashboard-event-status"
              aria-label={t("dashboard.eventStatus.label")}
            >
              <span>{t("dashboard.eventStatus.label")}</span>
              <strong>{t("dashboard.eventStatus.missing")}</strong>
            </article>
          )
        ) : null}

        {nextFavorite && act && stage && favoriteTime ? (
          <button
            className="dashboard-hero__module dashboard-hero__module--favorite"
            type="button"
            onClick={onOpenTimetable}
          >
            <span>{t("dashboard.hero.nextFavorite")}</span>
            <strong>{act.name}</strong>
            <small>
              {t("dashboard.hero.favoriteDetails", {
                time: favoriteTime,
                stage: stage.name,
              })}
            </small>
          </button>
        ) : null}

        {activeCategory ? (
          <button
            className="dashboard-hero__module dashboard-hero__module--voting"
            type="button"
            onClick={onOpenVoting}
          >
            <span>{t("dashboard.hero.activeVoting")}</span>
            <strong>{activeCategory.title}</strong>
            <small>{t("dashboard.hero.openVoting")}</small>
          </button>
        ) : null}
      </div>
    </div>
  );
}
