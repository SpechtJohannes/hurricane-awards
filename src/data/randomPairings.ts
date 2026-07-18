import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from "./accessContext";

export type RandomPairingStatus = "draft" | "drawn";

export type RandomPairingAssignment = {
  participantId: string;
  participantName: string;
  assignedParticipantId: string;
  assignedParticipantName: string;
};

export type AdminRandomPairingAction = {
  id: string;
  festivalId: string;
  name: string;
  status: RandomPairingStatus;
  selectedParticipantIds: string[];
  assignments: RandomPairingAssignment[];
  createdAt: string;
  drawnAt: string | null;
};

export type RandomPairingParticipantAssignment = {
  actionId: string;
  actionName: string;
  assignedParticipantId: string;
  assignedParticipantName: string;
  drawnAt: string | null;
};

type RandomPairingAssignmentRow = {
  participant_id: string;
  participant_name: string | null;
  assigned_participant_id: string;
  assigned_participant_name: string | null;
};

type AdminRandomPairingActionRow = {
  id: string;
  festival_id: string;
  name: string;
  status: RandomPairingStatus;
  selected_participant_ids?: string[] | null;
  assignments?: RandomPairingAssignmentRow[] | string | null;
  created_at: string;
  drawn_at?: string | null;
};

type RandomPairingParticipantAssignmentRow = {
  action_id: string;
  action_name: string;
  assigned_participant_id: string;
  assigned_participant_name: string | null;
  drawn_at?: string | null;
};

function firstRow<T>(data: unknown): T | null {
  const row = Array.isArray(data) ? data[0] : data;

  return row ? (row as T) : null;
}

function parseAssignments(
  assignments: AdminRandomPairingActionRow["assignments"],
): RandomPairingAssignmentRow[] {
  if (!assignments) {
    return [];
  }

  if (typeof assignments === "string") {
    return JSON.parse(assignments) as RandomPairingAssignmentRow[];
  }

  return assignments;
}

function mapAssignment(
  row: RandomPairingAssignmentRow,
): RandomPairingAssignment {
  return {
    participantId: row.participant_id,
    participantName: row.participant_name ?? row.participant_id,
    assignedParticipantId: row.assigned_participant_id,
    assignedParticipantName:
      row.assigned_participant_name ?? row.assigned_participant_id,
  };
}

function mapAdminAction(
  row: AdminRandomPairingActionRow,
): AdminRandomPairingAction {
  return {
    id: row.id,
    festivalId: row.festival_id,
    name: row.name,
    status: row.status,
    selectedParticipantIds: row.selected_participant_ids ?? [],
    assignments: parseAssignments(row.assignments).map(mapAssignment),
    createdAt: row.created_at,
    drawnAt: row.drawn_at ?? null,
  };
}

function mapParticipantAssignment(
  row: RandomPairingParticipantAssignmentRow,
): RandomPairingParticipantAssignment {
  return {
    actionId: row.action_id,
    actionName: row.action_name,
    assignedParticipantId: row.assigned_participant_id,
    assignedParticipantName:
      row.assigned_participant_name ?? row.assigned_participant_id,
    drawnAt: row.drawn_at ?? null,
  };
}

export async function loadRandomPairingAssignments(
  festivalId: string,
  context: ParticipantAccessContext,
): Promise<RandomPairingParticipantAssignment[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_list_random_pairing_assignments",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
    },
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as RandomPairingParticipantAssignmentRow[]).map(
    mapParticipantAssignment,
  );
}

export async function loadAdminRandomPairingActions(
  festivalId: string,
  context: AdminAccessContext,
): Promise<AdminRandomPairingAction[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_list_random_pairing_actions",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
    },
  );

  if (error) {
    throw error;
  }

  return ((data ?? []) as AdminRandomPairingActionRow[]).map(mapAdminAction);
}

export async function createRandomPairingAction(
  festivalId: string,
  name: string,
  context: AdminAccessContext,
): Promise<AdminRandomPairingAction> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_create_random_pairing_action",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
      p_name: name.trim(),
    },
  );

  if (error) {
    throw error;
  }

  const row = firstRow<AdminRandomPairingActionRow>(data);

  if (!row) {
    throw new Error("random pairing action was not returned");
  }

  return mapAdminAction(row);
}

export async function updateRandomPairingParticipants(
  actionId: string,
  participantIds: string[],
  context: AdminAccessContext,
): Promise<AdminRandomPairingAction> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_set_random_pairing_participants",
    {
      ...participantRpcParams(context),
      p_action_id: actionId,
      p_participant_ids: participantIds,
    },
  );

  if (error) {
    throw error;
  }

  const row = firstRow<AdminRandomPairingActionRow>(data);

  if (!row) {
    throw new Error("random pairing action was not returned");
  }

  return mapAdminAction(row);
}

export async function drawRandomPairingAction(
  actionId: string,
  replaceExisting: boolean,
  context: AdminAccessContext,
): Promise<AdminRandomPairingAction> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_draw_random_pairing_action",
    {
      ...participantRpcParams(context),
      p_action_id: actionId,
      p_replace_existing: replaceExisting,
    },
  );

  if (error) {
    throw error;
  }

  const row = firstRow<AdminRandomPairingActionRow>(data);

  if (!row) {
    throw new Error("random pairing action was not returned");
  }

  return mapAdminAction(row);
}

export async function resetRandomPairingAction(
  festivalId: string,
  actionId: string,
  context: AdminAccessContext,
): Promise<AdminRandomPairingAction> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_admin_reset_random_pairing_action",
    {
      ...participantRpcParams(context),
      p_festival_id: festivalId,
      p_action_id: actionId,
    },
  );

  if (error) {
    throw error;
  }

  const row = firstRow<AdminRandomPairingActionRow>(data);

  if (!row) {
    throw new Error("reset random pairing action was not returned");
  }

  return mapAdminAction(row);
}
