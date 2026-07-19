import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import {
  createCategory,
  deleteCategory,
  loadAdminCategories,
  loadCategories,
  updateCategory,
  updateCategoryStatus,
  type Category,
} from "../data/categories";
import {
  createParticipant,
  deactivateParticipant,
  loginParticipant,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  type Participant,
  updateParticipant,
  updateParticipantAvatar,
  updateOwnProfile,
} from "../data/participants";
import {
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from "../data/votes";
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from "../data/allTimeStandings";
import {
  archiveFestival,
  loadFestivalAccessCode,
  loadFestivalAccessVersion,
  loadEventSettings,
  updateFestivalAccessCode,
  updateEventSettings,
  verifyFestivalAccessCode,
} from "../data/festival";
import {
  eventLogoPublicUrl,
  removeEventLogo,
  uploadEventLogo,
} from "../data/festivalLogo";
import {
  festivalExportFileName,
  loadFestivalExportData,
  serializeFestivalExport,
  type FestivalExportData,
} from "../data/export";
import {
  deleteCampLocationLink,
  deleteFestivalDocument,
  geocodeCampLocation,
  GeocodingNotFoundError,
  loadAdminCampLocationLink,
  loadAdminFestivalDocuments,
  loadCampLocationLink,
  loadFestivalDocuments,
  updateCampLocationLink,
  uploadFestivalDocument,
  type FestivalDocument,
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
  type BingoCard,
  type BingoRound,
} from "../data/bingo";
import {
  loadAdminHorseRacingBets,
  loadAdminHorseRacingState,
  loadHorseRacingState,
  saveHorseRacingBet,
  updateAdminHorseRacingState,
  type AdminHorseRacingState,
  type HorseRacingState,
} from "../data/horseRacing";
import {
  createRandomPairingAction,
  drawRandomPairingAction,
  loadAdminRandomPairingActions,
  loadRandomPairingAssignments,
  resetRandomPairingAction,
  updateRandomPairingParticipants,
  type AdminRandomPairingAction,
  type RandomPairingParticipantAssignment,
} from "../data/randomPairings";
import {
  createTournament,
  deleteTournament,
  generateTournamentBracket,
  loadAdminTournaments,
  loadTournaments,
  updateTournament,
  type Tournament,
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
  type FestivalDay,
  type Timetable,
  type TimetableAct,
  type TimetablePerformance,
  type TimetableStage,
} from "../data/timetable";
import type { MusicPlaylist } from "../data/musicEmbeds";
import i18n from "../i18n";

vi.mock("../data/categories", () => ({
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  loadAdminCategories: vi.fn(),
  loadCategories: vi.fn(),
  updateCategory: vi.fn(),
  updateCategoryStatus: vi.fn(),
}));

vi.mock("../data/participants", () => ({
  createParticipant: vi.fn(),
  deactivateParticipant: vi.fn(),
  loginParticipant: vi.fn(),
  loadAdminParticipants: vi.fn(),
  loadParticipants: vi.fn(),
  reactivateParticipant: vi.fn(),
  suggestParticipantAccessCode: vi.fn(),
  updateParticipant: vi.fn(),
  updateParticipantAvatar: vi.fn(),
  updateOwnProfile: vi.fn(),
}));

vi.mock("../data/votes", () => ({
  loadVotes: vi.fn(),
  loadVotesForParticipant: vi.fn(),
  saveVote: vi.fn(),
}));

vi.mock("../data/allTimeStandings", () => ({
  loadAllTimeStandings: vi.fn(),
}));

vi.mock("../data/festival", () => ({
  archiveFestival: vi.fn(),
  loadFestivalAccessCode: vi.fn(),
  loadFestivalAccessVersion: vi.fn(),
  loadEventSettings: vi.fn(),
  updateFestivalAccessCode: vi.fn(),
  updateEventSettings: vi.fn(),
  verifyFestivalAccessCode: vi.fn(),
}));

vi.mock("../data/festivalLogo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/festivalLogo")>();
  return {
    ...actual,
    eventLogoPublicUrl: vi.fn(),
    removeEventLogo: vi.fn(),
    uploadEventLogo: vi.fn(),
  };
});

vi.mock("../data/export", () => ({
  festivalExportFileName: vi.fn(),
  loadFestivalExportData: vi.fn(),
  serializeFestivalExport: vi.fn(),
}));

vi.mock("../data/festivalDocuments", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../data/festivalDocuments")>();

  return {
    ...actual,
    deleteCampLocationLink: vi.fn(),
    deleteFestivalDocument: vi.fn(),
    geocodeCampLocation: vi.fn(),
    loadAdminCampLocationLink: vi.fn(),
    loadAdminFestivalDocuments: vi.fn(),
    loadCampLocationLink: vi.fn(),
    loadFestivalDocuments: vi.fn(),
    updateCampLocationLink: vi.fn(),
    uploadFestivalDocument: vi.fn(),
  };
});

vi.mock("../data/festivalMusic", () => ({
  deleteMusicPlaylist: vi.fn(),
  loadAdminMusicPlaylist: vi.fn(),
  loadMusicPlaylist: vi.fn(),
  updateMusicPlaylist: vi.fn(),
}));

vi.mock("../data/bingo", () => ({
  closeBingoRound: vi.fn(),
  loadAdminBingoRound: vi.fn(),
  loadOrCreateBingoCard: vi.fn(),
  setBingoMark: vi.fn(),
  startBingoRound: vi.fn(),
}));

vi.mock("../data/horseRacing", () => ({
  loadAdminHorseRacingBets: vi.fn(),
  loadAdminHorseRacingState: vi.fn(),
  loadHorseRacingState: vi.fn(),
  saveHorseRacingBet: vi.fn(),
  updateAdminHorseRacingState: vi.fn(),
}));

vi.mock("../data/randomPairings", () => ({
  createRandomPairingAction: vi.fn(),
  drawRandomPairingAction: vi.fn(),
  loadAdminRandomPairingActions: vi.fn(),
  loadRandomPairingAssignments: vi.fn(),
  resetRandomPairingAction: vi.fn(),
  updateRandomPairingParticipants: vi.fn(),
}));

vi.mock("../data/tournaments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/tournaments")>();

  return {
    ...actual,
    createTournament: vi.fn(),
    deleteTournament: vi.fn(),
    loadAdminTournaments: vi.fn(),
    loadTournaments: vi.fn(),
    updateTournament: vi.fn(),
  };
});

vi.mock("../data/timetable", () => ({
  addTimetableFavorite: vi.fn(),
  createFestivalDay: vi.fn(),
  createTimetableAct: vi.fn(),
  createTimetablePerformance: vi.fn(),
  createTimetableStage: vi.fn(),
  deleteFestivalDay: vi.fn(),
  deleteTimetableAct: vi.fn(),
  deleteTimetablePerformance: vi.fn(),
  deleteTimetableStage: vi.fn(),
  loadAdminFestivalDays: vi.fn(),
  loadAdminTimetableActs: vi.fn(),
  loadAdminTimetablePerformances: vi.fn(),
  loadAdminTimetableStages: vi.fn(),
  loadTimetable: vi.fn(),
  removeTimetableFavorite: vi.fn(),
  updateFestivalDay: vi.fn(),
  updateTimetableAct: vi.fn(),
  updateTimetablePerformance: vi.fn(),
  updateTimetableStage: vi.fn(),
}));

const participants: Participant[] = [
  {
    id: "alice",
    name: "alice",
    displayName: "Alice",
    accessCode: "ALICE42",
    isAdmin: true,
    isActive: true,
  },
  {
    id: "bob",
    name: "bob",
    displayName: "Bob",
    accessCode: "BOB42",
    isAdmin: false,
    isActive: true,
  },
  {
    id: "carla",
    name: "carla",
    displayName: "Carla",
    accessCode: "CARLA42",
    isAdmin: false,
    isActive: true,
  },
];

const categories: Category[] = [
  {
    id: "upcoming-category",
    title: "Bester Camp-Aufbau",
    description: "Noch nicht freigeschaltet.",
    status: "upcoming",
    sortOrder: 1,
  },
  {
    id: "open-category",
    title: "Beste Festival-Energie",
    description: "Aktuell offen.",
    status: "open",
    sortOrder: 2,
  },
  {
    id: "closed-category",
    title: "Beste Regenjacke",
    description: "Schon beendet.",
    status: "closed",
    sortOrder: 3,
  },
];

const standings: AllTimeStanding[] = [
  {
    participantId: "bob",
    participantName: "Bob",
    totalPoints: 18,
  },
  {
    participantId: "alice",
    participantName: "Alice",
    totalPoints: 12,
  },
];

const festivalDocuments: FestivalDocument[] = [
  {
    documentType: "timetable",
    title: "Timetable",
    filePath: "current/timetable/timetable.pdf",
    mimeType: "application/pdf",
    updatedAt: "2026-07-03T10:00:00.000Z",
    displayUrl: "https://example.test/timetable.pdf",
  },
  {
    documentType: "site_map",
    title: "Geländeplan",
    filePath: "current/site_map/site-map.png",
    mimeType: "image/png",
    updatedAt: "2026-07-03T11:00:00.000Z",
    displayUrl: "https://example.test/site-map.png",
  },
];

const musicPlaylist: MusicPlaylist = {
  provider: "spotify",
  playlistId: "37i9dQZF1DXcBWIGoYBM5M",
  externalUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
  embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
};

const bingoRound: BingoRound = {
  id: "bingo-round-1",
  startedAt: "2026-07-04T12:00:00.000Z",
};

const bingoCard: BingoCard = {
  ...bingoRound,
  cardId: "bingo-card-1",
  numbers: Array.from({ length: 25 }, (_, index) => index + 1),
  markedNumbers: [1, 7],
};

const disabledHorseRacingState: HorseRacingState = {
  festivalId: "hurricane-awards-2026",
  isEnabled: false,
  bettingStatus: "closed",
  selectedSuit: null,
  updatedAt: null,
};

const disabledAdminHorseRacingState: AdminHorseRacingState = {
  festivalId: "hurricane-awards-2026",
  isEnabled: false,
  bettingStatus: "closed",
  betCount: 0,
  updatedAt: null,
};

const randomPairingAction: AdminRandomPairingAction = {
  id: "random-action-1",
  festivalId: "hurricane-awards-2026",
  name: "Getraenk holen",
  status: "draft",
  selectedParticipantIds: ["alice", "bob"],
  assignments: [],
  createdAt: "2026-07-08T11:00:00.000Z",
  drawnAt: null,
};

const drawnRandomPairingAction: AdminRandomPairingAction = {
  ...randomPairingAction,
  status: "drawn",
  assignments: [
    {
      participantId: "alice",
      participantName: "Alice",
      assignedParticipantId: "bob",
      assignedParticipantName: "Bob",
    },
    {
      participantId: "bob",
      participantName: "Bob",
      assignedParticipantId: "alice",
      assignedParticipantName: "Alice",
    },
  ],
  drawnAt: "2026-07-08T12:00:00.000Z",
};

const randomPairingAssignment: RandomPairingParticipantAssignment = {
  actionId: "random-action-1",
  actionName: "Getraenk holen",
  assignedParticipantId: "bob",
  assignedParticipantName: "Bob",
  drawnAt: "2026-07-08T12:00:00.000Z",
};

const tournamentBracket = generateTournamentBracket([
  { participantId: "alice", participantName: "Alice" },
  { participantId: "bob", participantName: "Bob" },
]);

const tournament: Tournament = {
  id: "tournament-1",
  festivalId: "hurricane-awards-2026",
  name: "Kicker Cup",
  mode: "knockout",
  status: "active",
  selectedParticipantIds: ["alice", "bob"],
  drawParticipantIds: ["bob", "alice"],
  qualificationRankingIds: [],
  bracket: tournamentBracket,
  createdAt: "2026-07-08T12:00:00.000Z",
  updatedAt: "2026-07-08T12:00:00.000Z",
};

const emptyTimetable: Timetable = {
  festivalDays: [],
  stages: [],
  acts: [],
  performances: [],
  favoritePerformanceIds: [],
  performanceFavorites: [],
};

const festivalDays: FestivalDay[] = [
  {
    id: "day-1",
    date: "2026-06-19",
    label: "Freitag",
    sortOrder: 1,
  },
  {
    id: "day-2",
    date: "2026-06-20",
    label: "Samstag",
    sortOrder: 2,
  },
];

const timetableStages: TimetableStage[] = [
  {
    id: "stage-1",
    name: "Mainstage",
    sortOrder: 1,
    color: "#ff006e",
  },
  {
    id: "stage-2",
    name: "Tent Stage",
    sortOrder: 2,
    color: null,
  },
];

const timetableActs: TimetableAct[] = [
  {
    id: "act-1",
    name: "The Headliners",
    description: "Große Gitarren und große Gefühle.",
  },
  {
    id: "act-2",
    name: "Late Night DJ",
    description: null,
  },
];

const timetablePerformances: TimetablePerformance[] = [
  {
    id: "performance-1",
    festivalDayId: "day-1",
    stageId: "stage-1",
    actId: "act-1",
    startsAt: "2026-06-19T20:00:00.000Z",
    endsAt: "2026-06-19T21:00:00.000Z",
  },
];

const festivalAccessStorageKey =
  "hurricane-awards:hurricane-awards-2026:festival-access";
const festivalAccessVersion = "2026-07-01 10:00:00+00";
const defaultUserAgent = window.navigator.userAgent;
const stopCameraTrack = vi.fn();

const exportData: FestivalExportData = {
  formatVersion: 1,
  exportedAt: "2026-07-01T10:11:12.000Z",
  festival: {
    id: "hurricane-awards-2026",
    name: "Hurricane Awards 2026",
    source: "active",
  },
  participants,
  categories,
  votes: [],
};

function vote(overrides: Partial<Vote> = {}): Vote {
  return {
    voterId: "alice",
    votedForId: "bob",
    categoryId: "open-category",
    timestamp: "2026-06-26T12:00:00.000Z",
    ...overrides,
  };
}

