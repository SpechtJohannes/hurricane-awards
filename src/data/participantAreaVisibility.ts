import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type ParticipantAccessContext,
} from "./accessContext";

export const participantAreaKeys = [
  "info",
  "profile",
  "timetable",
  "artists",
  "awards",
  "voting",
  "games",
] as const;

export type ParticipantAreaKey = (typeof participantAreaKeys)[number];
export type ParticipantAreaVisibility = Record<ParticipantAreaKey, boolean>;

export const defaultParticipantAreaVisibility: ParticipantAreaVisibility = {
  info: true,
  profile: true,
  timetable: true,
  artists: true,
  awards: true,
  voting: true,
  games: true,
};

type ParticipantAreaVisibilityRow = {
  info_visible?: boolean;
  profile_visible?: boolean;
  timetable_visible?: boolean;
  artists_visible?: boolean;
  awards_visible?: boolean;
  voting_visible?: boolean;
  games_visible?: boolean;
};

function mapVisibility(data: unknown): ParticipantAreaVisibility {
  const row = (Array.isArray(data) ? data[0] : data) as
    | ParticipantAreaVisibilityRow
    | null;

  return Object.fromEntries(
    participantAreaKeys.map((key) => [
      key,
      row?.[`${key}_visible` as keyof ParticipantAreaVisibilityRow] !== false,
    ]),
  ) as ParticipantAreaVisibility;
}

export async function loadParticipantAreaVisibility() {
  const { data, error } = await getSupabase().rpc(
    "ha_get_participant_area_visibility",
  );
  if (error) throw error;
  return mapVisibility(data);
}

export async function updateParticipantAreaVisibility(
  area: ParticipantAreaKey,
  isVisible: boolean,
  context: ParticipantAccessContext,
) {
  const { data, error } = await getSupabase().rpc(
    "ha_admin_update_participant_area_visibility",
    {
      ...participantRpcParams(context),
      p_area_key: area,
      p_is_visible: isVisible,
    },
  );
  if (error) throw error;
  return mapVisibility(data);
}
