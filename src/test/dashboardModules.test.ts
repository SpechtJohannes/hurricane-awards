import { describe, expect, it } from "vitest";
import {
  dashboardModuleConfig,
  selectDashboardModules,
  type DashboardModuleConfig,
} from "../domain/dashboardModules";

const modules = dashboardModuleConfig.map(({ id }) => ({ id, data: null }));

describe("selectDashboardModules", () => {
  it.each([
    [
      "before",
      [
        "eventStatus",
        "timetable",
        "artists",
        "info",
        "games",
        "voting",
        "awards",
        "profile",
      ],
    ],
    [
      "during",
      [
        "eventStatus",
        "timetable",
        "artists",
        "games",
        "voting",
        "info",
        "awards",
        "profile",
      ],
    ],
    [
      "after",
      [
        "eventStatus",
        "awards",
        "voting",
        "timetable",
        "artists",
        "games",
        "info",
        "profile",
      ],
    ],
  ] as const)("orders modules %s the event", (phase, expected) => {
    expect(
      selectDashboardModules(modules, dashboardModuleConfig, phase).map(
        ({ id }) => id,
      ),
    ).toEqual(expected);
  });

  it("hides phase-specific modules and retains general modules", () => {
    const config: DashboardModuleConfig[] = [
      {
        id: "live",
        phases: ["during"],
        priority: { before: 1, during: 1, after: 1 },
      },
      { id: "general", priority: { before: 2, during: 2, after: 2 } },
    ];
    expect(
      selectDashboardModules(
        [{ id: "live" }, { id: "general" }],
        config,
        "after",
      ),
    ).toEqual([{ id: "general" }]);
  });

  it("keeps an unconfigured module stable when its data is absent", () => {
    expect(
      selectDashboardModules([{ id: "unknown", data: null }], [], "during"),
    ).toEqual([{ id: "unknown", data: null }]);
  });
});
