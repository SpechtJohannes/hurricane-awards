import { beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync } from "node:fs";

const rpcMock = vi.hoisted(() => vi.fn());
const storageFromMock = vi.hoisted(() => vi.fn());
const uploadMock = vi.hoisted(() => vi.fn());
const createSignedUrlMock = vi.hoisted(() => vi.fn());
const getPublicUrlMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/supabase", () => ({
  supabase: {
    rpc: rpcMock,
    storage: {
      from: storageFromMock,
    },
  },
  getSupabase: () => ({
    rpc: rpcMock,
    storage: {
      from: storageFromMock,
    },
  }),
}));

import { loadAllTimeStandings } from "../data/allTimeStandings";
import {
  archiveFestival,
  loadFestivalAccessCode,
  loadFestivalAccessVersion,
  loadFestivalName,
  loadEventSettings,
  updateFestivalAccessCode,
  updateFestivalName,
  updateEventSettings,
  verifyFestivalAccessCode,
} from "../data/festival";
import {
  eventLogoMaxFileSize,
  eventLogoPublicUrl,
  isEventLogoFileSizeAllowed,
  isSupportedEventLogoFile,
  removeEventLogo,
  uploadEventLogo,
} from "../data/festivalLogo";
import {
  createFestivalExportData,
  festivalExportFileName,
  loadFestivalExportData,
  serializeFestivalExport,
} from "../data/export";
import {
  createCategory,
  deleteCategory,
  loadAdminCategories,
  loadCategories,
  updateCategory,
  updateCategoryStatus,
} from "../data/categories";
import {
  createParticipant,
  deactivateParticipant,
  loginParticipant,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  updateParticipant,
  updateParticipantAvatar,
  updateOwnProfile,
} from "../data/participants";
import { avatarById, avatars, defaultAvatarId } from "../data/avatars";
import {
  deleteVotesForCategory,
  loadVotes,
  loadVotesForParticipant,
  saveVote,
} from "../data/votes";
import {
  deleteCampLocationLink,
  deleteFestivalDocument,
  isSupportedCampLocationLink,
  loadAdminCampLocationLink,
  loadAdminFestivalDocuments,
  loadCampLocationLink,
  loadFestivalDocuments,
  updateCampLocationLink,
  uploadFestivalDocument,
} from "../data/festivalDocuments";
import {
  deleteMusicPlaylist,
  loadAdminMusicPlaylist,
  loadMusicPlaylist,
  updateMusicPlaylist,
} from "../data/festivalMusic";
import {
  closeBingoRound,
  loadAdminBingoRound,
  loadOrCreateBingoCard,
  setBingoMark,
  startBingoRound,
} from "../data/bingo";
import {
  loadAdminHorseRacingBets,
  loadAdminHorseRacingState,
  loadHorseRacingState,
  saveHorseRacingBet,
  updateAdminHorseRacingState,
} from "../data/horseRacing";
import {
  createRandomPairingAction,
  drawRandomPairingAction,
  loadAdminRandomPairingActions,
  loadRandomPairingAssignments,
  resetRandomPairingAction,
  updateRandomPairingParticipants,
} from "../data/randomPairings";
import {
  createTournament,
  deleteTournament,
  drawTournamentParticipants,
  generateTournamentBracket,
  loadAdminTournaments,
  loadTournaments,
  recalculateTournamentBracket,
  setTournamentMatchWinner,
  updateTournament,
} from "../data/tournaments";
import {
  addTimetableFavorite,
  createFestivalDay,
  createTimetableAct,
  createTimetablePerformance,
  createTimetableStage,
  deleteFestivalDay,
  deleteTimetableAct,
  deleteTimetablePerformance,
  deleteTimetableStage,
  loadAdminFestivalDays,
  loadAdminTimetableActs,
  loadAdminTimetablePerformances,
  loadAdminTimetableStages,
  loadTimetable,
  removeTimetableFavorite,
  updateFestivalDay,
  updateTimetableAct,
  updateTimetablePerformance,
  updateTimetableStage,
} from "../data/timetable";
import {
  isSupportedMusicPlaylistLink,
  normalizeSpotifyPlaylistLink,
} from "../data/musicEmbeds";

const participantContext = {
  participantAccessCode: "ALICE42",
};

const expectedParticipantRpcContext = {
  p_participant_access_code: "ALICE42",
};

const participantRow = {
  id: "alice",
  name: "alice",
  display_name: "Alice",
  access_code: "ALICE42",
  is_admin: false,
  is_active: true,
};

const mappedParticipant = {
  id: "alice",
  name: "alice",
  displayName: "Alice",
  accessCode: "ALICE42",
  isAdmin: false,
  isActive: true,
};

beforeEach(() => {
  rpcMock.mockReset();
  uploadMock.mockReset();
  createSignedUrlMock.mockReset();
  getPublicUrlMock.mockReset();
  storageFromMock.mockReset();
  storageFromMock.mockReturnValue({
    upload: uploadMock,
    createSignedUrl: createSignedUrlMock,
    getPublicUrl: getPublicUrlMock,
  });
  uploadMock.mockResolvedValue({
    data: { path: "current/timetable/file.pdf" },
    error: null,
  });
  createSignedUrlMock.mockResolvedValue({
    data: { signedUrl: "https://example.test/document.pdf" },
    error: null,
  });
  getPublicUrlMock.mockReturnValue({
    data: { publicUrl: "https://example.test/event-logo.png" },
  });
});

