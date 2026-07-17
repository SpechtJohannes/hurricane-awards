import type { EventPhase } from "./eventPhase";

export type DashboardModuleConfig<Id extends string = string> = {
  id: Id;
  phases?: readonly EventPhase[];
  priority: Record<EventPhase, number>;
};

export const dashboardModuleConfig = [
  {
    id: "eventStatus",
    phases: ["before", "during", "after"],
    priority: { before: 1, during: 1, after: 1 },
  },
  { id: "awards", priority: { before: 50, during: 50, after: 10 } },
  { id: "timetable", priority: { before: 10, during: 10, after: 30 } },
  { id: "games", priority: { before: 30, during: 20, after: 40 } },
  { id: "info", priority: { before: 20, during: 40, after: 50 } },
  { id: "voting", priority: { before: 40, during: 30, after: 20 } },
  { id: "profile", priority: { before: 60, during: 60, after: 60 } },
] as const satisfies readonly DashboardModuleConfig[];

export function selectDashboardModules<T extends { id: string }>(
  modules: readonly T[],
  config: readonly DashboardModuleConfig[],
  phase: EventPhase,
): T[] {
  const configById = new Map(config.map((entry) => [entry.id, entry]));
  return modules
    .map((module, originalIndex) => ({
      module,
      originalIndex,
      config: configById.get(module.id),
    }))
    .filter(
      ({ config: entry }) => !entry?.phases || entry.phases.includes(phase),
    )
    .sort(
      (left, right) =>
        (left.config?.priority[phase] ?? Number.MAX_SAFE_INTEGER) -
          (right.config?.priority[phase] ?? Number.MAX_SAFE_INTEGER) ||
        left.originalIndex - right.originalIndex,
    )
    .map(({ module }) => module);
}
