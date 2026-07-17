import { getSupabase } from "../lib/supabase";
import { participantRpcParams, type AdminAccessContext } from "./accessContext";

type FestivalAccessCodeRow = {
  access_code: string;
  access_version: string;
};

type FestivalAccessVerificationRow = {
  is_valid: boolean;
  access_version: string | null;
};

export type FestivalAccessCodeSettings = {
  code: string;
  version: string;
};

export type FestivalAccessVerification = {
  isValid: boolean;
  version: string | null;
};

export type EventSettings = {
  name: string;
  startDate: string | null;
  endDate: string | null;
};

type EventSettingsRow = {
  event_name: string;
  event_start_date: string | null;
  event_end_date: string | null;
};

function mapEventSettings(data: unknown): EventSettings {
  const row = (Array.isArray(data) ? data[0] : data) as EventSettingsRow | null;
  return {
    name: row?.event_name ?? "",
    startDate: row?.event_start_date ?? null,
    endDate: row?.event_end_date ?? null,
  };
}

export async function loadEventSettings(): Promise<EventSettings> {
  const { data, error } = await getSupabase().rpc("ha_get_event_settings");
  if (error) throw error;
  return mapEventSettings(data);
}

export async function updateEventSettings(
  settings: EventSettings,
  context: AdminAccessContext,
): Promise<EventSettings> {
  const { data, error } = await getSupabase().rpc(
    "ha_admin_update_event_settings",
    {
      ...participantRpcParams(context),
      p_event_name: settings.name,
      p_event_start_date: settings.startDate,
      p_event_end_date: settings.endDate,
    },
  );
  if (error) throw error;
  return mapEventSettings(data);
}

function normalizeFestivalAccessCode(code: string) {
  return code.trim().toUpperCase();
}

function mapFestivalAccessCode(data: unknown): FestivalAccessCodeSettings {
  const row = (Array.isArray(data) ? data[0] : data) as FestivalAccessCodeRow;

  return {
    code: row.access_code,
    version: row.access_version,
  };
}

function mapFestivalAccessVerification(
  data: unknown,
): FestivalAccessVerification {
  const row = (
    Array.isArray(data) ? data[0] : data
  ) as FestivalAccessVerificationRow | null;

  return {
    isValid: row?.is_valid === true,
    version: row?.access_version ?? null,
  };
}

export async function loadFestivalName(): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_get_festival_name");

  if (error) {
    throw error;
  }

  return String(data ?? "");
}

export async function updateFestivalName(
  name: string,
  context: AdminAccessContext,
): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_update_festival_name", {
    ...participantRpcParams(context),
    p_name: name,
  });

  if (error) {
    throw error;
  }

  return String(data ?? "");
}

export async function loadFestivalAccessVersion(): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_get_festival_access_version");

  if (error) {
    throw error;
  }

  return String(data ?? "");
}

export async function verifyFestivalAccessCode(
  code: string,
): Promise<FestivalAccessVerification> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_verify_festival_access_code", {
    p_access_code: normalizeFestivalAccessCode(code),
  });

  if (error) {
    throw error;
  }

  return mapFestivalAccessVerification(data);
}

export async function loadFestivalAccessCode(
  context: AdminAccessContext,
): Promise<FestivalAccessCodeSettings> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "ha_get_festival_access_code",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapFestivalAccessCode(data);
}

export async function updateFestivalAccessCode(
  code: string,
  context: AdminAccessContext,
): Promise<FestivalAccessCodeSettings> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_update_festival_access_code", {
    ...participantRpcParams(context),
    p_access_code: normalizeFestivalAccessCode(code),
  });

  if (error) {
    throw error;
  }

  return mapFestivalAccessCode(data);
}

export async function archiveFestival(
  adminAccessCode: string,
): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("ha_archive_festival", {
    p_admin_access_code: adminAccessCode,
  });

  if (error) {
    throw error;
  }

  return String(data ?? "");
}