function mockLoadedData({
  loadedFestivalName = "Hurricane Awards 2026",
  loadedFestivalAccessCode = "HURRICANE2026",
  loadedFestivalAccessVersion = festivalAccessVersion,
  loadedEventLogoPath = null,
  loadedEventLogoUrl = null,
  loadedParticipants = participants,
  loadedAdminParticipants = loadedParticipants,
  loadedCategories = categories,
  loadedVotes = [],
  participantVotes = [],
  loadedStandings = standings,
  loadedFestivalDocuments = [],
  loadedAdminFestivalDocuments = loadedFestivalDocuments,
  loadedCampLocationLink = null,
  loadedAdminCampLocationLink = loadedCampLocationLink,
  loadedMusicPlaylist = null,
  loadedAdminMusicPlaylist = loadedMusicPlaylist,
  loadedBingoCard = null,
  loadedAdminBingoRound = loadedBingoCard,
  loadedHorseRacingState = disabledHorseRacingState,
  loadedAdminHorseRacingState = disabledAdminHorseRacingState,
  loadedAdminHorseRacingBets = [],
  loadedRandomPairingAssignments = [],
  loadedAdminRandomPairingActions = [],
  loadedTournaments = [],
  loadedAdminTournaments = loadedTournaments,
  loadedTimetable = emptyTimetable,
  loadedAdminFestivalDays = loadedTimetable.festivalDays,
  loadedAdminTimetableStages = loadedTimetable.stages,
  loadedAdminTimetableActs = loadedTimetable.acts,
  loadedAdminTimetablePerformances = loadedTimetable.performances,
}: {
  loadedFestivalName?: string;
  loadedFestivalAccessCode?: string;
  loadedFestivalAccessVersion?: string;
  loadedEventLogoPath?: string | null;
  loadedEventLogoUrl?: string | null;
  loadedParticipants?: Participant[];
  loadedAdminParticipants?: Participant[];
  loadedCategories?: Category[];
  loadedVotes?: Vote[];
  participantVotes?: Vote[];
  loadedStandings?: AllTimeStanding[];
  loadedFestivalDocuments?: FestivalDocument[];
  loadedAdminFestivalDocuments?: FestivalDocument[];
  loadedCampLocationLink?: string | null;
  loadedAdminCampLocationLink?: string | null;
  loadedMusicPlaylist?: MusicPlaylist | null;
  loadedAdminMusicPlaylist?: MusicPlaylist | null;
  loadedBingoCard?: BingoCard | null;
  loadedAdminBingoRound?: BingoRound | null;
  loadedHorseRacingState?: HorseRacingState | null;
  loadedAdminHorseRacingState?: AdminHorseRacingState | null;
  loadedAdminHorseRacingBets?: Awaited<
    ReturnType<typeof loadAdminHorseRacingBets>
  >;
  loadedRandomPairingAssignments?: RandomPairingParticipantAssignment[];
  loadedAdminRandomPairingActions?: AdminRandomPairingAction[];
  loadedTournaments?: Tournament[];
  loadedAdminTournaments?: Tournament[];
  loadedTimetable?: Timetable;
  loadedAdminFestivalDays?: FestivalDay[];
  loadedAdminTimetableStages?: TimetableStage[];
  loadedAdminTimetableActs?: TimetableAct[];
  loadedAdminTimetablePerformances?: TimetablePerformance[];
} = {}) {
  vi.mocked(loadEventSettings).mockResolvedValue({
    name: loadedFestivalName,
    startDate: null,
    endDate: null,
    logoPath: loadedEventLogoPath,
    logoUrl: loadedEventLogoUrl,
  });
  vi.mocked(eventLogoPublicUrl).mockImplementation((path) =>
    path ? `https://example.test/${path}` : null,
  );
  vi.mocked(uploadEventLogo).mockResolvedValue(
    "hurricane-awards-2026/logo.png",
  );
  vi.mocked(removeEventLogo).mockResolvedValue();
  vi.mocked(loadFestivalAccessVersion).mockResolvedValue(
    loadedFestivalAccessVersion,
  );
  vi.mocked(verifyFestivalAccessCode).mockImplementation(async (accessCode) => {
    const isValid =
      accessCode.trim().toUpperCase() ===
      loadedFestivalAccessCode.toUpperCase();

    return {
      isValid,
      version: isValid ? loadedFestivalAccessVersion : null,
    };
  });
  vi.mocked(loadFestivalAccessCode).mockResolvedValue({
    code: loadedFestivalAccessCode,
    version: loadedFestivalAccessVersion,
  });
  vi.mocked(loadParticipants).mockResolvedValue(loadedParticipants);
  vi.mocked(loadAdminParticipants).mockResolvedValue(loadedAdminParticipants);
  vi.mocked(loginParticipant).mockImplementation(async (accessCode) => {
    const participant = loadedParticipants.find(
      (currentParticipant) =>
        currentParticipant.accessCode === accessCode &&
        currentParticipant.isActive,
    );

    return participant
      ? {
          status: "success",
          participant,
          lockedUntil: null,
        }
      : {
          status: "invalid",
          participant: null,
          lockedUntil: null,
        };
  });
  vi.mocked(loadCategories).mockResolvedValue(loadedCategories);
  vi.mocked(loadAdminCategories).mockResolvedValue(loadedCategories);
  vi.mocked(loadVotes).mockResolvedValue(loadedVotes);
  vi.mocked(loadVotesForParticipant).mockResolvedValue(participantVotes);
  vi.mocked(loadAllTimeStandings).mockResolvedValue(loadedStandings);
  vi.mocked(loadFestivalDocuments).mockResolvedValue(loadedFestivalDocuments);
  vi.mocked(loadAdminFestivalDocuments).mockResolvedValue(
    loadedAdminFestivalDocuments,
  );
  vi.mocked(loadCampLocationLink).mockResolvedValue(loadedCampLocationLink);
  vi.mocked(loadAdminCampLocationLink).mockResolvedValue(
    loadedAdminCampLocationLink,
  );
  vi.mocked(loadMusicPlaylist).mockResolvedValue(loadedMusicPlaylist);
  vi.mocked(loadAdminMusicPlaylist).mockResolvedValue(loadedAdminMusicPlaylist);
  vi.mocked(loadOrCreateBingoCard).mockResolvedValue(loadedBingoCard);
  vi.mocked(loadAdminBingoRound).mockResolvedValue(loadedAdminBingoRound);
  vi.mocked(loadHorseRacingState).mockResolvedValue(loadedHorseRacingState);
  vi.mocked(loadAdminHorseRacingState).mockResolvedValue(
    loadedAdminHorseRacingState,
  );
  vi.mocked(loadAdminHorseRacingBets).mockResolvedValue(
    loadedAdminHorseRacingBets,
  );
  vi.mocked(saveHorseRacingBet).mockImplementation(
    async (_festivalId, suit) => ({
      ...(loadedHorseRacingState ?? disabledHorseRacingState),
      isEnabled: true,
      bettingStatus: "open",
      selectedSuit: suit,
    }),
  );
  vi.mocked(updateAdminHorseRacingState).mockImplementation(
    async (_festivalId, input) => ({
      ...(loadedAdminHorseRacingState ?? disabledAdminHorseRacingState),
      isEnabled: input.isEnabled,
      bettingStatus: input.isEnabled ? input.bettingStatus : "closed",
    }),
  );
  vi.mocked(loadRandomPairingAssignments).mockResolvedValue(
    loadedRandomPairingAssignments,
  );
  vi.mocked(loadAdminRandomPairingActions).mockResolvedValue(
    loadedAdminRandomPairingActions,
  );
  vi.mocked(loadTournaments).mockResolvedValue(loadedTournaments);
  vi.mocked(loadAdminTournaments).mockResolvedValue(loadedAdminTournaments);
  vi.mocked(createTournament).mockImplementation(
    async (_festivalId, input) => ({
      ...tournament,
      id: "created-tournament",
      name: input.name,
      mode: input.mode,
      selectedParticipantIds: input.participantIds,
      drawParticipantIds: [...input.participantIds].reverse(),
      qualificationRankingIds: [],
      bracket:
        input.mode === "knockout"
          ? generateTournamentBracket(
              [...input.participantIds].reverse().map((participantId) => {
                const participant = participants.find(
                  (currentParticipant) =>
                    currentParticipant.id === participantId,
                );

                return {
                  participantId,
                  participantName: participant?.displayName ?? participantId,
                };
              }),
            )
          : {
              type: "single_elimination",
              mainParticipantCount: 2,
              rounds: [],
            },
    }),
  );
  vi.mocked(updateTournament).mockImplementation(
    async (tournamentId, input) => ({
      ...tournament,
      id: tournamentId,
      name: input.name,
      mode: input.mode,
      selectedParticipantIds: input.participantIds,
      drawParticipantIds: [...input.participantIds].reverse(),
      qualificationRankingIds: [],
      bracket:
        input.mode === "knockout"
          ? generateTournamentBracket(
              [...input.participantIds].reverse().map((participantId) => {
                const participant = participants.find(
                  (currentParticipant) =>
                    currentParticipant.id === participantId,
                );

                return {
                  participantId,
                  participantName: participant?.displayName ?? participantId,
                };
              }),
            )
          : {
              type: "single_elimination",
              mainParticipantCount: 2,
              rounds: [],
            },
    }),
  );
  vi.mocked(deleteTournament).mockResolvedValue();
  vi.mocked(createRandomPairingAction).mockImplementation(
    async (_festivalId, actionName) => ({
      ...randomPairingAction,
      id: "created-random-action",
      name: actionName,
      selectedParticipantIds: [],
    }),
  );
  vi.mocked(updateRandomPairingParticipants).mockImplementation(
    async (actionId, participantIds) => ({
      ...(loadedAdminRandomPairingActions.find(
        (action) => action.id === actionId,
      ) ?? randomPairingAction),
      id: actionId,
      selectedParticipantIds: participantIds,
    }),
  );
  vi.mocked(drawRandomPairingAction).mockImplementation(async (actionId) => ({
    ...(loadedAdminRandomPairingActions.find(
      (action) => action.id === actionId,
    ) ?? drawnRandomPairingAction),
    id: actionId,
    status: "drawn",
    assignments: drawnRandomPairingAction.assignments,
    drawnAt: drawnRandomPairingAction.drawnAt,
  }));
  vi.mocked(resetRandomPairingAction).mockImplementation(
    async (_festivalId, actionId) => ({
      ...(loadedAdminRandomPairingActions.find(
        (action) => action.id === actionId,
      ) ?? drawnRandomPairingAction),
      id: actionId,
      status: "draft",
      assignments: [],
      drawnAt: null,
    }),
  );
  vi.mocked(loadTimetable).mockResolvedValue(loadedTimetable);
  vi.mocked(loadAdminFestivalDays).mockResolvedValue(loadedAdminFestivalDays);
  vi.mocked(loadAdminTimetableStages).mockResolvedValue(
    loadedAdminTimetableStages,
  );
  vi.mocked(loadAdminTimetableActs).mockResolvedValue(loadedAdminTimetableActs);
  vi.mocked(loadAdminTimetablePerformances).mockResolvedValue(
    loadedAdminTimetablePerformances,
  );
  vi.mocked(createFestivalDay).mockImplementation(async (input) => ({
    id: input.label.toLowerCase(),
    date: input.date,
    label: input.label,
    sortOrder: input.sortOrder,
  }));
  vi.mocked(updateFestivalDay).mockImplementation(async (input) => ({
    id: input.id,
    date: input.date,
    label: input.label,
    sortOrder: input.sortOrder,
  }));
  vi.mocked(deleteFestivalDay).mockResolvedValue();
  vi.mocked(createTimetableStage).mockImplementation(async (input) => ({
    id: input.name.toLowerCase().replace(/\s+/g, "-"),
    name: input.name,
    sortOrder: input.sortOrder,
    color: input.color,
  }));
  vi.mocked(updateTimetableStage).mockImplementation(async (input) => ({
    id: input.id,
    name: input.name,
    sortOrder: input.sortOrder,
    color: input.color,
  }));
  vi.mocked(deleteTimetableStage).mockResolvedValue();
  vi.mocked(createTimetableAct).mockImplementation(async (input) => ({
    id: input.name.toLowerCase().replace(/\s+/g, "-"),
    name: input.name,
    description: input.description || null,
  }));
  vi.mocked(updateTimetableAct).mockImplementation(async (input) => ({
    id: input.id,
    name: input.name,
    description: input.description || null,
  }));
  vi.mocked(deleteTimetableAct).mockResolvedValue();
  vi.mocked(createTimetablePerformance).mockImplementation(async (input) => ({
    id: `${input.actId}-${input.startsAt}`,
    festivalDayId: input.festivalDayId,
    stageId: input.stageId,
    actId: input.actId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  }));
  vi.mocked(updateTimetablePerformance).mockImplementation(async (input) => ({
    id: input.id,
    festivalDayId: input.festivalDayId,
    stageId: input.stageId,
    actId: input.actId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  }));
  vi.mocked(deleteTimetablePerformance).mockResolvedValue();
  vi.mocked(addTimetableFavorite).mockResolvedValue();
  vi.mocked(removeTimetableFavorite).mockResolvedValue();
  vi.mocked(startBingoRound).mockResolvedValue(bingoRound);
  vi.mocked(closeBingoRound).mockResolvedValue();
  vi.mocked(setBingoMark).mockImplementation(async (number, isMarked) => {
    const markedNumbers = new Set(loadedBingoCard?.markedNumbers ?? []);

    if (isMarked) {
      markedNumbers.add(number);
    } else {
      markedNumbers.delete(number);
    }

    return Array.from(markedNumbers).sort((a, b) => a - b);
  });
  vi.mocked(updateMusicPlaylist).mockImplementation(async (link) => ({
    ...musicPlaylist,
    playlistId: link.includes("0JQ5DAqbMKFz6FAsUtgAab")
      ? "0JQ5DAqbMKFz6FAsUtgAab"
      : musicPlaylist.playlistId,
    externalUrl: link.includes("0JQ5DAqbMKFz6FAsUtgAab")
      ? "https://open.spotify.com/playlist/0JQ5DAqbMKFz6FAsUtgAab"
      : musicPlaylist.externalUrl,
    embedUrl: link.includes("0JQ5DAqbMKFz6FAsUtgAab")
      ? "https://open.spotify.com/embed/playlist/0JQ5DAqbMKFz6FAsUtgAab"
      : musicPlaylist.embedUrl,
  }));
  vi.mocked(deleteMusicPlaylist).mockResolvedValue();
  vi.mocked(updateCampLocationLink).mockImplementation(async (link) =>
    link.trim(),
  );
  vi.mocked(deleteCampLocationLink).mockResolvedValue();
  vi.mocked(uploadFestivalDocument).mockImplementation(async (input) => ({
    documentType: input.documentType,
    title: input.title,
    filePath: `current/${input.documentType}/uploaded-${input.file.name}`,
    mimeType: input.file.type,
    updatedAt: "2026-07-03T12:00:00.000Z",
    displayUrl: `https://example.test/uploaded-${input.file.name}`,
  }));
  vi.mocked(deleteFestivalDocument).mockResolvedValue();
  vi.mocked(suggestParticipantAccessCode).mockResolvedValue("NEU23456");
  vi.mocked(createParticipant).mockImplementation(async (input) => ({
    id: input.displayName.toLowerCase().replace(/\s+/g, "-"),
    name: input.displayName.toLowerCase().replace(/\s+/g, "-"),
    displayName: input.displayName,
    accessCode: input.accessCode ?? "NEU23456",
    isAdmin: false,
    isActive: true,
  }));
  vi.mocked(updateParticipant).mockImplementation(async (input) => {
    const participant = loadedAdminParticipants.find(
      (currentParticipant) => currentParticipant.id === input.id,
    );

    if (!participant) {
      throw new Error("Unknown participant");
    }

    return {
      ...participant,
      displayName: input.displayName ?? participant.displayName,
      accessCode: input.accessCode ?? participant.accessCode,
    };
  });
  vi.mocked(updateParticipantAvatar).mockImplementation(async (input) => {
    const participant = loadedParticipants.find(
      (currentParticipant) => currentParticipant.id === input.participantId,
    );

    if (!participant) {
      throw new Error("Unknown participant");
    }

    return {
      ...participant,
      avatarId: input.avatarId,
    };
  });
  vi.mocked(updateOwnProfile).mockImplementation(async (input) => {
    const participant = loadedParticipants[0];

    if (!participant) {
      throw new Error("Unknown participant");
    }

    return {
      ...participant,
      displayName: input.displayName.trim(),
      avatarId: input.avatarId,
    };
  });
  vi.mocked(deactivateParticipant).mockImplementation(async (participantId) => {
    const participant = loadedAdminParticipants.find(
      (currentParticipant) => currentParticipant.id === participantId,
    );

    if (!participant) {
      throw new Error("Unknown participant");
    }

    return { ...participant, isActive: false };
  });
  vi.mocked(reactivateParticipant).mockImplementation(async (participantId) => {
    const participant = loadedAdminParticipants.find(
      (currentParticipant) => currentParticipant.id === participantId,
    );

    if (!participant) {
      throw new Error("Unknown participant");
    }

    return { ...participant, isActive: true };
  });
  vi.mocked(updateCategoryStatus).mockImplementation(
    async (categoryId, status) => {
      const category = loadedCategories.find(
        (currentCategory) => currentCategory.id === categoryId,
      );

      if (!category) {
        throw new Error("Unknown category");
      }

      return { ...category, status };
    },
  );
  vi.mocked(updateCategory).mockImplementation(async (input) => {
    const category = loadedCategories.find(
      (currentCategory) => currentCategory.id === input.id,
    );

    if (!category) {
      throw new Error("Unknown category");
    }

    return {
      ...category,
      title: input.title ?? category.title,
      description: input.description ?? category.description,
      status: input.status ?? category.status,
      sortOrder: input.sortOrder ?? category.sortOrder,
    };
  });
  vi.mocked(createCategory).mockImplementation(async (input) => ({
    id: input.title.toLowerCase().replace(/\s+/g, "-"),
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "upcoming",
    sortOrder: input.sortOrder,
  }));
  vi.mocked(deleteCategory).mockResolvedValue();
  vi.mocked(saveVote).mockImplementation(async (savedVote) => savedVote);
  vi.mocked(updateEventSettings).mockImplementation(
    async (settings) => settings,
  );
  vi.mocked(updateFestivalAccessCode).mockImplementation(async (code) => ({
    code: code.trim().toUpperCase(),
    version: "2026-07-01 10:05:00+00",
  }));
  vi.mocked(archiveFestival).mockResolvedValue(
    "8e560706-5e2f-4b50-9e41-381625fd8102",
  );
  vi.mocked(loadFestivalExportData).mockResolvedValue(exportData);
  vi.mocked(serializeFestivalExport).mockReturnValue(
    '{\n  "formatVersion": 1\n}\n',
  );
  vi.mocked(festivalExportFileName).mockReturnValue(
    "festival-awards-hurricane-awards-2026-2026-07-01.json",
  );
}

async function renderLoadedApp() {
  const view = render(<App />);

  await waitFor(() => {
    expect(screen.getByRole("main")).toBeVisible();
  });

  return view;
}

async function unlockFestivalWith(code = "HURRICANE2026") {
  const user = userEvent.setup();

  await user.type(screen.getByRole("textbox", { name: /^eventcode$/i }), code);
  await user.click(screen.getByRole("button", { name: /event freischalten/i }));

  await waitFor(() => {
    expect(
      screen.queryByRole("heading", { name: /hallo eventcrew/i }) ??
        screen.queryByRole("alert"),
    ).not.toBeNull();
  });

  return user;
}

async function loginWith(code: string) {
  const user = screen.queryByRole("textbox", { name: /^teilnehmercode$/i })
    ? userEvent.setup()
    : await unlockFestivalWith();

  if (!screen.queryByRole("textbox", { name: /^teilnehmercode$/i })) {
    await user.click(screen.getByRole("button", { name: /^profil/i }));
  }

  await user.clear(screen.getByRole("textbox", { name: /^teilnehmercode$/i }));
  await user.type(
    screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
    code,
  );
  await user.click(screen.getByRole("button", { name: /code/i }));

  await waitFor(() => {
    expect(screen.queryByText("Lade...")).not.toBeInTheDocument();
  });

  const votingButton = screen.queryByRole("button", { name: /abstimmungen/i });

  if (votingButton) {
    await user.click(votingButton);
  }

  return user;
}

function sectionForHeading(name: RegExp) {
  const heading = screen.getByRole("heading", { name });
  const section = heading.closest("section");

  expect(section).not.toBeNull();

  return section as HTMLElement;
}

async function switchMainSection(name: RegExp) {
  const user = userEvent.setup();
  const source = name.source.toLowerCase();

  if (source.includes("start")) {
    await user.click(
      screen.getByRole("button", { name: /hurricane awards 2026/i }),
    );

    return user;
  }

  if (!screen.queryByRole("heading", { name: /hallo /i })) {
    await user.click(
      screen.getByRole("button", { name: /hurricane awards 2026/i }),
    );
  }

  const tileName = source.includes("timetable")
    ? /timetable/i
    : source.includes("künstler")
      ? /^künstler/i
    : source.includes("spiele")
      ? /spiele/i
      : source.includes("infos")
        ? /festivalinfos/i
        : source.includes("profil")
          ? /^profil/i
          : source.includes("awards")
            ? /^awards/i
            : source.includes("abstimmung")
              ? /abstimmungen/i
              : name;

  await user.click(
    within(sectionForHeading(/hallo /i)).getByRole("button", {
      name: tileName,
    }),
  );

  return user;
}

async function switchAdminSection(name: RegExp) {
  const user = userEvent.setup();
  const navigation = screen.getByRole("navigation", { name: /adminbereiche/i });

  await user.click(within(navigation).getByRole("button", { name }));

  return user;
}

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

function setStandaloneDisplay(isStandalone: boolean) {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn((query: string) => ({
      matches: query === "(display-mode: standalone)" && isStandalone,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
  });
}

function setQrScannerSupport(scannedValues: string[] = []) {
  const detect = vi.fn(async () => {
    const scannedValue = scannedValues.shift();

    return scannedValue === undefined ? [] : [{ rawValue: scannedValue }];
  });
  class MockBarcodeDetector {
    static getSupportedFormats = vi.fn(async () => ["qr_code"]);

    detect = detect;
  }

  Object.defineProperty(window, "BarcodeDetector", {
    value: MockBarcodeDetector,
    configurable: true,
  });
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: stopCameraTrack }],
      })),
    },
    configurable: true,
  });

  return {
    detect,
    getUserMedia: navigator.mediaDevices.getUserMedia as ReturnType<
      typeof vi.fn
    >,
  };
}

