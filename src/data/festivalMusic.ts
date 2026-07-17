import { getSupabase } from "../lib/supabase";
import {
  participantRpcParams,
  type AdminAccessContext,
  type ParticipantAccessContext,
} from "./accessContext";
import {
  normalizeSpotifyPlaylistLink,
  spotifyPlaylistFromStoredId,
  type MusicPlaylist,
} from "./musicEmbeds";

type MusicPlaylistRow = {
  provider: "spotify";
  playlist_id: string;
  external_url: string;
  embed_url: string;
};

function mapMusicPlaylistRow(row: MusicPlaylistRow): MusicPlaylist {
  return {
    provider: row.provider,
    playlistId: row.playlist_id,
    externalUrl: row.external_url,
    embedUrl: row.embed_url,
  };
}

function mapMusicPlaylistResult(data: unknown): MusicPlaylist | null {
  const row = (Array.isArray(data) ? data[0] : data) as
    MusicPlaylistRow | null | undefined;

  if (!row) {
    return null;
  }

  const playlist = spotifyPlaylistFromStoredId(row.playlist_id);

  return playlist ?? mapMusicPlaylistRow(row);
}

export async function loadMusicPlaylist(
  context: ParticipantAccessContext,
): Promise<MusicPlaylist | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "ha_get_music_playlist",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapMusicPlaylistResult(data);
}

export async function loadAdminMusicPlaylist(
  context: AdminAccessContext,
): Promise<MusicPlaylist | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(
    "ha_admin_get_music_playlist",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }

  return mapMusicPlaylistResult(data);
}

export async function updateMusicPlaylist(
  link: string,
  context: AdminAccessContext,
): Promise<MusicPlaylist> {
  const normalizedPlaylist = normalizeSpotifyPlaylistLink(link);

  if (!normalizedPlaylist) {
    throw new Error("unsupported music playlist link");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("ha_update_music_playlist", {
    ...participantRpcParams(context),
    p_link: link.trim(),
  });

  if (error) {
    throw error;
  }

  return mapMusicPlaylistResult(data) ?? normalizedPlaylist;
}

export async function deleteMusicPlaylist(
  context: AdminAccessContext,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc(
    "ha_delete_music_playlist",
    participantRpcParams(context),
  );

  if (error) {
    throw error;
  }
}
