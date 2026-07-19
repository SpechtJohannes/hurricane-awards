import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from "./accessContext";

export const festivalDocumentTypes = ["timetable", "site_map"] as const;
export type FestivalDocumentType = (typeof festivalDocumentTypes)[number];

export type FestivalDocument = {
  documentType: FestivalDocumentType;
  title: string;
  filePath: string;
  mimeType: string;
  updatedAt: string;
  displayUrl: string;
};

export type UploadFestivalDocumentInput = {
  documentType: FestivalDocumentType;
  title: string;
  file: File;
};

export type CampLocation = {
  label: string;
  mapUrl: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
};
export type CampLocationLink = string | null;

type CampLocationRow = {
  camp_location_label: string | null;
  camp_location_map_url: string | null;
  camp_location_latitude: number | null;
  camp_location_longitude: number | null;
  camp_location_timezone: string | null;
};

function mapCampLocation(data: unknown): CampLocation | null {
  if (typeof data === "string" && data.trim()) return null;
  const row = (Array.isArray(data) ? data[0] : data) as CampLocationRow | null;
  if (!row?.camp_location_label || !row.camp_location_map_url ||
      !Number.isFinite(row.camp_location_latitude) || !Number.isFinite(row.camp_location_longitude)) return null;
  return { label: row.camp_location_label, mapUrl: row.camp_location_map_url,
    latitude: row.camp_location_latitude as number, longitude: row.camp_location_longitude as number,
    timezone: row.camp_location_timezone ?? null };
}

type FestivalDocumentRow = {
  document_type: FestivalDocumentType;
  title: string;
  file_path: string;
  mime_type: string;
  updated_at: string;
};

type FestivalDocumentUploadRow = {
  document_type: FestivalDocumentType;
  title: string;
  file_path: string;
  mime_type: string;
  expires_at: string;
};

const festivalDocumentsBucket = "festival-documents";
const signedUrlLifetimeSeconds = 60 * 60;
const supportedCampLocationHosts = new Set([
  "maps.app.goo.gl",
  "maps.google.com",
  "google.com",
  "www.google.com",
  "wa.me",
  "api.whatsapp.com",
  "whatsapp.com",
  "www.whatsapp.com",
]);

function isSupportedFestivalDocumentType(
  documentType: string,
): documentType is FestivalDocumentType {
  return festivalDocumentTypes.includes(documentType as FestivalDocumentType);
}

