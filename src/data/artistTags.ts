import { getSupabase } from "../lib/supabase";
import { participantRpcParams, type AdminAccessContext, type ParticipantAccessContext } from "./accessContext";

export type ArtistTag = { id: string; name: string };
export type ActArtistTag = ArtistTag & { actId: string };
type ArtistTagRow = { id: string; name: string };
type ActArtistTagRow = ArtistTagRow & { act_id: string };

export async function loadArtistTags(context: ParticipantAccessContext): Promise<ArtistTag[]> {
  const { data, error } = await getSupabase().rpc("ha_list_artist_tags", participantRpcParams(context));
  if (error) throw error;
  return (data ?? []) as ArtistTagRow[];
}

export async function loadActArtistTags(context: ParticipantAccessContext): Promise<ActArtistTag[]> {
  const { data, error } = await getSupabase().rpc("ha_list_act_artist_tags", participantRpcParams(context));
  if (error) throw error;
  return ((data ?? []) as ActArtistTagRow[]).map(({ act_id, id, name }) => ({ actId: act_id, id, name }));
}

export async function addArtistTag(actId: string, name: string, context: AdminAccessContext): Promise<ArtistTag> {
  const { data, error } = await getSupabase().rpc("ha_admin_add_artist_tag", { ...participantRpcParams(context), p_act_id: actId, p_name: name });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as ArtistTagRow;
}

export async function assignArtistTag(actId: string, tagId: string, context: AdminAccessContext): Promise<void> {
  const { error } = await getSupabase().rpc("ha_admin_assign_artist_tag", { ...participantRpcParams(context), p_act_id: actId, p_tag_id: tagId });
  if (error) throw error;
}

export async function removeArtistTag(actId: string, tagId: string, context: AdminAccessContext): Promise<void> {
  const { error } = await getSupabase().rpc("ha_admin_remove_artist_tag", { ...participantRpcParams(context), p_act_id: actId, p_tag_id: tagId });
  if (error) throw error;
}
