import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from "./accessContext";

export type BingoRound = {
  id: string;
  startedAt: string;
};

export type BingoCard = BingoRound & {
  cardId: string;
  numbers: number[];
  markedNumbers: number[];
};

type BingoRoundRow = {
  id: string;
  started_at: string;
};

type BingoCardRow = BingoRoundRow & {
  card_id: string;
  numbers: number[];
  marked_numbers?: number[] | null;
};

function firstRow<T>(data: unknown): T | null {
  const row = Array.isArray(data) ? data[0] : data;

  return row ? (row as T) : null;
}

function mapRound(row: BingoRoundRow): BingoRound {
  return {
    id: row.id,
    startedAt: row.started_at,
  };
}

function mapCard(row: BingoCardRow): BingoCard {
  return {
    ...mapRound(row),
    cardId: row.card_id,
    numbers: row.numbers,
    markedNumbers: row.marked_numbers ?? [],
  };
}

export async function loadActiveBingoRound(
  context: ParticipantAccessContext,
): Promise<BingoRound | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_get_active_bingo_round",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  const row = firstRow<BingoRoundRow>(data);

  return row ? mapRound(row) : null;
}

export async function loadOrCreateBingoCard(
  context: ParticipantAccessContext,
): Promise<BingoCard | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_get_or_create_bingo_card",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  const row = firstRow<BingoCardRow>(data);

  return row ? mapCard(row) : null;
}

export async function setBingoMark(
  number: number,
  isMarked: boolean,
  context: ParticipantAccessContext,
): Promise<number[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_set_bingo_mark", {
    ...participantRpcParams(context),
    p_number: number,
    p_is_marked: isMarked,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as number[];
}

export async function loadAdminBingoRound(
  context: AdminAccessContext,
): Promise<BingoRound | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_get_bingo_round",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  const row = firstRow<BingoRoundRow>(data);

  return row ? mapRound(row) : null;
}

export async function startBingoRound(
  context: AdminAccessContext,
): Promise<BingoRound> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_start_bingo_round",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  const row = firstRow<BingoRoundRow>(data);

  if (!row) {
    throw new Error("bingo round was not returned");
  }

  return mapRound(row);
}

export async function closeBingoRound(
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.rpc(
    "ha_close_bingo_round",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }
}
