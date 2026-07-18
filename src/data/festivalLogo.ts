import { activeFestival } from "../config/festivals";
import { getSupabase } from "../lib/supabase";
import { participantRpcParams, type AdminAccessContext } from "./accessContext";

export const eventLogoBucket = "event-logos";
export const eventLogoMaxFileSize = 2 * 1024 * 1024;
export const eventLogoMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

type EventLogoUploadRow = {
  file_path: string;
  mime_type: string;
  expires_at: string;
};

export function isSupportedEventLogoFile(file: File) {
  return eventLogoMimeTypes.includes(
    file.type as (typeof eventLogoMimeTypes)[number],
  );
}

export function isEventLogoFileSizeAllowed(file: File) {
  return file.size > 0 && file.size <= eventLogoMaxFileSize;
}

export function eventLogoPublicUrl(filePath: string | null) {
  if (!filePath) return null;
  return getSupabase().storage.from(eventLogoBucket).getPublicUrl(filePath).data
    .publicUrl;
}

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "logo"
  );
}

export async function uploadEventLogo(
  file: File,
  context: AdminAccessContext,
): Promise<string> {
  if (!isSupportedEventLogoFile(file)) {
    throw new Error("unsupported event logo file type");
  }
  if (!isEventLogoFileSizeAllowed(file)) {
    throw new Error("event logo file is too large");
  }

  const supabase = getSupabase();
  const { data: slotData, error: slotError } = await supabase.rpc(
    "ha_create_event_logo_upload",
    {
      ...participantRpcParams(context),
      p_festival_id: activeFestival.id,
      p_file_name: sanitizeFileName(file.name),
      p_mime_type: file.type,
      p_file_size: file.size,
    },
  );
  if (slotError) throw slotError;

  const slot = (Array.isArray(slotData) ? slotData[0] : slotData) as
    EventLogoUploadRow | undefined;
  if (!slot?.file_path) throw new Error("event logo upload was not authorized");

  const { error: uploadError } = await supabase.storage
    .from(eventLogoBucket)
    .upload(slot.file_path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.rpc("ha_admin_finalize_event_logo", {
    ...participantRpcParams(context),
    p_festival_id: activeFestival.id,
    p_file_path: slot.file_path,
  });
  if (error) throw error;
  return String(data ?? slot.file_path);
}

export async function removeEventLogo(context: AdminAccessContext) {
  const { error } = await getSupabase().rpc("ha_admin_remove_event_logo", {
    ...participantRpcParams(context),
    p_festival_id: activeFestival.id,
  });
  if (error) throw error;
}