describe("Supabase Datenzugriffe", () => {
  it("laedt bestehende Event Einstellungen ohne Logo kompatibel", async () => {
    rpcMock.mockResolvedValue({
      data: [
        { event_name: "Awards", event_start_date: null, event_end_date: null },
      ],
      error: null,
    });

    await expect(loadEventSettings()).resolves.toEqual({
      name: "Awards",
      startDate: null,
      endDate: null,
      logoPath: null,
      logoUrl: null,
    });
  });

  it("validiert und verwaltet Eventlogos ueber Storage und Admin RPCs", async () => {
    const validFile = new File(["logo"], "Mein Logo.png", {
      type: "image/png",
    });
    const invalidFile = new File(["text"], "logo.txt", { type: "text/plain" });
    const largeFile = new File(
      [new Uint8Array(eventLogoMaxFileSize + 1)],
      "logo.webp",
      {
        type: "image/webp",
      },
    );

    expect(isSupportedEventLogoFile(validFile)).toBe(true);
    expect(isSupportedEventLogoFile(invalidFile)).toBe(false);
    expect(isEventLogoFileSizeAllowed(validFile)).toBe(true);
    expect(isEventLogoFileSizeAllowed(largeFile)).toBe(false);
    expect(eventLogoPublicUrl("festival/logo.png")).toBe(
      "https://example.test/event-logo.png",
    );

    rpcMock
      .mockResolvedValueOnce({
        data: [
          {
            file_path: "hurricane-awards-2026/generated-logo.png",
            mime_type: "image/png",
            expires_at: "2026-07-18T12:10:00.000Z",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: "hurricane-awards-2026/generated-logo.png",
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(uploadEventLogo(validFile, participantContext)).resolves.toBe(
      "hurricane-awards-2026/generated-logo.png",
    );
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_create_event_logo_upload", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
      p_file_name: "mein-logo.png",
      p_mime_type: "image/png",
      p_file_size: validFile.size,
    });
    expect(uploadMock).toHaveBeenCalledWith(
      "hurricane-awards-2026/generated-logo.png",
      validFile,
      { contentType: "image/png", upsert: false },
    );
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_admin_finalize_event_logo", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
      p_file_path: "hurricane-awards-2026/generated-logo.png",
    });

    await removeEventLogo(participantContext);
    expect(rpcMock).toHaveBeenNthCalledWith(3, "ha_admin_remove_event_logo", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
    });
  });
  it("laedt den Festivalnamen ueber eine RPC Funktion", async () => {
    rpcMock.mockResolvedValue({
      data: "Hurricane Awards 2026",
      error: null,
    });

    await expect(loadFestivalName()).resolves.toBe("Hurricane Awards 2026");
    expect(rpcMock).toHaveBeenCalledWith("ha_get_festival_name");
  });

  it("speichert den Festivalnamen ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: "Hurricane Crew Awards",
      error: null,
    });

    await expect(
      updateFestivalName("Hurricane Crew Awards", participantContext),
    ).resolves.toBe("Hurricane Crew Awards");
    expect(rpcMock).toHaveBeenCalledWith("ha_update_festival_name", {
      ...expectedParticipantRpcContext,
      p_name: "Hurricane Crew Awards",
    });
  });

  it("laedt und speichert die zentralen Eventeinstellungen", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          event_name: "Festival",
          event_start_date: "2026-06-19",
          event_end_date: "2026-06-21",
        },
      ],
      error: null,
    });
    await expect(loadEventSettings()).resolves.toEqual({
      name: "Festival",
      startDate: "2026-06-19",
      endDate: "2026-06-21",
      logoPath: null,
      logoUrl: null,
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_get_event_settings");

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          event_name: "Festival",
          event_start_date: null,
          event_end_date: null,
        },
      ],
      error: null,
    });
    await expect(
      updateEventSettings(
        { name: "Festival", startDate: null, endDate: null },
        participantContext,
      ),
    ).resolves.toEqual({
      name: "Festival",
      startDate: null,
      endDate: null,
      logoPath: null,
      logoUrl: null,
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_admin_update_event_settings", {
      ...expectedParticipantRpcContext,
      p_event_name: "Festival",
      p_event_start_date: null,
      p_event_end_date: null,
    });
  });

  it("prueft den Festivalcode ohne ihn auszulesen", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          is_valid: true,
          access_version: "2026-07-01 10:00:00+00",
        },
      ],
      error: null,
    });

    await expect(verifyFestivalAccessCode(" hurricane2026 ")).resolves.toEqual({
      isValid: true,
      version: "2026-07-01 10:00:00+00",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_verify_festival_access_code", {
      p_access_code: "HURRICANE2026",
    });
  });

  it("laedt die Festivalcode-Version ohne Codewert", async () => {
    rpcMock.mockResolvedValue({
      data: "2026-07-01 10:00:00+00",
      error: null,
    });

    await expect(loadFestivalAccessVersion()).resolves.toBe(
      "2026-07-01 10:00:00+00",
    );
    expect(rpcMock).toHaveBeenCalledWith("ha_get_festival_access_version");
  });

  it("laedt und speichert den Festivalcode ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          access_code: "HURRICANE2026",
          access_version: "2026-07-01 10:00:00+00",
        },
      ],
      error: null,
    });

    await expect(loadFestivalAccessCode(participantContext)).resolves.toEqual({
      code: "HURRICANE2026",
      version: "2026-07-01 10:00:00+00",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_get_festival_access_code",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          access_code: "NEUERCODE",
          access_version: "2026-07-01 10:05:00+00",
        },
      ],
      error: null,
    });

    await expect(
      updateFestivalAccessCode(" neuercode ", participantContext),
    ).resolves.toEqual({
      code: "NEUERCODE",
      version: "2026-07-01 10:05:00+00",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_update_festival_access_code",
      {
        ...expectedParticipantRpcContext,
        p_access_code: "NEUERCODE",
      },
    );
  });

  it("archiviert das Festival ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: "8e560706-5e2f-4b50-9e41-381625fd8102",
      error: null,
    });

    await expect(archiveFestival("ALICE42")).resolves.toBe(
      "8e560706-5e2f-4b50-9e41-381625fd8102",
    );
    expect(rpcMock).toHaveBeenCalledWith("ha_archive_festival", {
      p_admin_access_code: "ALICE42",
    });
  });

  it("laedt Festivaldokumente mit signierter Anzeige URL", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          document_type: "timetable",
          title: "Timetable",
          file_path: "current/timetable/file.pdf",
          mime_type: "application/pdf",
          updated_at: "2026-07-03T10:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(loadFestivalDocuments(participantContext)).resolves.toEqual([
      {
        documentType: "timetable",
        title: "Timetable",
        filePath: "current/timetable/file.pdf",
        mimeType: "application/pdf",
        updatedAt: "2026-07-03T10:00:00.000Z",
        displayUrl: "https://example.test/document.pdf",
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_list_festival_documents",
      expectedParticipantRpcContext,
    );
    expect(storageFromMock).toHaveBeenCalledWith("festival-documents");
    expect(createSignedUrlMock).toHaveBeenCalledWith(
      "current/timetable/file.pdf",
      3600,
    );
  });

  it("laedt Festivaldokumente fuer die Adminverwaltung", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          document_type: "site_map",
          title: "Geländeplan",
          file_path: "current/site_map/map.png",
          mime_type: "image/png",
          updated_at: "2026-07-03T10:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      loadAdminFestivalDocuments(participantContext),
    ).resolves.toMatchObject([
      {
        documentType: "site_map",
        title: "Geländeplan",
        filePath: "current/site_map/map.png",
        mimeType: "image/png",
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_admin_list_festival_documents",
      expectedParticipantRpcContext,
    );
  });

  it("laedt Festivaldokumente in Storage hoch und speichert Metadaten", async () => {
    const file = new File(["pdf"], "Plan 2026.pdf", {
      type: "application/pdf",
    });
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          document_type: "timetable",
          title: "Timetable",
          file_path: "current/timetable/generated-plan-2026.pdf",
          mime_type: "application/pdf",
          expires_at: "2026-07-03T10:10:00.000Z",
        },
      ],
      error: null,
    });
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          document_type: "timetable",
          title: "Timetable",
          file_path: "current/timetable/generated-plan-2026.pdf",
          mime_type: "application/pdf",
          updated_at: "2026-07-03T10:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      uploadFestivalDocument(
        {
          documentType: "timetable",
          title: "Timetable",
          file,
        },
        participantContext,
      ),
    ).resolves.toMatchObject({
      documentType: "timetable",
      title: "Timetable",
      mimeType: "application/pdf",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_create_festival_document_upload",
      {
        ...expectedParticipantRpcContext,
        p_document_type: "timetable",
        p_title: "Timetable",
        p_file_name: "plan-2026.pdf",
        p_mime_type: "application/pdf",
      },
    );
    expect(uploadMock).toHaveBeenCalledWith(
      "current/timetable/generated-plan-2026.pdf",
      file,
      {
        contentType: "application/pdf",
        upsert: false,
      },
    );
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_upsert_festival_document",
      expect.objectContaining({
        ...expectedParticipantRpcContext,
        p_document_type: "timetable",
        p_title: "Timetable",
        p_file_path: "current/timetable/generated-plan-2026.pdf",
        p_mime_type: "application/pdf",
      }),
    );
  });

  it("loescht Festivaldokumente ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deleteFestivalDocument("site_map", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith("ha_delete_festival_document", {
      ...expectedParticipantRpcContext,
      p_document_type: "site_map",
    });
  });

  it("validiert unterstuetzte Campstandort Links clientseitig", () => {
    expect(isSupportedCampLocationLink("https://maps.app.goo.gl/camp")).toBe(
      true,
    );
    expect(
      isSupportedCampLocationLink("https://www.google.com/maps/place/camp"),
    ).toBe(true);
    expect(isSupportedCampLocationLink("https://wa.me/491701234567")).toBe(
      true,
    );
    expect(isSupportedCampLocationLink("https://example.com/camp")).toBe(false);
    expect(isSupportedCampLocationLink("http://maps.app.goo.gl/camp")).toBe(
      false,
    );
  });

  it("laedt den Campstandort fuer Teilnehmende und Admins", async () => {
    rpcMock.mockResolvedValueOnce({
      data: "https://maps.app.goo.gl/camp",
      error: null,
    });

    await expect(loadCampLocationLink(participantContext)).resolves.toBe(
      "https://maps.app.goo.gl/camp",
    );
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_get_camp_location_link",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      loadAdminCampLocationLink(participantContext),
    ).resolves.toBeNull();
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_admin_get_camp_location_link",
      expectedParticipantRpcContext,
    );
  });

  it("speichert und loescht den Campstandort ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: "https://wa.me/491701234567",
      error: null,
    });

    await expect(
      updateCampLocationLink(
        " https://wa.me/491701234567 ",
        participantContext,
      ),
    ).resolves.toBe("https://wa.me/491701234567");
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_update_camp_location_link", {
      ...expectedParticipantRpcContext,
      p_link: "https://wa.me/491701234567",
    });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteCampLocationLink(participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_delete_camp_location_link",
      expectedParticipantRpcContext,
    );
  });

  it("sendet ungueltige Campstandort Links nicht an Supabase", async () => {
    await expect(
      updateCampLocationLink("https://example.com/camp", participantContext),
    ).rejects.toThrow("unsupported camp location link");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("validiert und normalisiert Spotify Playlist Links clientseitig", () => {
    const playlistId = "37i9dQZF1DXcBWIGoYBM5M";

    expect(
      normalizeSpotifyPlaylistLink(
        `https://open.spotify.com/playlist/${playlistId}?si=test`,
      ),
    ).toEqual({
      provider: "spotify",
      playlistId,
      externalUrl: `https://open.spotify.com/playlist/${playlistId}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
    });
    expect(isSupportedMusicPlaylistLink(`spotify:playlist:${playlistId}`)).toBe(
      true,
    );
    expect(
      isSupportedMusicPlaylistLink("https://open.spotify.com/album/abc"),
    ).toBe(false);
    expect(
      isSupportedMusicPlaylistLink("https://example.com/playlist/37i9d"),
    ).toBe(false);
  });

  it("laedt die Festival Playlist fuer Teilnehmende und Admins", async () => {
    const playlistRow = {
      provider: "spotify",
      playlist_id: "37i9dQZF1DXcBWIGoYBM5M",
      external_url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      embed_url:
        "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
    };

    rpcMock.mockResolvedValueOnce({
      data: [playlistRow],
      error: null,
    });

    await expect(loadMusicPlaylist(participantContext)).resolves.toEqual({
      provider: "spotify",
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      externalUrl: playlistRow.external_url,
      embedUrl: playlistRow.embed_url,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_get_music_playlist",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await expect(
      loadAdminMusicPlaylist(participantContext),
    ).resolves.toBeNull();
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_admin_get_music_playlist",
      expectedParticipantRpcContext,
    );
  });

  it("speichert und loescht die Festival Playlist ueber Admin RPCs", async () => {
    const playlistId = "37i9dQZF1DXcBWIGoYBM5M";
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          provider: "spotify",
          playlist_id: playlistId,
          external_url: `https://open.spotify.com/playlist/${playlistId}`,
          embed_url: `https://open.spotify.com/embed/playlist/${playlistId}`,
        },
      ],
      error: null,
    });

    await expect(
      updateMusicPlaylist(
        ` https://open.spotify.com/playlist/${playlistId}?si=abc `,
        participantContext,
      ),
    ).resolves.toMatchObject({
      provider: "spotify",
      playlistId,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_update_music_playlist", {
      ...expectedParticipantRpcContext,
      p_link: `https://open.spotify.com/playlist/${playlistId}?si=abc`,
    });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteMusicPlaylist(participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_delete_music_playlist",
      expectedParticipantRpcContext,
    );
  });

  it("sendet ungueltige Spotify Playlist Links nicht an Supabase", async () => {
    await expect(
      updateMusicPlaylist(
        "https://open.spotify.com/album/abc",
        participantContext,
      ),
    ).rejects.toThrow("unsupported music playlist link");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("laedt oder erstellt eine Bingokarte fuer eine aktive Runde", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "round-1",
          started_at: "2026-07-04T12:00:00.000Z",
          card_id: "card-1",
          numbers: Array.from({ length: 25 }, (_, index) => index + 1),
          marked_numbers: [1, 7, 25],
        },
      ],
      error: null,
    });

    await expect(loadOrCreateBingoCard(participantContext)).resolves.toEqual({
      id: "round-1",
      startedAt: "2026-07-04T12:00:00.000Z",
      cardId: "card-1",
      numbers: Array.from({ length: 25 }, (_, index) => index + 1),
      markedNumbers: [1, 7, 25],
    });
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_get_or_create_bingo_card",
      expectedParticipantRpcContext,
    );
  });

  it("gibt null zurueck, wenn keine aktive Bingorunde existiert", async () => {
    rpcMock.mockResolvedValue({
      data: [],
      error: null,
    });

    await expect(loadOrCreateBingoCard(participantContext)).resolves.toBeNull();
  });

  it("speichert und entfernt Bingo Markierungen ueber RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [3, 17],
      error: null,
    });

    await expect(setBingoMark(17, true, participantContext)).resolves.toEqual([
      3, 17,
    ]);
    expect(rpcMock).toHaveBeenCalledWith("ha_set_bingo_mark", {
      ...expectedParticipantRpcContext,
      p_number: 17,
      p_is_marked: true,
    });
  });

  it("verwaltet Bingorunden ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "round-1",
          started_at: "2026-07-04T12:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(loadAdminBingoRound(participantContext)).resolves.toEqual({
      id: "round-1",
      startedAt: "2026-07-04T12:00:00.000Z",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_get_bingo_round",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "round-2",
          started_at: "2026-07-04T12:10:00.000Z",
        },
      ],
      error: null,
    });

    await expect(startBingoRound(participantContext)).resolves.toEqual({
      id: "round-2",
      startedAt: "2026-07-04T12:10:00.000Z",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_start_bingo_round",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(closeBingoRound(participantContext)).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      "ha_close_bingo_round",
      expectedParticipantRpcContext,
    );
  });

  it("laedt den Pferderennen Status fuer Teilnehmende", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          festival_id: "hurricane-awards-2026",
          is_enabled: true,
          betting_status: "open",
          suit: "hearts",
          updated_at: "2026-07-08T10:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      loadHorseRacingState("hurricane-awards-2026", participantContext),
    ).resolves.toEqual({
      festivalId: "hurricane-awards-2026",
      isEnabled: true,
      bettingStatus: "open",
      selectedSuit: "hearts",
      updatedAt: "2026-07-08T10:00:00.000Z",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_get_horse_racing_state", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
    });
  });

  it("speichert Pferderennen Wetten ueber Teilnehmer RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          festival_id: "hurricane-awards-2026",
          is_enabled: true,
          betting_status: "open",
          suit: "clubs",
          updated_at: "2026-07-08T10:03:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      saveHorseRacingBet("hurricane-awards-2026", "clubs", participantContext),
    ).resolves.toMatchObject({
      festivalId: "hurricane-awards-2026",
      selectedSuit: "clubs",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_place_horse_racing_bet", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
      p_suit: "clubs",
    });
  });

  it("verwaltet Pferderennen Status und Wettliste ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          festival_id: "hurricane-awards-2026",
          is_enabled: false,
          betting_status: "closed",
          bet_count: 0,
          updated_at: null,
        },
      ],
      error: null,
    });

    await expect(
      loadAdminHorseRacingState("hurricane-awards-2026", participantContext),
    ).resolves.toEqual({
      festivalId: "hurricane-awards-2026",
      isEnabled: false,
      bettingStatus: "closed",
      betCount: 0,
      updatedAt: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_get_horse_racing_state",
      {
        ...expectedParticipantRpcContext,
        p_festival_id: "hurricane-awards-2026",
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          festival_id: "hurricane-awards-2026",
          is_enabled: true,
          betting_status: "open",
          bet_count: "2",
          updated_at: "2026-07-08T10:05:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      updateAdminHorseRacingState(
        "hurricane-awards-2026",
        { isEnabled: true, bettingStatus: "open" },
        participantContext,
      ),
    ).resolves.toMatchObject({
      isEnabled: true,
      bettingStatus: "open",
      betCount: 2,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_admin_set_horse_racing_state",
      {
        ...expectedParticipantRpcContext,
        p_festival_id: "hurricane-awards-2026",
        p_is_enabled: true,
        p_betting_status: "open",
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          participant_id: "alice",
          participant_name: "Alice",
          suit: "diamonds",
          placed_at: "2026-07-08T10:01:00.000Z",
          updated_at: "2026-07-08T10:02:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      loadAdminHorseRacingBets("hurricane-awards-2026", participantContext),
    ).resolves.toEqual([
      {
        participantId: "alice",
        participantName: "Alice",
        suit: "diamonds",
        placedAt: "2026-07-08T10:01:00.000Z",
        updatedAt: "2026-07-08T10:02:00.000Z",
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      "ha_admin_list_horse_racing_bets",
      {
        ...expectedParticipantRpcContext,
        p_festival_id: "hurricane-awards-2026",
      },
    );
  });

  it("laedt eigene zufaellige Paarungen fuer Teilnehmende", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          action_id: "action-1",
          action_name: "Getraenk holen",
          assigned_participant_id: "bob",
          assigned_participant_name: "Bob",
          drawn_at: "2026-07-08T12:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      loadRandomPairingAssignments("hurricane-awards-2026", participantContext),
    ).resolves.toEqual([
      {
        actionId: "action-1",
        actionName: "Getraenk holen",
        assignedParticipantId: "bob",
        assignedParticipantName: "Bob",
        drawnAt: "2026-07-08T12:00:00.000Z",
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith("ha_list_random_pairing_assignments", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
    });
  });

  it("verwaltet zufaellige Paarungen ueber Admin RPCs", async () => {
    const actionRow = {
      id: "action-1",
      festival_id: "hurricane-awards-2026",
      name: "Getraenk holen",
      status: "draft",
      selected_participant_ids: ["alice", "bob"],
      assignments: [],
      created_at: "2026-07-08T11:00:00.000Z",
      drawn_at: null,
    };

    rpcMock.mockResolvedValueOnce({
      data: [actionRow],
      error: null,
    });

    await expect(
      loadAdminRandomPairingActions(
        "hurricane-awards-2026",
        participantContext,
      ),
    ).resolves.toEqual([
      {
        id: "action-1",
        festivalId: "hurricane-awards-2026",
        name: "Getraenk holen",
        status: "draft",
        selectedParticipantIds: ["alice", "bob"],
        assignments: [],
        createdAt: "2026-07-08T11:00:00.000Z",
        drawnAt: null,
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_list_random_pairing_actions",
      {
        ...expectedParticipantRpcContext,
        p_festival_id: "hurricane-awards-2026",
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [{ ...actionRow, selected_participant_ids: [] }],
      error: null,
    });

    await expect(
      createRandomPairingAction(
        "hurricane-awards-2026",
        " Getraenk holen ",
        participantContext,
      ),
    ).resolves.toMatchObject({
      id: "action-1",
      name: "Getraenk holen",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_admin_create_random_pairing_action",
      {
        ...expectedParticipantRpcContext,
        p_festival_id: "hurricane-awards-2026",
        p_name: "Getraenk holen",
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [actionRow],
      error: null,
    });

    await expect(
      updateRandomPairingParticipants(
        "action-1",
        ["alice", "bob"],
        participantContext,
      ),
    ).resolves.toMatchObject({
      selectedParticipantIds: ["alice", "bob"],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      "ha_admin_set_random_pairing_participants",
      {
        ...expectedParticipantRpcContext,
        p_action_id: "action-1",
        p_participant_ids: ["alice", "bob"],
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          ...actionRow,
          status: "drawn",
          drawn_at: "2026-07-08T12:00:00.000Z",
          assignments: [
            {
              participant_id: "alice",
              participant_name: "Alice",
              assigned_participant_id: "bob",
              assigned_participant_name: "Bob",
            },
          ],
        },
      ],
      error: null,
    });

    await expect(
      drawRandomPairingAction("action-1", false, participantContext),
    ).resolves.toMatchObject({
      status: "drawn",
      assignments: [
        {
          participantId: "alice",
          participantName: "Alice",
          assignedParticipantId: "bob",
          assignedParticipantName: "Bob",
        },
      ],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      4,
      "ha_admin_draw_random_pairing_action",
      {
        ...expectedParticipantRpcContext,
        p_action_id: "action-1",
        p_replace_existing: false,
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [actionRow],
      error: null,
    });

    await expect(
      resetRandomPairingAction(
        "hurricane-awards-2026",
        "action-1",
        participantContext,
      ),
    ).resolves.toMatchObject({
      id: "action-1",
      status: "draft",
      selectedParticipantIds: ["alice", "bob"],
      assignments: [],
      drawnAt: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      5,
      "ha_admin_reset_random_pairing_action",
      {
        ...expectedParticipantRpcContext,
        p_festival_id: "hurricane-awards-2026",
        p_action_id: "action-1",
      },
    );
  });

  it.each([
    {
      participantCount: 7,
      fieldSize: 8,
      firstRoundMatches: 3,
      byeCount: 1,
      totalMatches: 6,
    },
    {
      participantCount: 10,
      fieldSize: 16,
      firstRoundMatches: 2,
      byeCount: 6,
      totalMatches: 9,
    },
  ])(
    "erzeugt KO Freilose fuer $participantCount Teilnehmende",
    ({
      participantCount,
      fieldSize,
      firstRoundMatches,
      byeCount,
      totalMatches,
    }) => {
      const bracket = generateTournamentBracket(
        Array.from({ length: participantCount }, (_, index) => ({
          participantId: `participant-${index + 1}`,
          participantName: `Person ${index + 1}`,
        })),
      );
      const firstRound = bracket.rounds[0];
      const matchCount = bracket.rounds.reduce(
        (count, round) => count + round.matches.length,
        0,
      );

      expect(bracket.mainParticipantCount).toBe(fieldSize);
      expect(firstRound.type).toBe("main");
      expect(firstRound.matches).toHaveLength(firstRoundMatches);
      expect(firstRound.byes).toHaveLength(byeCount);
      expect(matchCount).toBe(totalMatches);
      expect(
        firstRound.matches.every(
          (match) =>
            match.participantA.participant !== null &&
            match.participantB.participant !== null,
        ),
      ).toBe(true);
    },
  );

  it("erzeugt fuer acht Teilnehmende im KO Modus direkt einen KO Baum", () => {
    const bracket = generateTournamentBracket(
      Array.from({ length: 8 }, (_, index) => ({
        participantId: `participant-${index + 1}`,
        participantName: `Person ${index + 1}`,
      })),
    );

    expect(bracket.mainParticipantCount).toBe(8);
    expect(bracket.rounds).toHaveLength(3);
    expect(bracket.rounds[0].type).toBe("main");
    expect(bracket.rounds[0].matches).toHaveLength(4);
    expect(bracket.rounds[0].byes).toHaveLength(0);
  });

  it("lost Teilnehmende zufaellig statt alphabetisch aus", () => {
    const drawnParticipants = drawTournamentParticipants(
      [
        { participantId: "alice", participantName: "Alice" },
        { participantId: "bob", participantName: "Bob" },
        { participantId: "carla", participantName: "Carla" },
        { participantId: "dina", participantName: "Dina" },
      ],
      () => 0,
    );

    expect(
      drawnParticipants.map((participant) => participant.participantId),
    ).toEqual(["bob", "carla", "dina", "alice"]);
  });

  it("erzeugt Freilose aus der gespeicherten Auslosung stabil", () => {
    const drawnParticipants = drawTournamentParticipants(
      Array.from({ length: 7 }, (_, index) => ({
        participantId: `participant-${index + 1}`,
        participantName: `Person ${index + 1}`,
      })),
      () => 0,
    );
    const bracket = generateTournamentBracket(drawnParticipants);

    expect(
      drawnParticipants.map((participant) => participant.participantId),
    ).toEqual([
      "participant-2",
      "participant-3",
      "participant-4",
      "participant-5",
      "participant-6",
      "participant-7",
      "participant-1",
    ]);
    expect(
      bracket.rounds[0].byes?.map((participant) => participant.participantId),
    ).toEqual(["participant-1"]);
  });

  it("laedt Turniere fuer Teilnehmende", async () => {
    const bracket = generateTournamentBracket([
      { participantId: "alice", participantName: "Alice" },
      { participantId: "bob", participantName: "Bob" },
    ]);

    rpcMock.mockResolvedValue({
      data: [
        {
          id: "tournament-1",
          festival_id: "hurricane-awards-2026",
          name: "Kicker Cup",
          mode: "knockout",
          status: "active",
          selected_participant_ids: ["alice", "bob"],
          draw_participant_ids: ["bob", "alice"],
          qualification_ranking_ids: [],
          bracket,
          created_at: "2026-07-08T12:00:00.000Z",
          updated_at: "2026-07-08T12:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      loadTournaments("hurricane-awards-2026", participantContext),
    ).resolves.toEqual([
      {
        id: "tournament-1",
        festivalId: "hurricane-awards-2026",
        name: "Kicker Cup",
        mode: "knockout",
        status: "active",
        selectedParticipantIds: ["alice", "bob"],
        drawParticipantIds: ["bob", "alice"],
        qualificationRankingIds: [],
        bracket,
        createdAt: "2026-07-08T12:00:00.000Z",
        updatedAt: "2026-07-08T12:00:00.000Z",
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith("ha_list_tournaments", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
    });
  });

  it("verwaltet Turniere ueber Admin RPCs", async () => {
    const bracket = generateTournamentBracket([
      { participantId: "alice", participantName: "Alice" },
      { participantId: "bob", participantName: "Bob" },
    ]);
    const tournamentRow = {
      id: "tournament-1",
      festival_id: "hurricane-awards-2026",
      name: "Kicker Cup",
      mode: "knockout",
      status: "active",
      selected_participant_ids: ["alice", "bob"],
      draw_participant_ids: ["bob", "alice"],
      qualification_ranking_ids: [],
      bracket: JSON.stringify(bracket),
      created_at: "2026-07-08T12:00:00.000Z",
      updated_at: "2026-07-08T12:00:00.000Z",
    };

    rpcMock.mockResolvedValueOnce({
      data: [tournamentRow],
      error: null,
    });

    await expect(
      loadAdminTournaments("hurricane-awards-2026", participantContext),
    ).resolves.toMatchObject([
      {
        id: "tournament-1",
        name: "Kicker Cup",
        mode: "knockout",
        selectedParticipantIds: ["alice", "bob"],
        drawParticipantIds: ["bob", "alice"],
        bracket,
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_admin_list_tournaments", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
    });

    rpcMock.mockResolvedValueOnce({
      data: [tournamentRow],
      error: null,
    });

    await expect(
      createTournament(
        "hurricane-awards-2026",
        {
          name: " Kicker Cup ",
          mode: "knockout",
          participantIds: ["alice", "bob"],
        },
        participantContext,
      ),
    ).resolves.toMatchObject({
      id: "tournament-1",
      name: "Kicker Cup",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_admin_create_tournament", {
      ...expectedParticipantRpcContext,
      p_festival_id: "hurricane-awards-2026",
      p_name: "Kicker Cup",
      p_mode: "knockout",
      p_participant_ids: ["alice", "bob"],
    });

    rpcMock.mockResolvedValueOnce({
      data: [{ ...tournamentRow, name: "Kicker Cup Finale" }],
      error: null,
    });

    await expect(
      updateTournament(
        "tournament-1",
        {
          name: "Kicker Cup Finale",
          mode: "knockout",
          participantIds: ["alice", "bob"],
        },
        participantContext,
      ),
    ).resolves.toMatchObject({
      name: "Kicker Cup Finale",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "ha_admin_update_tournament", {
      ...expectedParticipantRpcContext,
      p_tournament_id: "tournament-1",
      p_name: "Kicker Cup Finale",
      p_mode: "knockout",
      p_participant_ids: ["alice", "bob"],
    });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteTournament("tournament-1", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(4, "ha_admin_delete_tournament", {
      ...expectedParticipantRpcContext,
      p_tournament_id: "tournament-1",
    });
  });

  it("schreibt bei elf Teilnehmenden einen spaeteren Freilos-Gewinner bis ins Finale fort", () => {
    const bracket = generateTournamentBracket(
      Array.from({ length: 11 }, (_, index) => ({
        participantId: `participant-${index + 1}`,
        participantName: `Person ${index + 1}`,
      })),
    );
    const afterFirstResult = recalculateTournamentBracket(
      bracket,
      "r1-m1",
      "participant-1",
    );
    const recalculated = recalculateTournamentBracket(
      afterFirstResult,
      "r1-m2",
      "participant-3",
    );
    const semiFinalWithBye = recalculated.rounds[2].matches[0];
    const final = recalculated.rounds[3].matches[0];

    expect(semiFinalWithBye).toMatchObject({
      id: "r3-m1",
      winnerParticipantId: "participant-7",
      winnerResolution: "automatic",
      status: "completed",
    });
    expect(final.participantA.sourceMatchId).toBe(semiFinalWithBye.id);
    expect(final).toMatchObject({
      winnerParticipantId: "participant-7",
      winnerResolution: "automatic",
      status: "completed",
    });
  });

  it("speichert Turniergewinner ueber die geschuetzte Admin RPC", async () => {
    const bracket = generateTournamentBracket([
      { participantId: "alice", participantName: "Alice" },
      { participantId: "bob", participantName: "Bob" },
    ]);
    bracket.rounds[0].matches[0].winnerParticipantId = "alice";
    bracket.rounds[0].matches[0].status = "completed";
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "tournament-1",
          festival_id: "hurricane-awards-2026",
          name: "Kicker Cup",
          mode: "knockout",
          status: "active",
          selected_participant_ids: ["alice", "bob"],
          draw_participant_ids: ["alice", "bob"],
          qualification_ranking_ids: [],
          bracket,
          created_at: "2026-07-08T12:00:00.000Z",
          updated_at: "2026-07-09T10:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      setTournamentMatchWinner(
        "tournament-1",
        "r1-m1",
        "alice",
        participantContext,
      ),
    ).resolves.toMatchObject({
      bracket: { rounds: [{ matches: [{ winnerParticipantId: "alice" }] }] },
    });
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_admin_set_tournament_match_winner",
      {
        ...expectedParticipantRpcContext,
        p_tournament_id: "tournament-1",
        p_match_id: "r1-m1",
        p_winner_participant_id: "alice",
      },
    );
  });

  it("laedt die Timetable Basisdaten ueber eine geschuetzte RPC Funktion", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          festival_days: [
            {
              id: "day-1",
              date: "2026-06-19",
              label: "Freitag",
              sort_order: 1,
            },
          ],
          stages: [
            {
              id: "stage-1",
              name: "Mainstage",
              sort_order: 1,
              color: "#ff006e",
            },
          ],
          acts: [
            {
              id: "act-1",
              name: "The Headliners",
              description: null,
            },
          ],
          performances: [
            {
              id: "performance-1",
              festival_day_id: "day-1",
              stage_id: "stage-1",
              act_id: "act-1",
              starts_at: "2026-06-19T20:00:00.000Z",
              ends_at: "2026-06-19T21:00:00.000Z",
            },
          ],
          favorite_performance_ids: ["performance-1"],
          performance_favorites: [
            {
              performance_id: "performance-1",
              participants: [
                {
                  participant_id: "alice",
                  display_name: "Alice",
                  avatar_id: "camp-sunrise",
                },
              ],
            },
          ],
        },
      ],
      error: null,
    });

    await expect(loadTimetable(participantContext)).resolves.toEqual({
      festivalDays: [
        {
          id: "day-1",
          date: "2026-06-19",
          label: "Freitag",
          sortOrder: 1,
        },
      ],
      stages: [
        {
          id: "stage-1",
          name: "Mainstage",
          sortOrder: 1,
          color: "#ff006e",
        },
      ],
      acts: [
        {
          id: "act-1",
          name: "The Headliners",
          description: null,
        },
      ],
      performances: [
        {
          id: "performance-1",
          festivalDayId: "day-1",
          stageId: "stage-1",
          actId: "act-1",
          startsAt: "2026-06-19T20:00:00.000Z",
          endsAt: "2026-06-19T21:00:00.000Z",
        },
      ],
      favoritePerformanceIds: ["performance-1"],
      performanceFavorites: [
        {
          performanceId: "performance-1",
          participants: [
            {
              participantId: "alice",
              displayName: "Alice",
              avatarId: "camp-sunrise",
            },
          ],
        },
      ],
    });
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_get_timetable",
      expectedParticipantRpcContext,
    );
  });

  it("verwaltet Timetable Favoriten ueber Teilnehmer RPCs", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      addTimetableFavorite("performance-1", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_add_timetable_favorite", {
      ...expectedParticipantRpcContext,
      p_performance_id: "performance-1",
    });

    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      removeTimetableFavorite("performance-1", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_remove_timetable_favorite", {
      ...expectedParticipantRpcContext,
      p_performance_id: "performance-1",
    });
  });

  it("verwaltet Festivaltage ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "day-1",
          date: "2026-06-19",
          label: "Freitag",
          sort_order: 1,
        },
      ],
      error: null,
    });

    await expect(loadAdminFestivalDays(participantContext)).resolves.toEqual([
      {
        id: "day-1",
        date: "2026-06-19",
        label: "Freitag",
        sortOrder: 1,
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_list_festival_days",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "day-2",
          date: "2026-06-20",
          label: "Samstag",
          sort_order: 2,
        },
      ],
      error: null,
    });

    await expect(
      createFestivalDay(
        {
          date: "2026-06-20",
          label: "Samstag",
          sortOrder: 2,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "day-2",
      date: "2026-06-20",
      label: "Samstag",
      sortOrder: 2,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_create_festival_day", {
      ...expectedParticipantRpcContext,
      p_date: "2026-06-20",
      p_label: "Samstag",
      p_sort_order: 2,
    });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "day-2",
          date: "2026-06-21",
          label: "Sonntag",
          sort_order: 3,
        },
      ],
      error: null,
    });

    await expect(
      updateFestivalDay(
        {
          id: "day-2",
          date: "2026-06-21",
          label: "Sonntag",
          sortOrder: 3,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "day-2",
      date: "2026-06-21",
      label: "Sonntag",
      sortOrder: 3,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "ha_update_festival_day", {
      ...expectedParticipantRpcContext,
      p_festival_day_id: "day-2",
      p_date: "2026-06-21",
      p_label: "Sonntag",
      p_sort_order: 3,
    });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteFestivalDay("day-2", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(4, "ha_delete_festival_day", {
      ...expectedParticipantRpcContext,
      p_festival_day_id: "day-2",
    });
  });

  it("verwaltet Timetable Buehnen ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "stage-1",
          name: "Mainstage",
          sort_order: 1,
          color: "#ff006e",
        },
      ],
      error: null,
    });

    await expect(loadAdminTimetableStages(participantContext)).resolves.toEqual(
      [
        {
          id: "stage-1",
          name: "Mainstage",
          sortOrder: 1,
          color: "#ff006e",
        },
      ],
    );
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_list_timetable_stages",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "stage-2",
          name: "Tent Stage",
          sort_order: 2,
          color: null,
        },
      ],
      error: null,
    });

    await expect(
      createTimetableStage(
        {
          name: "Tent Stage",
          sortOrder: 2,
          color: null,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "stage-2",
      name: "Tent Stage",
      sortOrder: 2,
      color: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_create_timetable_stage", {
      ...expectedParticipantRpcContext,
      p_name: "Tent Stage",
      p_sort_order: 2,
      p_color: null,
    });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "stage-2",
          name: "Beach Stage",
          sort_order: 3,
          color: "#00a6fb",
        },
      ],
      error: null,
    });

    await expect(
      updateTimetableStage(
        {
          id: "stage-2",
          name: "Beach Stage",
          sortOrder: 3,
          color: "#00a6fb",
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "stage-2",
      name: "Beach Stage",
      sortOrder: 3,
      color: "#00a6fb",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "ha_update_timetable_stage", {
      ...expectedParticipantRpcContext,
      p_stage_id: "stage-2",
      p_name: "Beach Stage",
      p_sort_order: 3,
      p_color: "#00a6fb",
    });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteTimetableStage("stage-2", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(4, "ha_delete_timetable_stage", {
      ...expectedParticipantRpcContext,
      p_stage_id: "stage-2",
    });
  });

  it("verwaltet Timetable Acts ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "act-1",
          name: "The Headliners",
          description: "Gitarren.",
        },
      ],
      error: null,
    });

    await expect(loadAdminTimetableActs(participantContext)).resolves.toEqual([
      {
        id: "act-1",
        name: "The Headliners",
        description: "Gitarren.",
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_list_timetable_acts",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "act-2",
          name: "Late Night DJ",
          description: null,
        },
      ],
      error: null,
    });

    await expect(
      createTimetableAct(
        {
          name: "Late Night DJ",
          description: "",
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "act-2",
      name: "Late Night DJ",
      description: null,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_create_timetable_act", {
      ...expectedParticipantRpcContext,
      p_name: "Late Night DJ",
      p_description: "",
    });

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: "act-2",
          name: "Late Night DJ Neu",
          description: "Dance.",
        },
      ],
      error: null,
    });

    await expect(
      updateTimetableAct(
        {
          id: "act-2",
          name: "Late Night DJ Neu",
          description: "Dance.",
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "act-2",
      name: "Late Night DJ Neu",
      description: "Dance.",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "ha_update_timetable_act", {
      ...expectedParticipantRpcContext,
      p_act_id: "act-2",
      p_name: "Late Night DJ Neu",
      p_description: "Dance.",
    });

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteTimetableAct("act-2", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(4, "ha_delete_timetable_act", {
      ...expectedParticipantRpcContext,
      p_act_id: "act-2",
    });
  });

  it("verwaltet Timetable Auftritte ueber Admin RPCs", async () => {
    const performanceRow = {
      id: "performance-1",
      festival_day_id: "day-1",
      stage_id: "stage-1",
      act_id: "act-1",
      starts_at: "2026-06-19T20:00:00.000Z",
      ends_at: "2026-06-19T21:00:00.000Z",
    };

    rpcMock.mockResolvedValueOnce({
      data: [performanceRow],
      error: null,
    });

    await expect(
      loadAdminTimetablePerformances(participantContext),
    ).resolves.toEqual([
      {
        id: "performance-1",
        festivalDayId: "day-1",
        stageId: "stage-1",
        actId: "act-1",
        startsAt: "2026-06-19T20:00:00.000Z",
        endsAt: "2026-06-19T21:00:00.000Z",
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_admin_list_timetable_performances",
      expectedParticipantRpcContext,
    );

    rpcMock.mockResolvedValueOnce({
      data: [performanceRow],
      error: null,
    });

    await expect(
      createTimetablePerformance(
        {
          festivalDayId: "day-1",
          stageId: "stage-1",
          actId: "act-1",
          startsAt: "2026-06-19T20:00",
          endsAt: "2026-06-19T21:00",
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "performance-1",
      festivalDayId: "day-1",
      stageId: "stage-1",
      actId: "act-1",
      startsAt: "2026-06-19T20:00:00.000Z",
      endsAt: "2026-06-19T21:00:00.000Z",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_create_timetable_performance",
      {
        ...expectedParticipantRpcContext,
        p_festival_day_id: "day-1",
        p_stage_id: "stage-1",
        p_act_id: "act-1",
        p_starts_at: "2026-06-19T20:00",
        p_ends_at: "2026-06-19T21:00",
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          ...performanceRow,
          ends_at: "2026-06-19T21:30:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      updateTimetablePerformance(
        {
          id: "performance-1",
          festivalDayId: "day-1",
          stageId: "stage-1",
          actId: "act-1",
          startsAt: "2026-06-19T20:00",
          endsAt: "2026-06-19T21:30",
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "performance-1",
      festivalDayId: "day-1",
      stageId: "stage-1",
      actId: "act-1",
      startsAt: "2026-06-19T20:00:00.000Z",
      endsAt: "2026-06-19T21:30:00.000Z",
    });
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      "ha_update_timetable_performance",
      {
        ...expectedParticipantRpcContext,
        p_performance_id: "performance-1",
        p_festival_day_id: "day-1",
        p_stage_id: "stage-1",
        p_act_id: "act-1",
        p_starts_at: "2026-06-19T20:00",
        p_ends_at: "2026-06-19T21:30",
      },
    );

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      deleteTimetablePerformance("performance-1", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenNthCalledWith(
      4,
      "ha_delete_timetable_performance",
      {
        ...expectedParticipantRpcContext,
        p_performance_id: "performance-1",
      },
    );
  });

  it("laedt Kategorien ueber eine geschuetzte RPC Funktion", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "cat-1",
          title: "Beste Energie",
          description: "Offene Kategorie",
          status: "open",
        },
      ],
      error: null,
    });

    await expect(loadCategories(participantContext)).resolves.toEqual([
      {
        id: "cat-1",
        title: "Beste Energie",
        description: "Offene Kategorie",
        status: "open",
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_list_categories",
      expectedParticipantRpcContext,
    );
  });

  it("speichert Kategorie-Status ueber die Admin RPC Funktion", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "cat-1",
          title: "Beste Energie",
          description: "Offene Kategorie",
          status: "closed",
        },
      ],
      error: null,
    });

    await expect(
      updateCategoryStatus("cat-1", "closed", participantContext),
    ).resolves.toEqual({
      id: "cat-1",
      title: "Beste Energie",
      description: "Offene Kategorie",
      status: "closed",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_update_category_status", {
      ...expectedParticipantRpcContext,
      p_category_id: "cat-1",
      p_status: "closed",
    });
  });

  it("laedt Kategorien fuer die Verwaltung ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "cat-1",
          title: "Beste Energie",
          description: "Offene Kategorie",
          status: "open",
          sort_order: 2,
        },
      ],
      error: null,
    });

    await expect(loadAdminCategories(participantContext)).resolves.toEqual([
      {
        id: "cat-1",
        title: "Beste Energie",
        description: "Offene Kategorie",
        status: "open",
        sortOrder: 2,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_admin_list_categories",
      expectedParticipantRpcContext,
    );
  });

  it("legt Kategorien ueber Admin RPC an", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "cat-2",
          title: "Beste Crew",
          description: "Teamkategorie",
          status: "upcoming",
          sort_order: 3,
        },
      ],
      error: null,
    });

    await expect(
      createCategory(
        {
          title: "Beste Crew",
          description: "Teamkategorie",
          status: "upcoming",
          sortOrder: 3,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "cat-2",
      title: "Beste Crew",
      description: "Teamkategorie",
      status: "upcoming",
      sortOrder: 3,
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_create_category", {
      ...expectedParticipantRpcContext,
      p_title: "Beste Crew",
      p_description: "Teamkategorie",
      p_status: "upcoming",
      p_sort_order: 3,
    });
  });

  it("bearbeitet Kategorien ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "cat-2",
          title: "Beste Crew Neu",
          description: "Aktualisierte Teamkategorie",
          status: "closed",
          sort_order: 4,
        },
      ],
      error: null,
    });

    await expect(
      updateCategory(
        {
          id: "cat-2",
          title: "Beste Crew Neu",
          description: "Aktualisierte Teamkategorie",
          status: "closed",
          sortOrder: 4,
        },
        participantContext,
      ),
    ).resolves.toEqual({
      id: "cat-2",
      title: "Beste Crew Neu",
      description: "Aktualisierte Teamkategorie",
      status: "closed",
      sortOrder: 4,
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_update_category", {
      ...expectedParticipantRpcContext,
      p_category_id: "cat-2",
      p_title: "Beste Crew Neu",
      p_description: "Aktualisierte Teamkategorie",
      p_status: "closed",
      p_sort_order: 4,
    });
  });

  it("loescht Kategorien ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      deleteCategory("cat-2", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenCalledWith("ha_delete_category", {
      ...expectedParticipantRpcContext,
      p_category_id: "cat-2",
    });
  });

  it("reicht Admin RPC Fehler aus der Kategorienverwaltung weiter", async () => {
    const error = new Error("category cannot be deleted while votes exist");

    rpcMock.mockResolvedValue({
      data: null,
      error,
    });

    await expect(deleteCategory("cat-2", participantContext)).rejects.toThrow(
      "category cannot be deleted while votes exist",
    );
  });

  it("laedt Teilnehmer ohne Access Codes ueber eine geschuetzte RPC Funktion", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "alice",
          name: "alice",
          display_name: "Alice",
          is_admin: false,
          is_active: true,
        },
      ],
      error: null,
    });

    await expect(loadParticipants(participantContext)).resolves.toEqual([
      {
        id: "alice",
        name: "alice",
        displayName: "Alice",
        accessCode: "",
        isAdmin: false,
        isActive: true,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_list_participants",
      expectedParticipantRpcContext,
    );
  });

  it("enthaelt eine feste Avatarbibliothek mit Default Avatar", () => {
    const avatarFiles = readdirSync("src/assets/avatars").filter((fileName) =>
      /^avatar-\d{3}\.svg$/.test(fileName),
    );

    expect(avatarFiles.length).toBeGreaterThanOrEqual(50);
    expect(avatars).toHaveLength(52);
    expect(avatars.length).toBeGreaterThanOrEqual(50);
    expect(avatars.every((avatar) => avatar.imageSrc.length > 0)).toBe(true);
    expect(new Set(avatars.map((avatar) => avatar.imageSrc)).size).toBe(
      avatars.length,
    );
    expect(avatarById()).toEqual(avatarById(defaultAvatarId));
    expect(avatarById("unbekannt")).toEqual(avatarById(defaultAvatarId));
  });

  it("meldet Teilnehmer ueber geschuetzten Login RPC an", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          status: "success",
          locked_until: null,
          id: "alice",
          name: "alice",
          display_name: "Alice",
          is_admin: true,
          is_active: true,
        },
      ],
      error: null,
    });

    await expect(loginParticipant(" alice42 ")).resolves.toEqual({
      status: "success",
      participant: {
        id: "alice",
        name: "alice",
        displayName: "Alice",
        accessCode: "ALICE42",
        isAdmin: true,
        isActive: true,
      },
      lockedUntil: null,
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_login_participant", {
      p_access_code: "ALICE42",
    });
  });

  it("gibt ungueltige Logins generisch aus dem Login RPC weiter", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          status: "invalid",
          locked_until: null,
          id: null,
          name: null,
          display_name: null,
          is_admin: null,
          is_active: null,
        },
      ],
      error: null,
    });

    await expect(loginParticipant("FALSCH")).resolves.toEqual({
      status: "invalid",
      participant: null,
      lockedUntil: null,
    });
  });

  it("gibt temporaere Login Sperren aus dem Login RPC weiter", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          status: "blocked",
          locked_until: "2026-06-30T12:00:30.000Z",
          id: null,
          name: null,
          display_name: null,
          is_admin: null,
          is_active: null,
        },
      ],
      error: null,
    });

    await expect(loginParticipant("FALSCH")).resolves.toEqual({
      status: "blocked",
      participant: null,
      lockedUntil: "2026-06-30T12:00:30.000Z",
    });
  });

  it("laedt aktive und deaktivierte Teilnehmer fuer die Verwaltung ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        participantRow,
        {
          ...participantRow,
          id: "bob",
          name: "bob",
          display_name: "Bob",
          access_code: "BOB42",
          is_active: false,
        },
      ],
      error: null,
    });

    await expect(loadAdminParticipants(participantContext)).resolves.toEqual([
      mappedParticipant,
      {
        ...mappedParticipant,
        id: "bob",
        name: "bob",
        displayName: "Bob",
        accessCode: "BOB42",
        isActive: false,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_admin_list_participants",
      expectedParticipantRpcContext,
    );
  });

  it("legt Teilnehmer ueber Admin RPC an und erlaubt automatisch erzeugte Codes", async () => {
    rpcMock.mockResolvedValue({
      data: [participantRow],
      error: null,
    });

    await expect(
      createParticipant({ displayName: "Alice" }, participantContext),
    ).resolves.toEqual(mappedParticipant);
    expect(rpcMock).toHaveBeenCalledWith("ha_create_participant", {
      ...expectedParticipantRpcContext,
      p_display_name: "Alice",
      p_access_code: null,
    });
  });

  it("laedt einen vorgeschlagenen Teilnehmercode ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: "NEU23456",
      error: null,
    });

    await expect(
      suggestParticipantAccessCode(participantContext),
    ).resolves.toBe("NEU23456");
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_suggest_participant_access_code",
      expectedParticipantRpcContext,
    );
  });

  it("legt Teilnehmer mit ueberschriebenem Code ueber Admin RPC an", async () => {
    rpcMock.mockResolvedValue({
      data: [participantRow],
      error: null,
    });

    await expect(
      createParticipant(
        { displayName: "Alice", accessCode: "WUNSCH42" },
        participantContext,
      ),
    ).resolves.toEqual(mappedParticipant);
    expect(rpcMock).toHaveBeenCalledWith("ha_create_participant", {
      ...expectedParticipantRpcContext,
      p_display_name: "Alice",
      p_access_code: "WUNSCH42",
    });
  });

  it("bearbeitet Teilnehmer ueber Admin RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          ...participantRow,
          display_name: "Alice Neu",
          access_code: "NEU42",
        },
      ],
      error: null,
    });

    await expect(
      updateParticipant(
        { id: "alice", displayName: "Alice Neu", accessCode: "NEU42" },
        participantContext,
      ),
    ).resolves.toEqual({
      ...mappedParticipant,
      displayName: "Alice Neu",
      accessCode: "NEU42",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_update_participant", {
      ...expectedParticipantRpcContext,
      p_participant_id: "alice",
      p_display_name: "Alice Neu",
      p_access_code: "NEU42",
    });
  });

  it("speichert den eigenen Avatar ueber Teilnehmer RPC", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          ...participantRow,
          avatar_id: "neon-tent",
        },
      ],
      error: null,
    });

    await expect(
      updateParticipantAvatar(
        { participantId: "alice", avatarId: "neon-tent" },
        participantContext,
      ),
    ).resolves.toEqual({
      ...mappedParticipant,
      avatarId: "neon-tent",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_update_participant_avatar", {
      ...expectedParticipantRpcContext,
      p_participant_id: "alice",
      p_avatar_id: "neon-tent",
    });
  });

  it("speichert das eigene Profil ohne frei waehlbare Teilnehmer ID", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "alice",
          name: "alice",
          display_name: "Alicia",
          avatar_id: "neon-tent",
          is_admin: false,
          is_active: true,
        },
      ],
      error: null,
    });

    await expect(
      updateOwnProfile(
        { displayName: "Alicia", avatarId: "neon-tent" },
        participantContext,
      ),
    ).resolves.toEqual({
      ...mappedParticipant,
      displayName: "Alicia",
      avatarId: "neon-tent",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_update_own_profile", {
      ...expectedParticipantRpcContext,
      p_display_name: "Alicia",
      p_avatar_id: "neon-tent",
    });
  });

  it("deaktiviert und reaktiviert Teilnehmer ueber Admin RPCs", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ ...participantRow, is_active: false }],
      error: null,
    });

    await expect(
      deactivateParticipant("alice", participantContext),
    ).resolves.toEqual({
      ...mappedParticipant,
      isActive: false,
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_deactivate_participant", {
      ...expectedParticipantRpcContext,
      p_participant_id: "alice",
    });

    rpcMock.mockResolvedValueOnce({
      data: [participantRow],
      error: null,
    });

    await expect(
      reactivateParticipant("alice", participantContext),
    ).resolves.toEqual(mappedParticipant);
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_reactivate_participant", {
      ...expectedParticipantRpcContext,
      p_participant_id: "alice",
    });
  });

  it("reicht Admin RPC Fehler aus der Teilnehmerverwaltung weiter", async () => {
    const error = new Error("participant access code already exists");

    rpcMock.mockResolvedValue({
      data: null,
      error,
    });

    await expect(
      createParticipant(
        { displayName: "Alice", accessCode: "ALICE42" },
        participantContext,
      ),
    ).rejects.toThrow("participant access code already exists");
  });

  it("laedt Ergebnisstimmen und einzelne Teilnehmerstimmen ueber RPC Funktionen", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          voter_id: "alice",
          voted_for_id: "bob",
          category_id: "cat-1",
          timestamp: "2026-06-26T12:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(loadVotes(participantContext)).resolves.toEqual([
      {
        voterId: "alice",
        votedForId: "bob",
        categoryId: "cat-1",
        timestamp: "2026-06-26T12:00:00.000Z",
      },
    ]);

    rpcMock.mockResolvedValueOnce({
      data: [
        {
          voter_id: "alice",
          voted_for_id: "carla",
          category_id: "cat-2",
          timestamp: "2026-06-26T13:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      loadVotesForParticipant("alice", participantContext),
    ).resolves.toEqual([
      {
        voterId: "alice",
        votedForId: "carla",
        categoryId: "cat-2",
        timestamp: "2026-06-26T13:00:00.000Z",
      },
    ]);
    expect(rpcMock).toHaveBeenNthCalledWith(
      1,
      "ha_list_result_votes",
      expectedParticipantRpcContext,
    );
    expect(rpcMock).toHaveBeenNthCalledWith(2, "ha_list_participant_votes", {
      ...expectedParticipantRpcContext,
      p_voter_id: "alice",
    });
  });

  it("speichert und loescht Stimmen ueber geschuetzte RPC Funktionen", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          voter_id: "alice",
          voted_for_id: "bob",
          category_id: "cat-1",
          timestamp: "2026-06-26T12:00:00.000Z",
        },
      ],
      error: null,
    });

    await expect(
      saveVote(
        {
          voterId: "alice",
          votedForId: "bob",
          categoryId: "cat-1",
          timestamp: "2026-06-26T12:00:00.000Z",
        },
        participantContext,
      ),
    ).resolves.toEqual({
      voterId: "alice",
      votedForId: "bob",
      categoryId: "cat-1",
      timestamp: "2026-06-26T12:00:00.000Z",
    });
    expect(rpcMock).toHaveBeenCalledWith("ha_save_vote", {
      ...expectedParticipantRpcContext,
      p_voter_id: "alice",
      p_voted_for_id: "bob",
      p_category_id: "cat-1",
      p_timestamp: "2026-06-26T12:00:00.000Z",
    });

    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      deleteVotesForCategory("cat-1", participantContext),
    ).resolves.toBeUndefined();
    expect(rpcMock).toHaveBeenLastCalledWith("ha_delete_category_votes", {
      ...expectedParticipantRpcContext,
      p_category_id: "cat-1",
    });
  });

  it("laedt die ewige Tabelle ueber eine geschuetzte RPC Funktion", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          participant_id: "bob",
          participant_name: "Bob",
          total_points: "18",
        },
      ],
      error: null,
    });

    await expect(loadAllTimeStandings(participantContext)).resolves.toEqual([
      {
        participantId: "bob",
        participantName: "Bob",
        totalPoints: 18,
      },
    ]);
    expect(rpcMock).toHaveBeenCalledWith(
      "ha_list_all_time_standings",
      expectedParticipantRpcContext,
    );
  });

  it("laedt Exportdaten ohne Teilnehmercodes ueber bestehende geschuetzte RPC Funktionen", async () => {
    const exportedAt = new Date("2026-07-01T10:11:12.000Z");

    rpcMock
      .mockResolvedValueOnce({
        data: "Hurricane Awards 2026",
        error: null,
      })
      .mockResolvedValueOnce({
        data: [participantRow],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "cat-1",
            title: "Beste Energie",
            description: "Offene Kategorie",
            status: "open",
            sort_order: 2,
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          {
            voter_id: "alice",
            voted_for_id: "bob",
            category_id: "cat-1",
            timestamp: "2026-06-26T12:00:00.000Z",
          },
        ],
        error: null,
      });

    await expect(
      loadFestivalExportData(
        participantContext,
        {
          type: "active",
          festivalId: "hurricane-awards-2026",
        },
        exportedAt,
      ),
    ).resolves.toEqual({
      formatVersion: 1,
      exportedAt: "2026-07-01T10:11:12.000Z",
      festival: {
        id: "hurricane-awards-2026",
        name: "Hurricane Awards 2026",
        source: "active",
      },
      participants: [
        {
          id: "alice",
          name: "alice",
          displayName: "Alice",
          isAdmin: false,
          isActive: true,
        },
      ],
      categories: [
        {
          id: "cat-1",
          title: "Beste Energie",
          description: "Offene Kategorie",
          status: "open",
          sortOrder: 2,
        },
      ],
      votes: [
        {
          voterId: "alice",
          votedForId: "bob",
          categoryId: "cat-1",
          timestamp: "2026-06-26T12:00:00.000Z",
        },
      ],
    });
    expect(rpcMock).toHaveBeenNthCalledWith(1, "ha_get_festival_name");
    expect(rpcMock).toHaveBeenNthCalledWith(
      2,
      "ha_admin_list_participants",
      expectedParticipantRpcContext,
    );
    expect(rpcMock).toHaveBeenNthCalledWith(
      3,
      "ha_admin_list_categories",
      expectedParticipantRpcContext,
    );
    expect(rpcMock).toHaveBeenNthCalledWith(
      4,
      "ha_list_result_votes",
      expectedParticipantRpcContext,
    );
  });

  it("nimmt Teilnehmercodes nur mit expliziter Exportoption auf", async () => {
    const exportedAt = new Date("2026-07-01T10:11:12.000Z");
    const exportData = createFestivalExportData({
      festivalName: "Hurricane Crew Awards",
      festivalSource: {
        type: "active",
        festivalId: "hurricane-awards-2026",
      },
      participants: [mappedParticipant],
      categories: [],
      votes: [],
      exportedAt,
      options: {
        includeParticipantAccessCodes: true,
      },
    });

    expect(exportData.participants).toEqual([mappedParticipant]);
  });

  it("formatiert Export JSON lesbar und erzeugt stabile Dateinamen", () => {
    const exportedAt = new Date("2026-07-01T10:11:12.000Z");
    const exportData = createFestivalExportData({
      festivalName: "Hurricane Crew Awards!",
      festivalSource: {
        type: "active",
        festivalId: "hurricane-awards-2026",
      },
      participants: [mappedParticipant],
      categories: [],
      votes: [],
      exportedAt,
    });

    expect(serializeFestivalExport(exportData)).toBe(
      `${JSON.stringify(exportData, null, 2)}\n`,
    );
    expect(festivalExportFileName("Hurricane Crew Awards!", exportedAt)).toBe(
      "festival-awards-hurricane-crew-awards-2026-07-01.json",
    );
  });
});