beforeEach(async () => {
  vi.useRealTimers();
  vi.clearAllMocks();
  stopCameraTrack.mockClear();
  window.history.replaceState(null, "", "/");
  setUserAgent(defaultUserAgent);
  setStandaloneDisplay(false);
  Object.defineProperty(window, "BarcodeDetector", {
    value: undefined,
    configurable: true,
  });
  Object.defineProperty(navigator, "mediaDevices", {
    value: undefined,
    configurable: true,
  });
  localStorage.clear();
  sessionStorage.clear();
  await i18n.changeLanguage("de");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  mockLoadedData();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Sprachumschaltung", () => {
  it("schaltet feste UI-Texte auf Niederlaendisch um und speichert die Auswahl", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    await userEvent.click(screen.getByRole("button", { name: /niederl/i }));

    expect(
      await screen.findByRole("main", {
        name: /hurricane awards 2026 met 3 deelnemers/i,
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: /stemming/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /nederlands/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem("hurricane-awards-language")).toBe("nl");
  });

  it("laesst Datenbankinhalte beim Sprachwechsel unveraendert", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    await userEvent.click(screen.getByRole("button", { name: /niederl/i }));

    expect(screen.getByText("Beste Festival-Energie")).toBeVisible();
    expect(screen.getByText("Aktuell offen.")).toBeVisible();
  });
});

describe("PWA Installation", () => {
  it("startet auf unterstuetzten Browsern den nativen Installationsdialog", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };

    Object.defineProperty(installEvent, "prompt", {
      value: prompt,
    });
    Object.defineProperty(installEvent, "userChoice", {
      value: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });

    await renderLoadedApp();

    expect(
      screen.queryByRole("button", { name: /app installieren/i }),
    ).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(installEvent);
    });

    await userEvent.click(
      await screen.findByRole("button", { name: /app installieren/i }),
    );

    expect(prompt).toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /app installieren/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("zeigt auf iOS Safari eine Installationsanleitung", async () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );

    await renderLoadedApp();

    await userEvent.click(
      screen.getByRole("button", { name: /app installieren/i }),
    );

    expect(
      screen.getByText(
        /teilen-symbol antippen und zum home-bildschirm wählen/i,
      ),
    ).toBeVisible();
  });

  it("zeigt im Standalone Modus keinen Installationshinweis", async () => {
    setStandaloneDisplay(true);

    await renderLoadedApp();

    expect(
      screen.queryByRole("button", { name: /app installieren/i }),
    ).not.toBeInTheDocument();
  });

  it("ordnet einen langen Eventnamen und alle Headeraktionen getrennt an", async () => {
    const longFestivalName =
      "Hurricane Freundeskreis Sommerfestival Auszeichnungen";
    const installEvent = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed"; platform: string }>;
    };
    Object.defineProperty(installEvent, "prompt", {
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(installEvent, "userChoice", {
      value: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    });
    mockLoadedData({ loadedFestivalName: longFestivalName });
    await renderLoadedApp();
    await loginWith("ALICE42");

    act(() => {
      window.dispatchEvent(installEvent);
    });

    const header = screen.getByRole("banner");
    const brand = within(header).getByRole("button", {
      name: new RegExp(longFestivalName, "i"),
    });
    const actions = header.querySelector(".app-header__actions");

    expect(brand).toHaveAttribute("title", longFestivalName);
    expect(actions).not.toBeNull();
    expect(
      within(actions as HTMLElement).getByRole("button", {
        name: /app installieren/i,
      }),
    ).toBeVisible();
    expect(
      within(actions as HTMLElement).getByRole("button", { name: /deutsch/i }),
    ).toBeVisible();
    expect(
      within(actions as HTMLElement).getByRole("button", { name: /^admin$/i }),
    ).toBeVisible();
  });
});

describe("Impressum", () => {
  it("ist von der Festivalzugangsansicht erreichbar und zeigt Platzhalterdaten", async () => {
    await renderLoadedApp();

    await userEvent.click(screen.getByRole("link", { name: /^impressum$/i }));

    expect(
      await screen.findByRole("heading", { name: /^impressum$/i }),
    ).toBeVisible();
    expect(screen.getByText("Johannes Aaron Specht")).toBeVisible();
    expect(
      screen.getByText("Hermannstraße 2, 38114 Braunschweig, Deutschland"),
    ).toBeVisible();
    expect(screen.getByText("specht.johannes@gmx.de")).toBeVisible();
    expect(screen.getByRole("link", { name: /zurück zur app/i })).toBeVisible();
  });

  it("ruft bei der Ruecknavigation die Browser-Historie auf", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});

    window.history.pushState(null, "", "/#impressum");
    render(<App />);

    await userEvent.click(
      await screen.findByRole("link", { name: /zurück zur app/i }),
    );

    expect(back).toHaveBeenCalled();
  });

  it("ist auch nach dem Login ueber den Footer erreichbar", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(screen.getByRole("link", { name: /^impressum$/i })).toBeVisible();
  });
});

describe("Datenschutz", () => {
  it("ist von der Festivalzugangsansicht erreichbar und zeigt die Pflichtabschnitte", async () => {
    await renderLoadedApp();

    await userEvent.click(screen.getByRole("link", { name: /^datenschutz$/i }));

    expect(
      await screen.findByRole("heading", { name: /^datenschutzerklärung$/i }),
    ).toBeVisible();

    for (const heading of [
      "Verantwortlicher",
      "Verarbeitete Daten",
      "Zweck der Verarbeitung",
      "Rechtsgrundlage",
      "Speicherdauer",
      "Nutzung von Supabase",
      "Rechte betroffener Personen",
      "Kontaktmöglichkeit",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }

    expect(screen.getByText(/Johannes Aaron Specht/i)).toBeVisible();
    expect(
      screen.getByText(/Hermannstraße 2, 38114 Braunschweig, Deutschland/i),
    ).toBeVisible();
    expect(
      screen.getAllByText(/specht.johannes@gmx.de/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/supabase als backend/i)).toBeVisible();
    expect(screen.getByRole("link", { name: /zurück zur app/i })).toBeVisible();
  });

  it("ruft bei der Ruecknavigation die Browser-Historie auf", async () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});

    window.history.pushState(null, "", "/#datenschutz");
    render(<App />);

    await userEvent.click(
      await screen.findByRole("link", { name: /zurück zur app/i }),
    );

    expect(back).toHaveBeenCalled();
  });

  it("ist auch nach dem Login ueber den Footer erreichbar", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(screen.getByRole("link", { name: /^datenschutz$/i })).toBeVisible();
  });
});

