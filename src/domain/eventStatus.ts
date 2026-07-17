import {
  calendarDateAt,
  determineEventPhase,
  type EventPhase,
} from "./eventPhase";

export type EventStatus =
  | { phase: "before"; daysUntilStart: number }
  | { phase: "during"; currentDay: number; totalDays: number }
  | { phase: "after" };

function epochDay(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function eventStatus(
  startDate: string | null,
  endDate: string | null,
  referenceInstant: Date = new Date(),
  timeZone = "Europe/Berlin",
): EventStatus | null {
  if (!startDate || !endDate || endDate < startDate) return null;
  const today = calendarDateAt(referenceInstant, timeZone);
  const phase: EventPhase = determineEventPhase(
    { startDate, endDate },
    referenceInstant,
    timeZone,
  );
  if (phase === "before") {
    return { phase, daysUntilStart: epochDay(startDate) - epochDay(today) };
  }
  if (phase === "after") return { phase };
  return {
    phase,
    currentDay: epochDay(today) - epochDay(startDate) + 1,
    totalDays: epochDay(endDate) - epochDay(startDate) + 1,
  };
}
