import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from "./accessContext";

export type HorseRacingSuit = "hearts" | "diamonds" | "spades" | "clubs";
export type HorseRacingBettingStatus = "open" | "closed";

export type HorseRacingState = {
  festivalId: string;
  isEnabled: boolean;
  bettingStatus: HorseRacingBettingStatus;
  selectedSuit: HorseRacingSuit | null;
  updatedAt: string | null;
};

export type AdminHorseRacingState = Omit<HorseRacingState, "selectedSuit"> & {
  betCount: number;
};

export type AdminHorseRacingBet = {
  participantId: string;
  participantName: string;
  suit: HorseRacingSuit;
  placedAt: string;
  updatedAt: string;
};

type HorseRacingStateRow = {
  festival_id: string;
  is_enabled: boolean;
  betting_status: HorseRacingBettingStatus;
  suit?: HorseRacingSuit | null;
  updated_at?: string | null;
};

type AdminHorseRacingStateRow = Omit<HorseRacingStateRow, "suit"> & {
  bet_count?: number | string | null;
};

type AdminHorseRacingBetRow = {
  participant_id: string;
  participant_name: string | null;
  suit: HorseRacingSuit;
  placed_at: string;
  updated_at: string;
};

function firstRow<T>(data: unknown): T | null {
  const row = Array.isArray(data) ? data[0] : data;

  return row ? (row as T) : null;
}

function mapState(row: HorseRacingStateRow): HorseRacingState {
  return {
    festivalId: row.festival_id,
    isEnabled: row.is_enabled,
    bettingStatus: row.betting_status,
    selectedSuit: row.suit ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

function mapAdminState(row: AdminHorseRacingStateRow): AdminHorseRacingState {
  return {
    festivalId: row.festival_id,
    isEnabled: row.is_enabled,
    bettingStatus: row.betting_status,
    betCount: Number(row.bet_count ?? 0),
    updatedAt: row.updated_at ?? null,
  };
}

function mapAdminBet(row: AdminHorseRacingBetRow): AdminHorseRacingBet {
  return {
    participantId: row.participant_id,
    participantName: row.participant_name ?? row.participant_id,
    suit: row.suit,
    placedAt: row.placed_at,
    updatedAt: row.updated_at,
  };
}

export async function loadHorseRacingState(
  festivalId: string,
  context: ParticipantAccessContext,
): Promise<HorseRacingState | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_get_horse_racing_state", {
    ...participantRpcParams(context),
    p_festival_id: festivalId,
  });

  if (error) {
    throw error;
  }

  const row = firstRow<HorseRacingStateRow>(data);

  return row ? mapState(row) : null;
}

export async function saveHorseRacingBet(
  festivalId: string,
  suit: HorseRacingSuit,
  context: ParticipantAccessContext,
): Promise<HorseRacingState> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_place_horse_racing_bet", {
    ...participantRpcParams(context),
    p_festival_id: festivalId,
    p_suit: suit,
  });

  if (error) {
    throw error;
  }

  const row = firstRow<HorseRacingStateRow>(data);

  if (!row) {
    throw new Error("horse racing state was not returned");
  }

  return mapState(row);
}

export async function loadAdminHorseRacingState(
  festivalId: string,
  context: AdminAccessContext,
): Promise<AdminHorseRacingState | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_get_horse_racing_state",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
    },
  );

  if (error) {
    throw error;
  }

  const row = firstRow<AdminHorseRacingStateRow>(data);

  return row ? mapAdminState(row) : null;
}

export async function updateAdminHorseRacingState(
  festivalId: string,
  input: {
    isEnabled: boolean;
    bettingStatus: HorseRacingBettingStatus;
  },
  context: AdminAccessContext,
): Promise<AdminHorseRacingState> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_set_horse_racing_state",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
      p_is_enabled: input.isEnabled,
      p_betting_status: input.bettingStatus,
    },
  );

  if (error) {
    throw error;
  }

  const row = firstRow<AdminHorseRacingStateRow>(data);

  if (!row) {
    throw new Error("horse racing admin state was not returned");
  }

  return mapAdminState(row);
}

export async function loadAdminHorseRacingBets(
  festivalId: string,
  context: AdminAccessContext,
): Promise<AdminHorseRacingBet[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_list_horse_racing_bets",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
    },
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as AdminHorseRacingBetRow[]).map(mapAdminBet);
}
