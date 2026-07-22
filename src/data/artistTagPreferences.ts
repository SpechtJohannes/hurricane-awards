import { getSupabase } from "../lib/supabase";
import { participantRpcParams, type ParticipantAccessContext } from "./accessContext";
import type { ArtistTag } from "./artistTags";

type ArtistTagRow = { id: string; name: string };

export async function loadArtistTagPreferences(context: ParticipantAccessContext): Promise<ArtistTag[]> {
  const { data, error } = await getSupabase().rpc("ha_get_own_artist_tag_preferences", participantRpcParams(context));
  if (error) throw error;
  return (data ?? []) as ArtistTagRow[];
}

export async function replaceArtistTagPreferences(tagIds: readonly string[], context: ParticipantAccessContext): Promise<ArtistTag[]> {
  const { data, error } = await getSupabase().rpc("ha_replace_own_artist_tag_preferences", {
    ...participantRpcParams(context),
    p_artist_tag_ids: Array.from(new Set(tagIds)),
  });
  if (error) throw error;
  return (data ?? []) as ArtistTagRow[];
}
