import { useTranslation } from "react-i18next";
import { eventStatus } from "../domain/eventStatus";

type EventStatusCardProps = {
  startDate: string | null;
  endDate: string | null;
  referenceInstant?: Date;
};

export function EventStatusCard({
  startDate,
  endDate,
  referenceInstant,
}: EventStatusCardProps) {
  const { t } = useTranslation();
  const status = eventStatus(startDate, endDate, referenceInstant);
  if (!status) return null;

  let message: string;
  if (status.phase === "before") {
    message =
      status.daysUntilStart === 1
        ? t("dashboard.eventStatus.tomorrow")
        : t("dashboard.eventStatus.countdown", {
            count: status.daysUntilStart,
          });
  } else if (status.phase === "during") {
    message =
      status.totalDays === 1
        ? t("dashboard.eventStatus.singleDay")
        : t("dashboard.eventStatus.eventDay", {
            current: status.currentDay,
            total: status.totalDays,
          });
  } else {
    message = t("dashboard.eventStatus.finished");
  }

  return (
    <article
      className="dashboard-event-status"
      aria-label={t("dashboard.eventStatus.label")}
    >
      <span>{t("dashboard.eventStatus.label")}</span>
      <strong>{message}</strong>
    </article>
  );
}
