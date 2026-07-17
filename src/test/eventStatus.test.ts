import { describe, expect, it } from "vitest";
import { eventStatus } from "../domain/eventStatus";

describe("eventStatus", () => {
  it.each([
    [
      "several days before",
      "2026-06-15T12:00:00+02:00",
      { phase: "before", daysUntilStart: 4 },
    ],
    [
      "one day before",
      "2026-06-18T12:00:00+02:00",
      { phase: "before", daysUntilStart: 1 },
    ],
    [
      "first day",
      "2026-06-19T12:00:00+02:00",
      { phase: "during", currentDay: 1, totalDays: 3 },
    ],
    [
      "middle day",
      "2026-06-20T12:00:00+02:00",
      { phase: "during", currentDay: 2, totalDays: 3 },
    ],
    [
      "last day",
      "2026-06-21T23:59:00+02:00",
      { phase: "during", currentDay: 3, totalDays: 3 },
    ],
    ["after", "2026-06-22T12:00:00+02:00", { phase: "after" }],
  ] as const)("calculates %s", (_case, instant, expected) => {
    expect(eventStatus("2026-06-19", "2026-06-21", new Date(instant))).toEqual(
      expected,
    );
  });

  it("supports a single-day event", () => {
    expect(
      eventStatus(
        "2026-06-19",
        "2026-06-19",
        new Date("2026-06-19T12:00:00+02:00"),
      ),
    ).toEqual({ phase: "during", currentDay: 1, totalDays: 1 });
  });

  it("supports month and year changes", () => {
    expect(
      eventStatus("2026-01-30", "2026-02-02", new Date("2026-02-01T12:00:00Z")),
    ).toEqual({ phase: "during", currentDay: 3, totalDays: 4 });
    expect(
      eventStatus("2026-12-31", "2027-01-02", new Date("2027-01-01T12:00:00Z")),
    ).toEqual({ phase: "during", currentDay: 2, totalDays: 3 });
  });

  it.each([
    [null, "2026-06-21"],
    ["2026-06-19", null],
    [null, null],
    ["2026-06-22", "2026-06-21"],
  ])("returns null for an invalid or incomplete period", (start, end) => {
    expect(
      eventStatus(start, end, new Date("2026-06-20T12:00:00Z")),
    ).toBeNull();
  });

  it("stays stable across daylight-saving changes", () => {
    expect(
      eventStatus("2026-03-28", "2026-03-30", new Date("2026-03-29T12:00:00Z")),
    ).toEqual({ phase: "during", currentDay: 2, totalDays: 3 });
  });
});
