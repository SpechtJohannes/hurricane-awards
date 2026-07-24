import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  createCategory,
  deleteCategory,
  loadAdminCategories,
  loadCategories,
  updateCategory,
  type Category,
  type CategoryStatus,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "./data/categories";
import {
  createParticipant,
  deactivateParticipant,
  loginParticipant,
  loadAdminParticipants,
  loadParticipants,
  reactivateParticipant,
  suggestParticipantAccessCode,
  updateParticipant,
  updateOwnProfile,
  type Participant,
} from "./data/participants";
import {
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from "./data/votes";
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from "./data/allTimeStandings";
import {
  archiveFestival,
  loadFestivalAccessCode,
  loadEventSettings,
  updateFestivalAccessCode,
  updateEventSettings,
  type EventSettings,
} from "./data/festival";
import {
  eventLogoPublicUrl,
  removeEventLogo,
  uploadEventLogo,
} from "./data/festivalLogo";
import {
  festivalExportFileName,
  loadFestivalExportData,
  serializeFestivalExport,
} from "./data/export";
import {
  deleteFestivalDocument,
  deleteCampLocationLink,
  isSupportedFestivalDocumentFile,
  isSupportedCampLocationLink,
  geocodeCampLocation,
  GeocodingNotFoundError,
  loadAdminCampLocationLink,
  loadAdminFestivalDocuments,
  loadCampLocationLink,
  loadFestivalDocuments,
  updateCampLocationLink,
  uploadFestivalDocument,
  type CampLocationLink,
  type FestivalDocument,
  type FestivalDocumentType,
} from "./data/festivalDocuments";
import {
  deleteMusicPlaylist,
  loadAdminMusicPlaylist,
  loadMusicPlaylist,
  updateMusicPlaylist,
} from "./data/festivalMusic";
import {
  closeBingoRound,
  loadAdminBingoRound,
  loadOrCreateBingoCard,
  setBingoMark,
  startBingoRound,
  type BingoCard,
  type BingoRound,
} from "./data/bingo";
import {
  loadAdminHorseRacingBets,
  loadAdminHorseRacingState,
  loadHorseRacingState,
  saveHorseRacingBet,
  updateAdminHorseRacingState,
  type AdminHorseRacingBet,
  type AdminHorseRacingState,
  type HorseRacingBettingStatus,
  type HorseRacingState,
  type HorseRacingSuit,
} from "./data/horseRacing";
import {
  createRandomPairingAction,
  drawRandomPairingAction,
  loadAdminRandomPairingActions,
  loadRandomPairingAssignments,
  resetRandomPairingAction,
  updateRandomPairingParticipants,
  type AdminRandomPairingAction,
  type RandomPairingParticipantAssignment,
} from "./data/randomPairings";
import {
  createTournament,
  deleteTournament,
  loadAdminTournaments,
  loadTournaments,
  setTournamentMatchWinner,
  updateTournament,
  type Tournament,
  type TournamentMode,
} from "./data/tournaments";
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
  type CreateTimetablePerformanceInput,
  type CreateFestivalDayInput,
  type CreateTimetableActInput,
  type CreateTimetableStageInput,
  type FestivalDay,
  type Timetable,
  type TimetableAct,
  type TimetableFavoriteParticipant,
  type TimetablePerformance,
  type TimetablePerformanceFavorites,
  type TimetableStage,
  type UpdateFestivalDayInput,
  type UpdateTimetableActInput,
  type UpdateTimetablePerformanceInput,
  type UpdateTimetableStageInput,
} from "./data/timetable";
import {
  addArtistTag,
  assignArtistTag,
  loadActArtistTags,
  loadArtistTags,
  removeArtistTag,
  type ActArtistTag,
  type ArtistTag,
} from "./data/artistTags";
import { loadArtistTagPreferences, replaceArtistTagPreferences } from "./data/artistTagPreferences";
import { MusicalPreferences } from "./components/MusicalPreferences";
import {
  isSupportedMusicPlaylistLink,
  type MusicPlaylist,
} from "./data/musicEmbeds";
import { activeFestival, festivalStorageKey } from "./config/festivals";
import {
  AdminParticipants,
  type ParticipantFormState,
} from "./components/AdminParticipants";
import { AdminFestival } from "./components/AdminFestival";
import { AdminCategories } from "./components/AdminCategories";
import { AdminFestivalDocuments } from "./components/AdminFestivalDocuments";
import { AdminBingo } from "./components/AdminBingo";
import { AdminHorseRacing } from "./components/AdminHorseRacing";
import { AdminRandomPairings } from "./components/AdminRandomPairings";
import { AdminTournaments } from "./components/AdminTournaments";
import { AdminTimetableActs } from "./components/AdminTimetableActs";
import { AdminTimetableDays } from "./components/AdminTimetableDays";
import { AdminTimetablePerformances } from "./components/AdminTimetablePerformances";
import { AdminTimetableStages } from "./components/AdminTimetableStages";
import { Bingo } from "./components/Bingo";
import { HorseRacing } from "./components/HorseRacing";
import { RandomPairings } from "./components/RandomPairings";
import { Tournaments } from "./components/Tournaments";
import { FestivalInfo } from "./components/FestivalInfo";
import { Avatar, ParticipantName } from "./components/Avatar";
import { SectionHeader } from "./components/SectionHeader";
import { DashboardHero } from "./components/DashboardHero";
import { EventBrand } from "./components/EventBrand";
import { Artists } from "./components/Artists";
import { ArtistDetail } from "./components/ArtistDetail";
import { useFestivalAccess } from "./hooks/useFestivalAccess";
import { useFestivalCodeUnlock } from "./hooks/useFestivalCodeUnlock";
import { avatars } from "./config/avatars";
import i18n from "./i18n";
import { supportedLanguages, type SupportedLanguage } from "./i18n";
import { determineEventPhase } from "./domain/eventPhase";
import type { EventPhase } from "./domain/eventPhase";
import {
  dashboardModuleConfig,
  selectDashboardModules,
} from "./domain/dashboardModules";
import "./App.css";

type CategoryResult = {
  participant: Participant;
  voteCount: number;
};

type CategoryResults = {
  category: Category;
  results: CategoryResult[];
  highestVoteCount: number;
};

function countVotesForParticipant(
  votes: Vote[],
  categoryId: string,
  participantId: string,
): number {
  return votes.filter(
    (vote) =>
      vote.categoryId === categoryId && vote.votedForId === participantId,
  ).length;
}

function createCategoryResult(
  participant: Participant,
  categoryId: string,
  votes: Vote[],
): CategoryResult {
  return {
    participant,
    voteCount: countVotesForParticipant(votes, categoryId, participant.id),
  };
}

function compareCategoryResults(
  firstResult: CategoryResult,
  secondResult: CategoryResult,
): number {
  if (secondResult.voteCount !== firstResult.voteCount) {
    return secondResult.voteCount - firstResult.voteCount;
  }

  return firstResult.participant.displayName.localeCompare(
    secondResult.participant.displayName,
  );
}

function createResultsForCategory(
  category: Category,
  participants: Participant[],
  votes: Vote[],
): CategoryResults {
  const results = participants
    .map((participant) => createCategoryResult(participant, category.id, votes))
    .sort(compareCategoryResults);

  return {
    category,
    results,
    highestVoteCount: results[0]?.voteCount ?? 0,
  };
}

