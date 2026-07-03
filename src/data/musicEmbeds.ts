export type MusicProvider = 'spotify'

export type MusicPlaylist = {
  provider: MusicProvider
  playlistId: string
  externalUrl: string
  embedUrl: string
}

const spotifyPlaylistIdPattern = /^[A-Za-z0-9]{22}$/

function spotifyPlaylistFromId(playlistId: string): MusicPlaylist | null {
  if (!spotifyPlaylistIdPattern.test(playlistId)) {
    return null
  }

  return {
    provider: 'spotify',
    playlistId,
    externalUrl: `https://open.spotify.com/playlist/${playlistId}`,
    embedUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
  }
}

function spotifyPlaylistIdFromUrl(link: string): string | null {
  try {
    const url = new URL(link)

    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com') {
      return null
    }

    const segments = url.pathname.split('/').filter(Boolean)
    const playlistIndex = segments.indexOf('playlist')

    if (playlistIndex === -1) {
      return null
    }

    return segments[playlistIndex + 1] ?? null
  } catch {
    return null
  }
}

function spotifyPlaylistIdFromUri(link: string): string | null {
  const match = link.match(/^spotify:playlist:([A-Za-z0-9]{22})$/)

  return match?.[1] ?? null
}

export function normalizeSpotifyPlaylistLink(link: string): MusicPlaylist | null {
  const trimmedLink = link.trim()
  const playlistId =
    spotifyPlaylistIdFromUri(trimmedLink) ?? spotifyPlaylistIdFromUrl(trimmedLink)

  return playlistId ? spotifyPlaylistFromId(playlistId) : null
}

export function isSupportedMusicPlaylistLink(link: string) {
  return normalizeSpotifyPlaylistLink(link) !== null
}

export function spotifyPlaylistFromStoredId(
  playlistId: string,
): MusicPlaylist | null {
  return spotifyPlaylistFromId(playlistId.trim())
}
