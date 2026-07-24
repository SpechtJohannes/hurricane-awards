export type EventPhase = "before" | "during" | "after";

export type EventDateRange = {
  startDate?: string | null;
  endDate?: string | null;
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string | null | undefined) {
  return value && isoDatePattern.test(value) ? value : null;
}

export function calendarDateAt(
  instant: Date,
  timeZone = "Europe/Berlin",
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Date-only boundaries include their complete calendar day in the festival timezone. */
export function determineEventPhase(
  range: EventDateRange,
  referenceInstant: Date = new Date(),
  timeZone = "Europe/Berlin",
): EventPhase {
  const startDate = validDate(range.startDate);
  const endDate = validDate(range.endDate);
  const referenceDate = calendarDateAt(referenceInstant, timeZone);
  if (startDate && referenceDate < startDate) return "before";
  if (endDate && referenceDate > endDate) return "after";
  return "during";
}

export function eventDateRangeFromDays(
  dates: ReadonlyArray<string>,
): EventDateRange {
  const sortedDates = dates
    .filter((date) => validDate(date))
    .sort((first, second) => first.localeCompare(second));
  return {
    startDate: sortedDates[0] ?? null,
    endDate: sortedDates.at(-1) ?? null,
  };
}