function createResultsByCategory(
  categories: Category[],
  participants: Participant[],
  votes: Vote[],
): CategoryResults[] {
  return categories.map((category) =>
    createResultsForCategory(category, participants, votes),
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const fallbackFestivalName = "";

const authenticatedParticipantSessionStorageKey = festivalStorageKey(
  activeFestival.id,
  "participant",
);
const legacyAuthenticatedParticipantStorageKey =
  authenticatedParticipantSessionStorageKey;

function readStoredParticipant(): Participant | null {
  localStorage.removeItem(legacyAuthenticatedParticipantStorageKey);

  const storedParticipant = sessionStorage.getItem(
    authenticatedParticipantSessionStorageKey,
  );

  if (!storedParticipant) {
    return null;
  }

  try {
    const parsedParticipant = JSON.parse(
      storedParticipant,
    ) as Partial<Participant>;

    if (
      typeof parsedParticipant.id === "string" &&
      typeof parsedParticipant.name === "string" &&
      typeof parsedParticipant.displayName === "string" &&
      typeof parsedParticipant.accessCode === "string"
    ) {
      return {
        id: parsedParticipant.id,
        name: parsedParticipant.name,
        displayName: parsedParticipant.displayName,
        ...(typeof parsedParticipant.avatarId === "string"
          ? { avatarId: parsedParticipant.avatarId }
          : {}),
        accessCode: parsedParticipant.accessCode,
        isAdmin: parsedParticipant.isAdmin === true,
        isActive: parsedParticipant.isActive !== false,
      };
    }
  } catch {
    sessionStorage.removeItem(authenticatedParticipantSessionStorageKey);
  }

  return null;
}

function storeAuthenticatedParticipant(participant: Participant) {
  localStorage.removeItem(legacyAuthenticatedParticipantStorageKey);
  sessionStorage.setItem(
    authenticatedParticipantSessionStorageKey,
    JSON.stringify(participant),
  );
}

function clearStoredParticipant() {
  localStorage.removeItem(legacyAuthenticatedParticipantStorageKey);
  sessionStorage.removeItem(authenticatedParticipantSessionStorageKey);
}

function technicalErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function updateTournamentParticipantName(
  tournament: Tournament,
  participant: Participant,
): Tournament {
  const updateBracketParticipant = <
    T extends { participantId: string; participantName: string } | null,
  >(
    bracketParticipant: T,
  ): T =>
    bracketParticipant?.participantId === participant.id
      ? ({
          ...bracketParticipant,
          participantName: participant.displayName,
        } as T)
      : bracketParticipant;

  return {
    ...tournament,
    bracket: {
      ...tournament.bracket,
      rounds: tournament.bracket.rounds.map((round) => ({
        ...round,
        matches: round.matches.map((match) => ({
          ...match,
          participantA: {
            ...match.participantA,
            participant: updateBracketParticipant(
              match.participantA.participant,
            ),
          },
          participantB: {
            ...match.participantB,
            participant: updateBracketParticipant(
              match.participantB.participant,
            ),
          },
        })),
        ...(round.byes
          ? { byes: round.byes.map(updateBracketParticipant) }
          : {}),
      })),
    },
  };
}

function updateTimetableParticipant(
  timetable: Timetable | null,
  participant: Participant,
): Timetable | null {
  if (!timetable) return timetable;

  return {
    ...timetable,
    performanceFavorites: timetable.performanceFavorites.map((favorite) => ({
      ...favorite,
      participants: favorite.participants.map((favoriteParticipant) =>
        favoriteParticipant.participantId === participant.id
          ? {
              ...favoriteParticipant,
              displayName: participant.displayName,
              avatarId: participant.avatarId ?? null,
            }
          : favoriteParticipant,
      ),
    })),
  };
}

function updateRandomPairingActionParticipant(
  action: AdminRandomPairingAction,
  participant: Participant,
): AdminRandomPairingAction {
  return {
    ...action,
    assignments: action.assignments.map((assignment) => ({
      ...assignment,
      ...(assignment.participantId === participant.id
        ? { participantName: participant.displayName }
        : {}),
      ...(assignment.assignedParticipantId === participant.id
        ? { assignedParticipantName: participant.displayName }
        : {}),
    })),
  };
}

function removeFavoriteParticipant(
  participants: TimetableFavoriteParticipant[],
  participantId: string,
) {
  return participants.filter(
    (participant) => participant.participantId !== participantId,
  );
}

function replacePerformanceFavorite(
  favorites: TimetablePerformanceFavorites[],
  updatedFavorite: TimetablePerformanceFavorites,
) {
  return favorites.map((favorite) =>
    favorite.performanceId === updatedFavorite.performanceId
      ? updatedFavorite
      : favorite,
  );
}

function updatePerformanceFavorite(
  favorites: TimetablePerformanceFavorites[],
  performanceId: string,
  isFavorite: boolean,
  participant: Participant,
) {
  const existing = favorites.find(
    (favorite) => favorite.performanceId === performanceId,
  );
  const otherParticipants = removeFavoriteParticipant(
    existing?.participants ?? [],
    participant.id,
  );
  const updatedFavorite = {
    performanceId,
    participants: isFavorite
      ? otherParticipants
      : [
          ...otherParticipants,
          {
            participantId: participant.id,
            displayName: participant.displayName,
            avatarId: participant.avatarId ?? null,
          },
        ],
  };

  return existing
    ? replacePerformanceFavorite(favorites, updatedFavorite)
    : [...favorites, updatedFavorite];
}

function updatePerformanceFavorites(
  favorites: TimetablePerformanceFavorites[],
  performanceIds: string[],
  isFavorite: boolean,
  participant: Participant,
) {
  return performanceIds.reduce(
    (updatedFavorites, performanceId) =>
      updatePerformanceFavorite(
        updatedFavorites,
        performanceId,
        isFavorite,
        participant,
      ),
    favorites,
  );
}

type MainSection =
  | "dashboard"
  | "voting"
  | "awards"
  | "timetable"
  | "artists"
  | "games"
  | "info"
  | "profile";
type AdminSection =
  | "festival"
  | "participants"
  | "awards"
  | "timetable"
  | "games"
  | "info"
  | "archive";
type GameSection = "bingo" | "horseRacing" | "randomPairings" | "tournaments";

const mainSectionHashes: Record<Exclude<MainSection, "dashboard">, string> = {
  voting: "#voting",
  awards: "#awards",
  timetable: "#timetable",
  artists: "#artists",
  games: "#games",
  info: "#info",
  profile: "#profile",
};

function mainSectionFromHash(hash: string): MainSection | null {
  if (hash === "#artists" || hash.startsWith("#artists/")) {
    return "artists";
  }
  const entry = Object.entries(mainSectionHashes).find(
    ([, sectionHash]) => sectionHash === hash,
  );
  return (entry?.[0] as MainSection | undefined) ?? null;
}

type ResultCardProps = {
  category: Category;
  results: CategoryResult[];
  highestVoteCount: number;
};

function ResultCard({ category, results, highestVoteCount }: ResultCardProps) {
  const { t } = useTranslation();
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t("status.upcoming"),
    open: t("status.open"),
    closed: t("status.closed"),
  };
  const isClosed = category.status === "closed";
  const [isClosedResultExpanded, setIsClosedResultExpanded] = useState(false);
  const isCollapsed = isClosed && !isClosedResultExpanded;
  const resultListId = `result-list-${category.id}`;
  const leaders = results.filter(
    ({ voteCount }) => highestVoteCount > 0 && voteCount === highestVoteCount,
  );

  return (
    <article
      className={`result-card${isCollapsed ? " result-card--collapsed" : ""}`}
    >
      <div className="result-card__header">
        <div>
          <h3>{category.title}</h3>
          {isClosed ? (
            <span className="result-card__status">{statusLabels.closed}</span>
          ) : null}
        </div>

        {isClosed ? (
          <button
            className="result-card__toggle"
            type="button"
            onClick={() =>
              setIsClosedResultExpanded((isExpanded) => !isExpanded)
            }
            aria-expanded={!isCollapsed}
            aria-controls={resultListId}
            aria-label={`${category.title} ${
              isCollapsed ? t("results.expand") : t("results.collapse")
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
              <path d="m6.7 9.3 5.3 5.29 5.3-5.3 1.4 1.42-6.7 6.7-6.7-6.7 1.4-1.42Z" />
            </svg>
          </button>
        ) : null}
      </div>

      {isCollapsed ? (
        <div className="result-card__leaders">
          <span>{t("results.leading")}</span>
          {leaders.length > 0 ? (
            <ul>
              {leaders.map(({ participant, voteCount }) => (
                <li key={participant.id}>
                  <strong>
                    <ParticipantName
                      avatarId={participant.avatarId}
                      name={participant.displayName}
                    />
                  </strong>
                  <span>{voteCount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("results.emptyCategory")}</p>
          )}
        </div>
      ) : null}

      <div className="result-card__list" id={resultListId} hidden={isCollapsed}>
        {results.map(({ participant, voteCount }) => {
          const width =
            highestVoteCount > 0
              ? `${(voteCount / highestVoteCount) * 100}%`
              : "0%";
          const isLeader =
            highestVoteCount > 0 && voteCount === highestVoteCount;

          return (
            <div
              className={`result-card__row${
                isLeader ? " result-card__row--leader" : ""
              }`}
              key={participant.id}
            >
              <div className="result-card__label">
                <ParticipantName
                  avatarId={participant.avatarId}
                  name={participant.displayName}
                />
                <strong>{voteCount}</strong>
              </div>
              <div className="result-card__bar" aria-hidden="true">
                <span style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage?.split("-")[0] ?? "de";

  function changeLanguage(language: SupportedLanguage) {
    void i18n.changeLanguage(language);
  }

  return (
    <div className="language-switcher" aria-label={t("language.label")}>
      {supportedLanguages.map((language) => (
        <button
          className={
            activeLanguage === language
              ? "language-switcher__button is-active"
              : "language-switcher__button"
          }
          type="button"
          key={language}
          onClick={() => changeLanguage(language)}
          aria-pressed={activeLanguage === language}
          aria-label={t(`language.${language}`)}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isSafari =
    /safari/i.test(userAgent) && !/crios|fxios|edgios/i.test(userAgent);

  return isIos && isSafari;
}

function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());
  const [showIosHelp, setShowIosHelp] = useState(false);
  const isIos = isIosSafari();
  const canShowPrompt = Boolean(installPrompt);
  const shouldShow = !isInstalled && (canShowPrompt || isIos);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowIosHelp(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function installApp() {
    if (isIos) {
      setShowIosHelp((isVisible) => !isVisible);
      return;
    }

    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallPrompt(null);
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="install-prompt">
      <button
        className="install-prompt__button"
        type="button"
        onClick={installApp}
        aria-describedby={showIosHelp ? "install-prompt-help" : undefined}
      >
        {t("installPrompt.button")}
      </button>
      {showIosHelp ? (
        <p className="install-prompt__help" id="install-prompt-help">
          {t("installPrompt.iosHelp")}
        </p>
      ) : null}
    </div>
  );
}

function AppFooter() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <a href="#impressum">{t("legal.link")}</a>
      <a href="#datenschutz">{t("privacy.link")}</a>
    </footer>
  );
}

type LegalNoticeProps = {
  festivalName: string;
};

function LegalNotice({ festivalName }: LegalNoticeProps) {
  const { t } = useTranslation();

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.hash = "";
  }

  return (
    <main
      className="home legal-page"
      aria-label={t("legal.ariaLabel", {
        festivalName: festivalName || t("common.loading"),
      })}
    >
      <section className="legal-page__content" aria-labelledby="legal-title">
        <p className="legal-page__eyebrow">{t("legal.eyebrow")}</p>
        <h1 id="legal-title">{t("legal.title")}</h1>
        <dl className="legal-page__details">
          <div>
            <dt>{t("legal.fields.name")}</dt>
            <dd>{t("legal.placeholders.name")}</dd>
          </div>
          <div>
            <dt>{t("legal.fields.address")}</dt>
            <dd>{t("legal.placeholders.address")}</dd>
          </div>
          <div>
            <dt>{t("legal.fields.email")}</dt>
            <dd>{t("legal.placeholders.email")}</dd>
          </div>
        </dl>
        <a className="legal-page__back" href="#" onClick={goBack}>
          {t("legal.back")}
        </a>
      </section>
    </main>
  );
}

function PrivacyNotice({ festivalName }: LegalNoticeProps) {
  const { t } = useTranslation();
  const sections = [
    "controller",
    "processedData",
    "purpose",
    "legalBasis",
    "retention",
    "supabase",
    "weather",
    "rights",
    "contact",
  ];

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.hash = "";
  }

  return (
    <main
      className="home legal-page"
      aria-label={t("privacy.ariaLabel", {
        festivalName: festivalName || t("common.loading"),
      })}
    >
      <section className="legal-page__content" aria-labelledby="privacy-title">
        <p className="legal-page__eyebrow">{t("privacy.eyebrow")}</p>
        <h1 id="privacy-title">{t("privacy.title")}</h1>
        <div className="legal-page__sections">
          {sections.map((sectionKey) => (
            <article className="legal-page__section" key={sectionKey}>
              <h2>{t(`privacy.sections.${sectionKey}.title`)}</h2>
              <p>{t(`privacy.sections.${sectionKey}.body`)}</p>
            </article>
          ))}
        </div>
        <a className="legal-page__back" href="#" onClick={goBack}>
          {t("privacy.back")}
        </a>
      </section>
    </main>
  );
}

type TimetableSectionProps = {
  timetable: Timetable | null;
  error: string;
  isLoading: boolean;
  currentParticipantId: string | null;
  togglingPerformanceId: string | null;
  onBackToDashboard: () => void;
  onToggleFavorite: (performanceId: string, isFavorite: boolean) => void;
};

type TimetableDaySchedule = {
  day: Timetable["festivalDays"][number];
  performances: Timetable["performances"];
  timeSlots: string[];
  timeRows: string[];
};

type DashboardTile = {
  id: string;
  section: MainSection;
  title: string;
  description: string;
  status: string;
  detail: string;
  avatar?: {
    avatarId?: string | null;
    name: string;
  };
};

type DashboardSectionProps = {
  festivalName: string;
  eventLogoUrl: string | null;
  participantName: string | null;
  tiles: DashboardTile[];
  isAuthenticated: boolean;
  participantAccessCode: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  eventPhase: EventPhase;
  referenceInstant: Date;
  timetable: Timetable | null;
  activeCategory: Category | null;
  onNavigate: (section: MainSection) => void;
};

function timeLabel(value: string) {
  return value.slice(11, 16);
}

function stageColorStyle(color: string | null): CSSProperties | undefined {
  return color
    ? ({
        "--stage-color": color,
      } as CSSProperties)
    : undefined;
}

function renderWhen(condition: boolean, render: () => ReactNode): ReactNode {
  return condition ? render() : null;
}

function renderEither(
  condition: boolean,
  renderTruthy: () => ReactNode,
  renderFalsy: () => ReactNode,
): ReactNode {
  return condition ? renderTruthy() : renderFalsy();
}

function isAuthenticatedSection(
  participant: Participant | null,
  activeSection: MainSection,
  section: MainSection,
): boolean {
  return participant !== null && activeSection === section;
}

function isAdminAreaVisible(
  participant: Participant | null,
  isVisible: boolean,
): boolean {
  return Boolean(participant?.isAdmin) && isVisible;
}

type DashboardBackButtonProps = {
  onClick: () => void;
  width?: "standard" | "narrow";
};

function DashboardBackButton({
  onClick,
  width = "standard",
}: DashboardBackButtonProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`dashboard-back${
        width === "narrow" ? " dashboard-back--narrow" : ""
      }`}
    >
      <button
        className="dashboard-back__button"
        type="button"
        onClick={onClick}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
          <path d="M10.7 6.3 5 12l5.7 5.7 1.4-1.4-3.3-3.3H19v-2H8.8l3.3-3.3-1.4-1.4Z" />
        </svg>
        <span>{t("navigation.backToDashboard")}</span>
      </button>
    </div>
  );
}

function DashboardSection({
  festivalName,
  eventLogoUrl,
  participantName,
  tiles,
  isAuthenticated,
  participantAccessCode,
  eventStartDate,
  eventEndDate,
  eventPhase,
  referenceInstant,
  timetable,
  activeCategory,
  onNavigate,
}: DashboardSectionProps) {
  const { t } = useTranslation();
  const showEventStatus =
    selectDashboardModules(
      [{ id: "eventStatus" }],
      dashboardModuleConfig,
      eventPhase,
    ).length > 0;

  return (
    <section
      className="dashboard"
      id="main-dashboard"
      aria-labelledby="dashboard-title"
    >
      <DashboardHero
        festivalName={festivalName}
        eventLogoUrl={eventLogoUrl}
        participantName={participantName}
        isAuthenticated={isAuthenticated}
        participantAccessCode={participantAccessCode}
        eventStartDate={eventStartDate}
        eventEndDate={eventEndDate}
        referenceInstant={referenceInstant}
        timetable={timetable}
        activeCategory={activeCategory}
        showEventStatus={showEventStatus}
        onOpenTimetable={() => onNavigate("timetable")}
        onOpenVoting={() => onNavigate(isAuthenticated ? "voting" : "profile")}
      />

      <div className="dashboard__grid" aria-label={t("dashboard.quickAccess")}>
        {tiles.map((tile) => (
          <button
            className={`dashboard-tile dashboard-tile--${tile.section}`}
            type="button"
            key={tile.id}
            onClick={() =>
              onNavigate(isAuthenticated ? tile.section : "profile")
            }
          >
            <span className="dashboard-tile__title">{tile.title}</span>
            <span className="dashboard-tile__description">
              {tile.description}
            </span>
            {tile.avatar ? (
              <span className="dashboard-tile__profile">
                <Avatar
                  avatarId={tile.avatar.avatarId}
                  name={tile.avatar.name}
                />
                <span>{tile.avatar.name}</span>
              </span>
            ) : null}
            <span className="dashboard-tile__status">{tile.status}</span>
            <span className="dashboard-tile__detail">{tile.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function TimetableSection({
  timetable,
  error,
  isLoading,
  currentParticipantId,
  togglingPerformanceId,
  onBackToDashboard,
  onToggleFavorite,
}: TimetableSectionProps) {
  const { t } = useTranslation();
  const hasTimetableStructure = Boolean(
    timetable &&
    timetable.festivalDays.length > 0 &&
    timetable.stages.length > 0 &&
    timetable.performances.length > 0,
  );
  const actById = useMemo(
    () => new Map(timetable?.acts.map((act) => [act.id, act]) ?? []),
    [timetable?.acts],
  );
  const stageIndexById = useMemo(
    () =>
      new Map(timetable?.stages.map((stage, index) => [stage.id, index]) ?? []),
    [timetable?.stages],
  );
  const favoritePerformanceIds = useMemo(
    () => new Set(timetable?.favoritePerformanceIds ?? []),
    [timetable?.favoritePerformanceIds],
  );
  const favoriteParticipantsByPerformanceId = useMemo(
    () =>
      new Map(
        timetable?.performanceFavorites.map((favorite) => [
          favorite.performanceId,
          favorite.participants,
        ]) ?? [],
      ),
    [timetable?.performanceFavorites],
  );
  const daySchedules = useMemo<TimetableDaySchedule[]>(() => {
    if (!timetable) {
      return [];
    }

    const performancesByDay = new Map<string, Timetable["performances"]>();

    for (const performance of timetable.performances) {
      const performances =
        performancesByDay.get(performance.festivalDayId) ?? [];

      performances.push(performance);
      performancesByDay.set(performance.festivalDayId, performances);
    }

    return timetable.festivalDays
      .map((day) => {
        const performances = (performancesByDay.get(day.id) ?? [])
          .slice()
          .sort((firstPerformance, secondPerformance) =>
            firstPerformance.startsAt.localeCompare(secondPerformance.startsAt),
          );
        const timeSlots = Array.from(
          new Set(
            performances
              .flatMap((performance) => [
                performance.startsAt,
                performance.endsAt,
              ])
              .filter((value): value is string => Boolean(value)),
          ),
        ).sort((firstTimeSlot, secondTimeSlot) =>
          firstTimeSlot.localeCompare(secondTimeSlot),
        );

        return {
          day,
          performances,
          timeSlots,
          timeRows: timeSlots.length > 1 ? timeSlots.slice(0, -1) : timeSlots,
        };
      })
      .filter(({ performances }) => performances.length > 0);
  }, [timetable]);

  return (
    <section
      className="timetable"
      id="main-timetable"
      aria-labelledby="timetable-title"
    >
      <DashboardBackButton onClick={onBackToDashboard} width="narrow" />

      <SectionHeader
        title={t("timetable.title")}
        titleId="timetable-title"
        eyebrow={t("timetable.eyebrow")}
        width="narrow"
      />

      {isLoading ? (
        <p className="timetable__notice" role="status">
          {t("timetable.loading")}
        </p>
      ) : null}
      {error ? (
        <p className="timetable__notice timetable__notice--error" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading &&
      !error &&
      timetable &&
      timetable.performances.length === 0 ? (
        <p className="timetable__notice">{t("timetable.empty")}</p>
      ) : null}
      {!isLoading &&
      !error &&
      timetable &&
      timetable.festivalDays.length > 0 &&
      timetable.performances.length > 0 &&
      timetable.stages.length === 0 ? (
        <p className="timetable__notice">{t("timetable.emptyStages")}</p>
      ) : null}

      {!isLoading && !error && hasTimetableStructure && timetable ? (
        <div className="timetable__days">
          {daySchedules.map(({ day, performances, timeSlots, timeRows }) => {
            return (
              <article className="timetable-day" key={day.id}>
                <div className="timetable-day__header">
                  <p>{day.date}</p>
                  <h3>{day.label}</h3>
                </div>

                <div className="timetable-grid" role="table">
                  <p className="timetable-grid__hint">
                    {t("timetable.scrollHint")}
                  </p>
                  <div
                    className="timetable-grid__inner"
                    style={{
                      gridTemplateColumns: `76px repeat(${timetable.stages.length}, minmax(180px, 1fr))`,
                      gridTemplateRows: `auto repeat(${Math.max(timeRows.length, 1)}, minmax(72px, auto))`,
                      minWidth: `calc(76px + ${timetable.stages.length} * 180px)`,
                    }}
                  >
                    <div
                      className="timetable-grid__corner"
                      aria-hidden="true"
                    />
                    {timetable.stages.map((stage, stageIndex) => (
                      <div
                        className="timetable-grid__stage"
                        key={stage.id}
                        role="columnheader"
                        style={{
                          gridColumn: stageIndex + 2,
                          gridRow: 1,
                          ...stageColorStyle(stage.color),
                        }}
                      >
                        {stage.name}
                      </div>
                    ))}

                    {timeRows.map((slot, slotIndex) => (
                      <div
                        className="timetable-grid__time"
                        key={slot}
                        role="rowheader"
                        style={{ gridColumn: 1, gridRow: slotIndex + 2 }}
                      >
                        {timeLabel(slot)}
                      </div>
                    ))}

                    {timeRows.flatMap((slot, slotIndex) =>
                      timetable.stages.map((stage, stageIndex) => (
                        <div
                          className="timetable-grid__cell"
                          key={`${slot}-${stage.id}`}
                          style={{
                            gridColumn: stageIndex + 2,
                            gridRow: slotIndex + 2,
                            ...stageColorStyle(stage.color),
                          }}
                        />
                      )),
                    )}

                    {performances.map((performance) => {
                      const stageIndex = stageIndexById.get(
                        performance.stageId,
                      );
                      const startsAtIndex = timeSlots.indexOf(
                        performance.startsAt,
                      );
                      const endsAtIndex = performance.endsAt
                        ? timeSlots.indexOf(performance.endsAt)
                        : startsAtIndex + 1;
                      const act = actById.get(performance.actId);
                      const isFavorite = favoritePerformanceIds.has(
                        performance.id,
                      );
                      const isToggling =
                        togglingPerformanceId === performance.id;
                      const sharedFavoriteParticipants = (
                        favoriteParticipantsByPerformanceId.get(
                          performance.id,
                        ) ?? []
                      ).filter(
                        (participant) =>
                          participant.participantId !== currentParticipantId,
                      );
                      const visibleFavoriteParticipants =
                        sharedFavoriteParticipants.slice(0, 3);
                      const hiddenFavoriteParticipantCount =
                        sharedFavoriteParticipants.length -
                        visibleFavoriteParticipants.length;
                      const sharedFavoriteNames = sharedFavoriteParticipants
                        .map((participant) => participant.displayName)
                        .join(", ");

                      if (
                        stageIndex === undefined ||
                        startsAtIndex < 0 ||
                        endsAtIndex < 0
                      ) {
                        return null;
                      }

                      const stage = timetable.stages[stageIndex];

                      return (
                        <article
                          className={`timetable-performance${isFavorite ? " timetable-performance--favorite" : ""}`}
                          key={performance.id}
                          style={{
                            gridColumn: stageIndex + 2,
                            gridRow: `${startsAtIndex + 2} / ${endsAtIndex + 2}`,
                            ...stageColorStyle(stage.color),
                          }}
                        >
                          {isFavorite ? (
                            <span className="timetable-performance__badge">
                              {t("timetable.favorite.badge")}
                            </span>
                          ) : null}
                          <p className="timetable-performance__time">
                            {timeLabel(performance.startsAt)} -{" "}
                            {performance.endsAt
                              ? timeLabel(performance.endsAt)
                              : ""}
                          </p>
                          <h4>{act?.name ?? t("timetable.unknownAct")}</h4>
                          {act?.description ? <p>{act.description}</p> : null}
                          {sharedFavoriteParticipants.length > 0 ? (
                            <div
                              className="timetable-performance__shared"
                              aria-label={t("timetable.favorite.sharedAria", {
                                names: sharedFavoriteNames,
                              })}
                            >
                              <span className="timetable-performance__shared-label">
                                {t("timetable.favorite.sharedLabel")}
                              </span>
                              <span className="timetable-performance__shared-list">
                                {visibleFavoriteParticipants.map(
                                  (participant) => (
                                    <span
                                      className="timetable-performance__shared-person"
                                      key={participant.participantId}
                                    >
                                      <Avatar
                                        avatarId={participant.avatarId}
                                        name={participant.displayName}
                                        size="small"
                                      />
                                      <span>{participant.displayName}</span>
                                    </span>
                                  ),
                                )}
                                {hiddenFavoriteParticipantCount > 0 ? (
                                  <span
                                    className="timetable-performance__shared-more"
                                    aria-label={t(
                                      "timetable.favorite.sharedMoreAria",
                                      {
                                        count: hiddenFavoriteParticipantCount,
                                      },
                                    )}
                                  >
                                    {t("timetable.favorite.sharedMore", {
                                      count: hiddenFavoriteParticipantCount,
                                    })}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                          ) : null}
                          <button
                            className="timetable-performance__favorite"
                            type="button"
                            aria-pressed={isFavorite}
                            disabled={isToggling}
                            onClick={() =>
                              onToggleFavorite(performance.id, isFavorite)
                            }
                          >
                            {isFavorite
                              ? t("timetable.favorite.remove")
                              : t("timetable.favorite.add")}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

type GamesSectionProps = {
  activeSection: GameSection;
  bingoCard: BingoCard | null;
  bingoError: string;
  togglingBingoNumber: number | null;
  horseRacingState: HorseRacingState | null;
  horseRacingError: string;
  savingHorseRacingSuit: HorseRacingSuit | null;
  randomPairingAssignments: RandomPairingParticipantAssignment[];
  randomPairingsError: string;
  tournaments: Tournament[];
  tournamentsError: string;
  isLoading: boolean;
  onBack: () => void;
  onSelectSection: (section: GameSection) => void;
  onToggleBingoNumber: (number: number) => Promise<void>;
  onSelectHorseRacingSuit: (suit: HorseRacingSuit) => Promise<void>;
};

function GameTab({
  section,
  activeSection,
  isDisabled = false,
  label,
  onSelect,
}: {
  section: GameSection;
  activeSection: GameSection;
  isDisabled?: boolean;
  label: string;
  onSelect: (section: GameSection) => void;
}) {
  const isActive = activeSection === section;
  const className = `games__tab${isActive ? " is-active" : ""}${
    isDisabled ? " games__tab--disabled" : ""
  }`;

  return (
    <button
      className={className}
      type="button"
      aria-current={isActive ? "page" : undefined}
      onClick={() => onSelect(section)}
    >
      {label}
    </button>
  );
}

function GamesContent({
  activeSection,
  bingoCard,
  bingoError,
  togglingBingoNumber,
  horseRacingState,
  horseRacingError,
  savingHorseRacingSuit,
  randomPairingAssignments,
  randomPairingsError,
  tournaments,
  tournamentsError,
  isLoading,
  onToggleBingoNumber,
  onSelectHorseRacingSuit,
}: Omit<GamesSectionProps, "onBack" | "onSelectSection">) {
  const { t } = useTranslation();

  if (activeSection === "bingo") {
    if (!bingoCard) return <p className="games__notice">{t("games.empty")}</p>;
    return <Bingo card={bingoCard} error={bingoError} togglingNumber={togglingBingoNumber} onToggleNumber={onToggleBingoNumber} />;
  }
  if (activeSection === "horseRacing") {
    return <HorseRacing state={horseRacingState} error={horseRacingError} isSaving={savingHorseRacingSuit !== null} onSelectSuit={onSelectHorseRacingSuit} />;
  }
  if (activeSection === "randomPairings") {
    return <RandomPairings assignments={randomPairingAssignments} error={randomPairingsError} isLoading={isLoading} />;
  }
  return <Tournaments tournaments={tournaments} error={tournamentsError} isLoading={isLoading} />;
}

function GamesSection(props: GamesSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="games" id="main-games" aria-labelledby="games-title">
      <DashboardBackButton onClick={props.onBack} width="narrow" />
      <SectionHeader title={t("games.title")} titleId="games-title" eyebrow={t("games.eyebrow")} description={t("games.description")} width="narrow" />
      <nav className="games__navigation" aria-label={t("games.navigationLabel")}>
        <GameTab section="bingo" activeSection={props.activeSection} label={t("games.bingo")} onSelect={props.onSelectSection} />
        <GameTab section="horseRacing" activeSection={props.activeSection} isDisabled={!props.horseRacingState?.isEnabled} label={t("games.horseRacing")} onSelect={props.onSelectSection} />
        <GameTab section="randomPairings" activeSection={props.activeSection} label={t("games.randomPairings")} onSelect={props.onSelectSection} />
        <GameTab section="tournaments" activeSection={props.activeSection} label={t("games.tournaments")} onSelect={props.onSelectSection} />
      </nav>
      <GamesContent {...props} />
    </section>
  );
}

function assignedArtistTags(tags: ActArtistTag[], language: string): ArtistTag[] {
  return Array.from(
    new Map(tags.map((tag) => [tag.id, { id: tag.id, name: tag.name }])).values(),
  ).sort((first, second) =>
    first.name.localeCompare(second.name, language, { sensitivity: "base" }),
  );
}

type ProfileSectionProps = {
  selectedParticipant: Participant | null;
  profileAvatarId: string | null;
  profileDisplayName: string;
  isSavingProfile: boolean;
  isAvatarPickerExpanded: boolean;
  profileError: string;
  profileSuccess: string;
  hasProfileChanges: boolean;
  availableTags: ArtistTag[];
  selectedPreferenceTagIds: ReadonlySet<string>;
  arePreferencesLoading: boolean;
  arePreferencesSaving: boolean;
  preferencesLoadError: string;
  preferencesSaveError: string;
  preferencesSuccess: string;
  participantsError: string;
  accessCode: string;
  accessCodeError: string;
  isSubmittingAccessCode: boolean;
  isLoginLocked: boolean;
  loginLockRemainingSeconds: number;
  onBack: () => void;
  onLogout: () => void;
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onProfileNameChange: (name: string) => void;
  onToggleAvatarPicker: () => void;
  onSelectAvatar: (avatarId: string) => void;
  onTogglePreference: (tagId: string) => void;
  onResetPreferences: () => void;
  onSavePreferences: () => Promise<void>;
  onSubmitAccessCode: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onAccessCodeChange: (code: string) => void;
};

function AvatarPicker({
  selectedAvatarId,
  displayName,
  isExpanded,
  isSaving,
  onToggle,
  onSelect,
}: {
  selectedAvatarId: string | null;
  displayName: string;
  isExpanded: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onSelect: (avatarId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="avatar-picker">
      <button className="avatar-picker__toggle" type="button" aria-expanded={isExpanded} aria-controls="avatar-picker-options" onClick={onToggle} disabled={isSaving}>
        <span className="avatar-picker__toggle-current">
          <Avatar avatarId={selectedAvatarId} name={displayName} size="medium" />
          <span><strong>{t("identity.avatar.title")}</strong><small>{t("identity.avatar.toggleHint")}</small></span>
        </span>
        <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
      </button>
      {isExpanded ? (
        <div id="avatar-picker-options" className="avatar-picker__panel" aria-labelledby="avatar-picker-title">
          <div className="avatar-picker__header"><h4 id="avatar-picker-title">{t("identity.avatar.title")}</h4><p>{t("identity.avatar.description")}</p></div>
          <div className="avatar-picker__grid">
            {avatars.map((avatar) => {
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <button className={`avatar-picker__option${isSelected ? " is-selected" : ""}`} type="button" key={avatar.id} onClick={() => onSelect(avatar.id)} disabled={isSaving} aria-pressed={isSelected} aria-label={t("identity.avatar.selectLabel", { avatar: avatar.label })}>
                  <Avatar avatarId={avatar.id} name={avatar.label} size="large" />
                  <span>{avatar.label}</span>
                  {isSelected ? <span className="avatar-picker__selected-badge">{t("identity.avatar.selected")}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AuthenticatedProfile(props: ProfileSectionProps & { participant: Participant }) {
  const { t } = useTranslation();
  const displayName = props.profileDisplayName.trim() || props.participant.displayName;

  return (
    <>
      <SectionHeader title={t("identity.profileTitle")} titleId="identity-title" description={t("identity.profileDescription")} />
      <div className="identity__selected identity__profile-card">
        <Avatar avatarId={props.profileAvatarId} name={displayName} size="large" />
        <div className="identity__profile-copy"><p>{t("identity.loggedInAs")}</p><h3>{props.participant.displayName}</h3></div>
        <button className="identity__change" type="button" onClick={props.onLogout}>{t("identity.logout")}</button>
      </div>
      <form className="profile-editor" onSubmit={props.onSaveProfile}>
        <h3>{t("identity.profile.editTitle")}</h3>
        <label htmlFor="profile-display-name">{t("identity.profile.displayName")}</label>
        <input id="profile-display-name" type="text" value={props.profileDisplayName} maxLength={50} disabled={props.isSavingProfile} onChange={(event) => props.onProfileNameChange(event.target.value)} />
        <AvatarPicker selectedAvatarId={props.profileAvatarId} displayName={displayName} isExpanded={props.isAvatarPickerExpanded} isSaving={props.isSavingProfile} onToggle={props.onToggleAvatarPicker} onSelect={props.onSelectAvatar} />
        {props.profileError ? <p className="identity__error" role="alert">{props.profileError}</p> : null}
        {props.profileSuccess ? <p className="profile-editor__success" role="status">{props.profileSuccess}</p> : null}
        <button className="identity__submit profile-editor__submit" type="submit" disabled={props.isSavingProfile || !props.hasProfileChanges}>
          {props.isSavingProfile ? t("identity.profile.saving") : t("identity.profile.save")}
        </button>
      </form>
      <MusicalPreferences availableTags={props.availableTags} selectedTagIds={props.selectedPreferenceTagIds} isLoading={props.arePreferencesLoading} isSaving={props.arePreferencesSaving} loadError={props.preferencesLoadError} saveError={props.preferencesSaveError} success={props.preferencesSuccess} onToggle={props.onTogglePreference} onReset={props.onResetPreferences} onSave={props.onSavePreferences} />
      {props.participantsError ? <p className="identity__error">{props.participantsError}</p> : null}
    </>
  );
}

function ParticipantLogin(props: ProfileSectionProps) {
  const { t } = useTranslation();
  const isDisabled = props.isSubmittingAccessCode || props.isLoginLocked;

  return (
    <>
      <SectionHeader title={t("identity.loginTitle")} titleId="identity-title" description={t("identity.loginDescription")} />
      <form className="identity__form" onSubmit={props.onSubmitAccessCode}>
        <label htmlFor="participant-access-code">{t("identity.participantCodeLabel")}</label>
        <input id="participant-access-code" type="text" value={props.accessCode} disabled={isDisabled} onChange={(event) => props.onAccessCodeChange(event.target.value)} autoComplete="off" inputMode="text" placeholder={t("identity.participantCodePlaceholder")} />
        {props.accessCodeError ? <p className="identity__error">{props.accessCodeError}</p> : null}
        {props.isLoginLocked ? <p className="identity__error" role="status">{t("identity.locked", { seconds: props.loginLockRemainingSeconds })}</p> : null}
        <button className="identity__submit" type="submit" disabled={isDisabled}>{props.isSubmittingAccessCode ? t("common.loading") : t("identity.submit")}</button>
      </form>
    </>
  );
}

function ProfileSection(props: ProfileSectionProps) {
  return (
    <section className="identity" id="main-profile" aria-labelledby="identity-title">
      <div className="identity__content">
        <DashboardBackButton onClick={props.onBack} />
        {props.selectedParticipant ? <AuthenticatedProfile {...props} participant={props.selectedParticipant} /> : <ParticipantLogin {...props} />}
      </div>
    </section>
  );
}

type VotingSectionProps = {
  participant: Participant;
  participants: Participant[];
  categories: Category[];
  votes: Vote[];
  selectedVotes: Record<string, string>;
  statusLabels: Record<CategoryStatus, string>;
  participantCount: number;
  votesError: string;
  categoriesError: string;
  isLoading: boolean;
  submittingCategoryId: string | null;
  onBack: () => void;
  onSelectVote: (categoryId: string, participantId: string) => void;
  onSubmitVote: (categoryId: string) => Promise<void>;
};

function VotingCategory({
  category,
  eligibleParticipants,
  selectedVote,
  selectedParticipantForVote,
  hasAlreadyVoted,
  statusLabel,
  isSubmitting,
  onSelectVote,
  onSubmitVote,
}: Readonly<{
  category: Category;
  eligibleParticipants: Participant[];
  selectedVote: string;
  selectedParticipantForVote?: Participant;
  hasAlreadyVoted: boolean;
  statusLabel: string;
  isSubmitting: boolean;
  onSelectVote: (participantId: string) => void;
  onSubmitVote: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <article className="category-card">
      <div className="category-card__topline"><span className={`category-card__status category-card__status--${category.status}`}>{statusLabel}</span></div>
      <h3>{category.title}</h3><p>{category.description}</p>
      {hasAlreadyVoted ? <p className="category-card__voted">{t("categories.alreadyVoted")}</p> : (
        <div className="category-card__vote">
          <label htmlFor={`vote-${category.id}`}>{t("categories.voteTargetLabel")}</label>
          <select id={`vote-${category.id}`} value={selectedVote} onChange={(event) => onSelectVote(event.target.value)}>
            <option value="">{t("categories.selectPerson")}</option>
            {eligibleParticipants.map((participant) => <option key={participant.id} value={participant.id}>{participant.displayName}</option>)}
          </select>
          {selectedVote ? <p className="category-card__selected-vote"><ParticipantName avatarId={selectedParticipantForVote?.avatarId} name={selectedParticipantForVote?.displayName ?? ""} /></p> : null}
          {selectedVote ? <button className="category-card__submit" type="button" disabled={isSubmitting} onClick={onSubmitVote}>{isSubmitting ? t("common.saving") : t("categories.submitVote")}</button> : null}
        </div>
      )}
    </article>
  );
}

function VotingSection(props: Readonly<VotingSectionProps>) {
  const { t } = useTranslation();
  const eligibleParticipants = props.participants.filter(
    (participant) => participant.id !== props.participant.id,
  );

  return (
    <div id="main-voting">
      <section className="categories" id="abstimmung" aria-labelledby="categories-title">
        <DashboardBackButton onClick={props.onBack} />
        <SectionHeader title={t("categories.title")} titleId="categories-title" eyebrow={t("categories.eyebrow", { count: props.participantCount })} />
        {props.votesError ? <p className="categories__notice">{props.votesError}</p> : null}
        {props.isLoading ? <output className="categories__notice">{t("common.loading")}</output> : null}
        {props.categoriesError ? <p className="categories__notice">{props.categoriesError}</p> : null}
        {!props.isLoading && props.categories.length === 0 ? <p className="categories__notice">{t("categories.empty")}</p> : null}
        <div className="categories__grid">
          {props.categories.map((category) => {
            const selectedVote = props.selectedVotes[category.id] ?? "";
            return (
              <VotingCategory
                key={category.id}
                category={category}
                eligibleParticipants={eligibleParticipants}
                selectedVote={selectedVote}
                selectedParticipantForVote={eligibleParticipants.find((participant) => participant.id === selectedVote)}
                hasAlreadyVoted={props.votes.some((vote) => vote.voterId === props.participant.id && vote.categoryId === category.id)}
                statusLabel={props.statusLabels[category.status]}
                isSubmitting={props.submittingCategoryId === category.id}
                onSelectVote={(participantId) => props.onSelectVote(category.id, participantId)}
                onSubmitVote={() => void props.onSubmitVote(category.id)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StandingsContent({ isLoading, error, standings }: Readonly<{ isLoading: boolean; error: string; standings: AllTimeStanding[] }>) {
  const { t } = useTranslation();
  if (isLoading) return <output className="standings__notice">{t("standings.loading")}</output>;
  if (error) return <p className="standings__notice standings__notice--error" role="alert">{error}</p>;
  if (standings.length === 0) return <p className="standings__notice">{t("standings.empty")}</p>;
  return (
    <div className="standings__table" role="table" aria-label={t("standings.title")}>
      <div className="standings__columns" role="row"><span role="columnheader">{t("standings.columns.rank")}</span><span role="columnheader">{t("standings.columns.name")}</span><span role="columnheader">{t("standings.columns.points")}</span></div>
      <ol>{standings.map((standing, index) => <li key={standing.participantId} role="row"><span className="standings__rank" role="cell" aria-label={t("standings.rankLabel", { rank: index + 1 })}>{index + 1}</span><strong role="cell">{standing.participantName}</strong><span className="standings__points" role="cell">{standing.totalPoints}</span></li>)}</ol>
    </div>
  );
}

function AwardsSection({ resultsError, hasVotes, results, isStandingsLoading, standingsError, standings, onBack }: Readonly<{ resultsError: string; hasVotes: boolean; results: CategoryResults[]; isStandingsLoading: boolean; standingsError: string; standings: AllTimeStanding[]; onBack: () => void }>) {
  const { t } = useTranslation();
  return (
    <div id="main-awards">
      <section className="results" aria-labelledby="awards-title"><DashboardBackButton onClick={onBack} /><SectionHeader title={t("awards.title")} titleId="awards-title" eyebrow={t("awards.eyebrow")} description={t("awards.description")} /></section>
      <section className="results" id="ergebnisse" aria-labelledby="results-title">
        <SectionHeader title={t("results.title")} titleId="results-title" eyebrow={t("results.eyebrow")} />
        {resultsError ? <p className="results__notice">{resultsError}</p> : null}
        {!hasVotes ? <p className="results__notice">{t("results.empty")}</p> : <div className="results__grid">{results.map(({ category, results: categoryResults, highestVoteCount }) => <ResultCard category={category} results={categoryResults} highestVoteCount={highestVoteCount} key={`${category.id}-${category.status}`} />)}</div>}
      </section>
      <section className="standings" id="gesamtclassement" aria-labelledby="standings-title">
        <SectionHeader title={t("standings.title")} titleId="standings-title" eyebrow={t("standings.eyebrow")} />
        <StandingsContent isLoading={isStandingsLoading} error={standingsError} standings={standings} />
      </section>
    </div>
  );
}

type FestivalAccessProps = {
  festivalName: string;
  onUnlock: (code: string) => Promise<boolean>;
};

function FestivalAccess({ festivalName, onUnlock }: FestivalAccessProps) {
  const { t } = useTranslation();
  const {
    festivalCode,
    festivalCodeError,
    isSubmittingFestivalCode,
    qrScannerSupport,
    isScanningQrCode,
    videoRef,
    changeFestivalCode,
    submitFestivalCode,
    startQrScanner,
    stopQrScanner,
  } = useFestivalCodeUnlock(onUnlock);

  return (
    <main
      className="home home--locked"
      aria-label={t("festivalAccess.ariaLabel", {
        festivalName: festivalName || t("common.loading"),
      })}
    >
      <header className="hero hero--locked" aria-labelledby="hero-title">
        <div className="hero__actions">
          <PwaInstallPrompt />
        </div>

        <div className="hero__content hero__content--locked">
          <h1 id="hero-title">{festivalName || t("common.loading")}</h1>
          <form
            className="identity__form identity__form--locked"
            onSubmit={submitFestivalCode}
          >
            <label htmlFor="festival-access-code">
              {t("festivalAccess.codeLabel")}
            </label>
            <input
              id="festival-access-code"
              type="text"
              value={festivalCode}
              disabled={isSubmittingFestivalCode}
              onChange={(event) => changeFestivalCode(event.target.value)}
              autoComplete="off"
              inputMode="text"
              placeholder={t("festivalAccess.codePlaceholder")}
            />
            {festivalCodeError ? (
              <p className="identity__error" role="alert">
                {festivalCodeError}
              </p>
            ) : null}
            <button
              className="identity__submit"
              type="submit"
              disabled={isSubmittingFestivalCode}
            >
              {isSubmittingFestivalCode
                ? t("common.loading")
                : t("festivalAccess.submit")}
            </button>
          </form>
          <div className="qr-access" aria-label={t("festivalAccess.qr.label")}>
            <button
              className="qr-access__button"
              type="button"
              onClick={startQrScanner}
              disabled={
                isSubmittingFestivalCode ||
                isScanningQrCode ||
                qrScannerSupport !== "supported"
              }
            >
              {isScanningQrCode
                ? t("festivalAccess.qr.scanning")
                : t("festivalAccess.qr.start")}
            </button>
            {qrScannerSupport === "unsupported" ? (
              <p className="qr-access__status" role="status">
                {t("festivalAccess.qr.errors.unsupported")}
              </p>
            ) : null}
            <div className="qr-access__camera" hidden={!isScanningQrCode}>
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label={t("festivalAccess.qr.videoLabel")}
              />
              {isScanningQrCode ? (
                <button
                  className="qr-access__stop"
                  type="button"
                  onClick={stopQrScanner}
                >
                  {t("festivalAccess.qr.stop")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="stage-lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>
      <AppFooter />
    </main>
  );
}

function App() {
  const { t } = useTranslation();
  const festivalAccess = useFestivalAccess(activeFestival);
  const [locationHash, setLocationHash] = useState(() => window.location.hash);
  const [festivalName, setFestivalName] = useState(fallbackFestivalName);
  const [eventStartDate, setEventStartDate] = useState<string | null>(null);
  const [eventEndDate, setEventEndDate] = useState<string | null>(null);
  const [eventLogoUrl, setEventLogoUrl] = useState<string | null>(null);
  const [isUploadingEventLogo, setIsUploadingEventLogo] = useState(false);
  const [isRemovingEventLogo, setIsRemovingEventLogo] = useState(false);
  const [eventReferenceInstant, setEventReferenceInstant] = useState(
    () => new Date(),
  );
  const [festivalNameError, setFestivalNameError] = useState("");
  const [isSavingFestivalName, setIsSavingFestivalName] = useState(false);
  const [festivalCode, setFestivalCode] = useState("");
  const [festivalCodeError, setFestivalCodeError] = useState("");
  const [isLoadingFestivalCode, setIsLoadingFestivalCode] = useState(false);
  const [isSavingFestivalCode, setIsSavingFestivalCode] = useState(false);
  const [isExportingFestival, setIsExportingFestival] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(() =>
      festivalAccess.isUnlocked ? readStoredParticipant() : null,
    );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [participantsError, setParticipantsError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminCategoriesError, setAdminCategoriesError] = useState("");
  const [isLoadingAdminCategories, setIsLoadingAdminCategories] =
    useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );
  const [adminParticipants, setAdminParticipants] = useState<Participant[]>([]);
  const [adminParticipantsError, setAdminParticipantsError] = useState("");
  const [isLoadingAdminParticipants, setIsLoadingAdminParticipants] =
    useState(false);
  const [festivalDocuments, setFestivalDocuments] = useState<
    FestivalDocument[]
  >([]);
  const [campLocationLink, setCampLocationLink] =
    useState<CampLocationLink>(null);
  const [campLocationOpenError, setCampLocationOpenError] = useState("");
  const [musicPlaylist, setMusicPlaylist] = useState<MusicPlaylist | null>(
    null,
  );
  const [festivalDocumentsError, setFestivalDocumentsError] = useState("");
  const [isLoadingFestivalDocuments, setIsLoadingFestivalDocuments] = useState(
    Boolean(selectedParticipant),
  );
  const [adminFestivalDocuments, setAdminFestivalDocuments] = useState<
    FestivalDocument[]
  >([]);
  const [adminCampLocationLink, setAdminCampLocationLink] =
    useState<CampLocationLink>(null);
  const [adminCampLocationError, setAdminCampLocationError] = useState("");
  const [isSavingCampLocation, setIsSavingCampLocation] = useState(false);
  const [adminMusicPlaylist, setAdminMusicPlaylist] =
    useState<MusicPlaylist | null>(null);
  const [adminMusicPlaylistError, setAdminMusicPlaylistError] = useState("");
  const [isSavingMusicPlaylist, setIsSavingMusicPlaylist] = useState(false);
  const [bingoCard, setBingoCard] = useState<BingoCard | null>(null);
  const [bingoError, setBingoError] = useState("");
  const [horseRacingState, setHorseRacingState] =
    useState<HorseRacingState | null>(null);
  const [horseRacingError, setHorseRacingError] = useState("");
  const [savingHorseRacingSuit, setSavingHorseRacingSuit] =
    useState<HorseRacingSuit | null>(null);
  const [randomPairingAssignments, setRandomPairingAssignments] = useState<
    RandomPairingParticipantAssignment[]
  >([]);
  const [randomPairingsError, setRandomPairingsError] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsError, setTournamentsError] = useState("");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [timetableError, setTimetableError] = useState("");
  const [artistFavoriteError, setArtistFavoriteError] = useState("");
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(
    Boolean(selectedParticipant),
  );
  const [togglingFavoritePerformanceId, setTogglingFavoritePerformanceId] =
    useState<string | null>(null);
  const [adminFestivalDays, setAdminFestivalDays] = useState<FestivalDay[]>([]);
  const [adminFestivalDaysError, setAdminFestivalDaysError] = useState("");
  const [isLoadingAdminFestivalDays, setIsLoadingAdminFestivalDays] =
    useState(false);
  const [savingFestivalDayId, setSavingFestivalDayId] = useState<string | null>(
    null,
  );
  const [deletingFestivalDayId, setDeletingFestivalDayId] = useState<
    string | null
  >(null);
  const [adminTimetableStages, setAdminTimetableStages] = useState<
    TimetableStage[]
  >([]);
  const [adminTimetableStagesError, setAdminTimetableStagesError] =
    useState("");
  const [isLoadingAdminTimetableStages, setIsLoadingAdminTimetableStages] =
    useState(false);
  const [savingStageId, setSavingStageId] = useState<string | null>(null);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  const [adminTimetableActs, setAdminTimetableActs] = useState<TimetableAct[]>(
    [],
  );
  const [adminTimetableActsError, setAdminTimetableActsError] = useState("");
  const [isLoadingAdminTimetableActs, setIsLoadingAdminTimetableActs] =
    useState(false);
  const [deletingActId, setDeletingActId] = useState<string | null>(null);
  const [artistTags, setArtistTags] = useState<ArtistTag[]>([]);
  const [actArtistTags, setActArtistTags] = useState<ActArtistTag[]>([]);
  const [artistTagsError, setArtistTagsError] = useState("");
  const [preferredArtistTags, setPreferredArtistTags] = useState<ArtistTag[]>([]);
  const [selectedPreferenceTagIds, setSelectedPreferenceTagIds] = useState<Set<string>>(new Set());
  const [preferencesLoadError, setPreferencesLoadError] = useState("");
  const [preferencesSaveError, setPreferencesSaveError] = useState("");
  const [preferencesSuccess, setPreferencesSuccess] = useState("");
  const [arePreferencesLoading, setArePreferencesLoading] = useState(false);
  const [arePreferencesSaving, setArePreferencesSaving] = useState(false);
  const [adminTimetablePerformances, setAdminTimetablePerformances] = useState<
    TimetablePerformance[]
  >([]);
  const [adminTimetablePerformancesError, setAdminTimetablePerformancesError] =
    useState("");
  const [
    isLoadingAdminTimetablePerformances,
    setIsLoadingAdminTimetablePerformances,
  ] = useState(false);
  const [deletingPerformanceId, setDeletingPerformanceId] = useState<
    string | null
  >(null);
  const [togglingBingoNumber, setTogglingBingoNumber] = useState<number | null>(
    null,
  );
  const [adminBingoRound, setAdminBingoRound] = useState<BingoRound | null>(
    null,
  );
  const [adminBingoError, setAdminBingoError] = useState("");
  const [isLoadingAdminBingo, setIsLoadingAdminBingo] = useState(false);
  const [isSavingBingoRound, setIsSavingBingoRound] = useState(false);
  const [adminHorseRacingState, setAdminHorseRacingState] =
    useState<AdminHorseRacingState | null>(null);
  const [adminHorseRacingBets, setAdminHorseRacingBets] = useState<
    AdminHorseRacingBet[]
  >([]);
  const [adminHorseRacingError, setAdminHorseRacingError] = useState("");
  const [isLoadingAdminHorseRacing, setIsLoadingAdminHorseRacing] =
    useState(false);
  const [isSavingHorseRacingState, setIsSavingHorseRacingState] =
    useState(false);
  const [adminRandomPairingActions, setAdminRandomPairingActions] = useState<
    AdminRandomPairingAction[]
  >([]);
  const [adminRandomPairingsError, setAdminRandomPairingsError] = useState("");
  const [isLoadingAdminRandomPairings, setIsLoadingAdminRandomPairings] =
    useState(false);
  const [isCreatingRandomPairingAction, setIsCreatingRandomPairingAction] =
    useState(false);
  const [savingRandomPairingActionId, setSavingRandomPairingActionId] =
    useState<string | null>(null);
  const [adminTournaments, setAdminTournaments] = useState<Tournament[]>([]);
  const [adminTournamentsError, setAdminTournamentsError] = useState("");
  const [isLoadingAdminTournaments, setIsLoadingAdminTournaments] =
    useState(false);
  const [savingTournamentId, setSavingTournamentId] = useState<string | null>(
    null,
  );
  const [deletingTournamentId, setDeletingTournamentId] = useState<
    string | null
  >(null);
  const [savingTournamentMatchId, setSavingTournamentMatchId] = useState<
    string | null
  >(null);
  const [adminFestivalDocumentsError, setAdminFestivalDocumentsError] =
    useState("");
  const [isLoadingAdminFestivalDocuments, setIsLoadingAdminFestivalDocuments] =
    useState(false);
  const [uploadingDocumentType, setUploadingDocumentType] =
    useState<FestivalDocumentType | null>(null);
  const [removingDocumentType, setRemovingDocumentType] =
    useState<FestivalDocumentType | null>(null);
  const [participantForm, setParticipantForm] =
    useState<ParticipantFormState | null>(null);
  const [participantFormError, setParticipantFormError] = useState("");
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState(
    selectedParticipant?.displayName ?? "",
  );
  const [profileAvatarId, setProfileAvatarId] = useState(
    selectedParticipant?.avatarId ?? avatars[0]?.id ?? "",
  );
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAvatarPickerExpanded, setIsAvatarPickerExpanded] = useState(false);
  const isSavingProfileRef = useRef(false);
  const [togglingParticipantId, setTogglingParticipantId] = useState<
    string | null
  >(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(
    null,
  );
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [activeMainSection, setActiveMainSection] = useState<MainSection>(
    () => mainSectionFromHash(window.location.hash) ?? "dashboard",
  );
  const selectedArtistId = window.location.hash.startsWith("#artists/")
    ? window.location.hash.slice("#artists/".length)
    : null;
  const [activeAdminSection, setActiveAdminSection] =
    useState<AdminSection>("festival");
  const [activeGameSection, setActiveGameSection] =
    useState<GameSection>("bingo");
  const [isLoadingData, setIsLoadingData] = useState(
    Boolean(selectedParticipant),
  );
  const [isSubmittingAccessCode, setIsSubmittingAccessCode] = useState(false);
  const [loginLockedUntil, setLoginLockedUntil] = useState<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
  const participantCount = participants.length;
  const displayedFestivalName = festivalName || t("common.loading");
  const openCategories = categories.filter(
    (category) => category.status === "open",
  );
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t("status.upcoming"),
    open: t("status.open"),
    closed: t("status.closed"),
  };
  const [accessCode, setAccessCode] = useState("");
  const [accessCodeError, setAccessCodeError] = useState("");
  const [votes, setVotes] = useState<Vote[]>([]);
  const [allVotes, setAllVotes] = useState<Vote[]>([]);
  const [votesError, setVotesError] = useState("");
  const [resultsError, setResultsError] = useState("");
  const [allTimeStandings, setAllTimeStandings] = useState<AllTimeStanding[]>(
    [],
  );
  const [standingsError, setStandingsError] = useState("");
  const [isStandingsLoading, setIsStandingsLoading] = useState(
    Boolean(selectedParticipant),
  );
  const [selectedVotesByCategory, setSelectedVotesByCategory] = useState<
    Record<string, string>
  >({});
  const [submittingCategoryId, setSubmittingCategoryId] = useState<
    string | null
  >(null);
  const loginLockRemainingMs = loginLockedUntil
    ? Math.max(0, loginLockedUntil - currentTimeMs)
    : 0;
  const loginLockRemainingSeconds = Math.ceil(loginLockRemainingMs / 1000);
  const isLoginLocked = loginLockRemainingMs > 0;
  const adminNavigationItems: Array<{ section: AdminSection; label: string }> =
    [
      { section: "festival", label: t("admin.navigation.festival") },
      { section: "participants", label: t("admin.navigation.participants") },
      { section: "awards", label: t("admin.navigation.awards") },
      { section: "timetable", label: t("admin.navigation.timetable") },
      { section: "games", label: t("admin.navigation.games") },
      { section: "info", label: t("admin.navigation.info") },
      { section: "archive", label: t("admin.navigation.archive") },
    ];

  const savedProfileAvatarId =
    selectedParticipant?.avatarId ?? avatars[0]?.id ?? "";
  const normalizedProfileDisplayName = profileDisplayName.trim();
  const hasProfileChanges = Boolean(
    selectedParticipant &&
    (normalizedProfileDisplayName !== selectedParticipant.displayName ||
      profileAvatarId !== savedProfileAvatarId),
  );

  useEffect(() => {
    const timerId = window.setInterval(
      () => setEventReferenceInstant(new Date()),
      60 * 60 * 1000,
    );
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setLocationHash(window.location.hash);
      const section = mainSectionFromHash(window.location.hash);
      if (section) {
        setActiveMainSection(section);
      } else if (!window.location.hash) {
        setActiveMainSection("dashboard");
      }
    }

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  function navigateMainSection(section: MainSection) {
    const hash = section === "dashboard" ? "" : mainSectionHashes[section];
    if (window.location.hash === hash) {
      setActiveMainSection(section);
      return;
    }
    window.location.hash = hash;
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadSettings() {
      setFestivalNameError("");

      try {
        const settings = await loadEventSettings();

        if (isCurrent) {
          setFestivalName(settings.name);
          setEventStartDate(settings.startDate);
          setEventEndDate(settings.endDate);
          setEventLogoUrl(settings.logoUrl ?? null);
        }
      } catch {
        if (isCurrent) {
          setFestivalNameError(i18n.t("festival.errors.load"));
        }
      }
    }

    void loadSettings();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoginLocked) {
      return;
    }

    const timerId = window.setInterval(() => {
      const now = Date.now();

      setCurrentTimeMs(now);

      if (loginLockedUntil && loginLockedUntil <= now) {
        setLoginLockedUntil(null);
      }
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isLoginLocked, loginLockedUntil]);

  useEffect(() => {
    if (!festivalAccess.isUnlocked || !selectedParticipant) {
      return;
    }

    const authenticatedParticipant = selectedParticipant;
    let isCurrent = true;

    async function loadData() {
      const accessContext = {
        participantAccessCode: authenticatedParticipant.accessCode,
      };

      setIsLoadingData(true);
      setIsStandingsLoading(true);
      setIsLoadingFestivalDocuments(true);
      setIsLoadingTimetable(true);
      setArePreferencesLoading(true);
      setParticipantsError("");
      setCategoriesError("");
      setVotesError("");
      setResultsError("");
      setStandingsError("");
      setFestivalDocumentsError("");
      setBingoError("");
      setHorseRacingError("");
      setRandomPairingsError("");
      setTimetableError("");

      try {
        const [
          loadedParticipants,
          loadedCategories,
          loadedParticipantVotes,
          loadedFestivalDocuments,
          loadedCampLocationLink,
          loadedMusicPlaylist,
          loadedBingoCard,
          loadedHorseRacingState,
          loadedRandomPairingAssignments,
          loadedTournaments,
          loadedTimetable,
          loadedActArtistTags,
          loadedPreferences,
          loadedStandingsResult,
        ] = await Promise.all([
          loadParticipants(accessContext),
          loadCategories(accessContext),
          loadVotesForParticipant(authenticatedParticipant.id, accessContext),
          loadFestivalDocuments(accessContext),
          loadCampLocationLink(accessContext),
          loadMusicPlaylist(accessContext),
          loadOrCreateBingoCard(accessContext),
          loadHorseRacingState(activeFestival.id, accessContext),
          loadRandomPairingAssignments(activeFestival.id, accessContext),
          loadTournaments(activeFestival.id, accessContext),
          loadTimetable(accessContext),
          loadActArtistTags(accessContext),
          loadArtistTagPreferences(accessContext),
          loadAllTimeStandings(accessContext).then(
            (loadedStandings) =>
              ({
                status: "fulfilled",
                value: loadedStandings,
              }) as const,
            () =>
              ({
                status: "rejected",
              }) as const,
          ),
        ]);

        if (isCurrent) {
          setParticipants(loadedParticipants);
          setCategories(loadedCategories);
          setVotes(loadedParticipantVotes);
          setFestivalDocuments(loadedFestivalDocuments);
          setCampLocationLink(loadedCampLocationLink);
          setMusicPlaylist(loadedMusicPlaylist);
          setBingoCard(loadedBingoCard);
          setHorseRacingState(loadedHorseRacingState);
          setRandomPairingAssignments(loadedRandomPairingAssignments);
          setTournaments(loadedTournaments);
          setTimetable(loadedTimetable);
          setActArtistTags(loadedActArtistTags);
          setPreferredArtistTags(loadedPreferences);
          setSelectedPreferenceTagIds(new Set(loadedPreferences.map((tag) => tag.id)));
          setPreferencesLoadError("");
          setArePreferencesLoading(false);
          setCampLocationOpenError("");

          if (loadedStandingsResult.status === "fulfilled") {
            setAllTimeStandings(loadedStandingsResult.value);
          } else {
            setStandingsError(i18n.t("standings.errors.load"));
          }
        }
      } catch {
        if (isCurrent) {
          setParticipantsError(i18n.t("identity.errors.participantsLoad"));
          setCategoriesError(i18n.t("admin.errors.categoriesLoad"));
          setVotesError(i18n.t("identity.errors.participantVotesLoad"));
          setFestivalDocumentsError(i18n.t("info.errors.load"));
          setBingoError(i18n.t("bingo.errors.load"));
          setHorseRacingError(i18n.t("horseRacing.errors.load"));
          setRandomPairingsError(i18n.t("randomPairings.errors.load"));
          setTournamentsError(i18n.t("tournaments.errors.load"));
          setTimetableError(i18n.t("timetable.errors.load"));
          setPreferencesLoadError(i18n.t("preferences.errors.load"));
        }
      } finally {
        if (isCurrent) {
          setIsLoadingFestivalDocuments(false);
          setIsLoadingTimetable(false);
          setIsStandingsLoading(false);
          setArePreferencesLoading(false);
        }
      }

      try {
        const loadedVotes = await loadVotes(accessContext);

        if (isCurrent) {
          setAllVotes(loadedVotes);
        }
      } catch {
        if (isCurrent) {
          setResultsError(i18n.t("results.errors.load"));
        }
      } finally {
        if (isCurrent) {
          setIsLoadingData(false);
        }
      }
    }

    void loadData();

    return () => {
      isCurrent = false;
    };
  }, [festivalAccess.isUnlocked, selectedParticipant]);

  const resultsByCategory = useMemo(
    () => createResultsByCategory(categories, participants, allVotes),
    [allVotes, categories, participants],
  );

  const hasVotes = allVotes.length > 0;
  const timetablePerformanceCount = timetable?.performances.length ?? 0;
  const festivalInfoCount =
    festivalDocuments.length +
    (campLocationLink ? 1 : 0) +
    (musicPlaylist ? 1 : 0);
  const unsortedDashboardTiles: DashboardTile[] = [
    {
      id: "awards",
      section: "awards",
      title: t("dashboard.tiles.awards.title"),
      description: t("dashboard.tiles.awards.description"),
      status:
        allTimeStandings.length > 0
          ? t("dashboard.tiles.awards.status.standings", {
              count: allTimeStandings.length,
            })
          : hasVotes
            ? t("dashboard.tiles.awards.status.votes", {
                count: allVotes.length,
              })
            : t("dashboard.tiles.awards.status.empty"),
      detail: t("dashboard.tiles.awards.detail"),
    },
    {
      id: "timetable",
      section: "timetable",
      title: t("dashboard.tiles.timetable.title"),
      description: t("dashboard.tiles.timetable.description"),
      status:
        timetablePerformanceCount > 0
          ? t("dashboard.tiles.timetable.status.available", {
              count: timetablePerformanceCount,
            })
          : t("dashboard.tiles.timetable.status.empty"),
      detail: t("dashboard.tiles.timetable.detail"),
    },
    {
      id: "artists",
      section: "artists",
      title: t("dashboard.tiles.artists.title"),
      description: t("dashboard.tiles.artists.description"),
      status: t("dashboard.tiles.artists.status", {
        count: new Set(timetable?.acts.map((act) => act.id) ?? []).size,
      }),
      detail: t("dashboard.tiles.artists.detail"),
    },
    {
      id: "games",
      section: "games",
      title: t("dashboard.tiles.games.title"),
      description: t("dashboard.tiles.games.description"),
      status:
        randomPairingAssignments.length > 0
          ? t("dashboard.tiles.games.status.randomPairings", {
              count: randomPairingAssignments.length,
            })
          : tournaments.length > 0
            ? t("dashboard.tiles.games.status.tournaments", {
                count: tournaments.length,
              })
            : horseRacingState?.isEnabled &&
                horseRacingState.bettingStatus === "open"
              ? t("dashboard.tiles.games.status.horseRacing")
              : bingoCard
                ? t("dashboard.tiles.games.status.bingo")
                : t("dashboard.tiles.games.status.empty"),
      detail: t("dashboard.tiles.games.detail"),
    },
    {
      id: "info",
      section: "info",
      title: t("dashboard.tiles.info.title"),
      description: t("dashboard.tiles.info.description"),
      status:
        festivalInfoCount > 0
          ? t("dashboard.tiles.info.status.available", {
              count: festivalInfoCount,
            })
          : t("dashboard.tiles.info.status.empty"),
      detail: t("dashboard.tiles.info.detail"),
    },
    {
      id: "voting",
      section: "voting",
      title: t("dashboard.tiles.voting.title"),
      description: t("dashboard.tiles.voting.description"),
      status:
        openCategories.length > 0
          ? t("dashboard.tiles.voting.status.available", {
              count: openCategories.length,
            })
          : t("dashboard.tiles.voting.status.empty"),
      detail: t("dashboard.tiles.voting.detail"),
    },
    {
      id: "profile",
      section: "profile",
      title: t("dashboard.tiles.profile.title"),
      description: t("dashboard.tiles.profile.description"),
      status: selectedParticipant
        ? t("dashboard.tiles.profile.status.authenticated", {
            name: selectedParticipant.displayName,
          })
        : t("dashboard.tiles.profile.status.guest"),
      detail: selectedParticipant
        ? t("dashboard.tiles.profile.detailAuthenticated")
        : t("dashboard.tiles.profile.detailGuest"),
      avatar: selectedParticipant
        ? {
            avatarId: selectedParticipant.avatarId,
            name: selectedParticipant.displayName,
          }
        : undefined,
    },
  ];
  const eventPhase = determineEventPhase(
    {
      startDate: eventStartDate,
      endDate: eventEndDate,
    },
    eventReferenceInstant,
  );
  const dashboardTiles = selectDashboardModules(
    unsortedDashboardTiles,
    dashboardModuleConfig,
    eventPhase,
  );

  async function submitAccessCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = Date.now();

    if (loginLockedUntil && loginLockedUntil > now) {
      setCurrentTimeMs(now);
      return;
    }

    const normalizedAccessCode = accessCode.trim().toUpperCase();

    if (!normalizedAccessCode) {
      setAccessCodeError(t("identity.errors.invalidAccessCode"));
      return;
    }

    setIsSubmittingAccessCode(true);
    setAccessCodeError("");

    try {
      const loginResult = await loginParticipant(normalizedAccessCode);

      if (loginResult.status === "blocked") {
        setAccessCodeError(t("identity.errors.loginLocked"));
        setLoginLockedUntil(Date.parse(loginResult.lockedUntil));
        setCurrentTimeMs(Date.now());
        return;
      }

      if (loginResult.status === "invalid") {
        setAccessCodeError(t("identity.errors.invalidAccessCode"));
        return;
      }

      setLoginLockedUntil(null);
      setIsStandingsLoading(true);
      setStandingsError("");

      try {
        const loadedStandings = await loadAllTimeStandings({
          participantAccessCode: loginResult.participant.accessCode,
        });

        setAllTimeStandings(loadedStandings);
      } catch {
        setStandingsError(t("standings.errors.load"));
      } finally {
        setIsStandingsLoading(false);
      }

      storeAuthenticatedParticipant(loginResult.participant);
      setSelectedParticipant(loginResult.participant);
      setProfileDisplayName(loginResult.participant.displayName);
      setProfileAvatarId(
        loginResult.participant.avatarId ?? avatars[0]?.id ?? "",
      );
      setProfileError("");
      setProfileSuccess("");
      setIsAvatarPickerExpanded(false);
      navigateMainSection("dashboard");
      setSelectedVotesByCategory({});
      setAccessCode("");
      setAccessCodeError("");
      setVotesError("");
    } catch {
      setAccessCodeError(t("identity.errors.accessCodeLoad"));
    } finally {
      setIsSubmittingAccessCode(false);
    }
  }

  function logout() {
    clearStoredParticipant();
    setSelectedParticipant(null);
    setAccessCode("");
    setAccessCodeError("");
    setVotes([]);
    setVotesError("");
    setLoginLockedUntil(null);
    setCurrentTimeMs(Date.now());
    setFestivalCode("");
    setFestivalCodeError("");
    setParticipantsError("");
    setCategoriesError("");
    setResultsError("");
    setStandingsError("");
    setAdminError("");
    setAdminCategories([]);
    setAdminCategoriesError("");
    setAdminParticipants([]);
    setAdminParticipantsError("");
    setFestivalDocuments([]);
    setCampLocationLink(null);
    setCampLocationOpenError("");
    setMusicPlaylist(null);
    setFestivalDocumentsError("");
    setIsLoadingFestivalDocuments(false);
    setAdminFestivalDocuments([]);
    setAdminCampLocationLink(null);
    setAdminCampLocationError("");
    setIsSavingCampLocation(false);
    setAdminMusicPlaylist(null);
    setAdminMusicPlaylistError("");
    setIsSavingMusicPlaylist(false);
    setBingoCard(null);
    setBingoError("");
    setHorseRacingState(null);
    setHorseRacingError("");
    setSavingHorseRacingSuit(null);
    setRandomPairingAssignments([]);
    setRandomPairingsError("");
    setTournaments([]);
    setTournamentsError("");
    setTimetable(null);
    setTimetableError("");
    setArtistTags([]);
    setActArtistTags([]);
    setArtistTagsError("");
    setIsLoadingTimetable(false);
    setTogglingFavoritePerformanceId(null);
    setAdminFestivalDays([]);
    setAdminFestivalDaysError("");
    setIsLoadingAdminFestivalDays(false);
    setSavingFestivalDayId(null);
    setDeletingFestivalDayId(null);
    setAdminTimetableStages([]);
    setAdminTimetableStagesError("");
    setIsLoadingAdminTimetableStages(false);
    setSavingStageId(null);
    setDeletingStageId(null);
    setAdminTimetableActs([]);
    setAdminTimetableActsError("");
    setIsLoadingAdminTimetableActs(false);
    setDeletingActId(null);
    setAdminTimetablePerformances([]);
    setAdminTimetablePerformancesError("");
    setIsLoadingAdminTimetablePerformances(false);
    setDeletingPerformanceId(null);
    setTogglingBingoNumber(null);
    setAdminBingoRound(null);
    setAdminBingoError("");
    setIsLoadingAdminBingo(false);
    setIsSavingBingoRound(false);
    setAdminHorseRacingState(null);
    setAdminHorseRacingBets([]);
    setAdminHorseRacingError("");
    setIsLoadingAdminHorseRacing(false);
    setIsSavingHorseRacingState(false);
    setAdminRandomPairingActions([]);
    setAdminRandomPairingsError("");
    setIsLoadingAdminRandomPairings(false);
    setIsCreatingRandomPairingAction(false);
    setSavingRandomPairingActionId(null);
    setAdminTournaments([]);
    setAdminTournamentsError("");
    setIsLoadingAdminTournaments(false);
    setSavingTournamentId(null);
    setDeletingTournamentId(null);
    setAdminFestivalDocumentsError("");
    setIsLoadingAdminFestivalDocuments(false);
    setUploadingDocumentType(null);
    setRemovingDocumentType(null);
    setParticipantForm(null);
    setParticipantFormError("");
    setProfileError("");
    setProfileSuccess("");
    setProfileDisplayName("");
    setProfileAvatarId(avatars[0]?.id ?? "");
    setIsSavingProfile(false);
    isSavingProfileRef.current = false;
    setIsAvatarPickerExpanded(false);
    setIsAdminVisible(false);
    navigateMainSection("dashboard");
    setActiveAdminSection("festival");
    setSelectedVotesByCategory({});

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }

  function selectVote(categoryId: string, votedForId: string) {
    setSelectedVotesByCategory((currentVotes) => ({
      ...currentVotes,
      [categoryId]: votedForId,
    }));
  }

  async function saveOwnProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedParticipant || isSavingProfileRef.current) {
      return;
    }

    const displayName = profileDisplayName.trim();

    setProfileError("");
    setProfileSuccess("");

    if (!displayName) {
      setProfileError(t("identity.profile.errors.nameRequired"));
      return;
    }

    if (displayName.length > 50) {
      setProfileError(t("identity.profile.errors.nameTooLong"));
      return;
    }

    if (!hasProfileChanges) {
      return;
    }

    isSavingProfileRef.current = true;
    setIsSavingProfile(true);

    try {
      const updatedParticipant = await updateOwnProfile(
        {
          displayName,
          avatarId: profileAvatarId,
        },
        {
          participantAccessCode: selectedParticipant.accessCode,
        },
      );

      storeAuthenticatedParticipant(updatedParticipant);
      setSelectedParticipant(updatedParticipant);
      setProfileDisplayName(updatedParticipant.displayName);
      setProfileAvatarId(updatedParticipant.avatarId ?? avatars[0]?.id ?? "");
      setParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.id === updatedParticipant.id
            ? { ...participant, ...updatedParticipant }
            : participant,
        ),
      );
      setAdminParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.id === updatedParticipant.id
            ? { ...participant, ...updatedParticipant }
            : participant,
        ),
      );
      setAllTimeStandings((currentStandings) =>
        currentStandings.map((standing) =>
          standing.participantId === updatedParticipant.id
            ? { ...standing, participantName: updatedParticipant.displayName }
            : standing,
        ),
      );
      setTimetable((currentTimetable) =>
        updateTimetableParticipant(currentTimetable, updatedParticipant),
      );
      setRandomPairingAssignments((currentAssignments) =>
        currentAssignments.map((assignment) =>
          assignment.assignedParticipantId === updatedParticipant.id
            ? {
                ...assignment,
                assignedParticipantName: updatedParticipant.displayName,
              }
            : assignment,
        ),
      );
      setAdminRandomPairingActions((currentActions) =>
        currentActions.map((action) =>
          updateRandomPairingActionParticipant(action, updatedParticipant),
        ),
      );
      setAdminHorseRacingBets((currentBets) =>
        currentBets.map((bet) =>
          bet.participantId === updatedParticipant.id
            ? { ...bet, participantName: updatedParticipant.displayName }
            : bet,
        ),
      );
      setTournaments((currentTournaments) =>
        currentTournaments.map((tournament) =>
          updateTournamentParticipantName(tournament, updatedParticipant),
        ),
      );
      setAdminTournaments((currentTournaments) =>
        currentTournaments.map((tournament) =>
          updateTournamentParticipantName(tournament, updatedParticipant),
        ),
      );
      setProfileSuccess(t("identity.profile.saved"));
    } catch {
      setProfileError(t("identity.profile.errors.save"));
    } finally {
      isSavingProfileRef.current = false;
      setIsSavingProfile(false);
    }
  }

  function togglePreference(tagId: string) {
    setSelectedPreferenceTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId); else next.add(tagId);
      return next;
    });
    setPreferencesSaveError("");
    setPreferencesSuccess("");
  }

  async function savePreferences() {
    if (!selectedParticipant || arePreferencesSaving) return;
    setArePreferencesSaving(true);
    setPreferencesSaveError("");
    setPreferencesSuccess("");
    try {
      const saved = await replaceArtistTagPreferences(Array.from(selectedPreferenceTagIds), { participantAccessCode: selectedParticipant.accessCode });
      setPreferredArtistTags(saved);
      setSelectedPreferenceTagIds(new Set(saved.map((tag) => tag.id)));
      setPreferencesSuccess(t("preferences.saved"));
    } catch {
      setPreferencesSaveError(t("preferences.errors.save"));
    } finally {
      setArePreferencesSaving(false);
    }
  }

  function toggleAdminView() {
    if (!selectedParticipant?.isAdmin) {
      return;
    }

    setIsAdminVisible((isVisible) => {
      if (!isVisible) {
        void reloadFestivalCode();
        void reloadAdminCategories();
        void reloadAdminParticipants();
        void reloadAdminFestivalDays();
        void reloadAdminTimetableStages();
        void reloadAdminTimetableActs();
        void reloadArtistTags().catch((error: unknown) => {
          console.error("Failed to load artist tags", error);
          setArtistTagsError(t("admin.timetable.acts.tags.errors.load"));
        });
        void reloadAdminTimetablePerformances();
        void reloadAdminFestivalDocuments();
        void reloadAdminBingoRound();
        void reloadAdminHorseRacing();
        void reloadAdminRandomPairings();
        void reloadAdminTournaments();

        window.setTimeout(() => {
          document
            .getElementById("admin")
            ?.scrollIntoView({ behavior: "smooth" });
        });
      }

      return !isVisible;
    });
  }

  function getParticipantAdminContext() {
    if (!selectedParticipant?.isAdmin) {
      return null;
    }

    return {
      participantAccessCode: selectedParticipant.accessCode,
    };
  }

  function participantMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("participant access code already exists")) {
      return t("admin.participants.errors.duplicateCode");
    }

    if (message.includes("display name is required")) {
      return t("admin.participants.errors.displayNameRequired");
    }

    if (message.includes("participant access code is required")) {
      return t("admin.participants.errors.accessCodeRequired");
    }

    return t("admin.participants.errors.save");
  }

  function categoryMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("category title is required")) {
      return t("admin.categories.errors.titleRequired");
    }

    if (message.includes("invalid status")) {
      return t("admin.categories.errors.invalidStatus");
    }

    if (message.includes("category cannot be deleted while votes exist")) {
      return t("admin.categories.errors.deleteHasVotes");
    }

    return t("admin.categories.errors.save");
  }

  function festivalDayMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("festival day date already exists")) {
      return t("admin.timetable.days.errors.duplicateDate");
    }

    if (message.includes("festival day date is required")) {
      return t("admin.timetable.days.errors.dateRequired");
    }

    if (message.includes("festival day label is required")) {
      return t("admin.timetable.days.errors.labelRequired");
    }

    if (message.includes("festival day sort order is invalid")) {
      return t("admin.timetable.days.errors.sortOrderInvalid");
    }

    return t("admin.timetable.days.errors.save");
  }

  function timetableStageMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("stage name already exists")) {
      return t("admin.timetable.stages.errors.duplicateName");
    }

    if (message.includes("stage name is required")) {
      return t("admin.timetable.stages.errors.nameRequired");
    }

    if (message.includes("stage sort order is invalid")) {
      return t("admin.timetable.stages.errors.sortOrderInvalid");
    }

    if (message.includes("stage color is invalid")) {
      return t("admin.timetable.stages.errors.colorInvalid");
    }

    return t("admin.timetable.stages.errors.save");
  }

  function timetableActMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("act name is required")) {
      return t("admin.timetable.acts.errors.nameRequired");
    }

    if (message.includes("act cannot be deleted while performances exist")) {
      return t("admin.timetable.acts.errors.deleteHasPerformances");
    }

    return t("admin.timetable.acts.errors.save");
  }

  function timetablePerformanceMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("festival day is required")) {
      return t("admin.timetable.performances.errors.dayRequired");
    }

    if (message.includes("stage is required")) {
      return t("admin.timetable.performances.errors.stageRequired");
    }

    if (message.includes("act is required")) {
      return t("admin.timetable.performances.errors.actRequired");
    }

    if (message.includes("performance start time is required")) {
      return t("admin.timetable.performances.errors.startRequired");
    }

    if (message.includes("performance end time is required")) {
      return t("admin.timetable.performances.errors.endRequired");
    }

    if (message.includes("performance end time must be after start time")) {
      return t("admin.timetable.performances.errors.endAfterStart");
    }

    if (
      message.includes("performance overlaps existing performance on stage")
    ) {
      return t("admin.timetable.performances.errors.overlap");
    }

    if (message.includes("performance references are invalid")) {
      return t("admin.timetable.performances.errors.invalidReference");
    }

    return t("admin.timetable.performances.errors.save");
  }

  function festivalNameMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("festival name is required")) {
      return t("admin.festival.errors.nameRequired");
    }

    return t("admin.festival.errors.save");
  }

  function festivalCodeMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error);

    if (message.includes("festival access code is required")) {
      return t("admin.festival.errors.codeRequired");
    }

    return t("admin.festival.errors.codeSave");
  }

  async function reloadCategoriesForAdminChange() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const [loadedAdminCategories, loadedCategories] = await Promise.all([
      loadAdminCategories(adminContext),
      loadCategories(adminContext),
    ]);

    setAdminCategories(loadedAdminCategories);
    setCategories(loadedCategories);
  }

  async function reloadTimetableForAdminChange() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const [
      loadedAdminFestivalDays,
      loadedAdminTimetableStages,
      loadedAdminTimetableActs,
      loadedAdminTimetablePerformances,
      loadedTimetable,
    ] = await Promise.all([
      loadAdminFestivalDays(adminContext),
      loadAdminTimetableStages(adminContext),
      loadAdminTimetableActs(adminContext),
      loadAdminTimetablePerformances(adminContext),
      loadTimetable(adminContext),
    ]);

    setAdminFestivalDays(loadedAdminFestivalDays);
    setAdminTimetableStages(loadedAdminTimetableStages);
    setAdminTimetableActs(loadedAdminTimetableActs);
    setAdminTimetablePerformances(loadedAdminTimetablePerformances);
    setTimetable(loadedTimetable);
  }

  async function reloadArtistTags() {
    const adminContext = getParticipantAdminContext();
    if (!adminContext) return;
    const [tags, assignments] = await Promise.all([
      loadArtistTags(adminContext),
      loadActArtistTags(adminContext),
    ]);
    setArtistTags(tags);
    setActArtistTags(assignments);
  }

  async function addAdminArtistTag(actId: string, name: string) {
    const adminContext = getParticipantAdminContext();
    if (!adminContext) return;
    setArtistTagsError("");
    try {
      const tag = await addArtistTag(actId, name, adminContext);
      setArtistTags((current) => current.some(({ id }) => id === tag.id) ? current : [...current, tag]);
      setActArtistTags((current) => current.some((item) => item.actId === actId && item.id === tag.id)
        ? current
        : [...current, { ...tag, actId }]);
      await reloadArtistTags().catch((error: unknown) => {
        console.error("Failed to refresh artist tags after adding", error);
        setArtistTagsError(t("admin.timetable.acts.tags.errors.load"));
      });
    } catch (error) {
      console.error("Failed to add artist tag", error);
      setArtistTagsError(t("admin.timetable.acts.tags.errors.save"));
      throw error;
    }
  }

  async function assignAdminArtistTag(actId: string, tagId: string) {
    const adminContext = getParticipantAdminContext();
    if (!adminContext) return;
    setArtistTagsError("");
    try {
      await assignArtistTag(actId, tagId, adminContext);
      const tag = artistTags.find(({ id }) => id === tagId);
      if (tag) {
        setActArtistTags((current) => current.some((item) => item.actId === actId && item.id === tagId)
          ? current
          : [...current, { ...tag, actId }]);
      }
      await reloadArtistTags().catch((error: unknown) => {
        console.error("Failed to refresh artist tags after assigning", error);
        setArtistTagsError(t("admin.timetable.acts.tags.errors.load"));
      });
    } catch (error) {
      console.error("Failed to assign artist tag", error);
      setArtistTagsError(t("admin.timetable.acts.tags.errors.save"));
      throw error;
    }
  }

  async function removeAdminArtistTag(actId: string, tagId: string) {
    const adminContext = getParticipantAdminContext();
    if (!adminContext) return;
    setArtistTagsError("");
    try {
      await removeArtistTag(actId, tagId, adminContext);
      setActArtistTags((current) => current.filter((item) => item.actId !== actId || item.id !== tagId));
      await reloadArtistTags().catch((error: unknown) => {
        console.error("Failed to refresh artist tags after removing", error);
        setArtistTagsError(t("admin.timetable.acts.tags.errors.load"));
      });
    } catch (error) {
      console.error("Failed to remove artist tag assignment", error);
      setArtistTagsError(t("admin.timetable.acts.tags.errors.remove"));
      throw error;
    }
  }

  async function reloadFestivalCode() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingFestivalCode(true);
    setFestivalCodeError("");

    try {
      const loadedFestivalCode = await loadFestivalAccessCode(adminContext);

      setFestivalCode(loadedFestivalCode.code);
      festivalAccess.rememberAccessVersion(loadedFestivalCode.version);
    } catch {
      setFestivalCodeError(t("admin.festival.errors.codeLoad"));
    } finally {
      setIsLoadingFestivalCode(false);
    }
  }

  async function reloadAdminCategories() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminCategories(true);
    setAdminCategoriesError("");

    try {
      const loadedAdminCategories = await loadAdminCategories(adminContext);

      setAdminCategories(loadedAdminCategories);
    } catch {
      setAdminCategoriesError(t("admin.categories.errors.load"));
    } finally {
      setIsLoadingAdminCategories(false);
    }
  }

  async function reloadAdminFestivalDays() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminFestivalDays(true);
    setAdminFestivalDaysError("");

    try {
      const loadedFestivalDays = await loadAdminFestivalDays(adminContext);

      setAdminFestivalDays(loadedFestivalDays);
    } catch {
      setAdminFestivalDaysError(t("admin.timetable.days.errors.load"));
    } finally {
      setIsLoadingAdminFestivalDays(false);
    }
  }

  async function reloadAdminTimetableStages() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminTimetableStages(true);
    setAdminTimetableStagesError("");

    try {
      const loadedStages = await loadAdminTimetableStages(adminContext);

      setAdminTimetableStages(loadedStages);
    } catch {
      setAdminTimetableStagesError(t("admin.timetable.stages.errors.load"));
    } finally {
      setIsLoadingAdminTimetableStages(false);
    }
  }

  async function reloadAdminTimetableActs() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminTimetableActs(true);
    setAdminTimetableActsError("");

    try {
      const loadedActs = await loadAdminTimetableActs(adminContext);

      setAdminTimetableActs(loadedActs);
    } catch {
      setAdminTimetableActsError(t("admin.timetable.acts.errors.load"));
    } finally {
      setIsLoadingAdminTimetableActs(false);
    }
  }

  async function reloadAdminTimetablePerformances() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminTimetablePerformances(true);
    setAdminTimetablePerformancesError("");

    try {
      const loadedPerformances =
        await loadAdminTimetablePerformances(adminContext);

      setAdminTimetablePerformances(loadedPerformances);
    } catch {
      setAdminTimetablePerformancesError(
        t("admin.timetable.performances.errors.load"),
      );
    } finally {
      setIsLoadingAdminTimetablePerformances(false);
    }
  }

  async function reloadAdminParticipants() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminParticipants(true);
    setAdminParticipantsError("");

    try {
      const loadedAdminParticipants = await loadAdminParticipants(adminContext);

      setAdminParticipants(loadedAdminParticipants);
    } catch {
      setAdminParticipantsError(t("admin.participants.errors.load"));
    } finally {
      setIsLoadingAdminParticipants(false);
    }
  }

  async function reloadAdminBingoRound() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminBingo(true);
    setAdminBingoError("");

    try {
      const loadedBingoRound = await loadAdminBingoRound(adminContext);

      setAdminBingoRound(loadedBingoRound);
    } catch {
      setAdminBingoError(t("admin.bingo.errors.load"));
    } finally {
      setIsLoadingAdminBingo(false);
    }
  }

  async function reloadAdminHorseRacing() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminHorseRacing(true);
    setAdminHorseRacingError("");

    try {
      const [loadedState, loadedBets] = await Promise.all([
        loadAdminHorseRacingState(activeFestival.id, adminContext),
        loadAdminHorseRacingBets(activeFestival.id, adminContext),
      ]);

      setAdminHorseRacingState(loadedState);
      setAdminHorseRacingBets(loadedBets);
    } catch {
      setAdminHorseRacingError(t("admin.horseRacing.errors.load"));
    } finally {
      setIsLoadingAdminHorseRacing(false);
    }
  }

  async function reloadAdminRandomPairings() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminRandomPairings(true);
    setAdminRandomPairingsError("");

    try {
      const loadedActions = await loadAdminRandomPairingActions(
        activeFestival.id,
        adminContext,
      );

      setAdminRandomPairingActions(loadedActions);
    } catch {
      setAdminRandomPairingsError(t("admin.randomPairings.errors.load"));
    } finally {
      setIsLoadingAdminRandomPairings(false);
    }
  }

  async function reloadAdminTournaments() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminTournaments(true);
    setAdminTournamentsError("");

    try {
      const loadedTournaments = await loadAdminTournaments(
        activeFestival.id,
        adminContext,
      );

      setAdminTournaments(loadedTournaments);
    } catch {
      setAdminTournamentsError(t("admin.tournaments.errors.load"));
    } finally {
      setIsLoadingAdminTournaments(false);
    }
  }

  async function reloadAdminFestivalDocuments() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsLoadingAdminFestivalDocuments(true);
    setAdminFestivalDocumentsError("");
    setAdminCampLocationError("");

    try {
      const [
        loadedAdminFestivalDocuments,
        loadedAdminCampLocationLink,
        loadedAdminMusicPlaylist,
      ] = await Promise.all([
        loadAdminFestivalDocuments(adminContext),
        loadAdminCampLocationLink(adminContext),
        loadAdminMusicPlaylist(adminContext),
      ]);

      setAdminFestivalDocuments(loadedAdminFestivalDocuments);
      setAdminCampLocationLink(loadedAdminCampLocationLink);
      setAdminMusicPlaylist(loadedAdminMusicPlaylist);
    } catch {
      setAdminFestivalDocumentsError(t("admin.documents.errors.load"));
    } finally {
      setIsLoadingAdminFestivalDocuments(false);
    }
  }

  async function saveFestivalSettings(settings: EventSettings) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsSavingFestivalName(true);
    setFestivalNameError("");

    try {
      const savedSettings = await updateEventSettings(settings, adminContext);
      setFestivalName(savedSettings.name);
      setEventStartDate(savedSettings.startDate);
      setEventEndDate(savedSettings.endDate);
    } catch (error) {
      throw new Error(festivalNameMutationErrorMessage(error), {
        cause: error,
      });
    } finally {
      setIsSavingFestivalName(false);
    }
  }

  async function uploadFestivalLogo(file: File) {
    const adminContext = getParticipantAdminContext();
    if (!adminContext) return;

    setIsUploadingEventLogo(true);
    try {
      const logoPath = await uploadEventLogo(file, adminContext);
      setEventLogoUrl(eventLogoPublicUrl(logoPath));
    } finally {
      setIsUploadingEventLogo(false);
    }
  }

  async function removeFestivalLogo() {
    const adminContext = getParticipantAdminContext();
    if (!adminContext) return;

    setIsRemovingEventLogo(true);
    try {
      await removeEventLogo(adminContext);
      setEventLogoUrl(null);
    } finally {
      setIsRemovingEventLogo(false);
    }
  }

  async function saveFestivalCode(code: string) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsSavingFestivalCode(true);
    setFestivalCodeError("");

    try {
      const savedFestivalCode = await updateFestivalAccessCode(
        code,
        adminContext,
      );

      setFestivalCode(savedFestivalCode.code);
      festivalAccess.rememberAccessVersion(savedFestivalCode.version);
    } catch (error) {
      throw new Error(festivalCodeMutationErrorMessage(error), {
        cause: error,
      });
    } finally {
      setIsSavingFestivalCode(false);
    }
  }

  async function archiveCurrentFestival() {
    if (!selectedParticipant?.isAdmin) {
      return "";
    }

    return archiveFestival(selectedParticipant.accessCode);
  }

  async function exportCurrentFestival(includeParticipantAccessCodes: boolean) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsExportingFestival(true);

    try {
      const exportedAt = new Date();
      const exportData = await loadFestivalExportData(
        adminContext,
        {
          type: "active",
          festivalId: activeFestival.id,
        },
        exportedAt,
        {
          includeParticipantAccessCodes,
        },
      );
      const fileName = festivalExportFileName(
        exportData.festival.name,
        exportedAt,
      );
      const blob = new Blob([serializeFestivalExport(exportData)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingFestival(false);
    }
  }

  async function startCreateParticipant() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setParticipantFormError("");
    setParticipantForm({
      id: null,
      displayName: "",
      accessCode: "",
    });

    try {
      const suggestedAccessCode =
        await suggestParticipantAccessCode(adminContext);

      setParticipantForm((currentForm) =>
        currentForm && currentForm.id === null
          ? { ...currentForm, accessCode: suggestedAccessCode }
          : currentForm,
      );
    } catch {
      setParticipantFormError(t("admin.participants.errors.codeSuggest"));
    }
  }

  function startEditParticipant(participant: Participant) {
    setParticipantFormError("");
    setParticipantForm({
      id: participant.id,
      displayName: participant.displayName,
      accessCode: participant.accessCode,
    });
  }

  function cancelParticipantForm() {
    setParticipantForm(null);
    setParticipantFormError("");
  }

  async function submitParticipantForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const adminContext = getParticipantAdminContext();

    if (!adminContext || !participantForm) {
      return;
    }

    const displayName = participantForm.displayName.trim();
    const accessCode = participantForm.accessCode.trim().toUpperCase();

    if (!displayName) {
      setParticipantFormError(
        t("admin.participants.errors.displayNameRequired"),
      );
      return;
    }

    if (!accessCode) {
      setParticipantFormError(
        t("admin.participants.errors.accessCodeRequired"),
      );
      return;
    }

    setIsSavingParticipant(true);
    setParticipantFormError("");

    try {
      if (participantForm.id) {
        await updateParticipant(
          {
            id: participantForm.id,
            displayName,
            accessCode,
          },
          adminContext,
        );
      } else {
        await createParticipant(
          {
            displayName,
            accessCode,
          },
          adminContext,
        );
      }

      setParticipantForm(null);
      await reloadAdminParticipants();
    } catch (error) {
      setParticipantFormError(participantMutationErrorMessage(error));
    } finally {
      setIsSavingParticipant(false);
    }
  }

  async function deactivateAdminParticipant(participant: Participant) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext || !participant.isActive) {
      return;
    }

    const shouldDeactivate = window.confirm(
      t("admin.participants.confirmDeactivate", {
        name: participant.displayName,
      }),
    );

    if (!shouldDeactivate) {
      return;
    }

    setTogglingParticipantId(participant.id);
    setAdminParticipantsError("");

    try {
      await deactivateParticipant(participant.id, adminContext);
      await reloadAdminParticipants();
    } catch {
      setAdminParticipantsError(t("admin.participants.errors.deactivate"));
    } finally {
      setTogglingParticipantId(null);
    }
  }

  async function reactivateAdminParticipant(participant: Participant) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext || participant.isActive) {
      return;
    }

    setTogglingParticipantId(participant.id);
    setAdminParticipantsError("");

    try {
      await reactivateParticipant(participant.id, adminContext);
      await reloadAdminParticipants();
    } catch {
      setAdminParticipantsError(t("admin.participants.errors.reactivate"));
    } finally {
      setTogglingParticipantId(null);
    }
  }

  async function createAdminCategory(input: CreateCategoryInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminCategoriesError("");

    try {
      await createCategory(input, adminContext);
      await reloadCategoriesForAdminChange();
    } catch (error) {
      throw new Error(categoryMutationErrorMessage(error), { cause: error });
    }
  }

  async function updateAdminCategory(input: UpdateCategoryInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminCategoriesError("");

    try {
      await updateCategory(input, adminContext);
      await reloadCategoriesForAdminChange();
    } catch (error) {
      throw new Error(categoryMutationErrorMessage(error), { cause: error });
    }
  }

  async function changeCategoryStatus(
    categoryId: string,
    status: CategoryStatus,
  ) {
    if (!selectedParticipant?.isAdmin) {
      return;
    }

    const previousCategories = categories;
    const previousAdminCategories = adminCategories;

    setAdminError("");
    setUpdatingCategoryId(categoryId);
    setCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    );
    setAdminCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    );

    try {
      const updatedCategory = await updateCategory(
        {
          id: categoryId,
          status,
        },
        {
          participantAccessCode: selectedParticipant.accessCode,
        },
      );

      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      );
      setAdminCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      );
    } catch {
      setCategories(previousCategories);
      setAdminCategories(previousAdminCategories);
      setAdminError(t("admin.errors.statusSave"));
    } finally {
      setUpdatingCategoryId(null);
    }
  }

  async function deleteAdminCategory(category: Category) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const shouldDelete = window.confirm(
      t("admin.categories.confirmDelete", {
        title: category.title,
      }),
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingCategoryId(category.id);
    setAdminCategoriesError("");

    try {
      await deleteCategory(category.id, adminContext);
      await reloadCategoriesForAdminChange();
    } catch (error) {
      setAdminCategoriesError(categoryMutationErrorMessage(error));
    } finally {
      setDeletingCategoryId(null);
    }
  }

  async function createAdminFestivalDay(input: CreateFestivalDayInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminFestivalDaysError("");

    try {
      await createFestivalDay(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(festivalDayMutationErrorMessage(error), { cause: error });
    }
  }

  async function updateAdminFestivalDay(input: UpdateFestivalDayInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminFestivalDaysError("");

    try {
      await updateFestivalDay(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(festivalDayMutationErrorMessage(error), { cause: error });
    }
  }

  async function moveAdminFestivalDay(
    festivalDay: FestivalDay,
    direction: "up" | "down",
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const orderedFestivalDays = [...adminFestivalDays].sort(
      (firstDay, secondDay) =>
        firstDay.sortOrder - secondDay.sortOrder ||
        firstDay.date.localeCompare(secondDay.date),
    );
    const currentIndex = orderedFestivalDays.findIndex(
      (currentDay) => currentDay.id === festivalDay.id,
    );
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetDay = orderedFestivalDays[targetIndex];

    if (currentIndex < 0 || !targetDay) {
      return;
    }

    setSavingFestivalDayId(festivalDay.id);
    setAdminFestivalDaysError("");

    try {
      await updateFestivalDay(
        {
          ...festivalDay,
          sortOrder: targetDay.sortOrder,
        },
        adminContext,
      );
      await updateFestivalDay(
        {
          ...targetDay,
          sortOrder: festivalDay.sortOrder,
        },
        adminContext,
      );
      await reloadTimetableForAdminChange();
    } catch {
      setAdminFestivalDaysError(t("admin.timetable.days.errors.reorder"));
    } finally {
      setSavingFestivalDayId(null);
    }
  }

  async function deleteAdminFestivalDay(festivalDay: FestivalDay) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const shouldDelete = window.confirm(
      t("admin.timetable.days.confirmDelete", {
        label: festivalDay.label,
      }),
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingFestivalDayId(festivalDay.id);
    setAdminFestivalDaysError("");

    try {
      await deleteFestivalDay(festivalDay.id, adminContext);
      await reloadTimetableForAdminChange();
    } catch {
      setAdminFestivalDaysError(t("admin.timetable.days.errors.delete"));
    } finally {
      setDeletingFestivalDayId(null);
    }
  }

  async function createAdminTimetableStage(input: CreateTimetableStageInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminTimetableStagesError("");

    try {
      await createTimetableStage(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(timetableStageMutationErrorMessage(error), {
        cause: error,
      });
    }
  }

  async function updateAdminTimetableStage(input: UpdateTimetableStageInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminTimetableStagesError("");

    try {
      await updateTimetableStage(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(timetableStageMutationErrorMessage(error), {
        cause: error,
      });
    }
  }

  async function moveAdminTimetableStage(
    stage: TimetableStage,
    direction: "up" | "down",
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const orderedStages = [...adminTimetableStages].sort(
      (firstStage, secondStage) =>
        firstStage.sortOrder - secondStage.sortOrder ||
        firstStage.name.localeCompare(secondStage.name),
    );
    const currentIndex = orderedStages.findIndex(
      (currentStage) => currentStage.id === stage.id,
    );
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetStage = orderedStages[targetIndex];

    if (currentIndex < 0 || !targetStage) {
      return;
    }

    setSavingStageId(stage.id);
    setAdminTimetableStagesError("");

    try {
      await updateTimetableStage(
        {
          ...stage,
          sortOrder: targetStage.sortOrder,
        },
        adminContext,
      );
      await updateTimetableStage(
        {
          ...targetStage,
          sortOrder: stage.sortOrder,
        },
        adminContext,
      );
      await reloadTimetableForAdminChange();
    } catch {
      setAdminTimetableStagesError(t("admin.timetable.stages.errors.reorder"));
    } finally {
      setSavingStageId(null);
    }
  }

  async function deleteAdminTimetableStage(stage: TimetableStage) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const shouldDelete = window.confirm(
      t("admin.timetable.stages.confirmDelete", {
        name: stage.name,
      }),
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingStageId(stage.id);
    setAdminTimetableStagesError("");

    try {
      await deleteTimetableStage(stage.id, adminContext);
      await reloadTimetableForAdminChange();
    } catch {
      setAdminTimetableStagesError(t("admin.timetable.stages.errors.delete"));
    } finally {
      setDeletingStageId(null);
    }
  }

  async function createAdminTimetableAct(input: CreateTimetableActInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminTimetableActsError("");

    try {
      await createTimetableAct(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(timetableActMutationErrorMessage(error), {
        cause: error,
      });
    }
  }

  async function updateAdminTimetableAct(input: UpdateTimetableActInput) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminTimetableActsError("");

    try {
      await updateTimetableAct(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(timetableActMutationErrorMessage(error), {
        cause: error,
      });
    }
  }

  async function deleteAdminTimetableAct(act: TimetableAct) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const shouldDelete = window.confirm(
      t("admin.timetable.acts.confirmDelete", {
        name: act.name,
      }),
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingActId(act.id);
    setAdminTimetableActsError("");

    try {
      await deleteTimetableAct(act.id, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      setAdminTimetableActsError(timetableActMutationErrorMessage(error));
    } finally {
      setDeletingActId(null);
    }
  }

  async function createAdminTimetablePerformance(
    input: CreateTimetablePerformanceInput,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminTimetablePerformancesError("");

    try {
      await createTimetablePerformance(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(timetablePerformanceMutationErrorMessage(error), {
        cause: error,
      });
    }
  }

  async function updateAdminTimetablePerformance(
    input: UpdateTimetablePerformanceInput,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setAdminTimetablePerformancesError("");

    try {
      await updateTimetablePerformance(input, adminContext);
      await reloadTimetableForAdminChange();
    } catch (error) {
      throw new Error(timetablePerformanceMutationErrorMessage(error), {
        cause: error,
      });
    }
  }

  async function deleteAdminTimetablePerformance(
    performance: TimetablePerformance,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const act = adminTimetableActs.find(
      (currentAct) => currentAct.id === performance.actId,
    );
    const shouldDelete = window.confirm(
      t("admin.timetable.performances.confirmDelete", {
        act: act?.name ?? t("admin.timetable.performances.unknownAct"),
      }),
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingPerformanceId(performance.id);
    setAdminTimetablePerformancesError("");

    try {
      await deleteTimetablePerformance(performance.id, adminContext);
      await reloadTimetableForAdminChange();
    } catch {
      setAdminTimetablePerformancesError(
        t("admin.timetable.performances.errors.delete"),
      );
    } finally {
      setDeletingPerformanceId(null);
    }
  }

  async function uploadAdminFestivalDocument(
    documentType: FestivalDocumentType,
    file: File,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    if (!isSupportedFestivalDocumentFile(file)) {
      setAdminFestivalDocumentsError(
        t("admin.documents.errors.unsupportedFileType"),
      );
      return;
    }

    setUploadingDocumentType(documentType);
    setAdminFestivalDocumentsError("");

    try {
      await uploadFestivalDocument(
        {
          documentType,
          title: t(`info.documentTypes.${documentType}`),
          file,
        },
        adminContext,
      );

      const [loadedAdminDocuments, loadedDocuments] = await Promise.all([
        loadAdminFestivalDocuments(adminContext),
        loadFestivalDocuments(adminContext),
      ]);

      setAdminFestivalDocuments(loadedAdminDocuments);
      setFestivalDocuments(loadedDocuments);
      setFestivalDocumentsError("");
    } catch {
      setAdminFestivalDocumentsError(t("admin.documents.errors.upload"));
    } finally {
      setUploadingDocumentType(null);
    }
  }

  async function removeAdminFestivalDocument(
    documentType: FestivalDocumentType,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const shouldRemove = window.confirm(
      t("admin.documents.confirmRemove", {
        title: t(`info.documentTypes.${documentType}`),
      }),
    );

    if (!shouldRemove) {
      return;
    }

    setRemovingDocumentType(documentType);
    setAdminFestivalDocumentsError("");

    try {
      await deleteFestivalDocument(documentType, adminContext);

      const [loadedAdminDocuments, loadedDocuments] = await Promise.all([
        loadAdminFestivalDocuments(adminContext),
        loadFestivalDocuments(adminContext),
      ]);

      setAdminFestivalDocuments(loadedAdminDocuments);
      setFestivalDocuments(loadedDocuments);
      setFestivalDocumentsError("");
    } catch {
      setAdminFestivalDocumentsError(t("admin.documents.errors.remove"));
    } finally {
      setRemovingDocumentType(null);
    }
  }

  async function saveAdminCampLocationLink(link: string, locationQuery: string) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const normalizedLink = link.trim();

    if (!isSupportedCampLocationLink(normalizedLink)) {
      setAdminCampLocationError(t("admin.campLocation.errors.invalid"));
      return;
    }

    setIsSavingCampLocation(true);
    setAdminCampLocationError("");

    try {
      const location = await geocodeCampLocation(locationQuery || normalizedLink, adminContext);
      const savedLink = await updateCampLocationLink(normalizedLink, location, adminContext);

      setAdminCampLocationLink(savedLink);
      setCampLocationLink(savedLink);
      setCampLocationOpenError("");
    } catch (error) {
      setAdminCampLocationError(t(error instanceof GeocodingNotFoundError
        ? "admin.campLocation.errors.notFound"
        : "admin.campLocation.errors.save"));
    } finally {
      setIsSavingCampLocation(false);
    }
  }

  async function removeAdminCampLocationLink() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    const shouldRemove = window.confirm(t("admin.campLocation.confirmRemove"));

    if (!shouldRemove) {
      return;
    }

    setIsSavingCampLocation(true);
    setAdminCampLocationError("");

    try {
      await deleteCampLocationLink(adminContext);
      setAdminCampLocationLink(null);
      setCampLocationLink(null);
      setCampLocationOpenError("");
    } catch {
      setAdminCampLocationError(t("admin.campLocation.errors.remove"));
    } finally {
      setIsSavingCampLocation(false);
    }
  }

  async function saveAdminMusicPlaylist(link: string) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return false;
    }

    const normalizedLink = link.trim();

    if (!isSupportedMusicPlaylistLink(normalizedLink)) {
      setAdminMusicPlaylistError(t("admin.musicPlaylist.errors.invalid"));
      return false;
    }

    setIsSavingMusicPlaylist(true);
    setAdminMusicPlaylistError("");

    try {
      const savedPlaylist = await updateMusicPlaylist(
        normalizedLink,
        adminContext,
      );

      setAdminMusicPlaylist(savedPlaylist);
      setMusicPlaylist(savedPlaylist);
      setFestivalDocumentsError("");
      return true;
    } catch {
      setAdminMusicPlaylistError(t("admin.musicPlaylist.errors.save"));
      return false;
    } finally {
      setIsSavingMusicPlaylist(false);
    }
  }

  async function removeAdminMusicPlaylist() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return false;
    }

    const shouldRemove = window.confirm(t("admin.musicPlaylist.confirmRemove"));

    if (!shouldRemove) {
      return false;
    }

    setIsSavingMusicPlaylist(true);
    setAdminMusicPlaylistError("");

    try {
      await deleteMusicPlaylist(adminContext);
      setAdminMusicPlaylist(null);
      setMusicPlaylist(null);
      setFestivalDocumentsError("");
      return true;
    } catch {
      setAdminMusicPlaylistError(t("admin.musicPlaylist.errors.remove"));
      return false;
    } finally {
      setIsSavingMusicPlaylist(false);
    }
  }

  async function startAdminBingoRound() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsSavingBingoRound(true);
    setAdminBingoError("");

    try {
      const startedRound = await startBingoRound(adminContext);
      const loadedBingoCard = await loadOrCreateBingoCard(adminContext);

      setAdminBingoRound(startedRound);
      setBingoCard(loadedBingoCard);
      setBingoError("");
    } finally {
      setIsSavingBingoRound(false);
    }
  }

  async function closeAdminBingoRound() {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsSavingBingoRound(true);
    setAdminBingoError("");

    try {
      await closeBingoRound(adminContext);
      setAdminBingoRound(null);
      setBingoCard(null);
      setBingoError("");

      if (activeMainSection === "games") {
        navigateMainSection("awards");
      }
    } finally {
      setIsSavingBingoRound(false);
    }
  }

  async function updateHorseRacingAdminState(input: {
    isEnabled: boolean;
    bettingStatus: HorseRacingBettingStatus;
  }) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsSavingHorseRacingState(true);
    setAdminHorseRacingError("");

    try {
      const updatedState = await updateAdminHorseRacingState(
        activeFestival.id,
        input,
        adminContext,
      );
      const [loadedParticipantState, loadedBets] = await Promise.all([
        loadHorseRacingState(activeFestival.id, adminContext),
        loadAdminHorseRacingBets(activeFestival.id, adminContext),
      ]);

      setAdminHorseRacingState(updatedState);
      setAdminHorseRacingBets(loadedBets);
      setHorseRacingState(loadedParticipantState);
      setHorseRacingError("");
    } finally {
      setIsSavingHorseRacingState(false);
    }
  }

  function replaceAdminRandomPairingAction(action: AdminRandomPairingAction) {
    setAdminRandomPairingActions((currentActions) => {
      const existingIndex = currentActions.findIndex(
        (currentAction) => currentAction.id === action.id,
      );

      if (existingIndex === -1) {
        return [action, ...currentActions];
      }

      return currentActions.map((currentAction) =>
        currentAction.id === action.id ? action : currentAction,
      );
    });
  }

  async function createAdminRandomPairingAction(name: string) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setIsCreatingRandomPairingAction(true);
    setAdminRandomPairingsError("");

    try {
      const createdAction = await createRandomPairingAction(
        activeFestival.id,
        name,
        adminContext,
      );

      replaceAdminRandomPairingAction(createdAction);
    } finally {
      setIsCreatingRandomPairingAction(false);
    }
  }

  async function updateAdminRandomPairingParticipants(
    actionId: string,
    participantIds: string[],
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setSavingRandomPairingActionId(actionId);
    setAdminRandomPairingsError("");

    try {
      const updatedAction = await updateRandomPairingParticipants(
        actionId,
        participantIds,
        adminContext,
      );

      replaceAdminRandomPairingAction(updatedAction);
    } finally {
      setSavingRandomPairingActionId(null);
    }
  }

  async function drawAdminRandomPairingAction(
    actionId: string,
    replaceExisting: boolean,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setSavingRandomPairingActionId(actionId);
    setAdminRandomPairingsError("");

    try {
      const drawnAction = await drawRandomPairingAction(
        actionId,
        replaceExisting,
        adminContext,
      );
      const loadedAssignments = await loadRandomPairingAssignments(
        activeFestival.id,
        adminContext,
      );

      replaceAdminRandomPairingAction(drawnAction);
      setRandomPairingAssignments(loadedAssignments);
      setRandomPairingsError("");
    } finally {
      setSavingRandomPairingActionId(null);
    }
  }

  async function resetAdminRandomPairingAction(actionId: string) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setSavingRandomPairingActionId(actionId);
    setAdminRandomPairingsError("");

    try {
      const resetAction = await resetRandomPairingAction(
        activeFestival.id,
        actionId,
        adminContext,
      );
      const loadedAssignments = await loadRandomPairingAssignments(
        activeFestival.id,
        adminContext,
      );

      replaceAdminRandomPairingAction(resetAction);
      setRandomPairingAssignments(loadedAssignments);
      setRandomPairingsError("");
    } finally {
      setSavingRandomPairingActionId(null);
    }
  }

  function replaceTournament(tournament: Tournament) {
    setTournaments((currentTournaments) => {
      const exists = currentTournaments.some(
        (currentTournament) => currentTournament.id === tournament.id,
      );

      return exists
        ? currentTournaments.map((currentTournament) =>
            currentTournament.id === tournament.id
              ? tournament
              : currentTournament,
          )
        : [tournament, ...currentTournaments];
    });
    setAdminTournaments((currentTournaments) => {
      const exists = currentTournaments.some(
        (currentTournament) => currentTournament.id === tournament.id,
      );

      return exists
        ? currentTournaments.map((currentTournament) =>
            currentTournament.id === tournament.id
              ? tournament
              : currentTournament,
          )
        : [tournament, ...currentTournaments];
    });
  }

  async function createAdminTournament(input: {
    name: string;
    mode: TournamentMode;
    participantIds: string[];
  }) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setSavingTournamentId("new");
    setAdminTournamentsError("");

    try {
      const createdTournament = await createTournament(
        activeFestival.id,
        input,
        adminContext,
      );

      replaceTournament(createdTournament);
      setTournamentsError("");
    } finally {
      setSavingTournamentId(null);
    }
  }

  async function updateAdminTournament(
    tournamentId: string,
    input: {
      name: string;
      mode: TournamentMode;
      participantIds: string[];
    },
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setSavingTournamentId(tournamentId);
    setAdminTournamentsError("");

    try {
      const updatedTournament = await updateTournament(
        tournamentId,
        input,
        adminContext,
      );

      replaceTournament(updatedTournament);
      setTournamentsError("");
    } finally {
      setSavingTournamentId(null);
    }
  }

  async function deleteAdminTournament(tournamentId: string) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) {
      return;
    }

    setDeletingTournamentId(tournamentId);
    setAdminTournamentsError("");

    try {
      await deleteTournament(tournamentId, adminContext);
      setAdminTournaments((currentTournaments) =>
        currentTournaments.filter(
          (currentTournament) => currentTournament.id !== tournamentId,
        ),
      );
      setTournaments((currentTournaments) =>
        currentTournaments.filter(
          (currentTournament) => currentTournament.id !== tournamentId,
        ),
      );
      setTournamentsError("");
    } finally {
      setDeletingTournamentId(null);
    }
  }

  async function saveAdminTournamentMatchWinner(
    tournamentId: string,
    matchId: string,
    winnerParticipantId: string,
  ) {
    const adminContext = getParticipantAdminContext();

    if (!adminContext) return;

    setSavingTournamentMatchId(matchId);
    setAdminTournamentsError("");

    try {
      const updatedTournament = await setTournamentMatchWinner(
        tournamentId,
        matchId,
        winnerParticipantId,
        adminContext,
      );
      replaceTournament(updatedTournament);
      setTournamentsError("");
    } catch {
      setAdminTournamentsError(t("admin.tournaments.errors.winnerSave"));
    } finally {
      setSavingTournamentMatchId(null);
    }
  }

  async function toggleBingoNumber(number: number) {
    if (!selectedParticipant || !bingoCard) {
      return;
    }

    const isMarked = bingoCard.markedNumbers.includes(number);

    setTogglingBingoNumber(number);
    setBingoError("");

    try {
      const markedNumbers = await setBingoMark(number, !isMarked, {
        participantAccessCode: selectedParticipant.accessCode,
      });

      setBingoCard({
        ...bingoCard,
        markedNumbers,
      });
    } catch {
      setBingoError(t("bingo.errors.mark"));
    } finally {
      setTogglingBingoNumber(null);
    }
  }

  async function selectHorseRacingSuit(suit: HorseRacingSuit) {
    if (!selectedParticipant) {
      return;
    }

    setSavingHorseRacingSuit(suit);
    setHorseRacingError("");

    try {
      const savedState = await saveHorseRacingBet(activeFestival.id, suit, {
        participantAccessCode: selectedParticipant.accessCode,
      });

      setHorseRacingState(savedState);

      if (selectedParticipant.isAdmin) {
        void reloadAdminHorseRacing();
      }
    } catch {
      setHorseRacingError(t("horseRacing.errors.save"));
    } finally {
      setSavingHorseRacingSuit(null);
    }
  }

  async function toggleTimetableFavorite(
    performanceId: string,
    isFavorite: boolean,
  ) {
    if (!selectedParticipant || !timetable) {
      return;
    }

    const previousFavoritePerformanceIds = timetable.favoritePerformanceIds;
    const previousPerformanceFavorites = timetable.performanceFavorites;
    const nextFavoritePerformanceIds = isFavorite
      ? previousFavoritePerformanceIds.filter((id) => id !== performanceId)
      : Array.from(new Set([...previousFavoritePerformanceIds, performanceId]));
    const hasPerformanceFavoritesEntry = previousPerformanceFavorites.some(
      (favorite) => favorite.performanceId === performanceId,
    );
    const nextPerformanceFavoritesSource = hasPerformanceFavoritesEntry
      ? previousPerformanceFavorites
      : [
          ...previousPerformanceFavorites,
          {
            performanceId,
            participants: [],
          },
        ];

    setTogglingFavoritePerformanceId(performanceId);
    setTimetableError("");
    setTimetable({
      ...timetable,
      favoritePerformanceIds: nextFavoritePerformanceIds,
      performanceFavorites: nextPerformanceFavoritesSource.map((favorite) =>
        favorite.performanceId === performanceId
          ? {
              ...favorite,
              participants: isFavorite
                ? favorite.participants.filter(
                    (participant) =>
                      participant.participantId !== selectedParticipant.id,
                  )
                : [
                    ...favorite.participants.filter(
                      (participant) =>
                        participant.participantId !== selectedParticipant.id,
                    ),
                    {
                      participantId: selectedParticipant.id,
                      displayName: selectedParticipant.displayName,
                      avatarId: selectedParticipant.avatarId ?? null,
                    },
                  ],
            }
          : favorite,
      ),
    });

    try {
      if (isFavorite) {
        await removeTimetableFavorite(performanceId, {
          participantAccessCode: selectedParticipant.accessCode,
        });
      } else {
        await addTimetableFavorite(performanceId, {
          participantAccessCode: selectedParticipant.accessCode,
        });
      }
    } catch {
      setTimetable((currentTimetable) =>
        currentTimetable
          ? {
              ...currentTimetable,
              favoritePerformanceIds: previousFavoritePerformanceIds,
              performanceFavorites: previousPerformanceFavorites,
            }
          : currentTimetable,
      );
      setTimetableError(t("timetable.favorite.errors.save"));
    } finally {
      setTogglingFavoritePerformanceId(null);
    }
  }

  async function toggleArtistFavorite(
    performanceIds: string[],
    isFavorite: boolean,
  ) {
    if (!selectedParticipant || !timetable || performanceIds.length === 0) {
      return;
    }

    const currentFavoriteIds = new Set(timetable.favoritePerformanceIds);
    const targetPerformanceIds = performanceIds.filter((performanceId) =>
      isFavorite
        ? currentFavoriteIds.has(performanceId)
        : !currentFavoriteIds.has(performanceId),
    );

    if (targetPerformanceIds.length === 0) {
      return;
    }

    const completedIds: string[] = [];
    setTogglingFavoritePerformanceId(targetPerformanceIds[0]);
    setArtistFavoriteError("");

    try {
      for (const performanceId of targetPerformanceIds) {
        if (isFavorite) {
          await removeTimetableFavorite(performanceId, {
            participantAccessCode: selectedParticipant.accessCode,
          });
        } else {
          await addTimetableFavorite(performanceId, {
            participantAccessCode: selectedParticipant.accessCode,
          });
        }
        completedIds.push(performanceId);
      }

      const changedIds = new Set(targetPerformanceIds);
      setTimetable((currentTimetable) =>
        currentTimetable
          ? {
              ...currentTimetable,
              favoritePerformanceIds: isFavorite
                ? currentTimetable.favoritePerformanceIds.filter(
                    (id) => !changedIds.has(id),
                  )
                : Array.from(
                    new Set([
                      ...currentTimetable.favoritePerformanceIds,
                      ...targetPerformanceIds,
                    ]),
                  ),
              performanceFavorites: updatePerformanceFavorites(
                currentTimetable.performanceFavorites,
                targetPerformanceIds,
                isFavorite,
                selectedParticipant,
              ),
            }
          : currentTimetable,
      );
    } catch {
      await Promise.allSettled(
        completedIds.map((performanceId) =>
          isFavorite
            ? addTimetableFavorite(performanceId, {
                participantAccessCode: selectedParticipant.accessCode,
              })
            : removeTimetableFavorite(performanceId, {
                participantAccessCode: selectedParticipant.accessCode,
              }),
        ),
      );
      setArtistFavoriteError(t("artistDetail.favorite.error"));
    } finally {
      setTogglingFavoritePerformanceId(null);
    }
  }

  function openCampLocationLink() {
    if (!campLocationLink) {
      return;
    }

    setCampLocationOpenError("");

    window.open(campLocationLink, "_blank", "noopener,noreferrer");
  }

  async function submitVote(categoryId: string) {
    if (!selectedParticipant) {
      return;
    }

    const votedForId = selectedVotesByCategory[categoryId];
    const hasAlreadyVoted = votes.some(
      (vote) =>
        vote.voterId === selectedParticipant.id &&
        vote.categoryId === categoryId,
    );

    if (
      !votedForId ||
      votedForId === selectedParticipant.id ||
      hasAlreadyVoted
    ) {
      return;
    }

    const vote = {
      voterId: selectedParticipant.id,
      votedForId,
      categoryId,
      timestamp: new Date().toISOString(),
    };

    setSubmittingCategoryId(categoryId);
    setVotesError("");

    try {
      const savedVote = await saveVote(vote, {
        participantAccessCode: selectedParticipant.accessCode,
      });

      setVotes((currentVotes) => [...currentVotes, savedVote]);
      setAllVotes((currentVotes) => [...currentVotes, savedVote]);
      setSelectedVotesByCategory((currentVotes) => {
        const remainingVotes = { ...currentVotes };
        delete remainingVotes[categoryId];

        return remainingVotes;
      });
    } catch {
      setVotesError(t("categories.errors.voteSave"));
    } finally {
      setSubmittingCategoryId(null);
    }
  }

  if (locationHash === "#impressum") {
    return <LegalNotice festivalName={displayedFestivalName} />;
  }

  if (locationHash === "#datenschutz") {
    return <PrivacyNotice festivalName={displayedFestivalName} />;
  }

  if (!festivalAccess.isUnlocked) {
    return (
      <FestivalAccess
        festivalName={festivalName}
        onUnlock={festivalAccess.unlock}
      />
    );
  }

  return (
    <main
      className="home"
      aria-label={t("app.ariaLabel", {
        count: participantCount,
        festivalName: displayedFestivalName,
      })}
    >
      <header className="app-header" aria-label={displayedFestivalName}>
        <EventBrand
          festivalName={displayedFestivalName}
          logoUrl={eventLogoUrl}
          onClick={() => navigateMainSection("dashboard")}
        />

        <div className="app-header__actions">
          <PwaInstallPrompt />
          <LanguageSwitcher />
          {renderWhen(Boolean(selectedParticipant?.isAdmin), () => (
            <button
              className="hero__admin"
              type="button"
              onClick={toggleAdminView}
              aria-expanded={isAdminVisible}
              aria-controls="admin"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94L14.39 2.8a.49.49 0 0 0-.49-.4h-3.8a.49.49 0 0 0-.49.4l-.36 2.52a7.2 7.2 0 0 0-1.62.94L5.24 5.3a.5.5 0 0 0-.61.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.43 7.43 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.22l2.39-.96c.5.39 1.04.7 1.62.94l.36 2.52c.04.24.24.4.49.4h3.8c.25 0 .45-.16.49-.4l.36-2.52a7.2 7.2 0 0 0 1.62-.94l2.39.96a.5.5 0 0 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
              </svg>
              <span>
                {isAdminVisible ? t("hero.adminClose") : t("hero.admin")}
              </span>
            </button>
          ))}
        </div>
      </header>

      {renderWhen(isAdminAreaVisible(selectedParticipant, isAdminVisible), () => (
        <section
          className="admin"
          id="admin"
          aria-label={t("admin.navigation.label")}
        >
          <nav
            className="admin-navigation"
            aria-label={t("admin.navigation.label")}
          >
            {adminNavigationItems.map((item) => (
              <button
                className="admin-navigation__button"
                type="button"
                key={item.section}
                aria-current={
                  activeAdminSection === item.section ? "page" : undefined
                }
                onClick={() => setActiveAdminSection(item.section)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {activeAdminSection === "festival" ? (
            <AdminFestival
              key={`festival-${festivalName}-${eventStartDate}-${eventEndDate}-${festivalCode}`}
              mode="settings"
              festivalName={festivalName}
              eventStartDate={eventStartDate}
              eventEndDate={eventEndDate}
              error={festivalNameError}
              isSaving={isSavingFestivalName}
              festivalCode={festivalCode}
              festivalCodeError={festivalCodeError}
              isLoadingFestivalCode={isLoadingFestivalCode}
              isSavingFestivalCode={isSavingFestivalCode}
              isExporting={isExportingFestival}
              logoUrl={eventLogoUrl}
              isUploadingLogo={isUploadingEventLogo}
              isRemovingLogo={isRemovingEventLogo}
              onSave={saveFestivalSettings}
              onSaveFestivalCode={saveFestivalCode}
              onArchive={archiveCurrentFestival}
              onExport={exportCurrentFestival}
              onUploadLogo={uploadFestivalLogo}
              onRemoveLogo={removeFestivalLogo}
            />
          ) : null}

          {activeAdminSection === "participants" ? (
            <AdminParticipants
              participants={adminParticipants}
              error={adminParticipantsError}
              isLoading={isLoadingAdminParticipants}
              form={participantForm}
              formError={participantFormError}
              isSaving={isSavingParticipant}
              togglingParticipantId={togglingParticipantId}
              onCreate={startCreateParticipant}
              onEdit={startEditParticipant}
              onCancelForm={cancelParticipantForm}
              onSubmitForm={submitParticipantForm}
              onChangeForm={setParticipantForm}
              onClearFormError={() => setParticipantFormError("")}
              onDeactivate={deactivateAdminParticipant}
              onReactivate={reactivateAdminParticipant}
            />
          ) : null}

          {activeAdminSection === "awards" ? (
            <>
              {adminError ? (
                <p className="admin__notice">{adminError}</p>
              ) : null}
              {categoriesError ? (
                <p className="admin__notice">{categoriesError}</p>
              ) : null}

              <AdminCategories
                categories={adminCategories}
                error={adminCategoriesError}
                isLoading={isLoadingAdminCategories}
                updatingCategoryId={updatingCategoryId}
                deletingCategoryId={deletingCategoryId}
                onCreate={createAdminCategory}
                onUpdate={updateAdminCategory}
                onChangeStatus={changeCategoryStatus}
                onDelete={deleteAdminCategory}
              />
            </>
          ) : null}

          {activeAdminSection === "timetable" ? (
            <>
              <AdminTimetableDays
                festivalDays={adminFestivalDays}
                error={adminFestivalDaysError}
                isLoading={isLoadingAdminFestivalDays}
                savingFestivalDayId={savingFestivalDayId}
                deletingFestivalDayId={deletingFestivalDayId}
                onCreate={createAdminFestivalDay}
                onUpdate={updateAdminFestivalDay}
                onDelete={deleteAdminFestivalDay}
                onMove={moveAdminFestivalDay}
              />
              <AdminTimetableStages
                stages={adminTimetableStages}
                error={adminTimetableStagesError}
                isLoading={isLoadingAdminTimetableStages}
                savingStageId={savingStageId}
                deletingStageId={deletingStageId}
                onCreate={createAdminTimetableStage}
                onUpdate={updateAdminTimetableStage}
                onDelete={deleteAdminTimetableStage}
                onMove={moveAdminTimetableStage}
              />
              <AdminTimetableActs
                acts={adminTimetableActs}
                error={adminTimetableActsError || artistTagsError}
                isLoading={isLoadingAdminTimetableActs}
                deletingActId={deletingActId}
                tags={artistTags}
                actTags={actArtistTags}
                onCreate={createAdminTimetableAct}
                onUpdate={updateAdminTimetableAct}
                onDelete={deleteAdminTimetableAct}
                onAddTag={addAdminArtistTag}
                onAssignTag={assignAdminArtistTag}
                onRemoveTag={removeAdminArtistTag}
              />
              <AdminTimetablePerformances
                performances={adminTimetablePerformances}
                festivalDays={adminFestivalDays}
                stages={adminTimetableStages}
                acts={adminTimetableActs}
                error={adminTimetablePerformancesError}
                isLoading={isLoadingAdminTimetablePerformances}
                deletingPerformanceId={deletingPerformanceId}
                onCreate={createAdminTimetablePerformance}
                onUpdate={updateAdminTimetablePerformance}
                onDelete={deleteAdminTimetablePerformance}
              />
            </>
          ) : null}

          {activeAdminSection === "games" ? (
            <>
              <AdminBingo
                round={adminBingoRound}
                error={adminBingoError}
                isLoading={isLoadingAdminBingo}
                isSaving={isSavingBingoRound}
                onStart={startAdminBingoRound}
                onClose={closeAdminBingoRound}
              />
              <AdminHorseRacing
                state={adminHorseRacingState}
                bets={adminHorseRacingBets}
                error={adminHorseRacingError}
                isLoading={isLoadingAdminHorseRacing}
                isSaving={isSavingHorseRacingState}
                onUpdate={updateHorseRacingAdminState}
              />
              <AdminRandomPairings
                actions={adminRandomPairingActions}
                participants={adminParticipants}
                error={adminRandomPairingsError}
                isLoading={isLoadingAdminRandomPairings}
                savingActionId={savingRandomPairingActionId}
                isCreating={isCreatingRandomPairingAction}
                onCreate={createAdminRandomPairingAction}
                onUpdateParticipants={updateAdminRandomPairingParticipants}
                onDraw={drawAdminRandomPairingAction}
                onReset={resetAdminRandomPairingAction}
              />
              <AdminTournaments
                tournaments={adminTournaments}
                participants={adminParticipants}
                error={adminTournamentsError}
                isLoading={isLoadingAdminTournaments}
                savingTournamentId={savingTournamentId}
                deletingTournamentId={deletingTournamentId}
                savingMatchId={savingTournamentMatchId}
                onCreate={createAdminTournament}
                onUpdate={updateAdminTournament}
                onDelete={deleteAdminTournament}
                onSetWinner={saveAdminTournamentMatchWinner}
              />
            </>
          ) : null}

          {activeAdminSection === "info" ? (
            <AdminFestivalDocuments
              key={`documents-${adminCampLocationLink ?? "empty"}`}
              documents={adminFestivalDocuments}
              campLocationLink={adminCampLocationLink}
              campLocationError={adminCampLocationError}
              musicPlaylist={adminMusicPlaylist}
              musicPlaylistError={adminMusicPlaylistError}
              error={adminFestivalDocumentsError}
              isLoading={isLoadingAdminFestivalDocuments}
              isSavingCampLocation={isSavingCampLocation}
              isSavingMusicPlaylist={isSavingMusicPlaylist}
              uploadingDocumentType={uploadingDocumentType}
              removingDocumentType={removingDocumentType}
              onSaveCampLocation={saveAdminCampLocationLink}
              onRemoveCampLocation={removeAdminCampLocationLink}
              onClearCampLocationError={() => setAdminCampLocationError("")}
              onSaveMusicPlaylist={saveAdminMusicPlaylist}
              onRemoveMusicPlaylist={removeAdminMusicPlaylist}
              onClearMusicPlaylistError={() => setAdminMusicPlaylistError("")}
              onUpload={uploadAdminFestivalDocument}
              onRemove={removeAdminFestivalDocument}
            />
          ) : null}

          {activeAdminSection === "archive" ? (
            <AdminFestival
              key={`archive-${festivalName}-${festivalCode}`}
              mode="archive"
              festivalName={festivalName}
              eventStartDate={eventStartDate}
              eventEndDate={eventEndDate}
              error={festivalNameError}
              isSaving={isSavingFestivalName}
              festivalCode={festivalCode}
              festivalCodeError={festivalCodeError}
              isLoadingFestivalCode={isLoadingFestivalCode}
              isSavingFestivalCode={isSavingFestivalCode}
              isExporting={isExportingFestival}
              logoUrl={eventLogoUrl}
              isUploadingLogo={isUploadingEventLogo}
              isRemovingLogo={isRemovingEventLogo}
              onSave={saveFestivalSettings}
              onSaveFestivalCode={saveFestivalCode}
              onArchive={archiveCurrentFestival}
              onExport={exportCurrentFestival}
              onUploadLogo={uploadFestivalLogo}
              onRemoveLogo={removeFestivalLogo}
            />
          ) : null}
        </section>
      ))}

      {renderWhen(activeMainSection === "dashboard", () => (
        <DashboardSection
          festivalName={displayedFestivalName}
          eventLogoUrl={eventLogoUrl}
          participantName={selectedParticipant?.displayName ?? null}
          tiles={dashboardTiles}
          isAuthenticated={Boolean(selectedParticipant)}
          participantAccessCode={selectedParticipant?.accessCode ?? null}
          eventStartDate={eventStartDate}
          eventEndDate={eventEndDate}
          eventPhase={eventPhase}
          referenceInstant={eventReferenceInstant}
          timetable={timetable}
          activeCategory={openCategories[0] ?? null}
          onNavigate={navigateMainSection}
        />
      ))}

      {renderWhen(activeMainSection === "profile", () => (
        <ProfileSection
          selectedParticipant={selectedParticipant}
          profileAvatarId={profileAvatarId}
          profileDisplayName={profileDisplayName}
          isSavingProfile={isSavingProfile}
          isAvatarPickerExpanded={isAvatarPickerExpanded}
          profileError={profileError}
          profileSuccess={profileSuccess}
          hasProfileChanges={hasProfileChanges}
          availableTags={assignedArtistTags(actArtistTags, i18n.language)}
          selectedPreferenceTagIds={selectedPreferenceTagIds}
          arePreferencesLoading={arePreferencesLoading}
          arePreferencesSaving={arePreferencesSaving}
          preferencesLoadError={preferencesLoadError}
          preferencesSaveError={preferencesSaveError}
          preferencesSuccess={preferencesSuccess}
          participantsError={participantsError}
          accessCode={accessCode}
          accessCodeError={accessCodeError}
          isSubmittingAccessCode={isSubmittingAccessCode}
          isLoginLocked={isLoginLocked}
          loginLockRemainingSeconds={loginLockRemainingSeconds}
          onBack={() => navigateMainSection("dashboard")}
          onLogout={logout}
          onSaveProfile={saveOwnProfile}
          onProfileNameChange={(name) => {
            setProfileDisplayName(name);
            setProfileError("");
            setProfileSuccess("");
          }}
          onToggleAvatarPicker={() =>
            setIsAvatarPickerExpanded((isExpanded) => !isExpanded)
          }
          onSelectAvatar={(avatarId) => {
            setProfileAvatarId(avatarId);
            setProfileError("");
            setProfileSuccess("");
            setIsAvatarPickerExpanded(false);
          }}
          onTogglePreference={togglePreference}
          onResetPreferences={() => {
            setSelectedPreferenceTagIds(new Set());
            setPreferencesSuccess("");
          }}
          onSavePreferences={savePreferences}
          onSubmitAccessCode={submitAccessCode}
          onAccessCodeChange={(code) => {
            setAccessCode(code);
            setAccessCodeError("");
          }}
        />
      ))}

      {renderWhen(isAuthenticatedSection(selectedParticipant, activeMainSection, "games"), () => (
        <GamesSection
          activeSection={activeGameSection}
          bingoCard={bingoCard}
          bingoError={bingoError}
          togglingBingoNumber={togglingBingoNumber}
          horseRacingState={horseRacingState}
          horseRacingError={horseRacingError}
          savingHorseRacingSuit={savingHorseRacingSuit}
          randomPairingAssignments={randomPairingAssignments}
          randomPairingsError={randomPairingsError}
          tournaments={tournaments}
          tournamentsError={tournamentsError}
          isLoading={isLoadingData}
          onBack={() => navigateMainSection("dashboard")}
          onSelectSection={setActiveGameSection}
          onToggleBingoNumber={toggleBingoNumber}
          onSelectHorseRacingSuit={selectHorseRacingSuit}
        />
      ))}

      {renderWhen(isAuthenticatedSection(selectedParticipant, activeMainSection, "timetable"), () => (
        <TimetableSection
          timetable={timetable}
          error={timetableError}
          isLoading={isLoadingTimetable}
          currentParticipantId={selectedParticipant?.id ?? null}
          togglingPerformanceId={togglingFavoritePerformanceId}
          onBackToDashboard={() => navigateMainSection("dashboard")}
          onToggleFavorite={toggleTimetableFavorite}
        />
      ))}

      {renderWhen(isAuthenticatedSection(selectedParticipant, activeMainSection, "artists"), () => (
        renderEither(Boolean(selectedArtistId), () => (
          <ArtistDetail
            timetable={timetable}
            actId={selectedArtistId!}
            artistTags={actArtistTags}
            loadError={timetableError ? t("artistDetail.errors.load") : ""}
            favoriteError={artistFavoriteError}
            isLoading={isLoadingTimetable}
            isSavingFavorite={togglingFavoritePerformanceId !== null}
            backButton={
              <DashboardBackButton
                onClick={() => {
                  window.location.hash = "#artists";
                }}
              />
            }
            onToggleFavorite={toggleArtistFavorite}
          />
        ), () => (
          <Artists
            acts={timetable?.acts ?? null}
            artistTags={actArtistTags}
            timetable={timetable}
            preferredTagIds={new Set(preferredArtistTags.map((tag) => tag.id))}
            preferencesError={preferencesLoadError}
            arePreferencesLoading={arePreferencesLoading}
            isSavingFavorite={togglingFavoritePerformanceId !== null}
            error={timetableError ? t("artists.errors.load") : ""}
            isLoading={isLoadingTimetable}
            selectedActId={null}
            dashboardBackButton={
              <DashboardBackButton
                onClick={() => navigateMainSection("dashboard")}
              />
            }
            onSelectAct={(actId) => {
              setArtistFavoriteError("");
              window.location.hash = `#artists/${encodeURIComponent(actId)}`;
            }}
            onToggleFavorite={toggleArtistFavorite}
            onOpenProfile={() => navigateMainSection("profile")}
          />
        ))
      ))}

      {renderWhen(isAuthenticatedSection(selectedParticipant, activeMainSection, "info"), () => (
        <FestivalInfo
          documents={festivalDocuments}
          campLocationLink={campLocationLink}
          campLocationError={campLocationOpenError}
          musicPlaylist={musicPlaylist}
          error={festivalDocumentsError}
          isLoading={isLoadingFestivalDocuments}
          dashboardBackButton={
            <DashboardBackButton
              onClick={() => navigateMainSection("dashboard")}
            />
          }
          onOpenCampLocation={openCampLocationLink}
        />
      ))}

      {renderWhen(isAuthenticatedSection(selectedParticipant, activeMainSection, "voting"), () => (
        <VotingSection
          participant={selectedParticipant!}
          participants={participants}
          categories={openCategories}
          votes={votes}
          selectedVotes={selectedVotesByCategory}
          statusLabels={statusLabels}
          participantCount={participantCount}
          votesError={votesError}
          categoriesError={categoriesError}
          isLoading={isLoadingData}
          submittingCategoryId={submittingCategoryId}
          onBack={() => navigateMainSection("dashboard")}
          onSelectVote={selectVote}
          onSubmitVote={submitVote}
        />
      ))}

      {renderWhen(isAuthenticatedSection(selectedParticipant, activeMainSection, "awards"), () => (
        <AwardsSection
          resultsError={resultsError}
          hasVotes={hasVotes}
          results={resultsByCategory}
          isStandingsLoading={isStandingsLoading}
          standingsError={standingsError}
          standings={allTimeStandings}
          onBack={() => navigateMainSection("dashboard")}
        />
      ))}
      <AppFooter />
    </main>
  );
}

export default App;