describe("Login", () => {
  it("zeigt vor der Eventfreischaltung nur Eventname und Eventcodeformular", async () => {
    await renderLoadedApp();

    expect(
      await screen.findByRole("heading", { name: "Hurricane Awards 2026" }),
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: /^eventcode$/i })).toBeVisible();
    expect(
      screen.getByRole("button", { name: /event freischalten/i }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /abstimmung/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /ergebnisse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /gesamtclassement/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^admin$/i }),
    ).not.toBeInTheDocument();
    expect(loadParticipants).not.toHaveBeenCalled();
    expect(loadVotes).not.toHaveBeenCalled();
    expect(loadAllTimeStandings).not.toHaveBeenCalled();
    expect(loadEventSettings).toHaveBeenCalled();
  });

  it("zeigt nach gueltigem Eventcode das Dashboard und speichert die Freischaltung", async () => {
    await renderLoadedApp();

    await unlockFestivalWith(" hurricane2026 ");

    expect(localStorage.getItem(festivalAccessStorageKey)).toBe(
      JSON.stringify({ version: festivalAccessVersion }),
    );
    expect(verifyFestivalAccessCode).toHaveBeenCalledWith("HURRICANE2026");
    expect(
      await screen.findByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();
    expect(screen.getAllByText("Hurricane Awards 2026").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("textbox", { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument();
    expect(loadParticipants).not.toHaveBeenCalled();
    expect(loadVotes).not.toHaveBeenCalled();
  });

  it("behaelt die manuelle Eventcode Eingabe neben der Scan-Funktion bei", async () => {
    setQrScannerSupport();
    await renderLoadedApp();

    expect(screen.getByRole("textbox", { name: /^eventcode$/i })).toBeVisible();
    expect(
      await screen.findByRole("button", { name: /qr-code scannen/i }),
    ).toBeEnabled();

    await unlockFestivalWith("HURRICANE2026");

    expect(
      await screen.findByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();
  });

  it("behandelt nicht verfuegbare QR-Scan-Unterstuetzung verstaendlich", async () => {
    await renderLoadedApp();

    expect(
      await screen.findByRole("button", { name: /qr-code scannen/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/qr-code scannen ist auf diesem ger/i),
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: /^eventcode$/i })).toBeVisible();
  });

  it("uebernimmt einen gueltigen QR-Scan als Eventcode", async () => {
    const qrScanner = setQrScannerSupport(["HURRICANE2026"]);
    await renderLoadedApp();

    await userEvent.click(
      await screen.findByRole("button", { name: /qr-code scannen/i }),
    );

    expect(qrScanner.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
      audio: false,
    });
    expect(
      await screen.findByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();
    expect(verifyFestivalAccessCode).toHaveBeenCalledWith("HURRICANE2026");
    expect(stopCameraTrack).toHaveBeenCalled();
  });

  it("zeigt bei ungueltigem QR-Scan eine Fehlermeldung und erlaubt neue Eingaben", async () => {
    setQrScannerSupport(["FALSCH"]);
    await renderLoadedApp();

    await userEvent.click(
      await screen.findByRole("button", { name: /qr-code scannen/i }),
    );

    expect(await screen.findByText(/qr-code enth/i)).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^eventcode$/i })).toHaveValue(
      "FALSCH",
    );
    expect(
      screen.getByRole("button", { name: /qr-code scannen/i }),
    ).toBeEnabled();
  });

  it("macht nach erfolgreichem QR-Scan die Teilnehmercode Eingabe erreichbar", async () => {
    setQrScannerSupport([" hurricane2026 "]);
    await renderLoadedApp();

    await userEvent.click(
      await screen.findByRole("button", { name: /qr-code scannen/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /^profil/i }));

    const participantCodeInput = await screen.findByRole("textbox", {
      name: /^teilnehmercode$/i,
    });

    expect(participantCodeInput).toBeVisible();
    expect(loadParticipants).not.toHaveBeenCalled();
  });

  it("verhindert Zugriff mit ungueltigem Eventcode", async () => {
    await renderLoadedApp();

    await unlockFestivalWith("FALSCH");

    expect(screen.getByRole("alert")).toHaveTextContent(
      /eventcode ist ungültig/i,
    );
    expect(localStorage.getItem(festivalAccessStorageKey)).toBeNull();
    expect(
      screen.queryByRole("textbox", { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /abstimmung/i }),
    ).not.toBeInTheDocument();
    expect(loadParticipants).not.toHaveBeenCalled();
    expect(loadVotes).not.toHaveBeenCalled();
    expect(loadAllTimeStandings).not.toHaveBeenCalled();
  });

  it("ueberspringt den Eventcode nach gespeicherter Freischaltung", async () => {
    localStorage.setItem(
      festivalAccessStorageKey,
      JSON.stringify({ version: festivalAccessVersion }),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: /^eventcode$/i }),
    ).not.toBeInTheDocument();
  });

  it("zeigt nicht angemeldet den Profilbereich mit Loginueberschrift", async () => {
    await renderLoadedApp();

    const user = await unlockFestivalWith();
    await user.click(screen.getByRole("button", { name: /^profil/i }));

    const profileSection = sectionForHeading(/mit teilnehmercode anmelden/i);

    expect(
      within(profileSection).getByText(/profil, abstimmungen/i),
    ).toBeVisible();
    expect(
      within(profileSection).getByRole("textbox", {
        name: /^teilnehmercode$/i,
      }),
    ).toBeVisible();
    expect(
      within(profileSection).queryByRole("heading", { name: /dein profil/i }),
    ).not.toBeInTheDocument();
  });

  it("zeigt nach der Anmeldung den Profilbereich mit Name und Avatar", async () => {
    await renderLoadedApp();
    const user = await unlockFestivalWith();

    await user.click(screen.getByRole("button", { name: /^profil/i }));
    await user.type(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      "ALICE42",
    );
    await user.click(screen.getByRole("button", { name: /code/i }));
    await user.click(screen.getByRole("button", { name: /^profil/i }));

    const profileSection = sectionForHeading(/dein profil/i);

    expect(
      await within(profileSection).findByRole("heading", { name: "Alice" }),
    ).toBeVisible();
    expect(
      within(profileSection).getAllByRole("img", {
        name: "Alice: Camp Sunrise",
      })[0],
    ).toBeVisible();
    expect(
      within(profileSection).queryByRole("heading", {
        name: /mit teilnehmercode anmelden/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("zeigt den aktuellen Namen und speichert einen neuen Anzeigenamen", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    const nameInput = screen.getByRole("textbox", {
      name: /angezeigter name/i,
    });
    const saveButton = screen.getByRole("button", {
      name: /nderungen speichern/i,
    });

    expect(nameInput).toHaveValue("Alice");
    expect(saveButton).toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, "Alicia");
    await user.click(saveButton);

    expect(updateOwnProfile).toHaveBeenCalledWith(
      { displayName: "Alicia", avatarId: "camp-sunrise" },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await screen.findByRole("heading", { name: "Alicia" }),
    ).toBeVisible();
    expect(screen.getByText(/profil wurde gespeichert/i)).toBeVisible();
    expect(
      sessionStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toContain('"displayName":"Alicia"');

    await user.click(screen.getByRole("button", { name: /zur dashboard/i }));
    expect(
      screen.getByRole("heading", { name: /hallo alicia/i }),
    ).toBeVisible();
  });

  it("trimmt den Anzeigenamen vor dem Speichern", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    const nameInput = screen.getByRole("textbox", {
      name: /angezeigter name/i,
    });
    await user.clear(nameInput);
    await user.type(nameInput, "  Alicia  ");
    await user.click(
      screen.getByRole("button", { name: /nderungen speichern/i }),
    );

    expect(updateOwnProfile).toHaveBeenCalledWith(
      { displayName: "Alicia", avatarId: "camp-sunrise" },
      { participantAccessCode: "ALICE42" },
    );
    expect(nameInput).toHaveValue("Alicia");
  });

  it("lehnt einen leeren Anzeigenamen ab und begrenzt die Eingabe auf 50 Zeichen", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    const nameInput = screen.getByRole("textbox", {
      name: /angezeigter name/i,
    });
    const saveButton = screen.getByRole("button", {
      name: /nderungen speichern/i,
    });

    expect(nameInput).toHaveAttribute("maxlength", "50");
    await user.clear(nameInput);
    await user.type(nameInput, "   ");
    await user.click(saveButton);

    expect(updateOwnProfile).not.toHaveBeenCalled();
    expect(screen.getByText(/name darf nicht leer sein/i)).toBeVisible();

    await user.clear(nameInput);
    await user.type(nameInput, "A".repeat(51));
    expect(nameInput).toHaveValue("A".repeat(50));
  });

  it("deaktiviert das Speichern waehrend der Anfrage und verhindert Doppel-Submits", async () => {
    let resolveProfileUpdate!: (participant: Participant) => void;
    vi.mocked(updateOwnProfile).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveProfileUpdate = resolve;
        }),
    );
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    const nameInput = screen.getByRole("textbox", {
      name: /angezeigter name/i,
    });
    await user.clear(nameInput);
    await user.type(nameInput, "Alicia");
    await user.click(
      screen.getByRole("button", { name: /nderungen speichern/i }),
    );

    const savingButton = screen.getByRole("button", {
      name: /wird gespeichert/i,
    });
    expect(savingButton).toBeDisabled();
    await user.click(savingButton);
    expect(updateOwnProfile).toHaveBeenCalledTimes(1);

    resolveProfileUpdate({
      ...participants[0],
      displayName: "Alicia",
      avatarId: "camp-sunrise",
    });
    expect(await screen.findByText(/profil wurde gespeichert/i)).toBeVisible();
  });

  it("zeigt einen verstaendlichen Fehler, wenn das Profil nicht gespeichert wird", async () => {
    vi.mocked(updateOwnProfile).mockRejectedValueOnce(new Error("save failed"));
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    const nameInput = screen.getByRole("textbox", {
      name: /angezeigter name/i,
    });
    await user.clear(nameInput);
    await user.type(nameInput, "Alicia");
    await user.click(
      screen.getByRole("button", { name: /nderungen speichern/i }),
    );

    expect(
      await screen.findByText(/profil konnte nicht gespeichert werden/i),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Alice" })).toBeVisible();
  });

  it("zeigt nach der Anmeldung ein persoenliches Dashboard statt der alten Hero Startansicht", async () => {
    await renderLoadedApp();
    const user = await unlockFestivalWith();

    await user.click(screen.getByRole("button", { name: /^profil/i }));
    await user.type(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      "ALICE42",
    );
    await user.click(screen.getByRole("button", { name: /code/i }));

    expect(
      await screen.findByRole("heading", { name: /hallo alice/i }),
    ).toBeVisible();
    expect(screen.getAllByText("Hurricane Awards 2026").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByText(/knallharter wettbewerb/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^zur abstimmung$/i }),
    ).not.toBeInTheDocument();
  });

  it("zeigt Dashboard Kacheln mit Status und navigiert in alle Hauptbereiche", async () => {
    mockLoadedData({
      loadedBingoCard: bingoCard,
      loadedFestivalDocuments: festivalDocuments,
      loadedCampLocationLink: "https://maps.example.test/camp",
      loadedMusicPlaylist: musicPlaylist,
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    const user = await unlockFestivalWith();

    await user.click(screen.getByRole("button", { name: /^profil/i }));
    await user.type(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      "ALICE42",
    );
    await user.click(screen.getByRole("button", { name: /code/i }));

    const dashboardSection = sectionForHeading(/hallo alice/i);
    const dashboardHero =
      within(dashboardSection).getByTestId("dashboard-hero");

    expect(
      screen.queryByRole("navigation", { name: /hauptbereiche/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hurricane awards 2026/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /deutsch/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^admin$/i })).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /^awards/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /abstimmungen/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /^profil/i }),
    ).toBeVisible();
    const awardsTile = within(dashboardSection).getByRole("button", {
      name: /^awards/i,
    });
    expect(
      dashboardHero.compareDocumentPosition(awardsTile) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const timetableTile = within(dashboardSection).getByRole("button", {
      name: /timetable/i,
    });
    const artistsTile = within(dashboardSection).getByRole("button", {
      name: /^künstler/i,
    });
    const gamesTile = within(dashboardSection).getByRole("button", {
      name: /spiele/i,
    });
    const infoTile = within(dashboardSection).getByRole("button", {
      name: /festivalinfos/i,
    });
    const votingTile = within(dashboardSection).getByRole("button", {
      name: /abstimmungen/i,
    });
    const profileTile = within(dashboardSection).getByRole("button", {
      name: /^profil/i,
    });

    await waitFor(() => {
      expect(awardsTile).toHaveTextContent(/2/);
      expect(awardsTile).toHaveTextContent(/gesamtclassement/i);
      expect(timetableTile).toHaveTextContent(/1/);
      expect(artistsTile).toHaveTextContent(/2/);
      expect(gamesTile).toHaveTextContent(/bingo/i);
      expect(infoTile).toHaveTextContent(/4/);
      expect(votingTile).toHaveTextContent(/1/);
    });
    expect(profileTile).toHaveTextContent(/alice/i);
    expect(
      within(dashboardSection).getByRole("img", {
        name: "Alice: Camp Sunrise",
      }),
    ).toBeVisible();

    await user.click(awardsTile);
    expect(screen.getByRole("heading", { name: /^awards$/i })).toBeVisible();
    expect(window.location.hash).toBe("#awards");
    expect(
      screen.queryByRole("heading", { name: /abstimmungen/i }),
    ).not.toBeInTheDocument();

    await switchMainSection(/^start$/i);
    await user.click(
      within(sectionForHeading(/hallo alice/i)).getByRole("button", {
        name: /timetable/i,
      }),
    );
    expect(screen.getByRole("heading", { name: /^timetable$/i })).toBeVisible();

    await switchMainSection(/^start$/i);
    await user.click(
      within(sectionForHeading(/hallo alice/i)).getByRole("button", {
        name: /^künstler/i,
      }),
    );
    expect(screen.getByRole("heading", { name: /^künstler$/i })).toBeVisible();
    expect(window.location.hash).toBe("#artists");
    await user.click(screen.getByRole("button", { name: "The Headliners" }));
    expect(window.location.hash).toBe("#artists/act-1");
    expect(screen.getByRole("heading", { name: /^künstler$/i })).toBeVisible();

    await switchMainSection(/^start$/i);
    await user.click(
      within(sectionForHeading(/hallo alice/i)).getByRole("button", {
        name: /spiele/i,
      }),
    );
    expect(screen.getByRole("heading", { name: /^spiele$/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /^bingo$/i })).toBeVisible();

    await switchMainSection(/^start$/i);
    await user.click(
      within(sectionForHeading(/hallo alice/i)).getByRole("button", {
        name: /festivalinfos/i,
      }),
    );
    expect(screen.getByRole("heading", { name: /^infos$/i })).toBeVisible();

    await switchMainSection(/^start$/i);
    await user.click(
      within(sectionForHeading(/hallo alice/i)).getByRole("button", {
        name: /abstimmungen/i,
      }),
    );
    expect(
      screen.getByRole("heading", { name: /^abstimmungen$/i }),
    ).toBeVisible();
    expect(window.location.hash).toBe("#voting");
    expect(
      screen.queryByRole("heading", { name: /^awards$/i }),
    ).not.toBeInTheDocument();

    await switchMainSection(/^start$/i);
    await user.click(
      within(sectionForHeading(/hallo alice/i)).getByRole("button", {
        name: /^profil/i,
      }),
    );
    expect(screen.getByRole("heading", { name: /dein profil/i })).toBeVisible();
  });

  it("ermoeglicht aus allen Hauptbereichen die Rueckkehr zum Dashboard", async () => {
    mockLoadedData({
      loadedBingoCard: bingoCard,
      loadedFestivalDocuments: festivalDocuments,
      loadedCampLocationLink: "https://maps.example.test/camp",
      loadedMusicPlaylist: musicPlaylist,
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    const user = await unlockFestivalWith();

    await user.click(screen.getByRole("button", { name: /^profil/i }));
    await user.type(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      "ALICE42",
    );
    await user.click(screen.getByRole("button", { name: /code/i }));

    async function expectDashboardReturn(
      tileName: RegExp,
      destinationHeading: RegExp,
    ) {
      const dashboardSection = sectionForHeading(/hallo alice/i);

      await user.click(
        within(dashboardSection).getByRole("button", { name: tileName }),
      );
      expect(
        await screen.findByRole("heading", { name: destinationHeading }),
      ).toBeVisible();

      await user.click(
        screen.getByRole("button", { name: /zur dashboard-übersicht/i }),
      );
      expect(
        await screen.findByRole("heading", { name: /hallo alice/i }),
      ).toBeVisible();
    }

    await expectDashboardReturn(/^awards/i, /^awards$/i);
    await expectDashboardReturn(/^timetable/i, /^timetable$/i);
    await expectDashboardReturn(/^spiele/i, /^spiele$/i);
    await expectDashboardReturn(/^festivalinfos/i, /^infos$/i);
    await expectDashboardReturn(/^abstimmungen/i, /^abstimmungen$/i);
    await expectDashboardReturn(/^profil/i, /dein profil/i);
  });

  it("trennt Abstimmungen und Awards in Inhalt und Hash Route", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(window.location.hash).toBe("#voting");
    expect(screen.getByLabelText(/stimme geht an/i)).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: /gesamtclassement/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /ergebnisse/i }),
    ).not.toBeInTheDocument();

    await switchMainSection(/awards/i);

    expect(window.location.hash).toBe("#awards");
    expect(screen.getByRole("heading", { name: /^awards$/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: /ergebnisse/i })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /gesamtclassement/i }),
    ).toBeVisible();
    expect(screen.queryByLabelText(/stimme geht an/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /stimme abgeben/i }),
    ).not.toBeInTheDocument();
  });

  it("unterstuetzt direkte Voting und Awards Routen sowie Browsernavigation", async () => {
    localStorage.setItem(
      festivalAccessStorageKey,
      JSON.stringify({ version: festivalAccessVersion }),
    );
    sessionStorage.setItem(
      "hurricane-awards:hurricane-awards-2026:participant",
      JSON.stringify(participants[0]),
    );
    window.location.hash = "#voting";

    render(<App />);
    expect(
      await screen.findByRole("heading", { name: /^abstimmungen$/i }),
    ).toBeVisible();

    window.location.hash = "#awards";
    expect(
      await screen.findByRole("heading", { name: /^awards$/i }),
    ).toBeVisible();

    window.location.hash = "#voting";
    expect(
      await screen.findByRole("heading", { name: /^abstimmungen$/i }),
    ).toBeVisible();
  });

  it("zeigt das Dashboard auch nicht angemeldet sinnvoll an", async () => {
    await renderLoadedApp();
    const user = await unlockFestivalWith();

    const dashboardSection = sectionForHeading(/hallo eventcrew/i);

    expect(
      within(dashboardSection).getByText("Hurricane Awards 2026"),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /timetable/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /spiele/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /festivalinfos/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /abstimmungen/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /^awards/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getByRole("button", { name: /^profil/i }),
    ).toBeVisible();
    expect(
      within(dashboardSection).getAllByText(
        /melde dich mit deinem teilnehmercode/i,
      ).length,
    ).toBeGreaterThan(0);

    await user.click(
      within(dashboardSection).getByRole("button", { name: /timetable/i }),
    );

    expect(
      screen.getByRole("heading", { name: /mit teilnehmercode anmelden/i }),
    ).toBeVisible();
  });

  it("erlaubt Zugriff mit gueltigem Teilnehmercode", async () => {
    await renderLoadedApp();

    await loginWith(" alice42 ");
    await switchMainSection(/profil/i);

    const identitySection = sectionForHeading(/dein profil/i);
    expect(
      await within(identitySection).findByText(/angemeldet als:/i),
    ).toBeVisible();
    expect(within(identitySection).getByText("Alice")).toBeVisible();
    expect(loginParticipant).toHaveBeenCalledWith("ALICE42");
    expect(loadVotesForParticipant).toHaveBeenCalledWith("alice", {
      participantAccessCode: "ALICE42",
    });
    expect(
      localStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toBeNull();
    expect(
      sessionStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toContain('"accessCode":"ALICE42"');
  });

  it("zeigt fuer Teilnehmer ohne gespeicherten Avatar den Default Avatar", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    await user.click(screen.getByRole("button", { name: /avatar ausw/i }));

    const selectedAvatarButton = screen.getByRole("button", {
      name: /avatar camp sunrise ausw/i,
    });

    expect(
      screen.getAllByRole("img", { name: "Alice: Camp Sunrise" })[0],
    ).toBeVisible();
    expect(selectedAvatarButton).toHaveAttribute("aria-pressed", "true");
    expect(selectedAvatarButton).toHaveClass("is-selected");
    expect(within(selectedAvatarButton).getByText(/ausgew/i)).toBeVisible();
  });

  it("zeigt die Avatar Auswahl im Profil", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    const toggle = screen.getByRole("button", { name: /avatar ausw/i });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: /avatar neon tent ausw/i }),
    ).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("heading", { name: /avatar ausw/i })).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: /avatar .* ausw/i }).length,
    ).toBeGreaterThanOrEqual(50);
    expect(
      screen.getAllByRole("img", { name: /: / }).length,
    ).toBeGreaterThanOrEqual(50);
  });

  it("speichert einen geaenderten Avatar und hebt ihn hervor", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await switchMainSection(/profil/i);

    await user.click(screen.getByRole("button", { name: /avatar ausw/i }));

    const previousAvatarButton = screen.getByRole("button", {
      name: /avatar camp sunrise ausw/i,
    });
    expect(previousAvatarButton).toHaveClass("is-selected");

    await user.click(
      screen.getByRole("button", { name: /avatar neon tent ausw/i }),
    );

    expect(
      screen.queryByRole("button", { name: /avatar neon tent ausw/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /nderungen speichern/i }),
    );

    expect(updateOwnProfile).toHaveBeenCalledWith(
      { displayName: "Alice", avatarId: "neon-tent" },
      { participantAccessCode: "ALICE42" },
    );

    await user.click(screen.getByRole("button", { name: /avatar ausw/i }));
    const selectedAvatarButton = await screen.findByRole("button", {
      name: /avatar neon tent ausw/i,
      pressed: true,
    });

    expect(selectedAvatarButton).toBeVisible();
    expect(selectedAvatarButton).toHaveClass("is-selected");
    expect(within(selectedAvatarButton).getByText(/ausgew/i)).toBeVisible();
    const updatedPreviousAvatarButton = screen.getByRole("button", {
      name: /avatar camp sunrise ausw/i,
    });
    expect(updatedPreviousAvatarButton).not.toHaveClass("is-selected");
    expect(updatedPreviousAvatarButton).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(
      within(updatedPreviousAvatarButton).queryByText(/ausgew/i),
    ).not.toBeInTheDocument();
    expect(
      sessionStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toContain('"avatarId":"neon-tent"');
  });

  it("hebt den gespeicherten Avatar nach erneutem Laden hervor", async () => {
    localStorage.setItem(
      festivalAccessStorageKey,
      JSON.stringify({ version: festivalAccessVersion }),
    );
    sessionStorage.setItem(
      "hurricane-awards:hurricane-awards-2026:participant",
      JSON.stringify({ ...participants[0], avatarId: "neon-tent" }),
    );

    render(<App />);
    await switchMainSection(/profil/i);

    await userEvent.click(screen.getByRole("button", { name: /avatar ausw/i }));

    const selectedAvatarButton = await screen.findByRole("button", {
      name: /avatar neon tent ausw/i,
      pressed: true,
    });

    expect(selectedAvatarButton).toHaveClass("is-selected");
    expect(within(selectedAvatarButton).getByText(/ausgew/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /avatar camp sunrise ausw/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("zeigt Avatare zusammen mit Teilnehmernamen in Ergebnislisten", async () => {
    mockLoadedData({
      loadedParticipants: [
        participants[0],
        { ...participants[1], avatarId: "neon-tent" },
        participants[2],
      ],
      loadedVotes: [vote({ votedForId: "bob" })],
    });

    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/awards/i);

    const resultsSection = sectionForHeading(/ergebnisse/i);

    expect(
      within(resultsSection).getAllByRole("img", {
        name: "Bob: Neon Tent",
      }).length,
    ).toBeGreaterThan(0);
  });

  it("nutzt das Dashboard als zentrale Navigation ohne horizontale Hauptnavigation", async () => {
    mockLoadedData({ loadedBingoCard: bingoCard });
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(screen.getByRole("heading", { name: /abstimmung/i })).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: /hauptbereiche/i }),
    ).not.toBeInTheDocument();

    await switchMainSection(/^timetable$/i);

    expect(screen.getByRole("heading", { name: /^timetable$/i })).toBeVisible();

    await switchMainSection(/^spiele$/i);

    expect(screen.getByRole("heading", { name: /^spiele$/i })).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: /spielauswahl/i }),
    ).toBeVisible();
    expect(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^bingo$/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: /^bingo$/i })).toBeVisible();
    expect(screen.getByText(/jede person erhält automatisch/i)).toBeVisible();
    expect(
      screen.getByText(/ziehung findet außerhalb der app statt/i),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: /abstimmung/i }),
    ).not.toBeInTheDocument();

    await switchMainSection(/^infos$/i);

    expect(screen.getByRole("heading", { name: /^infos$/i })).toBeVisible();

    await switchMainSection(/^profil$/i);

    expect(screen.getByText(/angemeldet als:/i)).toBeVisible();
  });

  it("zeigt Spiele ohne aktive Runde mit Hinweis und ohne Bingo Hauptnavpunkt", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(
      screen.queryByRole("navigation", { name: /hauptbereiche/i }),
    ).not.toBeInTheDocument();

    await switchMainSection(/^spiele$/i);

    expect(screen.getByRole("heading", { name: /^spiele$/i })).toBeVisible();
    expect(screen.getByText(/aktuell ist kein spiel aktiv/i)).toBeVisible();
  });

  it("zeigt Pferderennen und speichert eine Wette waehrend offener Wettphase", async () => {
    mockLoadedData({
      loadedHorseRacingState: {
        ...disabledHorseRacingState,
        isEnabled: true,
        bettingStatus: "open",
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^pferderennen$/i }),
    );

    expect(screen.getByText(/die wettphase ist offen/i)).toBeVisible();

    const heartsButton = screen.getByRole("button", { name: /herz/i });

    await userEvent.click(heartsButton);

    expect(saveHorseRacingBet).toHaveBeenCalledWith(
      "hurricane-awards-2026",
      "hearts",
      { participantAccessCode: "ALICE42" },
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /herz.*ausgewählt/i }),
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("zeigt eine geschlossene Pferderennen Wette, ohne Aenderungen zu erlauben", async () => {
    mockLoadedData({
      loadedHorseRacingState: {
        ...disabledHorseRacingState,
        isEnabled: true,
        bettingStatus: "closed",
        selectedSuit: "spades",
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^pferderennen$/i }),
    );

    expect(screen.getByText(/deine auswahl ist gespeichert/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /pik.*ausgewählt/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /herz/i })).toBeDisabled();
    expect(saveHorseRacingBet).not.toHaveBeenCalled();
  });

  it("zeigt Teilnehmenden nur die eigene zufaellige Zuordnung", async () => {
    mockLoadedData({
      loadedRandomPairingAssignments: [randomPairingAssignment],
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^zuordnungen$/i }),
    );

    expect(
      screen.getByRole("heading", { name: /dein secret buddy/i }),
    ).toBeVisible();
    expect(screen.getByText("Getraenk holen")).toBeVisible();
    expect(screen.getByText("Bob")).toBeVisible();
    expect(screen.queryByText("Carla")).not.toBeInTheDocument();
    expect(loadRandomPairingAssignments).toHaveBeenCalledWith(
      "hurricane-awards-2026",
      { participantAccessCode: "ALICE42" },
    );
  });

  it("zeigt einen Hinweis, wenn keine zufaellige Zuordnung existiert", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^zuordnungen$/i }),
    );

    expect(screen.getByText(/keine zuordnung für dich/i)).toBeVisible();
  });

  it("zeigt Turniere und den KO Baum fuer Teilnehmende", async () => {
    mockLoadedData({
      loadedTournaments: [tournament],
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^turniere$/i }),
    );

    expect(screen.getByRole("heading", { name: /^turniere$/i })).toBeVisible();
    expect(screen.getByText("Kicker Cup")).toBeVisible();
    expect(screen.getByText(/2 teilnehmende/i)).toBeVisible();
    expect(screen.getByText(/finale/i)).toBeVisible();
    expect(screen.queryByText(/freilos/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(loadTournaments).toHaveBeenCalledWith("hurricane-awards-2026", {
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt Freilose ohne Offen gegen Offen Begegnungen", async () => {
    const sevenParticipantTournament: Tournament = {
      ...tournament,
      id: "tournament-7",
      name: "Sieben Cup",
      selectedParticipantIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
      drawParticipantIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
      bracket: generateTournamentBracket(
        Array.from({ length: 7 }, (_, index) => ({
          participantId: `p${index + 1}`,
          participantName: `Person ${index + 1}`,
        })),
      ),
    };

    mockLoadedData({
      loadedTournaments: [sevenParticipantTournament],
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^turniere$/i }),
    );

    expect(screen.getByText(/freilos: person 7/i)).toBeVisible();
    expect(screen.getAllByText(/^offen$/i)).toHaveLength(1);
    for (const match of document.querySelectorAll(".tournament-match")) {
      const openSlots = match.textContent?.match(/Offen/g) ?? [];
      expect(openSlots.length).toBeLessThan(2);
    }
  });

  it("zeigt einen Leerzustand, wenn keine Turniere existieren", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: /spielauswahl/i }),
      ).getByRole("button", { name: /^turniere$/i }),
    );

    expect(screen.getByText(/noch keine turniere/i)).toBeVisible();
  });

  it("laedt die Timetable Basisdaten und zeigt einen leeren vorbereiteten Bereich", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(loadTimetable).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });

    await switchMainSection(/^timetable$/i);

    expect(screen.getByText(/noch keine auftritte hinterlegt/i)).toBeVisible();
  });

  it("zeigt einen Hinweis, wenn im Timetable keine Auftritte vorhanden sind", async () => {
    mockLoadedData({
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: [],
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);

    expect(
      within(timetableSection).getByText(/noch keine auftritte hinterlegt/i),
    ).toBeVisible();
    expect(
      within(timetableSection).queryByRole("heading", { name: "Freitag" }),
    ).not.toBeInTheDocument();
    expect(
      within(timetableSection).queryByRole("heading", { name: "Samstag" }),
    ).not.toBeInTheDocument();
  });

  it("zeigt den Timetable nach Tagen, Buehnen und Uhrzeiten gruppiert", async () => {
    mockLoadedData({
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);

    expect(
      within(timetableSection).getByRole("heading", { name: "Freitag" }),
    ).toBeVisible();
    expect(within(timetableSection).getByText("2026-06-19")).toBeVisible();
    expect(
      within(timetableSection).getByRole("columnheader", {
        name: "Mainstage",
      }),
    ).toBeVisible();
    expect(
      within(timetableSection)
        .getByRole("columnheader", { name: "Mainstage" })
        .style.getPropertyValue("--stage-color"),
    ).toBe("#ff006e");
    expect(
      within(timetableSection).getByRole("columnheader", {
        name: "Tent Stage",
      }),
    ).toBeVisible();
    expect(
      within(timetableSection)
        .getByRole("columnheader", { name: "Tent Stage" })
        .style.getPropertyValue("--stage-color"),
    ).toBe("");
    expect(
      within(timetableSection).getByRole("rowheader", { name: "20:00" }),
    ).toBeVisible();

    const performanceTitle = within(timetableSection).getByRole("heading", {
      name: "The Headliners",
    });
    const performanceCard = performanceTitle.closest("article");

    expect(performanceCard).toHaveStyle("grid-column: 2");
    expect(performanceCard).toHaveStyle("grid-row: 2 / 3");
    expect(within(timetableSection).getByText("20:00 - 21:00")).toBeVisible();
    expect(
      within(timetableSection).getByText(/Gro.e Gitarren und gro.e Gef.hle/i),
    ).toBeVisible();
    expect(
      within(timetableSection).queryByRole("heading", { name: "Samstag" }),
    ).not.toBeInTheDocument();
    expect(
      within(timetableSection).queryByText(/an diesem tag sind noch keine/i),
    ).not.toBeInTheDocument();
    expect(
      within(timetableSection).getByText(/seitlich scrollen/i),
    ).toBeVisible();
  });

  it("erhaelt die chronologische Reihenfolge der Timetable Tage mit Auftritten", async () => {
    const sundayPerformance: TimetablePerformance = {
      id: "performance-2",
      festivalDayId: "day-3",
      stageId: "stage-2",
      actId: "act-2",
      startsAt: "2026-06-21T18:00:00.000Z",
      endsAt: "2026-06-21T19:00:00.000Z",
    };

    mockLoadedData({
      loadedTimetable: {
        festivalDays: [
          ...festivalDays,
          {
            id: "day-3",
            date: "2026-06-21",
            label: "Sonntag",
            sortOrder: 3,
          },
        ],
        stages: timetableStages,
        acts: timetableActs,
        performances: [...timetablePerformances, sundayPerformance],
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);
    const fridayHeading = within(timetableSection).getByRole("heading", {
      name: "Freitag",
    });
    const sundayHeading = within(timetableSection).getByRole("heading", {
      name: "Sonntag",
    });

    expect(
      within(timetableSection).queryByRole("heading", { name: "Samstag" }),
    ).not.toBeInTheDocument();
    expect(
      fridayHeading.compareDocumentPosition(sundayHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("stellt viele Buehnen und lange Act Namen in einem horizontalen Raster dar", async () => {
    const manyStages = Array.from({ length: 7 }, (_, index) => ({
      id: `stage-${index + 1}`,
      name: `Sehr lange Bühne ${index + 1}`,
      sortOrder: index + 1,
      color: index === 0 ? "#3a86ff" : null,
    }));
    const longActName =
      "Ein aussergewoehnlich langer Act Name mit sehr vielen Woertern";

    mockLoadedData({
      loadedTimetable: {
        festivalDays,
        stages: manyStages,
        acts: [
          {
            id: "act-long",
            name: longActName,
            description: "Beschreibung mit längerem Text für mobile Karten.",
          },
        ],
        performances: [
          {
            ...timetablePerformances[0],
            actId: "act-long",
            stageId: "stage-7",
          },
        ],
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);
    const grid = timetableSection.querySelector(".timetable-grid__inner");

    expect(grid).toHaveStyle("min-width: calc(76px + 7 * 180px)");
    expect(
      within(timetableSection).getByRole("columnheader", {
        name: "Sehr lange Bühne 7",
      }),
    ).toBeVisible();
    expect(
      within(timetableSection).getByRole("heading", { name: longActName }),
    ).toBeVisible();
  });

  it("hebt favorisierte Timetable Auftritte sichtbar hervor", async () => {
    mockLoadedData({
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
        favoritePerformanceIds: ["performance-1"],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);
    const performanceTitle = within(timetableSection).getByRole("heading", {
      name: "The Headliners",
    });
    const performanceCard = performanceTitle.closest("article");

    expect(performanceCard).toHaveClass("timetable-performance--favorite");
    expect(
      within(performanceCard as HTMLElement).getByText("Favorit"),
    ).toBeVisible();
    expect(
      within(performanceCard as HTMLElement).getByRole("button", {
        name: /favorit entfernen/i,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("zeigt andere Teilnehmende mit gemeinsamen Timetable Favoriten kompakt an", async () => {
    mockLoadedData({
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
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
              {
                participantId: "bob",
                displayName: "Bob",
                avatarId: "neon-tent",
              },
              {
                participantId: "carla",
                displayName: "Carla",
                avatarId: "sunset-stage",
              },
              {
                participantId: "dina",
                displayName: "Dina",
                avatarId: null,
              },
              {
                participantId: "emil",
                displayName: "Emil",
                avatarId: null,
              },
            ],
          },
        ],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);
    const performanceTitle = within(timetableSection).getByRole("heading", {
      name: "The Headliners",
    });
    const performanceCard = performanceTitle.closest("article") as HTMLElement;

    expect(performanceCard).toHaveClass("timetable-performance--favorite");
    expect(within(performanceCard).getByText("Auch dabei")).toBeVisible();
    expect(within(performanceCard).getByText("Bob")).toBeVisible();
    expect(within(performanceCard).getByText("Carla")).toBeVisible();
    expect(within(performanceCard).getByText("Dina")).toBeVisible();
    expect(within(performanceCard).getByText("+1")).toBeVisible();
    expect(
      within(performanceCard).queryByText("Alice"),
    ).not.toBeInTheDocument();
  });

  it("markiert und entfernt Timetable Auftritte als Favoriten", async () => {
    mockLoadedData({
      loadedTimetable: {
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
        favoritePerformanceIds: [],
        performanceFavorites: [],
      },
    });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^timetable$/i);

    const timetableSection = sectionForHeading(/^timetable$/i);
    const addFavoriteButton = within(timetableSection).getByRole("button", {
      name: /als favorit markieren/i,
    });

    expect(addFavoriteButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(addFavoriteButton);

    expect(addTimetableFavorite).toHaveBeenCalledWith("performance-1", {
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(
        within(timetableSection).getByRole("button", {
          name: /favorit entfernen/i,
        }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    const removeFavoriteButton = within(timetableSection).getByRole("button", {
      name: /favorit entfernen/i,
    });

    await userEvent.click(removeFavoriteButton);

    expect(removeTimetableFavorite).toHaveBeenCalledWith("performance-1", {
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(
        within(timetableSection).getByRole("button", {
          name: /als favorit markieren/i,
        }),
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("zeigt die individuelle Bingokarte und speichert Markierungen", async () => {
    mockLoadedData({ loadedBingoCard: bingoCard });
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^spiele$/i);

    const bingoSection = sectionForHeading(/^bingo$/i);
    const markedButton = within(bingoSection).getByRole("button", {
      name: "1",
    });
    const unmarkedButton = within(bingoSection).getByRole("button", {
      name: "2",
    });

    expect(markedButton).toHaveAttribute("aria-pressed", "true");
    expect(unmarkedButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(unmarkedButton);

    expect(setBingoMark).toHaveBeenCalledWith(2, true, {
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(unmarkedButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("zeigt im Infobereich einen Hinweis, wenn keine Dokumente vorhanden sind", async () => {
    mockLoadedData({ loadedFestivalDocuments: [] });
    await renderLoadedApp();
    await loginWith("ALICE42");

    await switchMainSection(/^infos$/i);

    expect(
      screen.getByText(/noch keine festivalinfos hinterlegt/i),
    ).toBeVisible();
    expect(loadFestivalDocuments).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(
      screen.queryByTitle(/spotify festival playlist/i),
    ).not.toBeInTheDocument();
  });

  it("zeigt Festivaldokumente im Infobereich innerhalb der App an", async () => {
    mockLoadedData({ loadedFestivalDocuments: festivalDocuments });
    await renderLoadedApp();
    await loginWith("ALICE42");

    await switchMainSection(/^infos$/i);

    expect(screen.getByRole("heading", { name: /^infos$/i })).toBeVisible();
    expect(screen.getByTitle("Timetable")).toHaveAttribute(
      "src",
      "https://example.test/timetable.pdf",
    );
    expect(screen.getByRole("img", { name: /geländeplan/i })).toHaveAttribute(
      "src",
      "https://example.test/site-map.png",
    );
  });

  it("zeigt und oeffnet den Campstandort im Infobereich", async () => {
    const openMock = vi.spyOn(window, "open").mockReturnValue(null);

    mockLoadedData({
      loadedCampLocationLink: "https://maps.app.goo.gl/campstandort",
    });

    await renderLoadedApp();
    await loginWith("ALICE42");

    await switchMainSection(/^infos$/i);
    await userEvent.click(
      screen.getByRole("button", { name: /standort öffnen/i }),
    );

    expect(
      screen.getByRole("heading", { name: /^campstandort$/i }),
    ).toBeVisible();
    expect(openMock).toHaveBeenCalledWith(
      "https://maps.app.goo.gl/campstandort",
      "_blank",
      "noopener,noreferrer",
    );
    expect(
      screen.queryByText(/konnte nicht geöffnet werden/i),
    ).not.toBeInTheDocument();
    expect(loadCampLocationLink).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt die Spotify Playlist im Infobereich an", async () => {
    mockLoadedData({
      loadedMusicPlaylist: musicPlaylist,
    });

    await renderLoadedApp();
    await loginWith("ALICE42");

    await switchMainSection(/^infos$/i);

    expect(
      screen.getByRole("heading", { name: /^festival playlist$/i }),
    ).toBeVisible();
    expect(screen.getByTitle(/spotify festival playlist/i)).toHaveAttribute(
      "src",
      musicPlaylist.embedUrl,
    );
    expect(screen.getByRole("link", { name: /in spotify/i })).toHaveAttribute(
      "href",
      musicPlaylist.externalUrl,
    );
    expect(loadMusicPlaylist).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt einen Hinweis, wenn der Spotify Player nicht geladen werden kann", async () => {
    mockLoadedData({
      loadedMusicPlaylist: musicPlaylist,
    });

    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/^infos$/i);

    fireEvent.error(screen.getByTitle(/spotify festival playlist/i));

    expect(
      await screen.findByText(/spotify playlist konnte nicht geladen werden/i),
    ).toBeVisible();
  });

  it("verhindert Zugriff mit ungueltigem Teilnehmercode", async () => {
    await renderLoadedApp();

    await loginWith("FALSCH");

    expect(screen.getByText(/code konnte nicht bestätigt/i)).toBeVisible();
    expect(screen.queryByText(/angemeldet als:/i)).not.toBeInTheDocument();
    expect(loginParticipant).toHaveBeenCalledWith("FALSCH");
    expect(loadVotesForParticipant).not.toHaveBeenCalled();
  });

  it("sperrt die Codeeingabe nach mehreren ungueltigen Versuchen kurzzeitig", async () => {
    await renderLoadedApp();
    const user = await unlockFestivalWith();
    await user.click(screen.getByRole("button", { name: /^profil/i }));
    const lockedUntil = new Date(Date.now() + 1_000).toISOString();

    vi.mocked(loginParticipant)
      .mockResolvedValueOnce({
        status: "invalid",
        participant: null,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        status: "invalid",
        participant: null,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        status: "blocked",
        participant: null,
        lockedUntil,
      });

    for (const code of ["FALSCH1", "FALSCH2", "FALSCH3"]) {
      const input = screen.getByRole("textbox", { name: /^teilnehmercode$/i });

      fireEvent.change(input, { target: { value: code } });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /code/i }));
      });
    }

    expect(screen.getByText(/warte kurz/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /code/i })).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/1 sekunden/i);
    expect(
      screen.queryByRole("heading", { name: /abstimmung/i }),
    ).not.toBeInTheDocument();
    expect(loadParticipants).not.toHaveBeenCalled();
    expect(loadVotes).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /code/i })).toBeEnabled();
      },
      { timeout: 2000 },
    );
    expect(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
    ).toBeEnabled();
  });

  it("zeigt eine vom Server gemeldete aktive Sperre an", async () => {
    await renderLoadedApp();
    const user = await unlockFestivalWith();
    await user.click(screen.getByRole("button", { name: /^profil/i }));

    vi.mocked(loginParticipant).mockResolvedValueOnce({
      status: "blocked",
      participant: null,
      lockedUntil: new Date(Date.now() + 10_000).toISOString(),
    });

    fireEvent.change(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      {
        target: { value: "FALSCH" },
      },
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /code/i }));
    });

    expect(screen.getByRole("button", { name: /code/i })).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      /10 sekunden|9 sekunden/i,
    );
    expect(
      screen.queryByRole("heading", { name: /abstimmung/i }),
    ).not.toBeInTheDocument();
  });

  it("setzt Fehlversuche bei erfolgreichem Login zurueck", async () => {
    await renderLoadedApp();
    const user = await unlockFestivalWith();
    await user.click(screen.getByRole("button", { name: /^profil/i }));

    vi.mocked(loginParticipant)
      .mockResolvedValueOnce({
        status: "invalid",
        participant: null,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        status: "invalid",
        participant: null,
        lockedUntil: null,
      })
      .mockResolvedValueOnce({
        status: "success",
        participant: participants[0],
        lockedUntil: null,
      });

    for (const code of ["FALSCH1", "FALSCH2"]) {
      await user.clear(
        screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      );
      await user.type(
        screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
        code,
      );
      await user.click(screen.getByRole("button", { name: /code/i }));
    }

    await user.clear(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /^teilnehmercode$/i }),
      "ALICE42",
    );
    await user.click(screen.getByRole("button", { name: /code/i }));
    await switchMainSection(/profil/i);

    const identitySection = sectionForHeading(/dein profil/i);
    expect(
      await within(identitySection).findByText(/angemeldet als:/i),
    ).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(loginParticipant).toHaveBeenLastCalledWith("ALICE42");
  });

  it("weist deaktivierte Teilnehmer beim Login generisch ab", async () => {
    mockLoadedData({
      loadedParticipants: [
        participants[0],
        { ...participants[1], isActive: false },
        participants[2],
      ],
    });
    await renderLoadedApp();

    await loginWith("BOB42");

    expect(screen.getByText(/code konnte nicht bestätigt/i)).toBeVisible();
    expect(screen.queryByText(/angemeldet als:/i)).not.toBeInTheDocument();
    expect(loginParticipant).toHaveBeenCalledWith("BOB42");
    expect(loadVotesForParticipant).not.toHaveBeenCalled();
  });

  it("erhaelt die Anmeldung nach einem Neuladen innerhalb der Browser-Session", async () => {
    localStorage.setItem(
      festivalAccessStorageKey,
      JSON.stringify({ version: festivalAccessVersion }),
    );
    sessionStorage.setItem(
      "hurricane-awards:hurricane-awards-2026:participant",
      JSON.stringify(participants[0]),
    );

    render(<App />);

    await switchMainSection(/profil/i);

    expect(await screen.findByText(/angemeldet als:/i)).toBeVisible();
    const identitySection = sectionForHeading(/dein profil/i);
    expect(within(identitySection).getByText("Alice")).toBeVisible();
    expect(loadParticipants).toHaveBeenCalled();
    expect(loadVotesForParticipant).toHaveBeenCalledWith("alice", {
      participantAccessCode: "ALICE42",
    });
  });

  it("uebernimmt alte dauerhaft gespeicherte Teilnehmercodes nicht mehr", async () => {
    localStorage.setItem(
      festivalAccessStorageKey,
      JSON.stringify({ version: festivalAccessVersion }),
    );
    localStorage.setItem(
      "hurricane-awards:hurricane-awards-2026:participant",
      JSON.stringify(participants[0]),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();
    expect(screen.queryByText(/angemeldet als:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /^teilnehmercode$/i }),
    ).not.toBeInTheDocument();
    expect(
      localStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toBeNull();
    expect(loadParticipants).not.toHaveBeenCalled();
  });

  it("meldet ab und blendet geschuetzte Inhalte wieder aus", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await switchMainSection(/profil/i);
    await user.click(screen.getByRole("button", { name: /abmelden/i }));

    expect(
      await screen.findByRole("heading", { name: "Hurricane Awards 2026" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /hallo eventcrew/i }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: /^teilnehmercode$/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: /abstimmung/i }),
    ).not.toBeInTheDocument();
    expect(
      localStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toBeNull();
    expect(
      sessionStorage.getItem(
        "hurricane-awards:hurricane-awards-2026:participant",
      ),
    ).toBeNull();
  });
});

describe("Kategorien", () => {
  it("zeigt einen Hinweis, wenn keine aktiven Abstimmungen vorhanden sind", async () => {
    mockLoadedData({
      loadedCategories: categories.filter(
        (category) => category.status !== "open",
      ),
    });

    await renderLoadedApp();
    await loginWith("ALICE42");

    const votingSection = sectionForHeading(/abstimmung/i);
    expect(
      within(votingSection).getByText(/keine abstimmungen geöffnet/i),
    ).toBeVisible();
    expect(
      within(votingSection).queryByLabelText(/stimme geht an/i),
    ).toBeNull();
  });

  it("zeigt keinen Hinweis, wenn aktive Abstimmungen vorhanden sind", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    const votingSection = sectionForHeading(/abstimmung/i);
    expect(
      within(votingSection).queryByText(/keine abstimmungen geöffnet/i),
    ).toBeNull();
    expect(
      within(votingSection).getByLabelText(/stimme geht an/i),
    ).toBeVisible();
  });

  it("laedt Kategorien und macht nur offene Kategorien abstimmbar", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    const votingSection = sectionForHeading(/abstimmung/i);

    expect(
      within(votingSection).getByRole("heading", {
        name: "Beste Festival-Energie",
      }),
    ).toBeVisible();
    expect(
      within(votingSection).queryByRole("heading", {
        name: "Bester Camp-Aufbau",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(votingSection).queryByRole("heading", {
        name: "Beste Regenjacke",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(votingSection).getByLabelText(/stimme geht an/i),
    ).toBeVisible();
  });

  it("schliesst die angemeldete Person als Stimmziel aus", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    const votingSection = sectionForHeading(/abstimmung/i);
    const voteSelect = within(votingSection).getByLabelText(/stimme geht an/i);

    expect(
      within(voteSelect).queryByRole("option", { name: "Alice" }),
    ).toBeNull();
    expect(
      within(voteSelect).getByRole("option", { name: "Bob" }),
    ).toBeVisible();
    expect(
      within(votingSection).queryByRole("button", { name: /stimme abgeben/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Voting", () => {
  it("gibt eine Stimme erfolgreich ab", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    const votingSection = sectionForHeading(/abstimmung/i);
    await user.selectOptions(
      within(votingSection).getByLabelText(/stimme geht an/i),
      "bob",
    );
    await user.click(
      within(votingSection).getByRole("button", { name: /stimme abgeben/i }),
    );

    expect(saveVote).toHaveBeenCalledWith(
      {
        voterId: "alice",
        votedForId: "bob",
        categoryId: "open-category",
        timestamp: expect.any(String),
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(votingSection).findByText(/bereits abgestimmt/i),
    ).toBeVisible();
  });

  it("behandelt eine bestehende Stimme als bereits abgegeben", async () => {
    mockLoadedData({
      participantVotes: [vote()],
      loadedVotes: [vote()],
    });
    await renderLoadedApp();

    await loginWith("ALICE42");

    const votingSection = sectionForHeading(/abstimmung/i);
    expect(
      within(votingSection).getByText(/bereits abgestimmt/i),
    ).toBeVisible();
    expect(
      within(votingSection).queryByRole("button", { name: /stimme abgeben/i }),
    ).not.toBeInTheDocument();
  });
});

describe("Ergebnisse", () => {
  it("zaehlt Stimmen und sortiert nach Punktzahl", async () => {
    mockLoadedData({
      loadedCategories: [categories[1]],
      loadedVotes: [
        vote({ voterId: "alice", votedForId: "bob" }),
        vote({ voterId: "carla", votedForId: "bob" }),
        vote({ voterId: "bob", votedForId: "carla" }),
      ],
      loadedStandings: [],
    });

    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/awards/i);

    const resultsSection = sectionForHeading(/ergebnisse/i);
    expect(
      within(resultsSection).getByText("Beste Festival-Energie"),
    ).toBeVisible();
    expect(within(resultsSection).getByText("2")).toBeVisible();
    expect(within(resultsSection).getByText("1")).toBeVisible();
    expect(within(resultsSection).getByText("0")).toBeVisible();

    const bobResult = within(resultsSection).getByText("Bob");
    const carlaResult = within(resultsSection).getByText("Carla");
    const aliceResult = within(resultsSection).getByText("Alice");

    expect(
      bobResult.compareDocumentPosition(carlaResult) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      carlaResult.compareDocumentPosition(aliceResult) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("stellt leere Ergebnisse korrekt dar", async () => {
    mockLoadedData({ loadedVotes: [], loadedStandings: [] });

    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/awards/i);

    expect(screen.getByText(/noch keine stimmen abgegeben/i)).toBeVisible();
  });
});

describe("Ewige Tabelle", () => {
  it("laedt und zeigt Daten in geladener Rangfolge", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/awards/i);

    const standingsSection = sectionForHeading(/gesamtclassement/i);
    const rows = within(standingsSection).getAllByRole("row");

    expect(within(rows[1]).getByText("Bob")).toBeVisible();
    expect(within(rows[1]).getByText("18")).toBeVisible();
    expect(within(rows[2]).getByText("Alice")).toBeVisible();
    expect(within(rows[2]).getByText("12")).toBeVisible();
  });

  it("stellt leere Daten korrekt dar", async () => {
    mockLoadedData({ loadedStandings: [] });

    await renderLoadedApp();
    await loginWith("ALICE42");
    await switchMainSection(/awards/i);

    expect(
      screen.getByText(/noch keine gesamtpunkte vorhanden/i),
    ).toBeVisible();
  });
});

describe("Admin", () => {
  it("blendet Adminfunktionen fuer normale Teilnehmer aus", async () => {
    await renderLoadedApp();
    await loginWith("BOB42");

    expect(
      screen.queryByRole("button", { name: /^admin$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /event archivieren/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /json exportieren/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /eventlogo/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    expect(loadAdminCategories).not.toHaveBeenCalled();
    expect(loadFestivalAccessCode).not.toHaveBeenCalled();
    expect(updateCategory).not.toHaveBeenCalled();
    expect(updateCategoryStatus).not.toHaveBeenCalled();
    expect(archiveFestival).not.toHaveBeenCalled();
    expect(loadFestivalExportData).not.toHaveBeenCalled();
    expect(updateFestivalAccessCode).not.toHaveBeenCalled();
  });

  it("macht Admin-Aktionen erst in der Admin-Ansicht verfuegbar", async () => {
    await renderLoadedApp();
    await loginWith("ALICE42");

    expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^admin$/i }));

    expect(screen.getByRole("heading", { name: /eventlogo/i })).toBeVisible();
    await switchAdminSection(/^awards$/i);

    expect(await screen.findAllByLabelText(/status/i)).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /^löschen$/i })).toHaveLength(
      3,
    );
    expect(loadAdminCategories).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(loadFestivalAccessCode).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt die Teilnehmerverwaltung mit aktiven und deaktivierten Teilnehmern", async () => {
    mockLoadedData({
      loadedAdminParticipants: [
        participants[0],
        { ...participants[1], isActive: false },
      ],
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);

    const participantsSection = sectionForHeading(/^teilnehmer$/i);

    expect(await within(participantsSection).findByText("Alice")).toBeVisible();
    expect(within(participantsSection).getByText("ALICE42")).toBeVisible();
    expect(within(participantsSection).getByText("Bob")).toBeVisible();
    expect(within(participantsSection).getByText("BOB42")).toBeVisible();
    expect(within(participantsSection).getByText("Aktiv")).toBeVisible();
    expect(within(participantsSection).getByText("Deaktiviert")).toBeVisible();
    expect(loadAdminParticipants).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
  });

  it("stellt lange und zusammengesetzte Namen in Teilnehmerkarten vollstaendig dar", async () => {
    const longName =
      "Alexandra-Maria von Beispielhausen Festivalorganisationsteam";
    mockLoadedData({
      loadedAdminParticipants: [
        {
          ...participants[0],
          displayName: longName,
        },
      ],
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);

    const participantsSection = sectionForHeading(/^teilnehmer$/i);
    const name = await within(participantsSection).findByText(longName);
    const card = name.closest("article");

    expect(name.parentElement).toHaveClass("admin-participant-card__name");
    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByRole("button", { name: /bearbeiten/i }),
    ).toBeVisible();
    expect(
      within(card as HTMLElement).getByRole("button", {
        name: /deaktivieren/i,
      }),
    ).toBeVisible();
  });

  it("bearbeitet den Eventnamen und zeigt ihn sofort in der App", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));

    const festivalSection = sectionForHeading(/^event$/i);
    const nameInput = within(festivalSection).getByLabelText(/^eventname$/i);

    expect(nameInput).toHaveValue("Hurricane Awards 2026");

    await user.clear(nameInput);
    await user.type(nameInput, "Hurricane Crew Awards");
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /eventeinstellungen speichern/i,
      }),
    );

    expect(updateEventSettings).toHaveBeenCalledWith(
      { name: "Hurricane Crew Awards", startDate: null, endDate: null },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await screen.findByRole("heading", { name: "Hurricane Crew Awards" }),
    ).toBeVisible();
    expect(
      screen.getByRole("main", {
        name: /hurricane crew awards mit 3 teilnehmenden/i,
      }),
    ).toBeVisible();
  });

  it("validiert einen leeren Eventnamen clientseitig", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));

    const festivalSection = sectionForHeading(/^event$/i);
    const nameInput = within(festivalSection).getByLabelText(/^eventname$/i);

    await user.clear(nameInput);
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /eventeinstellungen speichern/i,
      }),
    );

    expect(updateEventSettings).not.toHaveBeenCalled();
    expect(
      await within(festivalSection).findByText(/eventname ist erforderlich/i),
    ).toBeVisible();
  });

  it("zeigt technische RPC Fehler im Adminbereich nicht im Klartext", async () => {
    vi.mocked(updateEventSettings).mockRejectedValueOnce(
      new Error('relation "public.participants" does not exist'),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));

    const festivalSection = sectionForHeading(/^event$/i);
    const nameInput = within(festivalSection).getByLabelText(/^eventname$/i);

    await user.clear(nameInput);
    await user.type(nameInput, "Hurricane Crew Awards");
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /eventeinstellungen speichern/i,
      }),
    );

    expect(
      await within(festivalSection).findByText(
        /eventname konnte gerade nicht gespeichert werden/i,
      ),
    ).toBeVisible();
    expect(
      within(festivalSection).queryByText(/public\.participants/i),
    ).not.toBeInTheDocument();
  });

  it("zeigt und bearbeitet den Eventcode im Adminbereich", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));

    const festivalSection = sectionForHeading(/^event$/i);
    const codeInput =
      await within(festivalSection).findByLabelText(/^eventcode$/i);

    expect(codeInput).toHaveValue("HURRICANE2026");

    await user.clear(codeInput);
    await user.type(codeInput, "neuercode");
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /eventcode speichern/i,
      }),
    );

    expect(updateFestivalAccessCode).toHaveBeenCalledWith("NEUERCODE", {
      participantAccessCode: "ALICE42",
    });
    expect(codeInput).toHaveValue("NEUERCODE");
    expect(localStorage.getItem(festivalAccessStorageKey)).toBe(
      JSON.stringify({ version: "2026-07-01 10:05:00+00" }),
    );
  });

  it("validiert einen leeren Eventcode clientseitig", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));

    const festivalSection = sectionForHeading(/^event$/i);
    const codeInput =
      await within(festivalSection).findByLabelText(/^eventcode$/i);

    await user.clear(codeInput);
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /eventcode speichern/i,
      }),
    );

    expect(updateFestivalAccessCode).not.toHaveBeenCalled();
    expect(
      await within(festivalSection).findByText(/eventcode ist erforderlich/i),
    ).toBeVisible();
  });

  it("archiviert das Festival im Adminbereich nach Bestaetigung", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^archiv$/i);

    const festivalSection = sectionForHeading(/^archiv$/i);
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /event archivieren/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("wirklich archivieren"),
    );
    expect(archiveFestival).toHaveBeenCalledWith("ALICE42");
    expect(
      await within(festivalSection).findByText(
        /archiv id: 8e560706-5e2f-4b50-9e41-381625fd8102/i,
      ),
    ).toBeVisible();
  });

  it("exportiert das aktuelle Festival im Adminbereich als JSON", async () => {
    const createObjectUrl = vi.fn(() => "blob:festival-export");
    const revokeObjectUrl = vi.fn();
    const linkClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectUrl,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectUrl,
      configurable: true,
    });

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^archiv$/i);

    const festivalSection = sectionForHeading(/^archiv$/i);
    await user.click(
      within(festivalSection).getByRole("button", {
        name: /json exportieren/i,
      }),
    );

    await waitFor(() => {
      expect(loadFestivalExportData).toHaveBeenCalledWith(
        { participantAccessCode: "ALICE42" },
        {
          type: "active",
          festivalId: "hurricane-awards-2026",
        },
        expect.any(Date),
        {
          includeParticipantAccessCodes: false,
        },
      );
    });
    expect(festivalExportFileName).toHaveBeenCalledWith(
      "Hurricane Awards 2026",
      expect.any(Date),
    );
    expect(serializeFestivalExport).toHaveBeenCalledWith(exportData);
    expect(createObjectUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "application/json;charset=utf-8",
      }),
    );
    expect(linkClick).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:festival-export");
    expect(
      await within(festivalSection).findByText(/json-export wurde erstellt/i),
    ).toBeVisible();
  });

  it("exportiert Teilnehmercodes nur nach expliziter Warnung", async () => {
    const createObjectUrl = vi.fn(() => "blob:festival-export");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectUrl,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^archiv$/i);

    const festivalSection = sectionForHeading(/^archiv$/i);
    await user.click(
      within(festivalSection).getByRole("checkbox", {
        name: /teilnehmercodes in export aufnehmen/i,
      }),
    );

    expect(within(festivalSection).getByRole("alert")).toHaveTextContent(
      /enthält teilnehmercodes/i,
    );

    await user.click(
      within(festivalSection).getByRole("button", {
        name: /json exportieren/i,
      }),
    );

    await waitFor(() => {
      expect(loadFestivalExportData).toHaveBeenCalledWith(
        { participantAccessCode: "ALICE42" },
        {
          type: "active",
          festivalId: "hurricane-awards-2026",
        },
        expect.any(Date),
        {
          includeParticipantAccessCodes: true,
        },
      );
    });
  });

  it("verwaltet Festivaltage im Adminbereich Timetable", async () => {
    mockLoadedData({
      loadedTimetable: {
        ...emptyTimetable,
        festivalDays,
      },
      loadedAdminFestivalDays: festivalDays,
    });
    vi.mocked(loadAdminFestivalDays)
      .mockResolvedValueOnce(festivalDays)
      .mockResolvedValueOnce([
        ...festivalDays,
        {
          id: "day-3",
          date: "2026-06-21",
          label: "Sonntag",
          sortOrder: 3,
        },
      ])
      .mockResolvedValueOnce([
        {
          ...festivalDays[0],
          label: "Freitag neu",
        },
        festivalDays[1],
      ])
      .mockResolvedValueOnce([
        {
          ...festivalDays[1],
          sortOrder: 1,
        },
        {
          ...festivalDays[0],
          sortOrder: 2,
        },
      ])
      .mockResolvedValueOnce([festivalDays[1]]);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    expect(loadAdminFestivalDays).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });

    await user.click(
      screen.getByRole("button", { name: /festivaltag anlegen/i }),
    );
    await user.type(screen.getByLabelText(/^datum$/i), "2026-06-21");
    await user.type(screen.getByLabelText(/^bezeichnung$/i), "Sonntag");
    await user.clear(screen.getByLabelText(/^sortierung$/i));
    await user.type(screen.getByLabelText(/^sortierung$/i), "3");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(createFestivalDay).toHaveBeenCalledWith(
      {
        date: "2026-06-21",
        label: "Sonntag",
        sortOrder: 3,
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(await screen.findByText("Sonntag")).toBeVisible();

    const fridayCard = screen
      .getByRole("heading", { name: "Freitag" })
      .closest("article");

    expect(fridayCard).not.toBeNull();

    await user.click(
      within(fridayCard as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    await user.clear(screen.getByLabelText(/^bezeichnung$/i));
    await user.type(screen.getByLabelText(/^bezeichnung$/i), "Freitag neu");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(updateFestivalDay).toHaveBeenCalledWith(
      {
        id: "day-1",
        date: "2026-06-19",
        label: "Freitag neu",
        sortOrder: 1,
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(await screen.findByText("Freitag neu")).toBeVisible();

    const updatedFridayCard = screen
      .getByRole("heading", {
        name: "Freitag neu",
      })
      .closest("article");

    expect(updatedFridayCard).not.toBeNull();

    await user.click(
      within(updatedFridayCard as HTMLElement).getByRole("button", {
        name: /nach unten/i,
      }),
    );

    expect(updateFestivalDay).toHaveBeenCalledWith(
      {
        id: "day-1",
        date: "2026-06-19",
        label: "Freitag neu",
        sortOrder: 2,
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(updateFestivalDay).toHaveBeenCalledWith(
      {
        id: "day-2",
        date: "2026-06-20",
        label: "Samstag",
        sortOrder: 1,
      },
      { participantAccessCode: "ALICE42" },
    );

    const movedFridayCard = await screen.findByRole("heading", {
      name: "Freitag",
    });

    const movedFridayArticle = movedFridayCard.closest("article");

    expect(movedFridayArticle).not.toBeNull();

    await user.click(
      within(movedFridayArticle as HTMLElement).getByRole("button", {
        name: /löschen/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Freitag"),
    );
    expect(deleteFestivalDay).toHaveBeenCalledWith("day-1", {
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt doppelte Festivaltag-Daten verstaendlich an", async () => {
    mockLoadedData({ loadedAdminFestivalDays: festivalDays });
    vi.mocked(createFestivalDay).mockRejectedValueOnce(
      new Error("festival day date already exists"),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);
    await user.click(
      screen.getByRole("button", { name: /festivaltag anlegen/i }),
    );
    await user.type(screen.getByLabelText(/^datum$/i), "2026-06-19");
    await user.type(screen.getByLabelText(/^bezeichnung$/i), "Freitag");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(await screen.findByText(/bereits einen festivaltag/i)).toBeVisible();
  });

  it("verwaltet Buehnen im Adminbereich Timetable", async () => {
    mockLoadedData({
      loadedTimetable: {
        ...emptyTimetable,
        festivalDays,
        stages: timetableStages,
      },
      loadedAdminFestivalDays: festivalDays,
      loadedAdminTimetableStages: timetableStages,
    });
    vi.mocked(loadAdminTimetableStages)
      .mockResolvedValueOnce(timetableStages)
      .mockResolvedValueOnce([
        ...timetableStages,
        {
          id: "stage-3",
          name: "Beach Stage",
          sortOrder: 3,
          color: "#00a6fb",
        },
      ])
      .mockResolvedValueOnce([
        {
          ...timetableStages[0],
          name: "Mainstage Neu",
          color: "#9ef01a",
        },
        timetableStages[1],
      ])
      .mockResolvedValueOnce([
        {
          ...timetableStages[1],
          sortOrder: 1,
        },
        {
          ...timetableStages[0],
          name: "Mainstage Neu",
          sortOrder: 2,
          color: "#9ef01a",
        },
      ])
      .mockResolvedValueOnce([timetableStages[1]]);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    const stagesSection = sectionForHeading(/^bühnen$/i);

    expect(loadAdminTimetableStages).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });

    await user.click(
      within(stagesSection).getByRole("button", { name: /bühne anlegen/i }),
    );
    await user.type(
      within(stagesSection).getByLabelText(/^bühnenname$/i),
      "Beach Stage",
    );
    await user.clear(within(stagesSection).getByLabelText(/^sortierung$/i));
    await user.type(within(stagesSection).getByLabelText(/^sortierung$/i), "3");
    await user.click(
      within(stagesSection).getByRole("checkbox", {
        name: /farbe verwenden/i,
      }),
    );
    fireEvent.change(within(stagesSection).getByLabelText(/^farbe$/i), {
      target: { value: "#00a6fb" },
    });
    await user.click(
      within(stagesSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(createTimetableStage).toHaveBeenCalledWith(
      {
        name: "Beach Stage",
        sortOrder: 3,
        color: "#00a6fb",
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(await within(stagesSection).findByText("Beach Stage")).toBeVisible();

    const mainstageCard = within(stagesSection)
      .getByRole("heading", { name: "Mainstage" })
      .closest("article");

    expect(mainstageCard).not.toBeNull();

    await user.click(
      within(mainstageCard as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    await user.clear(within(stagesSection).getByLabelText(/^bühnenname$/i));
    await user.type(
      within(stagesSection).getByLabelText(/^bühnenname$/i),
      "Mainstage Neu",
    );
    fireEvent.change(within(stagesSection).getByLabelText(/^farbe$/i), {
      target: { value: "#9ef01a" },
    });
    await user.click(
      within(stagesSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(updateTimetableStage).toHaveBeenCalledWith(
      {
        id: "stage-1",
        name: "Mainstage Neu",
        sortOrder: 1,
        color: "#9ef01a",
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(stagesSection).findByText("Mainstage Neu"),
    ).toBeVisible();

    const updatedStageCard = within(stagesSection)
      .getByRole("heading", { name: "Mainstage Neu" })
      .closest("article");

    expect(updatedStageCard).not.toBeNull();

    await user.click(
      within(updatedStageCard as HTMLElement).getByRole("button", {
        name: /nach unten/i,
      }),
    );

    expect(updateTimetableStage).toHaveBeenCalledWith(
      {
        id: "stage-1",
        name: "Mainstage Neu",
        sortOrder: 2,
        color: "#9ef01a",
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(updateTimetableStage).toHaveBeenCalledWith(
      {
        id: "stage-2",
        name: "Tent Stage",
        sortOrder: 1,
        color: null,
      },
      { participantAccessCode: "ALICE42" },
    );

    const movedStageHeading = await within(stagesSection).findByRole(
      "heading",
      {
        name: "Mainstage Neu",
      },
    );
    const movedStageArticle = movedStageHeading.closest("article");

    expect(movedStageArticle).not.toBeNull();

    await user.click(
      within(movedStageArticle as HTMLElement).getByRole("button", {
        name: /löschen/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Mainstage Neu"),
    );
    expect(deleteTimetableStage).toHaveBeenCalledWith("stage-1", {
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt doppelte Buehnennamen verstaendlich an", async () => {
    mockLoadedData({ loadedAdminTimetableStages: timetableStages });
    vi.mocked(createTimetableStage).mockRejectedValueOnce(
      new Error("stage name already exists"),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    const stagesSection = sectionForHeading(/^bühnen$/i);

    await user.click(
      within(stagesSection).getByRole("button", { name: /bühne anlegen/i }),
    );
    await user.type(
      within(stagesSection).getByLabelText(/^bühnenname$/i),
      "Mainstage",
    );
    await user.click(
      within(stagesSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(
      await within(stagesSection).findByText(
        /bühnenname ist bereits vergeben/i,
      ),
    ).toBeVisible();
  });

  it("verwaltet Acts im Adminbereich Timetable", async () => {
    mockLoadedData({
      loadedTimetable: {
        ...emptyTimetable,
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
      },
      loadedAdminFestivalDays: festivalDays,
      loadedAdminTimetableStages: timetableStages,
      loadedAdminTimetableActs: timetableActs,
    });
    vi.mocked(loadAdminTimetableActs)
      .mockResolvedValueOnce(timetableActs)
      .mockResolvedValueOnce([
        ...timetableActs,
        {
          id: "act-3",
          name: "Sunday Choir",
          description: "Mehrstimmig in den Morgen.",
        },
      ])
      .mockResolvedValueOnce([
        {
          ...timetableActs[0],
          name: "The Headliners Neu",
          description: "Noch größere Gitarren.",
        },
        timetableActs[1],
      ])
      .mockResolvedValueOnce([timetableActs[1]]);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    const actsSection = sectionForHeading(/^acts$/i);

    expect(loadAdminTimetableActs).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });

    await user.click(
      within(actsSection).getByRole("button", { name: /act anlegen/i }),
    );
    await user.type(
      within(actsSection).getByLabelText(/^name$/i),
      "Sunday Choir",
    );
    await user.type(
      within(actsSection).getByLabelText(/^beschreibung$/i),
      "Mehrstimmig in den Morgen.",
    );
    await user.click(
      within(actsSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(createTimetableAct).toHaveBeenCalledWith(
      {
        name: "Sunday Choir",
        description: "Mehrstimmig in den Morgen.",
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(await within(actsSection).findByText("Sunday Choir")).toBeVisible();

    const headlinersCard = within(actsSection)
      .getByRole("heading", { name: "The Headliners" })
      .closest("article");

    expect(headlinersCard).not.toBeNull();

    await user.click(
      within(headlinersCard as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    await user.clear(within(actsSection).getByLabelText(/^name$/i));
    await user.type(
      within(actsSection).getByLabelText(/^name$/i),
      "The Headliners Neu",
    );
    await user.clear(within(actsSection).getByLabelText(/^beschreibung$/i));
    await user.type(
      within(actsSection).getByLabelText(/^beschreibung$/i),
      "Noch größere Gitarren.",
    );
    await user.click(
      within(actsSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(updateTimetableAct).toHaveBeenCalledWith(
      {
        id: "act-1",
        name: "The Headliners Neu",
        description: "Noch größere Gitarren.",
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(actsSection).findByText("The Headliners Neu"),
    ).toBeVisible();

    const updatedActCard = within(actsSection)
      .getByRole("heading", { name: "The Headliners Neu" })
      .closest("article");

    expect(updatedActCard).not.toBeNull();

    await user.click(
      within(updatedActCard as HTMLElement).getByRole("button", {
        name: /löschen/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("The Headliners Neu"),
    );
    expect(deleteTimetableAct).toHaveBeenCalledWith("act-1", {
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt belegte Acts beim Loeschen verstaendlich an", async () => {
    mockLoadedData({ loadedAdminTimetableActs: timetableActs });
    vi.mocked(deleteTimetableAct).mockRejectedValueOnce(
      new Error("act cannot be deleted while performances exist"),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    const actsSection = sectionForHeading(/^acts$/i);
    const headlinersCard = within(actsSection)
      .getByRole("heading", { name: "The Headliners" })
      .closest("article");

    expect(headlinersCard).not.toBeNull();

    await user.click(
      within(headlinersCard as HTMLElement).getByRole("button", {
        name: /löschen/i,
      }),
    );

    expect(
      await within(actsSection).findByText(/auftritte zugeordnet/i),
    ).toBeVisible();
  });

  it("verwaltet Auftritte im Adminbereich Timetable", async () => {
    mockLoadedData({
      loadedTimetable: {
        ...emptyTimetable,
        festivalDays,
        stages: timetableStages,
        acts: timetableActs,
        performances: timetablePerformances,
      },
      loadedAdminFestivalDays: festivalDays,
      loadedAdminTimetableStages: timetableStages,
      loadedAdminTimetableActs: timetableActs,
      loadedAdminTimetablePerformances: timetablePerformances,
    });
    vi.mocked(loadAdminTimetablePerformances)
      .mockResolvedValueOnce(timetablePerformances)
      .mockResolvedValueOnce([
        ...timetablePerformances,
        {
          id: "performance-2",
          festivalDayId: "day-1",
          stageId: "stage-2",
          actId: "act-2",
          startsAt: "2026-06-19T22:00:00.000Z",
          endsAt: "2026-06-19T23:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          ...timetablePerformances[0],
          endsAt: "2026-06-19T21:30:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    const performancesSection = sectionForHeading(/^auftritte$/i);

    expect(loadAdminTimetablePerformances).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });

    await user.click(
      within(performancesSection).getByRole("button", {
        name: /auftritt anlegen/i,
      }),
    );
    await user.selectOptions(
      within(performancesSection).getByLabelText(/^bühne$/i),
      "stage-2",
    );
    await user.selectOptions(
      within(performancesSection).getByLabelText(/^act$/i),
      "act-2",
    );
    fireEvent.change(
      within(performancesSection).getByLabelText(/^startzeit$/i),
      {
        target: { value: "2026-06-19T22:00" },
      },
    );
    fireEvent.change(within(performancesSection).getByLabelText(/^endzeit$/i), {
      target: { value: "2026-06-19T23:00" },
    });
    await user.click(
      within(performancesSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(createTimetablePerformance).toHaveBeenCalledWith(
      {
        festivalDayId: "day-1",
        stageId: "stage-2",
        actId: "act-2",
        startsAt: "2026-06-19T22:00",
        endsAt: "2026-06-19T23:00",
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(performancesSection).findByText("Late Night DJ"),
    ).toBeVisible();

    const headlinersCard = within(performancesSection)
      .getByRole("heading", { name: "The Headliners" })
      .closest("article");

    expect(headlinersCard).not.toBeNull();

    await user.click(
      within(headlinersCard as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    fireEvent.change(within(performancesSection).getByLabelText(/^endzeit$/i), {
      target: { value: "2026-06-19T21:30" },
    });
    await user.click(
      within(performancesSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(updateTimetablePerformance).toHaveBeenCalledWith(
      {
        id: "performance-1",
        festivalDayId: "day-1",
        stageId: "stage-1",
        actId: "act-1",
        startsAt: "2026-06-19T20:00",
        endsAt: "2026-06-19T21:30",
      },
      { participantAccessCode: "ALICE42" },
    );

    const updatedHeadlinersCard = within(performancesSection)
      .getByRole("heading", { name: "The Headliners" })
      .closest("article");

    expect(updatedHeadlinersCard).not.toBeNull();

    await user.click(
      within(updatedHeadlinersCard as HTMLElement).getByRole("button", {
        name: /löschen/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("The Headliners"),
    );
    expect(deleteTimetablePerformance).toHaveBeenCalledWith("performance-1", {
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt zeitliche Ueberschneidungen bei Auftritten verstaendlich an", async () => {
    mockLoadedData({
      loadedAdminFestivalDays: festivalDays,
      loadedAdminTimetableStages: timetableStages,
      loadedAdminTimetableActs: timetableActs,
      loadedAdminTimetablePerformances: timetablePerformances,
    });
    vi.mocked(createTimetablePerformance).mockRejectedValueOnce(
      new Error("performance overlaps existing performance on stage"),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^timetable$/i);

    const performancesSection = sectionForHeading(/^auftritte$/i);

    await user.click(
      within(performancesSection).getByRole("button", {
        name: /auftritt anlegen/i,
      }),
    );
    fireEvent.change(
      within(performancesSection).getByLabelText(/^startzeit$/i),
      {
        target: { value: "2026-06-19T20:30" },
      },
    );
    fireEvent.change(within(performancesSection).getByLabelText(/^endzeit$/i), {
      target: { value: "2026-06-19T21:30" },
    });
    await user.click(
      within(performancesSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(
      await within(performancesSection).findByText(/überschneidet/i),
    ).toBeVisible();
  });

  it("startet und beendet eine Bingorunde im Adminbereich", async () => {
    mockLoadedData();
    vi.mocked(loadOrCreateBingoCard).mockResolvedValueOnce(null);
    vi.mocked(loadOrCreateBingoCard).mockResolvedValueOnce(bingoCard);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    const adminNavigation = screen.getByRole("navigation", {
      name: /adminbereiche/i,
    });

    expect(
      within(adminNavigation).getByRole("button", { name: /^spiele$/i }),
    ).toBeVisible();
    expect(
      within(adminNavigation).queryByRole("button", { name: /^bingo$/i }),
    ).not.toBeInTheDocument();

    await switchAdminSection(/^spiele$/i);

    const adminBingoSection = sectionForHeading(/^bingo$/i);

    expect(
      within(adminBingoSection).getByText(/keine bingorunde/i),
    ).toBeVisible();

    await user.click(
      within(adminBingoSection).getByRole("button", {
        name: /bingorunde starten/i,
      }),
    );

    expect(startBingoRound).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(loadOrCreateBingoCard).toHaveBeenLastCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(
      await within(adminBingoSection).findByText(/aktive bingorunde/i),
    ).toBeVisible();

    await switchMainSection(/^spiele$/i);
    expect(screen.getByRole("button", { name: "1" })).toBeVisible();

    await switchAdminSection(/^spiele$/i);
    await user.click(
      within(adminBingoSection).getByRole("button", {
        name: /bingorunde beenden/i,
      }),
    );

    expect(closeBingoRound).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /^awards$/i })).toBeVisible();
    });
  });

  it("verwaltet zufaellige Paarungen im Adminbereich Spiele", async () => {
    mockLoadedData({
      loadedAdminRandomPairingActions: [randomPairingAction],
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^spiele$/i);

    const pairingsSection = sectionForHeading(/zufällige paarungen/i);

    await user.type(
      within(pairingsSection).getByRole("textbox", { name: /aktionsname/i }),
      "Bar-Team",
    );
    await user.click(
      within(pairingsSection).getByRole("button", { name: /aktion anlegen/i }),
    );

    expect(createRandomPairingAction).toHaveBeenCalledWith(
      "hurricane-awards-2026",
      "Bar-Team",
      { participantAccessCode: "ALICE42" },
    );

    const existingAction = within(pairingsSection)
      .getByRole("heading", { name: /getraenk holen/i })
      .closest("article");

    expect(existingAction).not.toBeNull();

    const existingActionView = within(existingAction as HTMLElement);
    const carlaCheckbox = existingActionView.getByLabelText(/carla/i);

    expect(
      existingActionView.queryByRole("button", {
        name: /zuordnungen zurücksetzen/i,
      }),
    ).toBeNull();

    await user.click(carlaCheckbox);

    expect(updateRandomPairingParticipants).toHaveBeenCalledWith(
      "random-action-1",
      ["alice", "bob", "carla"],
      { participantAccessCode: "ALICE42" },
    );

    await user.click(
      existingActionView.getByRole("button", { name: /auslosung starten/i }),
    );

    expect(drawRandomPairingAction).toHaveBeenCalledWith(
      "random-action-1",
      false,
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(pairingsSection).findByText(/paarungen ausgelost/i),
    ).toBeVisible();
    expect(
      within(pairingsSection).getAllByText("Alice").length,
    ).toBeGreaterThan(0);
    expect(within(pairingsSection).getAllByText("Bob").length).toBeGreaterThan(
      0,
    );
  });

  it("setzt ausgeloste zufaellige Paarungen nach Bestaetigung zurueck", async () => {
    mockLoadedData({
      loadedAdminRandomPairingActions: [drawnRandomPairingAction],
      loadedRandomPairingAssignments: [randomPairingAssignment],
    });
    vi.mocked(loadRandomPairingAssignments)
      .mockResolvedValueOnce([randomPairingAssignment])
      .mockResolvedValueOnce([]);
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^spiele$/i);
    const pairingsSection = sectionForHeading(/zufällige paarungen/i);

    await user.click(
      within(pairingsSection).getByRole("button", {
        name: /zuordnungen zurücksetzen/i,
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: /zuordnungen zurücksetzen/i,
    });
    expect(within(dialog).getByText(/nicht direkt rückgängig/i)).toBeVisible();

    await user.click(
      within(dialog).getByRole("button", {
        name: /zuordnungen zurücksetzen/i,
      }),
    );

    expect(resetRandomPairingAction).toHaveBeenCalledWith(
      "hurricane-awards-2026",
      "random-action-1",
      { participantAccessCode: "ALICE42" },
    );
    expect(loadRandomPairingAssignments).toHaveBeenLastCalledWith(
      "hurricane-awards-2026",
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(pairingsSection).findByText(/wurden zurückgesetzt/i),
    ).toBeVisible();
    expect(
      within(pairingsSection).getByRole("button", {
        name: /auslosung starten/i,
      }),
    ).toBeEnabled();
    expect(within(pairingsSection).queryByText(/^ergebnis$/i)).toBeNull();
  });

  it("bricht das Zuruecksetzen zufaelliger Paarungen ohne Aenderung ab", async () => {
    mockLoadedData({
      loadedAdminRandomPairingActions: [drawnRandomPairingAction],
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^spiele$/i);
    const pairingsSection = sectionForHeading(/zufällige paarungen/i);
    await user.click(
      within(pairingsSection).getByRole("button", {
        name: /zuordnungen zurücksetzen/i,
      }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /abbrechen/i,
      }),
    );

    expect(resetRandomPairingAction).not.toHaveBeenCalled();
    expect(within(pairingsSection).getByText(/^ergebnis$/i)).toBeVisible();
  });

  it("zeigt Fehler beim Zuruecksetzen zufaelliger Paarungen an", async () => {
    mockLoadedData({
      loadedAdminRandomPairingActions: [drawnRandomPairingAction],
    });
    vi.mocked(resetRandomPairingAction).mockRejectedValueOnce(
      new Error("reset failed"),
    );
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^spiele$/i);
    const pairingsSection = sectionForHeading(/zufällige paarungen/i);
    await user.click(
      within(pairingsSection).getByRole("button", {
        name: /zuordnungen zurücksetzen/i,
      }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /zuordnungen zurücksetzen/i,
      }),
    );

    expect(await within(pairingsSection).findByRole("alert")).toHaveTextContent(
      /konnten gerade nicht zurückgesetzt werden/i,
    );
    expect(within(pairingsSection).getByText(/^ergebnis$/i)).toBeVisible();
  });

  it("verwaltet Turniere im Adminbereich Spiele", async () => {
    mockLoadedData({
      loadedTournaments: [tournament],
      loadedAdminTournaments: [tournament],
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^spiele$/i);

    const tournamentsSection = sectionForHeading(/^turniere$/i);

    await user.click(
      within(tournamentsSection).getByRole("button", {
        name: /turnier anlegen/i,
      }),
    );
    await user.type(
      within(tournamentsSection).getByLabelText(/turniername/i),
      "Flunkyball Cup",
    );
    await user.click(within(tournamentsSection).getByLabelText(/alice/i));
    await user.click(within(tournamentsSection).getByLabelText(/bob/i));
    await user.click(within(tournamentsSection).getByLabelText(/carla/i));

    expect(
      within(tournamentsSection).getByText(/bekommt jemand ein freilos/i),
    ).toBeVisible();

    await user.click(
      within(tournamentsSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(createTournament).toHaveBeenCalledWith(
      "hurricane-awards-2026",
      {
        name: "Flunkyball Cup",
        mode: "knockout",
        participantIds: ["alice", "bob", "carla"],
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(tournamentsSection).findByText("Flunkyball Cup"),
    ).toBeVisible();

    const existingTournament = within(tournamentsSection)
      .getByRole("heading", { name: /kicker cup/i })
      .closest("article");

    expect(existingTournament).not.toBeNull();

    await user.click(
      within(existingTournament as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    await user.clear(within(tournamentsSection).getByLabelText(/turniername/i));
    await user.type(
      within(tournamentsSection).getByLabelText(/turniername/i),
      "Kicker Finale",
    );
    await user.click(
      within(tournamentsSection).getByRole("button", { name: /^speichern$/i }),
    );

    expect(updateTournament).toHaveBeenCalledWith(
      "tournament-1",
      {
        name: "Kicker Finale",
        mode: "knockout",
        participantIds: ["alice", "bob"],
      },
      { participantAccessCode: "ALICE42" },
    );

    const updatedTournament = await within(tournamentsSection).findByRole(
      "heading",
      { name: /kicker finale/i },
    );
    const updatedTournamentCard = updatedTournament.closest("article");

    expect(updatedTournamentCard).not.toBeNull();

    await user.click(
      within(updatedTournamentCard as HTMLElement).getByRole("button", {
        name: /^löschen$/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Kicker Finale"),
    );
    expect(deleteTournament).toHaveBeenCalledWith("tournament-1", {
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(
        within(tournamentsSection).queryByRole("heading", {
          name: /kicker finale/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("verwaltet Festivaldokumente im Adminbereich Infos", async () => {
    mockLoadedData({
      loadedFestivalDocuments: festivalDocuments,
      loadedAdminFestivalDocuments: festivalDocuments,
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);

    const adminInfoSection = sectionForHeading(/^infos$/i);
    const timetableFile = new File(["pdf"], "timetable-new.pdf", {
      type: "application/pdf",
    });

    await user.upload(
      within(adminInfoSection).getAllByLabelText(/ersetzen/i)[0],
      timetableFile,
    );

    expect(uploadFestivalDocument).toHaveBeenCalledWith(
      {
        documentType: "timetable",
        title: "Timetable",
        file: timetableFile,
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(loadAdminFestivalDocuments).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(loadFestivalDocuments).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });

    await user.click(
      within(adminInfoSection).getAllByRole("button", {
        name: /entfernen/i,
      })[0],
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Timetable"),
    );
    expect(deleteFestivalDocument).toHaveBeenCalledWith("timetable", {
      participantAccessCode: "ALICE42",
    });
  });

  it("validiert Festivaldokument Uploads clientseitig auf PDF und Bilder", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);

    const adminInfoSection = sectionForHeading(/^infos$/i);
    const unsupportedFile = new File(["text"], "notizen.txt", {
      type: "text/plain",
    });

    fireEvent.change(
      within(adminInfoSection).getAllByLabelText(/hochladen/i)[0],
      {
        target: {
          files: [unsupportedFile],
        },
      },
    );

    expect(uploadFestivalDocument).not.toHaveBeenCalled();
    expect(
      await within(adminInfoSection).findByText(/pdf- oder bilddatei/i),
    ).toBeVisible();
  });

  it("verwaltet den Campstandort im Adminbereich Infos", async () => {
    vi.mocked(geocodeCampLocation).mockResolvedValue({
      label: "Scheeßel, Niedersachsen, Deutschland",
      latitude: 53.1667,
      longitude: 9.4833,
      timezone: "Europe/Berlin",
    });
    mockLoadedData({
      loadedCampLocationLink: "https://maps.app.goo.gl/alter-standort",
      loadedAdminCampLocationLink: "https://maps.app.goo.gl/alter-standort",
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);

    const adminInfoSection = sectionForHeading(/^infos$/i);
    const linkInput =
      within(adminInfoSection).getByLabelText(/^standortlink$/i);

    expect(linkInput).toHaveValue("https://maps.app.goo.gl/alter-standort");

    await user.clear(linkInput);
    await user.type(linkInput, "https://wa.me/491701234567");
    await user.click(
      within(adminInfoSection).getByRole("button", {
        name: /standort speichern/i,
      }),
    );

    expect(updateCampLocationLink).toHaveBeenCalledWith(
      "https://wa.me/491701234567",
      {
        label: "Scheeßel, Niedersachsen, Deutschland",
        latitude: 53.1667,
        longitude: 9.4833,
        timezone: "Europe/Berlin",
      },
      { participantAccessCode: "ALICE42" },
    );

    await user.click(
      within(adminInfoSection).getByRole("button", {
        name: /standort entfernen/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Campstandort"),
    );
    expect(deleteCampLocationLink).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
  });

  it("zeigt bei nicht gefundener Standortangabe einen fachlichen Fehler", async () => {
    vi.mocked(geocodeCampLocation).mockRejectedValue(new GeocodingNotFoundError());
    await renderLoadedApp();
    const user = await loginWith("ALICE42");
    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);
    const adminInfoSection = sectionForHeading(/^infos$/i);
    await user.type(within(adminInfoSection).getByLabelText(/ort oder adresse/i), "Eichenring Scheeßel");
    await user.type(within(adminInfoSection).getByLabelText(/^standortlink$/i), "https://maps.app.goo.gl/camp");
    await user.click(within(adminInfoSection).getByRole("button", { name: /standort speichern/i }));
    expect(await within(adminInfoSection).findByText(/konnte kein Ort gefunden werden/i)).toBeVisible();
    expect(updateCampLocationLink).not.toHaveBeenCalled();
  });

  it("speichert, aendert und entfernt die Festival Playlist im Adminbereich Infos", async () => {
    mockLoadedData({
      loadedMusicPlaylist: musicPlaylist,
      loadedAdminMusicPlaylist: musicPlaylist,
    });
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);

    const adminInfoSection = sectionForHeading(/^infos$/i);
    const playlistInput = within(adminInfoSection).getByLabelText(
      /^spotify playlist link$/i,
    );

    expect(playlistInput).toHaveValue(musicPlaylist.externalUrl);

    await user.clear(playlistInput);
    await user.type(
      playlistInput,
      "https://open.spotify.com/playlist/0JQ5DAqbMKFz6FAsUtgAab?si=abc",
    );
    await user.click(
      within(adminInfoSection).getByRole("button", {
        name: /playlist speichern/i,
      }),
    );

    expect(updateMusicPlaylist).toHaveBeenCalledWith(
      "https://open.spotify.com/playlist/0JQ5DAqbMKFz6FAsUtgAab?si=abc",
      { participantAccessCode: "ALICE42" },
    );
    expect(
      await within(adminInfoSection).findByText(/playlist wurde gespeichert/i),
    ).toBeVisible();

    await user.click(
      within(adminInfoSection).getByRole("button", {
        name: /playlist entfernen/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Festival Playlist"),
    );
    expect(deleteMusicPlaylist).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(
      await within(adminInfoSection).findByText(/playlist wurde entfernt/i),
    ).toBeVisible();
  });

  it("speichert ungueltige Spotify Playlist Links nicht", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);

    const adminInfoSection = sectionForHeading(/^infos$/i);
    const playlistInput = within(adminInfoSection).getByLabelText(
      /^spotify playlist link$/i,
    );

    await user.type(playlistInput, "https://open.spotify.com/album/abc");
    await user.click(
      within(adminInfoSection).getByRole("button", {
        name: /playlist speichern/i,
      }),
    );

    expect(updateMusicPlaylist).not.toHaveBeenCalled();
    expect(
      await within(adminInfoSection).findByText(
        /gültigen spotify playlist link/i,
      ),
    ).toBeVisible();
  });

  it("speichert ungueltige Campstandort Links nicht", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^infos$/i);

    const adminInfoSection = sectionForHeading(/^infos$/i);
    const linkInput =
      within(adminInfoSection).getByLabelText(/^standortlink$/i);

    await user.type(linkInput, "https://example.com/camp");
    await user.click(
      within(adminInfoSection).getByRole("button", {
        name: /standort speichern/i,
      }),
    );

    expect(updateCampLocationLink).not.toHaveBeenCalled();
    expect(
      await within(adminInfoSection).findByText(/google maps oder whatsapp/i),
    ).toBeVisible();
  });

  it("legt Teilnehmer im Adminbereich an und aktualisiert die Liste", async () => {
    const newParticipant = {
      id: "dina",
      name: "dina",
      displayName: "Dina",
      accessCode: "NEU23456",
      isAdmin: false,
      isActive: true,
    };

    mockLoadedData();
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(participants)
      .mockResolvedValueOnce([...participants, newParticipant]);
    vi.mocked(createParticipant).mockResolvedValue(newParticipant);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);
    await user.click(
      await screen.findByRole("button", { name: /teilnehmer anlegen/i }),
    );

    expect(suggestParticipantAccessCode).toHaveBeenCalledWith({
      participantAccessCode: "ALICE42",
    });
    expect(screen.getByLabelText(/^teilnehmercode$/i)).toHaveValue("NEU23456");

    await user.type(screen.getByLabelText(/^anzeigename$/i), "Dina");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(createParticipant).toHaveBeenCalledWith(
      { displayName: "Dina", accessCode: "NEU23456" },
      { participantAccessCode: "ALICE42" },
    );
    expect(await screen.findByText("Dina")).toBeVisible();
  });

  it("bearbeitet Teilnehmer im Adminbereich", async () => {
    const updatedParticipant = {
      ...participants[1],
      displayName: "Bobby",
      accessCode: "BOBBY42",
    };

    mockLoadedData();
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(participants)
      .mockResolvedValueOnce([
        participants[0],
        updatedParticipant,
        participants[2],
      ]);
    vi.mocked(updateParticipant).mockResolvedValue(updatedParticipant);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);

    const participantsSection = sectionForHeading(/^teilnehmer$/i);
    const bobCard = (
      await within(participantsSection).findByText("Bob")
    ).closest("article");

    expect(bobCard).not.toBeNull();

    await user.click(
      within(bobCard as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    await user.clear(screen.getByLabelText(/^anzeigename$/i));
    await user.type(screen.getByLabelText(/^anzeigename$/i), "Bobby");
    await user.clear(screen.getByLabelText(/^teilnehmercode$/i));
    await user.type(screen.getByLabelText(/^teilnehmercode$/i), "BOBBY42");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(updateParticipant).toHaveBeenCalledWith(
      { id: "bob", displayName: "Bobby", accessCode: "BOBBY42" },
      { participantAccessCode: "ALICE42" },
    );
    expect(await screen.findByText("Bobby")).toBeVisible();
  });

  it("deaktiviert aktive Teilnehmer nach Bestaetigung", async () => {
    mockLoadedData();
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(participants)
      .mockResolvedValueOnce([
        participants[0],
        { ...participants[1], isActive: false },
        participants[2],
      ]);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);

    const participantsSection = sectionForHeading(/^teilnehmer$/i);
    const bobCard = (
      await within(participantsSection).findByText("Bob")
    ).closest("article");

    expect(bobCard).not.toBeNull();

    await user.click(
      within(bobCard as HTMLElement).getByRole("button", {
        name: /deaktivieren/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalled();
    expect(deactivateParticipant).toHaveBeenCalledWith("bob", {
      participantAccessCode: "ALICE42",
    });
    expect(
      await within(participantsSection).findByText("Deaktiviert"),
    ).toBeVisible();
  });

  it("reaktiviert deaktivierte Teilnehmer", async () => {
    const inactiveParticipants = [
      participants[0],
      { ...participants[1], isActive: false },
      participants[2],
    ];

    mockLoadedData({ loadedAdminParticipants: inactiveParticipants });
    vi.mocked(loadAdminParticipants)
      .mockResolvedValueOnce(inactiveParticipants)
      .mockResolvedValueOnce(participants);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);

    const participantsSection = sectionForHeading(/^teilnehmer$/i);
    const bobCard = (
      await within(participantsSection).findByText("Bob")
    ).closest("article");

    expect(bobCard).not.toBeNull();

    await user.click(
      within(bobCard as HTMLElement).getByRole("button", {
        name: /reaktivieren/i,
      }),
    );

    expect(reactivateParticipant).toHaveBeenCalledWith("bob", {
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(
        within(participantsSection).getAllByText("Aktiv").length,
      ).toBeGreaterThan(1);
    });
  });

  it("zeigt Fehler beim Laden und Speichern der Teilnehmerverwaltung", async () => {
    mockLoadedData();
    vi.mocked(loadAdminParticipants).mockRejectedValueOnce(
      new Error("load failed"),
    );
    vi.mocked(createParticipant).mockRejectedValueOnce(
      new Error("participant access code already exists"),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^teilnehmer$/i);

    expect(
      await screen.findByText(
        /teilnehmerverwaltung konnte gerade nicht geladen/i,
      ),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: /teilnehmer anlegen/i }),
    );
    await user.type(screen.getByLabelText(/^anzeigename$/i), "Dina");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(
      await screen.findByText(/teilnehmercode ist bereits vergeben/i),
    ).toBeVisible();
  });

  it("aendert den Kategorie-Status ueber den Admin-Bereich", async () => {
    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^awards$/i);
    const statusSelects = await screen.findAllByLabelText(/status/i);

    await user.selectOptions(statusSelects[0], "open");

    expect(updateCategory).toHaveBeenCalledWith(
      { id: "upcoming-category", status: "open" },
      { participantAccessCode: "ALICE42" },
    );
    const adminSection = sectionForHeading(/^kategorien$/i);
    const updatedCard = within(adminSection)
      .getByRole("heading", { name: "Bester Camp-Aufbau" })
      .closest("article");

    expect(updatedCard).not.toBeNull();
    expect(
      within(updatedCard as HTMLElement).getByText(/^offen$/i),
    ).toBeVisible();
  });

  it("legt Kategorien im Adminbereich an und aktualisiert die Liste", async () => {
    const newCategory: Category = {
      id: "new-category",
      title: "Beste Playlist",
      description: "Soundtrack des Wochenendes.",
      status: "upcoming",
      sortOrder: 4,
    };

    mockLoadedData();
    vi.mocked(loadAdminCategories)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([...categories, newCategory]);
    vi.mocked(loadCategories).mockResolvedValueOnce(categories);
    vi.mocked(createCategory).mockResolvedValue(newCategory);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^awards$/i);
    await user.click(
      await screen.findByRole("button", { name: /kategorie anlegen/i }),
    );

    await user.type(screen.getByLabelText(/^titel$/i), "Beste Playlist");
    await user.type(
      screen.getByLabelText(/^beschreibung$/i),
      "Soundtrack des Wochenendes.",
    );
    await user.type(screen.getByLabelText(/^sortierung$/i), "4");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(createCategory).toHaveBeenCalledWith(
      {
        title: "Beste Playlist",
        description: "Soundtrack des Wochenendes.",
        status: "upcoming",
        sortOrder: 4,
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(await screen.findByText("Beste Playlist")).toBeVisible();
  });

  it("bearbeitet Kategorien im Adminbereich", async () => {
    const updatedCategory: Category = {
      ...categories[1],
      title: "Beste Festival-Laune",
      description: "Aktualisierte Beschreibung.",
      status: "closed",
      sortOrder: 5,
    };

    mockLoadedData();
    vi.mocked(loadAdminCategories)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([categories[0], updatedCategory, categories[2]]);
    vi.mocked(updateCategory).mockResolvedValue(updatedCategory);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^awards$/i);

    const adminSection = sectionForHeading(/^kategorien$/i);
    const categoryCard = (
      await within(adminSection).findByRole("heading", {
        name: "Beste Festival-Energie",
      })
    ).closest("article");

    expect(categoryCard).not.toBeNull();

    await user.click(
      within(categoryCard as HTMLElement).getByRole("button", {
        name: /bearbeiten/i,
      }),
    );
    await user.clear(screen.getByLabelText(/^titel$/i));
    await user.type(screen.getByLabelText(/^titel$/i), "Beste Festival-Laune");
    await user.clear(screen.getByLabelText(/^beschreibung$/i));
    await user.type(
      screen.getByLabelText(/^beschreibung$/i),
      "Aktualisierte Beschreibung.",
    );
    await user.selectOptions(screen.getByLabelText(/^status$/i), "closed");
    await user.clear(screen.getByLabelText(/^sortierung$/i));
    await user.type(screen.getByLabelText(/^sortierung$/i), "5");
    await user.click(screen.getByRole("button", { name: /^speichern$/i }));

    expect(updateCategory).toHaveBeenCalledWith(
      {
        id: "open-category",
        title: "Beste Festival-Laune",
        description: "Aktualisierte Beschreibung.",
        status: "closed",
        sortOrder: 5,
      },
      { participantAccessCode: "ALICE42" },
    );
    expect(await screen.findByText("Beste Festival-Laune")).toBeVisible();
  });

  it("loescht Kategorien nach Bestaetigung und aktualisiert die Liste", async () => {
    mockLoadedData();
    vi.mocked(loadAdminCategories)
      .mockResolvedValueOnce(categories)
      .mockResolvedValueOnce([categories[0], categories[1]]);
    vi.mocked(loadCategories).mockResolvedValueOnce(categories);

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^awards$/i);

    const adminSection = sectionForHeading(/^kategorien$/i);
    const categoryCard = (
      await within(adminSection).findByRole("heading", {
        name: "Beste Regenjacke",
      })
    ).closest("article");

    expect(categoryCard).not.toBeNull();

    await user.click(
      within(categoryCard as HTMLElement).getByRole("button", {
        name: /^löschen$/i,
      }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Beste Regenjacke"),
    );
    expect(deleteCategory).toHaveBeenCalledWith("closed-category", {
      participantAccessCode: "ALICE42",
    });
    await waitFor(() => {
      expect(
        within(adminSection).queryByRole("heading", {
          name: "Beste Regenjacke",
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("zeigt Fehler aus der Kategorienverwaltung verstaendlich an", async () => {
    mockLoadedData();
    vi.mocked(deleteCategory).mockRejectedValueOnce(
      new Error("category cannot be deleted while votes exist"),
    );

    await renderLoadedApp();
    const user = await loginWith("ALICE42");

    await user.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^awards$/i);

    const adminSection = sectionForHeading(/^kategorien$/i);
    const categoryCard = (
      await within(adminSection).findByRole("heading", {
        name: "Beste Festival-Energie",
      })
    ).closest("article");

    expect(categoryCard).not.toBeNull();

    await user.click(
      within(categoryCard as HTMLElement).getByRole("button", {
        name: /^löschen$/i,
      }),
    );

    expect(
      await screen.findByText(/solange stimmen vorhanden sind/i),
    ).toBeVisible();
  });

  it("bricht das Loeschen ab, wenn die Bestaetigung ausbleibt", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    await renderLoadedApp();
    await loginWith("ALICE42");

    await userEvent.click(screen.getByRole("button", { name: /^admin$/i }));
    await switchAdminSection(/^awards$/i);
    await userEvent.click(
      screen.getAllByRole("button", { name: /^löschen$/i })[1],
    );

    expect(deleteCategory).not.toHaveBeenCalled();
  });

  it("laedt Teilnehmerverwaltung nicht fuer normale Teilnehmer", async () => {
    await renderLoadedApp();
    await loginWith("BOB42");

    expect(loadAdminParticipants).not.toHaveBeenCalled();
    expect(loadAdminCategories).not.toHaveBeenCalled();
  });
});
