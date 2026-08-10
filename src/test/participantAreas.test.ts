import { describe, expect, it } from "vitest";
import { defaultParticipantAreaVisibility } from "../data/participantAreaVisibility";
import {
  filterVisibleParticipantAreas,
  isParticipantDestinationVisible,
  resolveParticipantDestination,
} from "../domain/participantAreas";

describe("participant area navigation", () => {
  it("evaluates every participant area independently", () => {
    const visibility = {
      ...defaultParticipantAreaVisibility,
      artists: false,
      awards: false,
    };

    expect(isParticipantDestinationVisible("artists", visibility)).toBe(false);
    expect(isParticipantDestinationVisible("timetable", visibility)).toBe(true);
    expect(isParticipantDestinationVisible("awards", visibility)).toBe(false);
    expect(isParticipantDestinationVisible("voting", visibility)).toBe(true);
    expect(isParticipantDestinationVisible("dashboard", visibility)).toBe(true);
  });

  it("filters disabled areas without changing the remaining order", () => {
    const visibility = {
      ...defaultParticipantAreaVisibility,
      artists: false,
      games: false,
    };
    const areas = [
      { section: "timetable" as const },
      { section: "artists" as const },
      { section: "info" as const },
      { section: "games" as const },
    ];

    expect(filterVisibleParticipantAreas(areas, visibility)).toEqual([
      areas[0],
      areas[2],
    ]);
  });

  it("uses the always available dashboard as a loop-free fallback", () => {
    const visibility = Object.fromEntries(
      Object.keys(defaultParticipantAreaVisibility).map((key) => [key, false]),
    ) as typeof defaultParticipantAreaVisibility;

    expect(resolveParticipantDestination("artists", visibility)).toBe("dashboard");
    expect(resolveParticipantDestination("dashboard", visibility)).toBe("dashboard");
  });
});
