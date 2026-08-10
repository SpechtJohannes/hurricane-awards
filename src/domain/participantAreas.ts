import type {
  ParticipantAreaKey,
  ParticipantAreaVisibility,
} from "../data/participantAreaVisibility";

export type ParticipantDestination = "dashboard" | ParticipantAreaKey;

export function isParticipantDestinationVisible(
  destination: ParticipantDestination,
  visibility: ParticipantAreaVisibility,
): boolean {
  return destination === "dashboard" || visibility[destination];
}

export function resolveParticipantDestination(
  destination: ParticipantDestination,
  visibility: ParticipantAreaVisibility,
): ParticipantDestination {
  return isParticipantDestinationVisible(destination, visibility)
    ? destination
    : "dashboard";
}

export function filterVisibleParticipantAreas<
  T extends { section: ParticipantAreaKey },
>(areas: readonly T[], visibility: ParticipantAreaVisibility): T[] {
  return areas.filter(({ section }) => visibility[section]);
}