export function isSupportedFestivalDocumentFile(file: File) {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

export function isSupportedCampLocationLink(link: string) {
  try {
    const url = new URL(link.trim());

    if (url.protocol !== "https:") {
      return false;
    }

    if (!supportedCampLocationHosts.has(url.hostname.toLowerCase())) {
      return false;
    }

    if (url.hostname === "google.com" || url.hostname === "www.google.com") {
      return url.pathname.startsWith("/maps");
    }

    return true;
  } catch {
    return false;
  }
}

function sanitizeFileName(fileName: string) {
  const safeFileName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeFileName || "document";
}

function mapUploadResult(data: unknown): FestivalDocumentUploadRow {
  const row = (
    Array.isArray(data) ? data[0] : data
  ) as FestivalDocumentUploadRow;

  if (!isSupportedFestivalDocumentType(row.document_type)) {
    throw new Error("unsupported document type");
  }

  return row;
}

async function mapDocumentRow(
  row: FestivalDocumentRow,
): Promise<FestivalDocument> {
  if (!isSupportedFestivalDocumentType(row.document_type)) {
    throw new Error("unsupported document type");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(festivalDocumentsBucket)
    .createSignedUrl(row.file_path, signedUrlLifetimeSeconds);

  if (error) {
    throw error;
  }

  return {
    documentType: row.document_type,
    title: row.title,
    filePath: row.file_path,
    mimeType: row.mime_type,
    updatedAt: row.updated_at,
    displayUrl: data.signedUrl,
  };
}

async function mapDocumentRows(data: unknown): Promise<FestivalDocument[]> {
  const rows = (data ?? []) as FestivalDocumentRow[];

  return Promise.all(rows.map((row) => mapDocumentRow(row)));
}

async function mapDocumentResult(data: unknown): Promise<FestivalDocument> {
  const row = (Array.isArray(data) ? data[0] : data) as FestivalDocumentRow;

  return mapDocumentRow(row);
}

export async function loadFestivalDocuments(
  context: ParticipantAccessContext,
): Promise<FestivalDocument[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "ha_list_festival_documents",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapDocumentRows(data);
}

export async function loadAdminFestivalDocuments(
  context: AdminAccessContext,
): Promise<FestivalDocument[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "ha_admin_list_festival_documents",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapDocumentRows(data);
}

export async function uploadFestivalDocument(
  input: UploadFestivalDocumentInput,
  context: AdminAccessContext,
): Promise<FestivalDocument> {
  if (!isSupportedFestivalDocumentFile(input.file)) {
    throw new Error("unsupported document file type");
  }

  const supabase = getSupabase();
  const { data: uploadSlotData, error: uploadSlotError } = await supabase.rpc(
    "ha_create_festival_document_upload",
    {
      ...participantRpcParams(context),
      p_document_type: input.documentType,
      p_title: input.title,
      p_file_name: sanitizeFileName(input.file.name),
      p_mime_type: input.file.type,
    },
  );

  if (uploadSlotError) {
    throw uploadSlotError;
  }

  const uploadSlot = mapUploadResult(uploadSlotData);
  const { error: uploadError } = await supabase.storage
    .from(festivalDocumentsBucket)
    .upload(uploadSlot.file_path, input.file, {
      contentType: input.file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase.rpc("ha_upsert_festival_document", {
    ...participantRpcParams(context),
    p_document_type: input.documentType,
    p_title: input.title,
    p_file_path: uploadSlot.file_path,
    p_mime_type: input.file.type,
  });

  if (error) {
    throw error;
  }

  return mapDocumentResult(data);
}

export async function deleteFestivalDocument(
  documentType: FestivalDocumentType,
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("ha_delete_festival_document", {
    ...participantRpcParams(context),
    p_document_type: documentType,
  });

  if (error) {
    throw error;
  }
}

export async function loadCampLocation(
  context: ParticipantAccessContext,
): Promise<CampLocation | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "ha_get_camp_location_link",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapCampLocation(data);
}

export async function loadAdminCampLocation(
  context: AdminAccessContext,
): Promise<CampLocation | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "ha_admin_get_camp_location_link",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapCampLocation(data);
}

export async function loadCampLocationLink(context: ParticipantAccessContext): Promise<CampLocationLink> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("ha_get_camp_location_link", participantRpcParams(context));
  if (error) throw error;
  if (typeof data === "string") return data.trim() || null;
  return mapCampLocation(data)?.mapUrl ?? null;
}

export async function loadAdminCampLocationLink(context: AdminAccessContext): Promise<CampLocationLink> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("ha_admin_get_camp_location_link", participantRpcParams(context));
  if (error) throw error;
  if (typeof data === "string") return data.trim() || null;
  return mapCampLocation(data)?.mapUrl ?? null;
}

export async function updateCampLocationLink(
  link: string,
  locationOrContext: Omit<CampLocation, "mapUrl"> | AdminAccessContext,
  possibleContext?: AdminAccessContext,
): Promise<string> {
  const normalizedLink = link.trim();

  if (!isSupportedCampLocationLink(normalizedLink)) {
    throw new Error("unsupported camp location link");
  }

  const context = possibleContext ?? (locationOrContext as AdminAccessContext);
  const location = possibleContext ? locationOrContext as Omit<CampLocation, "mapUrl"> : null;
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("ha_update_camp_location_link", {
    ...participantRpcParams(context),
    p_link: normalizedLink,
    ...(location ? { p_label: location.label, p_latitude: location.latitude,
      p_longitude: location.longitude, p_timezone: location.timezone } : {}),
  });

  if (error) {
    throw error;
  }

  if (typeof data === "string") return data;
  const saved = mapCampLocation(data);
  if (!saved) throw new Error("invalid saved camp location");
  return saved.mapUrl;
}

export async function geocodeCampLocation(query: string, context: AdminAccessContext) {
  const { data, error } = await getSupabase().functions.invoke("geocode_camp_location", {
    body: { participantAccessCode: context.participantAccessCode, query: query.trim() },
  });
  if (error || data?.status !== "available" || !data.result) throw new Error("geocoding failed");
  return data.result as Omit<CampLocation, "mapUrl">;
}

export async function deleteCampLocationLink(
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc(
    "ha_delete_camp_location_link",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }
}
