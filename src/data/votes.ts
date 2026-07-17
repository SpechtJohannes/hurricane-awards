import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from "./accessContext";

type VoteRow = {
  voter_id: string;
  voted_for_id: string;
  category_id: string;
  timestamp: string;
};

export type Vote = {
  voterId: string;
  votedForId: string;
  categoryId: string;
  timestamp: string;
};

function mapVote(row: VoteRow): Vote {
  return {
    voterId: row.voter_id,
    votedForId: row.voted_for_id,
    categoryId: row.category_id,
    timestamp: row.timestamp,
  };
}

export async function loadVotesForParticipant(
  voterId: string,
  context: ParticipantAccessContext,
): Promise<Vote[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_list_participant_votes", {
    ...participantRpcParams(context),
    p_voter_id: voterId,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as VoteRow[]).map((row) => mapVote(row));
}

export async function loadVotes(
  context: ParticipantAccessContext,
): Promise<Vote[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_list_result_votes",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as VoteRow[]).map((row) => mapVote(row));
}

export async function deleteVotesForCategory(
  categoryId: string,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.rpc("ha_delete_category_votes", {
    ...participantRpcParams(context),
    p_category_id: categoryId,
  });

  if (error) {
    throw error;
  }
}

export async function saveVote(
  vote: Vote,
  context: ParticipantAccessContext,
): Promise<Vote> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_save_vote", {
    ...participantRpcParams(context),
    p_voter_id: vote.voterId,
    p_voted_for_id: vote.votedForId,
    p_category_id: vote.categoryId,
    p_timestamp: vote.timestamp,
  });

  if (error) {
    throw error;
  }

  const savedVote = Array.isArray(data) ? data[0] : data;

  return mapVote(savedVote as VoteRow);
}
