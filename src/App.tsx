import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
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
} from './data/categories'
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
  type Participant,
} from './data/participants'
import {
  loadVotes,
  loadVotesForParticipant,
  saveVote,
  type Vote,
} from './data/votes'
import {
  loadAllTimeStandings,
  type AllTimeStanding,
} from './data/allTimeStandings'
import {
  archiveFestival,
  loadFestivalAccessCode,
  loadFestivalName,
  updateFestivalAccessCode,
  updateFestivalName,
} from './data/festival'
import {
  festivalExportFileName,
  loadFestivalExportData,
  serializeFestivalExport,
} from './data/export'
import {
  deleteFestivalDocument,
  deleteCampLocationLink,
  isSupportedFestivalDocumentFile,
  isSupportedCampLocationLink,
  loadAdminCampLocationLink,
  loadAdminFestivalDocuments,
  loadCampLocationLink,
  loadFestivalDocuments,
  updateCampLocationLink,
  uploadFestivalDocument,
  type CampLocationLink,
  type FestivalDocument,
  type FestivalDocumentType,
} from './data/festivalDocuments'
import {
  deleteMusicPlaylist,
  loadAdminMusicPlaylist,
  loadMusicPlaylist,
  updateMusicPlaylist,
} from './data/festivalMusic'
import {
  closeBingoRound,
  loadAdminBingoRound,
  loadOrCreateBingoCard,
  setBingoMark,
  startBingoRound,
  type BingoCard,
  type BingoRound,
} from './data/bingo'
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
  type TimetablePerformance,
  type TimetableStage,
  type UpdateFestivalDayInput,
  type UpdateTimetableActInput,
  type UpdateTimetablePerformanceInput,
  type UpdateTimetableStageInput,
} from './data/timetable'
import {
  isSupportedMusicPlaylistLink,
  type MusicPlaylist,
} from './data/musicEmbeds'
import { activeFestival, festivalStorageKey } from './config/festivals'
import {
  AdminParticipants,
  type ParticipantFormState,
} from './components/AdminParticipants'
import { AdminFestival } from './components/AdminFestival'
import { AdminCategories } from './components/AdminCategories'
import { AdminFestivalDocuments } from './components/AdminFestivalDocuments'
import { AdminBingo } from './components/AdminBingo'
import { AdminTimetableActs } from './components/AdminTimetableActs'
import { AdminTimetableDays } from './components/AdminTimetableDays'
import { AdminTimetablePerformances } from './components/AdminTimetablePerformances'
import { AdminTimetableStages } from './components/AdminTimetableStages'
import { Bingo } from './components/Bingo'
import { FestivalInfo } from './components/FestivalInfo'
import { Avatar, ParticipantName } from './components/Avatar'
import { SectionHeader } from './components/SectionHeader'
import { useFestivalAccess } from './hooks/useFestivalAccess'
import { avatars } from './config/avatars'
import i18n from './i18n'
import { supportedLanguages, type SupportedLanguage } from './i18n'
import './App.css'

type CategoryResult = {
  participant: Participant
  voteCount: number
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

type DetectedBarcode = {
  rawValue?: string
}

type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>
}

type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorInstance
  getSupportedFormats?: () => Promise<string[]>
}

type WindowWithBarcodeDetector = Window &
  typeof globalThis & {
    BarcodeDetector?: BarcodeDetectorConstructor
  }

const fallbackFestivalName = ''

const authenticatedParticipantSessionStorageKey = festivalStorageKey(
  activeFestival.id,
  'participant',
)
const legacyAuthenticatedParticipantStorageKey =
  authenticatedParticipantSessionStorageKey

function readStoredParticipant(): Participant | null {
  localStorage.removeItem(legacyAuthenticatedParticipantStorageKey)

  const storedParticipant = sessionStorage.getItem(
    authenticatedParticipantSessionStorageKey,
  )

  if (!storedParticipant) {
    return null
  }

  try {
    const parsedParticipant = JSON.parse(storedParticipant) as Partial<Participant>

    if (
      typeof parsedParticipant.id === 'string' &&
      typeof parsedParticipant.name === 'string' &&
      typeof parsedParticipant.displayName === 'string' &&
      typeof parsedParticipant.accessCode === 'string'
    ) {
      return {
        id: parsedParticipant.id,
        name: parsedParticipant.name,
        displayName: parsedParticipant.displayName,
        ...(typeof parsedParticipant.avatarId === 'string'
          ? { avatarId: parsedParticipant.avatarId }
          : {}),
        accessCode: parsedParticipant.accessCode,
        isAdmin: parsedParticipant.isAdmin === true,
        isActive: parsedParticipant.isActive !== false,
      }
    }
  } catch {
    sessionStorage.removeItem(authenticatedParticipantSessionStorageKey)
  }

  return null
}

function storeAuthenticatedParticipant(participant: Participant) {
  localStorage.removeItem(legacyAuthenticatedParticipantStorageKey)
  sessionStorage.setItem(
    authenticatedParticipantSessionStorageKey,
    JSON.stringify(participant),
  )
}

function clearStoredParticipant() {
  localStorage.removeItem(legacyAuthenticatedParticipantStorageKey)
  sessionStorage.removeItem(authenticatedParticipantSessionStorageKey)
}

function technicalErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

type MainSection =
  | 'dashboard'
  | 'awards'
  | 'timetable'
  | 'games'
  | 'info'
  | 'profile'
type AdminSection =
  | 'festival'
  | 'participants'
  | 'awards'
  | 'timetable'
  | 'games'
  | 'info'
  | 'archive'

type ResultCardProps = {
  category: Category
  results: CategoryResult[]
  highestVoteCount: number
}

function ResultCard({ category, results, highestVoteCount }: ResultCardProps) {
  const { t } = useTranslation()
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t('status.upcoming'),
    open: t('status.open'),
    closed: t('status.closed'),
  }
  const isClosed = category.status === 'closed'
  const [isClosedResultExpanded, setIsClosedResultExpanded] = useState(false)
  const isCollapsed = isClosed && !isClosedResultExpanded
  const resultListId = `result-list-${category.id}`
  const leaders = results.filter(
    ({ voteCount }) => highestVoteCount > 0 && voteCount === highestVoteCount,
  )

  return (
    <article
      className={`result-card${isCollapsed ? ' result-card--collapsed' : ''}`}
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
            onClick={() => setIsClosedResultExpanded((isExpanded) => !isExpanded)}
            aria-expanded={!isCollapsed}
            aria-controls={resultListId}
            aria-label={`${category.title} ${
              isCollapsed ? t('results.expand') : t('results.collapse')
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
          <span>{t('results.leading')}</span>
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
            <p>{t('results.emptyCategory')}</p>
          )}
        </div>
      ) : null}

      <div className="result-card__list" id={resultListId} hidden={isCollapsed}>
        {results.map(({ participant, voteCount }) => {
          const width =
            highestVoteCount > 0
              ? `${(voteCount / highestVoteCount) * 100}%`
              : '0%'
          const isLeader =
            highestVoteCount > 0 && voteCount === highestVoteCount

          return (
            <div
              className={`result-card__row${
                isLeader ? ' result-card__row--leader' : ''
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
          )
        })}
      </div>
    </article>
  )
}

function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const activeLanguage = i18n.resolvedLanguage?.split('-')[0] ?? 'de'

  function changeLanguage(language: SupportedLanguage) {
    void i18n.changeLanguage(language)
  }

  return (
    <div className="language-switcher" aria-label={t('language.label')}>
      {supportedLanguages.map((language) => (
        <button
          className={
            activeLanguage === language ? 'language-switcher__button is-active' : 'language-switcher__button'
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
  )
}

function isStandaloneDisplay() {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean
  }

  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    navigatorWithStandalone.standalone === true
  )
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(userAgent)
  const isSafari = /safari/i.test(userAgent) && !/crios|fxios|edgios/i.test(userAgent)

  return isIos && isSafari
}

function PwaInstallPrompt() {
  const { t } = useTranslation()
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay())
  const [showIosHelp, setShowIosHelp] = useState(false)
  const isIos = isIosSafari()
  const canShowPrompt = Boolean(installPrompt)
  const shouldShow = !isInstalled && (canShowPrompt || isIos)

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setIsInstalled(true)
      setInstallPrompt(null)
      setShowIosHelp(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function installApp() {
    if (isIos) {
      setShowIosHelp((isVisible) => !isVisible)
      return
    }

    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
  }

  if (!shouldShow) {
    return null
  }

  return (
    <div className="install-prompt">
      <button
        className="install-prompt__button"
        type="button"
        onClick={installApp}
        aria-describedby={showIosHelp ? 'install-prompt-help' : undefined}
      >
        {t('installPrompt.button')}
      </button>
      {showIosHelp ? (
        <p className="install-prompt__help" id="install-prompt-help">
          {t('installPrompt.iosHelp')}
        </p>
      ) : null}
    </div>
  )
}

function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer className="app-footer">
      <a href="#impressum">{t('legal.link')}</a>
      <a href="#datenschutz">{t('privacy.link')}</a>
    </footer>
  )
}

type LegalNoticeProps = {
  festivalName: string
}

function LegalNotice({ festivalName }: LegalNoticeProps) {
  const { t } = useTranslation()

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.hash = ''
  }

  return (
    <main
      className="home legal-page"
      aria-label={t('legal.ariaLabel', {
        festivalName: festivalName || t('common.loading'),
      })}
    >
      <section className="legal-page__content" aria-labelledby="legal-title">
        <p className="legal-page__eyebrow">{t('legal.eyebrow')}</p>
        <h1 id="legal-title">{t('legal.title')}</h1>
        <dl className="legal-page__details">
          <div>
            <dt>{t('legal.fields.name')}</dt>
            <dd>{t('legal.placeholders.name')}</dd>
          </div>
          <div>
            <dt>{t('legal.fields.address')}</dt>
            <dd>{t('legal.placeholders.address')}</dd>
          </div>
          <div>
            <dt>{t('legal.fields.email')}</dt>
            <dd>{t('legal.placeholders.email')}</dd>
          </div>
        </dl>
        <a className="legal-page__back" href="#" onClick={goBack}>
          {t('legal.back')}
        </a>
      </section>
    </main>
  )
}

function PrivacyNotice({ festivalName }: LegalNoticeProps) {
  const { t } = useTranslation()
  const sections = [
    'controller',
    'processedData',
    'purpose',
    'legalBasis',
    'retention',
    'supabase',
    'rights',
    'contact',
  ]

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.hash = ''
  }

  return (
    <main
      className="home legal-page"
      aria-label={t('privacy.ariaLabel', {
        festivalName: festivalName || t('common.loading'),
      })}
    >
      <section className="legal-page__content" aria-labelledby="privacy-title">
        <p className="legal-page__eyebrow">{t('privacy.eyebrow')}</p>
        <h1 id="privacy-title">{t('privacy.title')}</h1>
        <div className="legal-page__sections">
          {sections.map((sectionKey) => (
            <article className="legal-page__section" key={sectionKey}>
              <h2>{t(`privacy.sections.${sectionKey}.title`)}</h2>
              <p>{t(`privacy.sections.${sectionKey}.body`)}</p>
            </article>
          ))}
        </div>
        <a className="legal-page__back" href="#" onClick={goBack}>
          {t('privacy.back')}
        </a>
      </section>
    </main>
  )
}

type TimetableSectionProps = {
  timetable: Timetable | null
  error: string
  isLoading: boolean
  currentParticipantId: string | null
  togglingPerformanceId: string | null
  onToggleFavorite: (performanceId: string, isFavorite: boolean) => void
}

type TimetableDaySchedule = {
  day: Timetable['festivalDays'][number]
  performances: Timetable['performances']
  timeSlots: string[]
  timeRows: string[]
}

type DashboardTile = {
  id: string
  section: MainSection
  title: string
  description: string
  status: string
  detail: string
  avatar?: {
    avatarId?: string | null
    name: string
  }
}

type DashboardSectionProps = {
  festivalName: string
  participantName: string | null
  tiles: DashboardTile[]
  isAuthenticated: boolean
  onNavigate: (section: MainSection) => void
}

function timeLabel(value: string) {
  return value.slice(11, 16)
}

function stageColorStyle(color: string | null): CSSProperties | undefined {
  return color
    ? ({
        '--stage-color': color,
      } as CSSProperties)
    : undefined
}

function DashboardSection({
  festivalName,
  participantName,
  tiles,
  isAuthenticated,
  onNavigate,
}: DashboardSectionProps) {
  const { t } = useTranslation()
  const greetingName = participantName ?? t('dashboard.guestName')

  return (
    <section
      className="dashboard"
      id="main-dashboard"
      aria-labelledby="dashboard-title"
    >
      <div className="dashboard__intro">
        <p className="dashboard__eyebrow">{t('dashboard.eyebrow')}</p>
        <h2 id="dashboard-title">
          {t('dashboard.greeting', { name: greetingName })}
        </h2>
        <p className="dashboard__festival">{festivalName}</p>
        <p className="dashboard__description">
          {isAuthenticated
            ? t('dashboard.description')
            : t('dashboard.guestDescription')}
        </p>
      </div>

      <div className="dashboard__grid" aria-label={t('dashboard.quickAccess')}>
        {tiles.map((tile) => (
          <button
            className="dashboard-tile"
            type="button"
            key={tile.id}
            onClick={() => onNavigate(isAuthenticated ? tile.section : 'profile')}
          >
            <span className="dashboard-tile__title">{tile.title}</span>
            <span className="dashboard-tile__description">
              {tile.description}
            </span>
            {tile.avatar ? (
              <span className="dashboard-tile__profile">
                <Avatar avatarId={tile.avatar.avatarId} name={tile.avatar.name} />
                <span>{tile.avatar.name}</span>
              </span>
            ) : null}
            <span className="dashboard-tile__status">{tile.status}</span>
            <span className="dashboard-tile__detail">{tile.detail}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function TimetableSection({
  timetable,
  error,
  isLoading,
  currentParticipantId,
  togglingPerformanceId,
  onToggleFavorite,
}: TimetableSectionProps) {
  const { t } = useTranslation()
  const hasTimetableStructure = Boolean(
    timetable &&
      timetable.festivalDays.length > 0 &&
      timetable.stages.length > 0 &&
      timetable.performances.length > 0,
  )
  const actById = useMemo(
    () => new Map(timetable?.acts.map((act) => [act.id, act]) ?? []),
    [timetable?.acts],
  )
  const stageIndexById = useMemo(
    () => new Map(timetable?.stages.map((stage, index) => [stage.id, index]) ?? []),
    [timetable?.stages],
  )
  const favoritePerformanceIds = useMemo(
    () => new Set(timetable?.favoritePerformanceIds ?? []),
    [timetable?.favoritePerformanceIds],
  )
  const favoriteParticipantsByPerformanceId = useMemo(
    () =>
      new Map(
        timetable?.performanceFavorites.map((favorite) => [
          favorite.performanceId,
          favorite.participants,
        ]) ?? [],
      ),
    [timetable?.performanceFavorites],
  )
  const daySchedules = useMemo<TimetableDaySchedule[]>(() => {
    if (!timetable) {
      return []
    }

    const performancesByDay = new Map<string, Timetable['performances']>()

    for (const performance of timetable.performances) {
      const performances = performancesByDay.get(performance.festivalDayId) ?? []

      performances.push(performance)
      performancesByDay.set(performance.festivalDayId, performances)
    }

    return timetable.festivalDays
      .map((day) => {
        const performances = (performancesByDay.get(day.id) ?? [])
          .slice()
          .sort((firstPerformance, secondPerformance) =>
            firstPerformance.startsAt.localeCompare(secondPerformance.startsAt),
          )
        const timeSlots = Array.from(
          new Set(
            performances
              .flatMap((performance) => [
                performance.startsAt,
                performance.endsAt,
              ])
              .filter((value): value is string => Boolean(value)),
          ),
        ).sort()

        return {
          day,
          performances,
          timeSlots,
          timeRows: timeSlots.length > 1 ? timeSlots.slice(0, -1) : timeSlots,
        }
      })
      .filter(({ performances }) => performances.length > 0)
  }, [timetable])

  return (
    <section
      className="timetable"
      id="main-timetable"
      aria-labelledby="timetable-title"
    >
      <SectionHeader
        title={t('timetable.title')}
        titleId="timetable-title"
        eyebrow={t('timetable.eyebrow')}
        width="narrow"
      />

      {isLoading ? (
        <p className="timetable__notice" role="status">
          {t('timetable.loading')}
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
        <p className="timetable__notice">{t('timetable.empty')}</p>
      ) : null}
      {!isLoading &&
      !error &&
      timetable &&
      timetable.festivalDays.length > 0 &&
      timetable.performances.length > 0 &&
      timetable.stages.length === 0 ? (
        <p className="timetable__notice">{t('timetable.emptyStages')}</p>
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
                    {t('timetable.scrollHint')}
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
                        const stageIndex = stageIndexById.get(performance.stageId)
                        const startsAtIndex = timeSlots.indexOf(performance.startsAt)
                        const endsAtIndex = performance.endsAt
                          ? timeSlots.indexOf(performance.endsAt)
                          : startsAtIndex + 1
                        const act = actById.get(performance.actId)
                        const isFavorite = favoritePerformanceIds.has(
                          performance.id,
                        )
                        const isToggling =
                          togglingPerformanceId === performance.id
                        const sharedFavoriteParticipants = (
                          favoriteParticipantsByPerformanceId.get(
                            performance.id,
                          ) ?? []
                        ).filter(
                          (participant) =>
                            participant.participantId !== currentParticipantId,
                        )
                        const visibleFavoriteParticipants =
                          sharedFavoriteParticipants.slice(0, 3)
                        const hiddenFavoriteParticipantCount =
                          sharedFavoriteParticipants.length -
                          visibleFavoriteParticipants.length
                        const sharedFavoriteNames = sharedFavoriteParticipants
                          .map((participant) => participant.displayName)
                          .join(', ')

                        if (
                          stageIndex === undefined ||
                          startsAtIndex < 0 ||
                          endsAtIndex < 0
                        ) {
                          return null
                        }

                        const stage = timetable.stages[stageIndex]

                        return (
                          <article
                            className={`timetable-performance${isFavorite ? ' timetable-performance--favorite' : ''}`}
                            key={performance.id}
                            style={{
                              gridColumn: stageIndex + 2,
                              gridRow: `${startsAtIndex + 2} / ${endsAtIndex + 2}`,
                              ...stageColorStyle(stage.color),
                            }}
                          >
                            {isFavorite ? (
                              <span className="timetable-performance__badge">
                                {t('timetable.favorite.badge')}
                              </span>
                            ) : null}
                            <p className="timetable-performance__time">
                              {timeLabel(performance.startsAt)} -{' '}
                              {performance.endsAt
                                ? timeLabel(performance.endsAt)
                                : ''}
                            </p>
                            <h4>
                              {act?.name ?? t('timetable.unknownAct')}
                            </h4>
                            {act?.description ? <p>{act.description}</p> : null}
                            {sharedFavoriteParticipants.length > 0 ? (
                              <div
                                className="timetable-performance__shared"
                                aria-label={t(
                                  'timetable.favorite.sharedAria',
                                  {
                                    names: sharedFavoriteNames,
                                  },
                                )}
                              >
                                <span className="timetable-performance__shared-label">
                                  {t('timetable.favorite.sharedLabel')}
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
                                        'timetable.favorite.sharedMoreAria',
                                        {
                                          count:
                                            hiddenFavoriteParticipantCount,
                                        },
                                      )}
                                    >
                                      {t('timetable.favorite.sharedMore', {
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
                                ? t('timetable.favorite.remove')
                                : t('timetable.favorite.add')}
                            </button>
                          </article>
                        )
                      })}
                    </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

type FestivalAccessProps = {
  festivalName: string
  onUnlock: (code: string) => Promise<boolean>
}

function FestivalAccess({ festivalName, onUnlock }: FestivalAccessProps) {
  const { t } = useTranslation()
  const [festivalCode, setFestivalCode] = useState('')
  const [festivalCodeError, setFestivalCodeError] = useState('')
  const [isSubmittingFestivalCode, setIsSubmittingFestivalCode] = useState(false)
  const [qrScannerSupport, setQrScannerSupport] = useState<
    'checking' | 'supported' | 'unsupported'
  >('checking')
  const [isScanningQrCode, setIsScanningQrCode] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const scanAnimationFrameRef = useRef<number | null>(null)
  const isScanningQrCodeRef = useRef(false)

  const stopQrScanner = useCallback(() => {
    isScanningQrCodeRef.current = false
    setIsScanningQrCode(false)

    if (scanAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scanAnimationFrameRef.current)
      scanAnimationFrameRef.current = null
    }

    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    async function checkQrScannerSupport() {
      const BarcodeDetector = (window as WindowWithBarcodeDetector)
        .BarcodeDetector
      const hasCameraSupport =
        typeof navigator.mediaDevices?.getUserMedia === 'function'

      if (!BarcodeDetector || !hasCameraSupport) {
        if (isCurrent) {
          setQrScannerSupport('unsupported')
        }

        return
      }

      try {
        const supportedFormats = BarcodeDetector.getSupportedFormats
          ? await BarcodeDetector.getSupportedFormats()
          : ['qr_code']

        if (isCurrent) {
          setQrScannerSupport(
            supportedFormats.includes('qr_code') ? 'supported' : 'unsupported',
          )
        }
      } catch {
        if (isCurrent) {
          setQrScannerSupport('unsupported')
        }
      }
    }

    void checkQrScannerSupport()

    return () => {
      isCurrent = false
      stopQrScanner()
    }
  }, [stopQrScanner])

  async function unlockFestivalCode(
    code: string,
    invalidMessage: string,
  ): Promise<boolean> {
    const normalizedFestivalCode = code.trim().toUpperCase()

    if (!normalizedFestivalCode) {
      setFestivalCodeError(invalidMessage)
      return false
    }

    setFestivalCodeError('')
    setIsSubmittingFestivalCode(true)

    try {
      if (!(await onUnlock(normalizedFestivalCode))) {
        setFestivalCodeError(invalidMessage)
        return false
      }

      setFestivalCode('')
      return true
    } catch {
      setFestivalCodeError(t('festivalAccess.errors.verify'))
      return false
    } finally {
      setIsSubmittingFestivalCode(false)
    }
  }

  async function submitFestivalCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    await unlockFestivalCode(
      festivalCode,
      t('festivalAccess.errors.invalidCode'),
    )
  }

  async function unlockScannedFestivalCode(code: string) {
    const normalizedFestivalCode = code.trim().toUpperCase()

    setFestivalCode(normalizedFestivalCode)
    stopQrScanner()

    await unlockFestivalCode(
      normalizedFestivalCode,
      t('festivalAccess.qr.errors.invalidCode'),
    )
  }

  async function startQrScanner() {
    const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector

    if (
      !BarcodeDetector ||
      typeof navigator.mediaDevices?.getUserMedia !== 'function' ||
      qrScannerSupport !== 'supported'
    ) {
      setFestivalCodeError(t('festivalAccess.qr.errors.unsupported'))
      return
    }

    setFestivalCodeError('')
    setIsScanningQrCode(true)
    isScanningQrCodeRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      const video = videoRef.current

      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        setFestivalCodeError(t('festivalAccess.qr.errors.camera'))
        setIsScanningQrCode(false)
        isScanningQrCodeRef.current = false
        return
      }

      cameraStreamRef.current = stream
      video.srcObject = stream
      await video.play()

      const detector = new BarcodeDetector({ formats: ['qr_code'] })

      async function scanFrame() {
        if (!isScanningQrCodeRef.current || !videoRef.current) {
          return
        }

        try {
          const barcodes = await detector.detect(videoRef.current)
          const scannedCode = barcodes.find((barcode) =>
            Boolean(barcode.rawValue?.trim()),
          )?.rawValue

          if (scannedCode) {
            await unlockScannedFestivalCode(scannedCode)
            return
          }

          scanAnimationFrameRef.current = window.requestAnimationFrame(() => {
            void scanFrame()
          })
        } catch {
          setFestivalCodeError(t('festivalAccess.qr.errors.scan'))
          stopQrScanner()
        }
      }

      scanAnimationFrameRef.current = window.requestAnimationFrame(() => {
        void scanFrame()
      })
    } catch {
      setFestivalCodeError(t('festivalAccess.qr.errors.camera'))
      stopQrScanner()
    }
  }

  return (
    <main
      className="home home--locked"
      aria-label={t('festivalAccess.ariaLabel', {
        festivalName: festivalName || t('common.loading'),
      })}
    >
      <header className="hero hero--locked" aria-labelledby="hero-title">
        <div className="hero__actions">
          <PwaInstallPrompt />
        </div>

        <div className="hero__content hero__content--locked">
          <h1 id="hero-title">{festivalName || t('common.loading')}</h1>
          <form
            className="identity__form identity__form--locked"
            onSubmit={submitFestivalCode}
          >
            <label htmlFor="festival-access-code">
              {t('festivalAccess.codeLabel')}
            </label>
            <input
              id="festival-access-code"
              type="text"
              value={festivalCode}
              disabled={isSubmittingFestivalCode}
              onChange={(event) => {
                setFestivalCode(event.target.value)
                setFestivalCodeError('')
              }}
              autoComplete="off"
              inputMode="text"
              placeholder={t('festivalAccess.codePlaceholder')}
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
                ? t('common.loading')
                : t('festivalAccess.submit')}
            </button>
          </form>
          <div className="qr-access" aria-label={t('festivalAccess.qr.label')}>
            <button
              className="qr-access__button"
              type="button"
              onClick={startQrScanner}
              disabled={
                isSubmittingFestivalCode ||
                isScanningQrCode ||
                qrScannerSupport !== 'supported'
              }
            >
              {isScanningQrCode
                ? t('festivalAccess.qr.scanning')
                : t('festivalAccess.qr.start')}
            </button>
            {qrScannerSupport === 'unsupported' ? (
              <p className="qr-access__status" role="status">
                {t('festivalAccess.qr.errors.unsupported')}
              </p>
            ) : null}
            <div className="qr-access__camera" hidden={!isScanningQrCode}>
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label={t('festivalAccess.qr.videoLabel')}
              />
              {isScanningQrCode ? (
                <button
                  className="qr-access__stop"
                  type="button"
                  onClick={stopQrScanner}
                >
                  {t('festivalAccess.qr.stop')}
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
  )
}

function App() {
  const { t } = useTranslation()
  const festivalAccess = useFestivalAccess(activeFestival)
  const [locationHash, setLocationHash] = useState(() => window.location.hash)
  const [festivalName, setFestivalName] = useState(fallbackFestivalName)
  const [festivalNameError, setFestivalNameError] = useState('')
  const [isSavingFestivalName, setIsSavingFestivalName] = useState(false)
  const [festivalCode, setFestivalCode] = useState('')
  const [festivalCodeError, setFestivalCodeError] = useState('')
  const [isLoadingFestivalCode, setIsLoadingFestivalCode] = useState(false)
  const [isSavingFestivalCode, setIsSavingFestivalCode] = useState(false)
  const [isExportingFestival, setIsExportingFestival] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(
    () => (festivalAccess.isUnlocked ? readStoredParticipant() : null),
  )
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [participantsError, setParticipantsError] = useState('')
  const [categoriesError, setCategoriesError] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminCategories, setAdminCategories] = useState<Category[]>([])
  const [adminCategoriesError, setAdminCategoriesError] = useState('')
  const [isLoadingAdminCategories, setIsLoadingAdminCategories] =
    useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  )
  const [adminParticipants, setAdminParticipants] = useState<Participant[]>([])
  const [adminParticipantsError, setAdminParticipantsError] = useState('')
  const [isLoadingAdminParticipants, setIsLoadingAdminParticipants] =
    useState(false)
  const [festivalDocuments, setFestivalDocuments] = useState<FestivalDocument[]>(
    [],
  )
  const [campLocationLink, setCampLocationLink] =
    useState<CampLocationLink>(null)
  const [campLocationOpenError, setCampLocationOpenError] = useState('')
  const [musicPlaylist, setMusicPlaylist] = useState<MusicPlaylist | null>(null)
  const [festivalDocumentsError, setFestivalDocumentsError] = useState('')
  const [isLoadingFestivalDocuments, setIsLoadingFestivalDocuments] =
    useState(Boolean(selectedParticipant))
  const [adminFestivalDocuments, setAdminFestivalDocuments] = useState<
    FestivalDocument[]
  >([])
  const [adminCampLocationLink, setAdminCampLocationLink] =
    useState<CampLocationLink>(null)
  const [adminCampLocationError, setAdminCampLocationError] = useState('')
  const [isSavingCampLocation, setIsSavingCampLocation] = useState(false)
  const [adminMusicPlaylist, setAdminMusicPlaylist] =
    useState<MusicPlaylist | null>(null)
  const [adminMusicPlaylistError, setAdminMusicPlaylistError] = useState('')
  const [isSavingMusicPlaylist, setIsSavingMusicPlaylist] = useState(false)
  const [bingoCard, setBingoCard] = useState<BingoCard | null>(null)
  const [bingoError, setBingoError] = useState('')
  const [timetable, setTimetable] = useState<Timetable | null>(null)
  const [timetableError, setTimetableError] = useState('')
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(
    Boolean(selectedParticipant),
  )
  const [togglingFavoritePerformanceId, setTogglingFavoritePerformanceId] =
    useState<string | null>(null)
  const [adminFestivalDays, setAdminFestivalDays] = useState<FestivalDay[]>([])
  const [adminFestivalDaysError, setAdminFestivalDaysError] = useState('')
  const [isLoadingAdminFestivalDays, setIsLoadingAdminFestivalDays] =
    useState(false)
  const [savingFestivalDayId, setSavingFestivalDayId] = useState<string | null>(
    null,
  )
  const [deletingFestivalDayId, setDeletingFestivalDayId] = useState<
    string | null
  >(null)
  const [adminTimetableStages, setAdminTimetableStages] = useState<
    TimetableStage[]
  >([])
  const [adminTimetableStagesError, setAdminTimetableStagesError] = useState('')
  const [isLoadingAdminTimetableStages, setIsLoadingAdminTimetableStages] =
    useState(false)
  const [savingStageId, setSavingStageId] = useState<string | null>(null)
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null)
  const [adminTimetableActs, setAdminTimetableActs] = useState<TimetableAct[]>([])
  const [adminTimetableActsError, setAdminTimetableActsError] = useState('')
  const [isLoadingAdminTimetableActs, setIsLoadingAdminTimetableActs] =
    useState(false)
  const [deletingActId, setDeletingActId] = useState<string | null>(null)
  const [adminTimetablePerformances, setAdminTimetablePerformances] = useState<
    TimetablePerformance[]
  >([])
  const [adminTimetablePerformancesError, setAdminTimetablePerformancesError] =
    useState('')
  const [
    isLoadingAdminTimetablePerformances,
    setIsLoadingAdminTimetablePerformances,
  ] = useState(false)
  const [deletingPerformanceId, setDeletingPerformanceId] = useState<
    string | null
  >(null)
  const [togglingBingoNumber, setTogglingBingoNumber] = useState<number | null>(
    null,
  )
  const [adminBingoRound, setAdminBingoRound] = useState<BingoRound | null>(null)
  const [adminBingoError, setAdminBingoError] = useState('')
  const [isLoadingAdminBingo, setIsLoadingAdminBingo] = useState(false)
  const [isSavingBingoRound, setIsSavingBingoRound] = useState(false)
  const [adminFestivalDocumentsError, setAdminFestivalDocumentsError] =
    useState('')
  const [isLoadingAdminFestivalDocuments, setIsLoadingAdminFestivalDocuments] =
    useState(false)
  const [uploadingDocumentType, setUploadingDocumentType] =
    useState<FestivalDocumentType | null>(null)
  const [removingDocumentType, setRemovingDocumentType] =
    useState<FestivalDocumentType | null>(null)
  const [participantForm, setParticipantForm] =
    useState<ParticipantFormState | null>(null)
  const [participantFormError, setParticipantFormError] = useState('')
  const [isSavingParticipant, setIsSavingParticipant] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null)
  const [togglingParticipantId, setTogglingParticipantId] = useState<
    string | null
  >(null)
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null)
  const [isAdminVisible, setIsAdminVisible] = useState(false)
  const [activeMainSection, setActiveMainSection] =
    useState<MainSection>('dashboard')
  const [activeAdminSection, setActiveAdminSection] =
    useState<AdminSection>('festival')
  const [isLoadingData, setIsLoadingData] = useState(Boolean(selectedParticipant))
  const [isSubmittingAccessCode, setIsSubmittingAccessCode] = useState(false)
  const [loginLockedUntil, setLoginLockedUntil] = useState<number | null>(null)
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())
  const participantCount = participants.length
  const displayedFestivalName = festivalName || t('common.loading')
  const openCategories = categories.filter((category) => category.status === 'open')
  const statusLabels: Record<CategoryStatus, string> = {
    upcoming: t('status.upcoming'),
    open: t('status.open'),
    closed: t('status.closed'),
  }
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState('')
  const [votes, setVotes] = useState<Vote[]>([])
  const [allVotes, setAllVotes] = useState<Vote[]>([])
  const [votesError, setVotesError] = useState('')
  const [resultsError, setResultsError] = useState('')
  const [allTimeStandings, setAllTimeStandings] = useState<AllTimeStanding[]>([])
  const [standingsError, setStandingsError] = useState('')
  const [isStandingsLoading, setIsStandingsLoading] = useState(
    Boolean(selectedParticipant),
  )
  const [selectedVotesByCategory, setSelectedVotesByCategory] = useState<
    Record<string, string>
  >({})
  const [submittingCategoryId, setSubmittingCategoryId] = useState<string | null>(
    null,
  )
  const loginLockRemainingMs = loginLockedUntil
    ? Math.max(0, loginLockedUntil - currentTimeMs)
    : 0
  const loginLockRemainingSeconds = Math.ceil(loginLockRemainingMs / 1000)
  const isLoginLocked = loginLockRemainingMs > 0
  const adminNavigationItems: Array<{ section: AdminSection; label: string }> = [
    { section: 'festival', label: t('admin.navigation.festival') },
    { section: 'participants', label: t('admin.navigation.participants') },
    { section: 'awards', label: t('admin.navigation.awards') },
    { section: 'timetable', label: t('admin.navigation.timetable') },
    { section: 'games', label: t('admin.navigation.bingo') },
    { section: 'info', label: t('admin.navigation.info') },
    { section: 'archive', label: t('admin.navigation.archive') },
  ]

  useEffect(() => {
    function handleHashChange() {
      setLocationHash(window.location.hash)
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    async function loadName() {
      setFestivalNameError('')

      try {
        const loadedFestivalName = await loadFestivalName()

        if (isCurrent) {
          setFestivalName(loadedFestivalName)
        }
      } catch {
        if (isCurrent) {
          setFestivalNameError(i18n.t('festival.errors.load'))
        }
      }
    }

    void loadName()

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!isLoginLocked) {
      return
    }

    const timerId = window.setInterval(() => {
      const now = Date.now()

      setCurrentTimeMs(now)

      if (loginLockedUntil && loginLockedUntil <= now) {
        setLoginLockedUntil(null)
      }
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [isLoginLocked, loginLockedUntil])

  useEffect(() => {
    if (!festivalAccess.isUnlocked || !selectedParticipant) {
      return
    }

    const authenticatedParticipant = selectedParticipant
    let isCurrent = true

    async function loadData() {
      const accessContext = {
        participantAccessCode: authenticatedParticipant.accessCode,
      }

      setIsLoadingData(true)
      setIsStandingsLoading(true)
      setIsLoadingFestivalDocuments(true)
      setIsLoadingTimetable(true)
      setParticipantsError('')
      setCategoriesError('')
      setVotesError('')
      setResultsError('')
      setStandingsError('')
      setFestivalDocumentsError('')
      setBingoError('')
      setTimetableError('')

      try {
        const [
          loadedParticipants,
          loadedCategories,
          loadedParticipantVotes,
          loadedFestivalDocuments,
          loadedCampLocationLink,
          loadedMusicPlaylist,
          loadedBingoCard,
          loadedTimetable,
        ] = await Promise.all([
          loadParticipants(accessContext),
          loadCategories(accessContext),
          loadVotesForParticipant(authenticatedParticipant.id, accessContext),
          loadFestivalDocuments(accessContext),
          loadCampLocationLink(accessContext),
          loadMusicPlaylist(accessContext),
          loadOrCreateBingoCard(accessContext),
          loadTimetable(accessContext),
        ])

        if (isCurrent) {
          setParticipants(loadedParticipants)
          setCategories(loadedCategories)
          setVotes(loadedParticipantVotes)
          setFestivalDocuments(loadedFestivalDocuments)
          setCampLocationLink(loadedCampLocationLink)
          setMusicPlaylist(loadedMusicPlaylist)
          setBingoCard(loadedBingoCard)
          setTimetable(loadedTimetable)
          setCampLocationOpenError('')
        }
      } catch {
        if (isCurrent) {
          setParticipantsError(
            i18n.t('identity.errors.participantsLoad'),
          )
          setCategoriesError(
            i18n.t('admin.errors.categoriesLoad'),
          )
          setVotesError(i18n.t('identity.errors.participantVotesLoad'))
          setFestivalDocumentsError(i18n.t('info.errors.load'))
          setBingoError(i18n.t('bingo.errors.load'))
          setTimetableError(i18n.t('timetable.errors.load'))
        }
      } finally {
        if (isCurrent) {
          setIsLoadingFestivalDocuments(false)
          setIsLoadingTimetable(false)
        }
      }

      try {
        const loadedVotes = await loadVotes(accessContext)

        if (isCurrent) {
          setAllVotes(loadedVotes)
        }
      } catch {
        if (isCurrent) {
          setResultsError(i18n.t('results.errors.load'))
        }
      } finally {
        if (isCurrent) {
          setIsLoadingData(false)
        }
      }

      try {
        const loadedStandings = await loadAllTimeStandings(accessContext)

        if (isCurrent) {
          setAllTimeStandings(loadedStandings)
        }
      } catch {
        if (isCurrent) {
          setStandingsError(
            i18n.t('standings.errors.load'),
          )
        }
      } finally {
        if (isCurrent) {
          setIsStandingsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isCurrent = false
    }
  }, [festivalAccess.isUnlocked, selectedParticipant])

  const resultsByCategory = useMemo(
    () =>
      categories.map((category) => {
        const results = participants
          .map((participant) => ({
            participant,
            voteCount: allVotes.filter(
              (vote) =>
                vote.categoryId === category.id &&
                vote.votedForId === participant.id,
            ).length,
          }))
          .sort((firstResult, secondResult) => {
            if (secondResult.voteCount !== firstResult.voteCount) {
              return secondResult.voteCount - firstResult.voteCount
            }

            return firstResult.participant.displayName.localeCompare(
              secondResult.participant.displayName,
            )
          })

        const highestVoteCount = results[0]?.voteCount ?? 0

        return {
          category,
          results,
          highestVoteCount,
        }
      }),
    [allVotes, categories, participants],
  )

  const hasVotes = allVotes.length > 0
  const timetablePerformanceCount = timetable?.performances.length ?? 0
  const festivalInfoCount =
    festivalDocuments.length +
    (campLocationLink ? 1 : 0) +
    (musicPlaylist ? 1 : 0)
  const dashboardTiles: DashboardTile[] = [
    {
      id: 'awards',
      section: 'awards',
      title: t('dashboard.tiles.awards.title'),
      description: t('dashboard.tiles.awards.description'),
      status:
        allTimeStandings.length > 0
          ? t('dashboard.tiles.awards.status.standings', {
              count: allTimeStandings.length,
            })
          : hasVotes
            ? t('dashboard.tiles.awards.status.votes', {
                count: allVotes.length,
              })
            : t('dashboard.tiles.awards.status.empty'),
      detail: t('dashboard.tiles.awards.detail'),
    },
    {
      id: 'timetable',
      section: 'timetable',
      title: t('dashboard.tiles.timetable.title'),
      description: t('dashboard.tiles.timetable.description'),
      status:
        timetablePerformanceCount > 0
          ? t('dashboard.tiles.timetable.status.available', {
              count: timetablePerformanceCount,
            })
          : t('dashboard.tiles.timetable.status.empty'),
      detail: t('dashboard.tiles.timetable.detail'),
    },
    {
      id: 'games',
      section: 'games',
      title: t('dashboard.tiles.games.title'),
      description: t('dashboard.tiles.games.description'),
      status: bingoCard
        ? t('dashboard.tiles.games.status.bingo')
        : t('dashboard.tiles.games.status.empty'),
      detail: t('dashboard.tiles.games.detail'),
    },
    {
      id: 'info',
      section: 'info',
      title: t('dashboard.tiles.info.title'),
      description: t('dashboard.tiles.info.description'),
      status:
        festivalInfoCount > 0
          ? t('dashboard.tiles.info.status.available', {
              count: festivalInfoCount,
            })
          : t('dashboard.tiles.info.status.empty'),
      detail: t('dashboard.tiles.info.detail'),
    },
    {
      id: 'voting',
      section: 'awards',
      title: t('dashboard.tiles.voting.title'),
      description: t('dashboard.tiles.voting.description'),
      status:
        openCategories.length > 0
          ? t('dashboard.tiles.voting.status.available', {
              count: openCategories.length,
            })
          : t('dashboard.tiles.voting.status.empty'),
      detail: t('dashboard.tiles.voting.detail'),
    },
    {
      id: 'profile',
      section: 'profile',
      title: t('dashboard.tiles.profile.title'),
      description: t('dashboard.tiles.profile.description'),
      status: selectedParticipant
        ? t('dashboard.tiles.profile.status.authenticated', {
            name: selectedParticipant.displayName,
          })
        : t('dashboard.tiles.profile.status.guest'),
      detail: selectedParticipant
        ? t('dashboard.tiles.profile.detailAuthenticated')
        : t('dashboard.tiles.profile.detailGuest'),
      avatar: selectedParticipant
        ? {
            avatarId: selectedParticipant.avatarId,
            name: selectedParticipant.displayName,
          }
        : undefined,
    },
  ]

  async function submitAccessCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const now = Date.now()

    if (loginLockedUntil && loginLockedUntil > now) {
      setCurrentTimeMs(now)
      return
    }

    const normalizedAccessCode = accessCode.trim().toUpperCase()

    if (!normalizedAccessCode) {
      setAccessCodeError(t('identity.errors.invalidAccessCode'))
      return
    }

    setIsSubmittingAccessCode(true)
    setAccessCodeError('')

    try {
      const loginResult = await loginParticipant(normalizedAccessCode)

      if (loginResult.status === 'blocked') {
        setAccessCodeError(t('identity.errors.loginLocked'))
        setLoginLockedUntil(Date.parse(loginResult.lockedUntil))
        setCurrentTimeMs(Date.now())
        return
      }

      if (loginResult.status === 'invalid') {
        setAccessCodeError(
          t('identity.errors.invalidAccessCode'),
        )
        return
      }

      setLoginLockedUntil(null)
      storeAuthenticatedParticipant(loginResult.participant)
      setSelectedParticipant(loginResult.participant)
      setActiveMainSection('dashboard')
      setSelectedVotesByCategory({})
      setAccessCode('')
      setAccessCodeError('')
      setVotesError('')
    } catch {
      setAccessCodeError(t('identity.errors.accessCodeLoad'))
    } finally {
      setIsSubmittingAccessCode(false)
    }
  }

  function logout() {
    clearStoredParticipant()
    setSelectedParticipant(null)
    setAccessCode('')
    setAccessCodeError('')
    setVotes([])
    setVotesError('')
    setLoginLockedUntil(null)
    setCurrentTimeMs(Date.now())
    setFestivalCode('')
    setFestivalCodeError('')
    setParticipantsError('')
    setCategoriesError('')
    setResultsError('')
    setStandingsError('')
    setAdminError('')
    setAdminCategories([])
    setAdminCategoriesError('')
    setAdminParticipants([])
    setAdminParticipantsError('')
    setFestivalDocuments([])
    setCampLocationLink(null)
    setCampLocationOpenError('')
    setMusicPlaylist(null)
    setFestivalDocumentsError('')
    setIsLoadingFestivalDocuments(false)
    setAdminFestivalDocuments([])
    setAdminCampLocationLink(null)
    setAdminCampLocationError('')
    setIsSavingCampLocation(false)
    setAdminMusicPlaylist(null)
    setAdminMusicPlaylistError('')
    setIsSavingMusicPlaylist(false)
    setBingoCard(null)
    setBingoError('')
    setTimetable(null)
    setTimetableError('')
    setIsLoadingTimetable(false)
    setTogglingFavoritePerformanceId(null)
    setAdminFestivalDays([])
    setAdminFestivalDaysError('')
    setIsLoadingAdminFestivalDays(false)
    setSavingFestivalDayId(null)
    setDeletingFestivalDayId(null)
    setAdminTimetableStages([])
    setAdminTimetableStagesError('')
    setIsLoadingAdminTimetableStages(false)
    setSavingStageId(null)
    setDeletingStageId(null)
    setAdminTimetableActs([])
    setAdminTimetableActsError('')
    setIsLoadingAdminTimetableActs(false)
    setDeletingActId(null)
    setAdminTimetablePerformances([])
    setAdminTimetablePerformancesError('')
    setIsLoadingAdminTimetablePerformances(false)
    setDeletingPerformanceId(null)
    setTogglingBingoNumber(null)
    setAdminBingoRound(null)
    setAdminBingoError('')
    setIsLoadingAdminBingo(false)
    setIsSavingBingoRound(false)
    setAdminFestivalDocumentsError('')
    setIsLoadingAdminFestivalDocuments(false)
    setUploadingDocumentType(null)
    setRemovingDocumentType(null)
    setParticipantForm(null)
    setParticipantFormError('')
    setAvatarError('')
    setSavingAvatarId(null)
    setIsAdminVisible(false)
    setActiveMainSection('dashboard')
    setActiveAdminSection('festival')
    setSelectedVotesByCategory({})

    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      )
    }
  }

  function selectVote(categoryId: string, votedForId: string) {
    setSelectedVotesByCategory((currentVotes) => ({
      ...currentVotes,
      [categoryId]: votedForId,
    }))
  }

  async function saveParticipantAvatar(avatarId: string) {
    if (!selectedParticipant || savingAvatarId) {
      return
    }

    setSavingAvatarId(avatarId)
    setAvatarError('')

    try {
      const updatedParticipant = await updateParticipantAvatar(
        {
          participantId: selectedParticipant.id,
          avatarId,
        },
        {
          participantAccessCode: selectedParticipant.accessCode,
        },
      )

      storeAuthenticatedParticipant(updatedParticipant)
      setSelectedParticipant(updatedParticipant)
      setParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.id === updatedParticipant.id
            ? {
                ...participant,
                avatarId: updatedParticipant.avatarId,
              }
            : participant,
        ),
      )
      setAdminParticipants((currentParticipants) =>
        currentParticipants.map((participant) =>
          participant.id === updatedParticipant.id
            ? {
                ...participant,
                avatarId: updatedParticipant.avatarId,
              }
            : participant,
        ),
      )
    } catch {
      setAvatarError(t('identity.avatar.errors.save'))
    } finally {
      setSavingAvatarId(null)
    }
  }

  function toggleAdminView() {
    if (!selectedParticipant?.isAdmin) {
      return
    }

    setIsAdminVisible((isVisible) => {
      if (!isVisible) {
        void reloadFestivalCode()
        void reloadAdminCategories()
        void reloadAdminParticipants()
        void reloadAdminFestivalDays()
        void reloadAdminTimetableStages()
        void reloadAdminTimetableActs()
        void reloadAdminTimetablePerformances()
        void reloadAdminFestivalDocuments()
        void reloadAdminBingoRound()

        window.setTimeout(() => {
          document.getElementById('admin')?.scrollIntoView({ behavior: 'smooth' })
        })
      }

      return !isVisible
    })
  }

  function getParticipantAdminContext() {
    if (!selectedParticipant?.isAdmin) {
      return null
    }

    return {
      participantAccessCode: selectedParticipant.accessCode,
    }
  }

  function participantMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('participant access code already exists')) {
      return t('admin.participants.errors.duplicateCode')
    }

    if (message.includes('display name is required')) {
      return t('admin.participants.errors.displayNameRequired')
    }

    if (message.includes('participant access code is required')) {
      return t('admin.participants.errors.accessCodeRequired')
    }

    return t('admin.participants.errors.save')
  }

  function categoryMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('category title is required')) {
      return t('admin.categories.errors.titleRequired')
    }

    if (message.includes('invalid status')) {
      return t('admin.categories.errors.invalidStatus')
    }

    if (message.includes('category cannot be deleted while votes exist')) {
      return t('admin.categories.errors.deleteHasVotes')
    }

    return t('admin.categories.errors.save')
  }

  function festivalDayMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('festival day date already exists')) {
      return t('admin.timetable.days.errors.duplicateDate')
    }

    if (message.includes('festival day date is required')) {
      return t('admin.timetable.days.errors.dateRequired')
    }

    if (message.includes('festival day label is required')) {
      return t('admin.timetable.days.errors.labelRequired')
    }

    if (message.includes('festival day sort order is invalid')) {
      return t('admin.timetable.days.errors.sortOrderInvalid')
    }

    return t('admin.timetable.days.errors.save')
  }

  function timetableStageMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('stage name already exists')) {
      return t('admin.timetable.stages.errors.duplicateName')
    }

    if (message.includes('stage name is required')) {
      return t('admin.timetable.stages.errors.nameRequired')
    }

    if (message.includes('stage sort order is invalid')) {
      return t('admin.timetable.stages.errors.sortOrderInvalid')
    }

    if (message.includes('stage color is invalid')) {
      return t('admin.timetable.stages.errors.colorInvalid')
    }

    return t('admin.timetable.stages.errors.save')
  }

  function timetableActMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('act name is required')) {
      return t('admin.timetable.acts.errors.nameRequired')
    }

    if (message.includes('act cannot be deleted while performances exist')) {
      return t('admin.timetable.acts.errors.deleteHasPerformances')
    }

    return t('admin.timetable.acts.errors.save')
  }

  function timetablePerformanceMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('festival day is required')) {
      return t('admin.timetable.performances.errors.dayRequired')
    }

    if (message.includes('stage is required')) {
      return t('admin.timetable.performances.errors.stageRequired')
    }

    if (message.includes('act is required')) {
      return t('admin.timetable.performances.errors.actRequired')
    }

    if (message.includes('performance start time is required')) {
      return t('admin.timetable.performances.errors.startRequired')
    }

    if (message.includes('performance end time is required')) {
      return t('admin.timetable.performances.errors.endRequired')
    }

    if (message.includes('performance end time must be after start time')) {
      return t('admin.timetable.performances.errors.endAfterStart')
    }

    if (message.includes('performance overlaps existing performance on stage')) {
      return t('admin.timetable.performances.errors.overlap')
    }

    if (message.includes('performance references are invalid')) {
      return t('admin.timetable.performances.errors.invalidReference')
    }

    return t('admin.timetable.performances.errors.save')
  }

  function festivalNameMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('festival name is required')) {
      return t('admin.festival.errors.nameRequired')
    }

    return t('admin.festival.errors.save')
  }

  function festivalCodeMutationErrorMessage(error: unknown) {
    const message = technicalErrorMessage(error)

    if (message.includes('festival access code is required')) {
      return t('admin.festival.errors.codeRequired')
    }

    return t('admin.festival.errors.codeSave')
  }

  async function reloadCategoriesForAdminChange() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const [loadedAdminCategories, loadedCategories] = await Promise.all([
      loadAdminCategories(adminContext),
      loadCategories(adminContext),
    ])

    setAdminCategories(loadedAdminCategories)
    setCategories(loadedCategories)
  }

  async function reloadTimetableForAdminChange() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
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
    ])

    setAdminFestivalDays(loadedAdminFestivalDays)
    setAdminTimetableStages(loadedAdminTimetableStages)
    setAdminTimetableActs(loadedAdminTimetableActs)
    setAdminTimetablePerformances(loadedAdminTimetablePerformances)
    setTimetable(loadedTimetable)
  }

  async function reloadFestivalCode() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingFestivalCode(true)
    setFestivalCodeError('')

    try {
      const loadedFestivalCode = await loadFestivalAccessCode(adminContext)

      setFestivalCode(loadedFestivalCode.code)
      festivalAccess.rememberAccessVersion(loadedFestivalCode.version)
    } catch {
      setFestivalCodeError(t('admin.festival.errors.codeLoad'))
    } finally {
      setIsLoadingFestivalCode(false)
    }
  }

  async function reloadAdminCategories() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminCategories(true)
    setAdminCategoriesError('')

    try {
      const loadedAdminCategories = await loadAdminCategories(adminContext)

      setAdminCategories(loadedAdminCategories)
    } catch {
      setAdminCategoriesError(t('admin.categories.errors.load'))
    } finally {
      setIsLoadingAdminCategories(false)
    }
  }

  async function reloadAdminFestivalDays() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminFestivalDays(true)
    setAdminFestivalDaysError('')

    try {
      const loadedFestivalDays = await loadAdminFestivalDays(adminContext)

      setAdminFestivalDays(loadedFestivalDays)
    } catch {
      setAdminFestivalDaysError(t('admin.timetable.days.errors.load'))
    } finally {
      setIsLoadingAdminFestivalDays(false)
    }
  }

  async function reloadAdminTimetableStages() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminTimetableStages(true)
    setAdminTimetableStagesError('')

    try {
      const loadedStages = await loadAdminTimetableStages(adminContext)

      setAdminTimetableStages(loadedStages)
    } catch {
      setAdminTimetableStagesError(t('admin.timetable.stages.errors.load'))
    } finally {
      setIsLoadingAdminTimetableStages(false)
    }
  }

  async function reloadAdminTimetableActs() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminTimetableActs(true)
    setAdminTimetableActsError('')

    try {
      const loadedActs = await loadAdminTimetableActs(adminContext)

      setAdminTimetableActs(loadedActs)
    } catch {
      setAdminTimetableActsError(t('admin.timetable.acts.errors.load'))
    } finally {
      setIsLoadingAdminTimetableActs(false)
    }
  }

  async function reloadAdminTimetablePerformances() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminTimetablePerformances(true)
    setAdminTimetablePerformancesError('')

    try {
      const loadedPerformances =
        await loadAdminTimetablePerformances(adminContext)

      setAdminTimetablePerformances(loadedPerformances)
    } catch {
      setAdminTimetablePerformancesError(
        t('admin.timetable.performances.errors.load'),
      )
    } finally {
      setIsLoadingAdminTimetablePerformances(false)
    }
  }

  async function reloadAdminParticipants() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminParticipants(true)
    setAdminParticipantsError('')

    try {
      const loadedAdminParticipants = await loadAdminParticipants(adminContext)

      setAdminParticipants(loadedAdminParticipants)
    } catch {
      setAdminParticipantsError(t('admin.participants.errors.load'))
    } finally {
      setIsLoadingAdminParticipants(false)
    }
  }

  async function reloadAdminBingoRound() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminBingo(true)
    setAdminBingoError('')

    try {
      const loadedBingoRound = await loadAdminBingoRound(adminContext)

      setAdminBingoRound(loadedBingoRound)
    } catch {
      setAdminBingoError(t('admin.bingo.errors.load'))
    } finally {
      setIsLoadingAdminBingo(false)
    }
  }

  async function reloadAdminFestivalDocuments() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsLoadingAdminFestivalDocuments(true)
    setAdminFestivalDocumentsError('')
    setAdminCampLocationError('')

    try {
      const [
        loadedAdminFestivalDocuments,
        loadedAdminCampLocationLink,
        loadedAdminMusicPlaylist,
      ] = await Promise.all([
        loadAdminFestivalDocuments(adminContext),
        loadAdminCampLocationLink(adminContext),
        loadAdminMusicPlaylist(adminContext),
      ])

      setAdminFestivalDocuments(loadedAdminFestivalDocuments)
      setAdminCampLocationLink(loadedAdminCampLocationLink)
      setAdminMusicPlaylist(loadedAdminMusicPlaylist)
    } catch {
      setAdminFestivalDocumentsError(t('admin.documents.errors.load'))
    } finally {
      setIsLoadingAdminFestivalDocuments(false)
    }
  }

  async function saveFestivalName(name: string) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsSavingFestivalName(true)
    setFestivalNameError('')

    try {
      const savedFestivalName = await updateFestivalName(name, adminContext)

      setFestivalName(savedFestivalName)
    } catch (error) {
      throw new Error(festivalNameMutationErrorMessage(error), { cause: error })
    } finally {
      setIsSavingFestivalName(false)
    }
  }

  async function saveFestivalCode(code: string) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsSavingFestivalCode(true)
    setFestivalCodeError('')

    try {
      const savedFestivalCode = await updateFestivalAccessCode(code, adminContext)

      setFestivalCode(savedFestivalCode.code)
      festivalAccess.rememberAccessVersion(savedFestivalCode.version)
    } catch (error) {
      throw new Error(festivalCodeMutationErrorMessage(error), { cause: error })
    } finally {
      setIsSavingFestivalCode(false)
    }
  }

  async function archiveCurrentFestival() {
    if (!selectedParticipant?.isAdmin) {
      return ''
    }

    return archiveFestival(selectedParticipant.accessCode)
  }

  async function exportCurrentFestival(includeParticipantAccessCodes: boolean) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsExportingFestival(true)

    try {
      const exportedAt = new Date()
      const exportData = await loadFestivalExportData(
        adminContext,
        {
          type: 'active',
          festivalId: activeFestival.id,
        },
        exportedAt,
        {
          includeParticipantAccessCodes,
        },
      )
      const fileName = festivalExportFileName(exportData.festival.name, exportedAt)
      const blob = new Blob([serializeFestivalExport(exportData)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExportingFestival(false)
    }
  }

  async function startCreateParticipant() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setParticipantFormError('')
    setParticipantForm({
      id: null,
      displayName: '',
      accessCode: '',
    })

    try {
      const suggestedAccessCode = await suggestParticipantAccessCode(adminContext)

      setParticipantForm((currentForm) =>
        currentForm && currentForm.id === null
          ? { ...currentForm, accessCode: suggestedAccessCode }
          : currentForm,
      )
    } catch {
      setParticipantFormError(t('admin.participants.errors.codeSuggest'))
    }
  }

  function startEditParticipant(participant: Participant) {
    setParticipantFormError('')
    setParticipantForm({
      id: participant.id,
      displayName: participant.displayName,
      accessCode: participant.accessCode,
    })
  }

  function cancelParticipantForm() {
    setParticipantForm(null)
    setParticipantFormError('')
  }

  async function submitParticipantForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const adminContext = getParticipantAdminContext()

    if (!adminContext || !participantForm) {
      return
    }

    const displayName = participantForm.displayName.trim()
    const accessCode = participantForm.accessCode.trim().toUpperCase()

    if (!displayName) {
      setParticipantFormError(t('admin.participants.errors.displayNameRequired'))
      return
    }

    if (!accessCode) {
      setParticipantFormError(t('admin.participants.errors.accessCodeRequired'))
      return
    }

    setIsSavingParticipant(true)
    setParticipantFormError('')

    try {
      if (participantForm.id) {
        await updateParticipant(
          {
            id: participantForm.id,
            displayName,
            accessCode,
          },
          adminContext,
        )
      } else {
        await createParticipant(
          {
            displayName,
            accessCode,
          },
          adminContext,
        )
      }

      setParticipantForm(null)
      await reloadAdminParticipants()
    } catch (error) {
      setParticipantFormError(participantMutationErrorMessage(error))
    } finally {
      setIsSavingParticipant(false)
    }
  }

  async function deactivateAdminParticipant(participant: Participant) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext || !participant.isActive) {
      return
    }

    const shouldDeactivate = window.confirm(
      t('admin.participants.confirmDeactivate', {
        name: participant.displayName,
      }),
    )

    if (!shouldDeactivate) {
      return
    }

    setTogglingParticipantId(participant.id)
    setAdminParticipantsError('')

    try {
      await deactivateParticipant(participant.id, adminContext)
      await reloadAdminParticipants()
    } catch {
      setAdminParticipantsError(t('admin.participants.errors.deactivate'))
    } finally {
      setTogglingParticipantId(null)
    }
  }

  async function reactivateAdminParticipant(participant: Participant) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext || participant.isActive) {
      return
    }

    setTogglingParticipantId(participant.id)
    setAdminParticipantsError('')

    try {
      await reactivateParticipant(participant.id, adminContext)
      await reloadAdminParticipants()
    } catch {
      setAdminParticipantsError(t('admin.participants.errors.reactivate'))
    } finally {
      setTogglingParticipantId(null)
    }
  }

  async function createAdminCategory(input: CreateCategoryInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminCategoriesError('')

    try {
      await createCategory(input, adminContext)
      await reloadCategoriesForAdminChange()
    } catch (error) {
      throw new Error(categoryMutationErrorMessage(error), { cause: error })
    }
  }

  async function updateAdminCategory(input: UpdateCategoryInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminCategoriesError('')

    try {
      await updateCategory(input, adminContext)
      await reloadCategoriesForAdminChange()
    } catch (error) {
      throw new Error(categoryMutationErrorMessage(error), { cause: error })
    }
  }

  async function changeCategoryStatus(
    categoryId: string,
    status: CategoryStatus,
  ) {
    if (!selectedParticipant?.isAdmin) {
      return
    }

    const previousCategories = categories
    const previousAdminCategories = adminCategories

    setAdminError('')
    setUpdatingCategoryId(categoryId)
    setCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    )
    setAdminCategories((currentCategories) =>
      currentCategories.map((category) =>
        category.id === categoryId ? { ...category, status } : category,
      ),
    )

    try {
      const updatedCategory = await updateCategory(
        {
          id: categoryId,
          status,
        },
        {
          participantAccessCode: selectedParticipant.accessCode,
        },
      )

      setCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      )
      setAdminCategories((currentCategories) =>
        currentCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      )
    } catch {
      setCategories(previousCategories)
      setAdminCategories(previousAdminCategories)
      setAdminError(t('admin.errors.statusSave'))
    } finally {
      setUpdatingCategoryId(null)
    }
  }

  async function deleteAdminCategory(category: Category) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldDelete = window.confirm(
      t('admin.categories.confirmDelete', {
        title: category.title,
      }),
    )

    if (!shouldDelete) {
      return
    }

    setDeletingCategoryId(category.id)
    setAdminCategoriesError('')

    try {
      await deleteCategory(category.id, adminContext)
      await reloadCategoriesForAdminChange()
    } catch (error) {
      setAdminCategoriesError(categoryMutationErrorMessage(error))
    } finally {
      setDeletingCategoryId(null)
    }
  }

  async function createAdminFestivalDay(input: CreateFestivalDayInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminFestivalDaysError('')

    try {
      await createFestivalDay(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(festivalDayMutationErrorMessage(error), { cause: error })
    }
  }

  async function updateAdminFestivalDay(input: UpdateFestivalDayInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminFestivalDaysError('')

    try {
      await updateFestivalDay(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(festivalDayMutationErrorMessage(error), { cause: error })
    }
  }

  async function moveAdminFestivalDay(
    festivalDay: FestivalDay,
    direction: 'up' | 'down',
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const orderedFestivalDays = [...adminFestivalDays].sort(
      (firstDay, secondDay) =>
        firstDay.sortOrder - secondDay.sortOrder ||
        firstDay.date.localeCompare(secondDay.date),
    )
    const currentIndex = orderedFestivalDays.findIndex(
      (currentDay) => currentDay.id === festivalDay.id,
    )
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetDay = orderedFestivalDays[targetIndex]

    if (currentIndex < 0 || !targetDay) {
      return
    }

    setSavingFestivalDayId(festivalDay.id)
    setAdminFestivalDaysError('')

    try {
      await updateFestivalDay(
        {
          ...festivalDay,
          sortOrder: targetDay.sortOrder,
        },
        adminContext,
      )
      await updateFestivalDay(
        {
          ...targetDay,
          sortOrder: festivalDay.sortOrder,
        },
        adminContext,
      )
      await reloadTimetableForAdminChange()
    } catch {
      setAdminFestivalDaysError(t('admin.timetable.days.errors.reorder'))
    } finally {
      setSavingFestivalDayId(null)
    }
  }

  async function deleteAdminFestivalDay(festivalDay: FestivalDay) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldDelete = window.confirm(
      t('admin.timetable.days.confirmDelete', {
        label: festivalDay.label,
      }),
    )

    if (!shouldDelete) {
      return
    }

    setDeletingFestivalDayId(festivalDay.id)
    setAdminFestivalDaysError('')

    try {
      await deleteFestivalDay(festivalDay.id, adminContext)
      await reloadTimetableForAdminChange()
    } catch {
      setAdminFestivalDaysError(t('admin.timetable.days.errors.delete'))
    } finally {
      setDeletingFestivalDayId(null)
    }
  }

  async function createAdminTimetableStage(input: CreateTimetableStageInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminTimetableStagesError('')

    try {
      await createTimetableStage(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(timetableStageMutationErrorMessage(error), {
        cause: error,
      })
    }
  }

  async function updateAdminTimetableStage(input: UpdateTimetableStageInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminTimetableStagesError('')

    try {
      await updateTimetableStage(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(timetableStageMutationErrorMessage(error), {
        cause: error,
      })
    }
  }

  async function moveAdminTimetableStage(
    stage: TimetableStage,
    direction: 'up' | 'down',
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const orderedStages = [...adminTimetableStages].sort(
      (firstStage, secondStage) =>
        firstStage.sortOrder - secondStage.sortOrder ||
        firstStage.name.localeCompare(secondStage.name),
    )
    const currentIndex = orderedStages.findIndex(
      (currentStage) => currentStage.id === stage.id,
    )
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetStage = orderedStages[targetIndex]

    if (currentIndex < 0 || !targetStage) {
      return
    }

    setSavingStageId(stage.id)
    setAdminTimetableStagesError('')

    try {
      await updateTimetableStage(
        {
          ...stage,
          sortOrder: targetStage.sortOrder,
        },
        adminContext,
      )
      await updateTimetableStage(
        {
          ...targetStage,
          sortOrder: stage.sortOrder,
        },
        adminContext,
      )
      await reloadTimetableForAdminChange()
    } catch {
      setAdminTimetableStagesError(t('admin.timetable.stages.errors.reorder'))
    } finally {
      setSavingStageId(null)
    }
  }

  async function deleteAdminTimetableStage(stage: TimetableStage) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldDelete = window.confirm(
      t('admin.timetable.stages.confirmDelete', {
        name: stage.name,
      }),
    )

    if (!shouldDelete) {
      return
    }

    setDeletingStageId(stage.id)
    setAdminTimetableStagesError('')

    try {
      await deleteTimetableStage(stage.id, adminContext)
      await reloadTimetableForAdminChange()
    } catch {
      setAdminTimetableStagesError(t('admin.timetable.stages.errors.delete'))
    } finally {
      setDeletingStageId(null)
    }
  }

  async function createAdminTimetableAct(input: CreateTimetableActInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminTimetableActsError('')

    try {
      await createTimetableAct(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(timetableActMutationErrorMessage(error), {
        cause: error,
      })
    }
  }

  async function updateAdminTimetableAct(input: UpdateTimetableActInput) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminTimetableActsError('')

    try {
      await updateTimetableAct(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(timetableActMutationErrorMessage(error), {
        cause: error,
      })
    }
  }

  async function deleteAdminTimetableAct(act: TimetableAct) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldDelete = window.confirm(
      t('admin.timetable.acts.confirmDelete', {
        name: act.name,
      }),
    )

    if (!shouldDelete) {
      return
    }

    setDeletingActId(act.id)
    setAdminTimetableActsError('')

    try {
      await deleteTimetableAct(act.id, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      setAdminTimetableActsError(timetableActMutationErrorMessage(error))
    } finally {
      setDeletingActId(null)
    }
  }

  async function createAdminTimetablePerformance(
    input: CreateTimetablePerformanceInput,
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminTimetablePerformancesError('')

    try {
      await createTimetablePerformance(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(timetablePerformanceMutationErrorMessage(error), {
        cause: error,
      })
    }
  }

  async function updateAdminTimetablePerformance(
    input: UpdateTimetablePerformanceInput,
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setAdminTimetablePerformancesError('')

    try {
      await updateTimetablePerformance(input, adminContext)
      await reloadTimetableForAdminChange()
    } catch (error) {
      throw new Error(timetablePerformanceMutationErrorMessage(error), {
        cause: error,
      })
    }
  }

  async function deleteAdminTimetablePerformance(
    performance: TimetablePerformance,
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const act = adminTimetableActs.find(
      (currentAct) => currentAct.id === performance.actId,
    )
    const shouldDelete = window.confirm(
      t('admin.timetable.performances.confirmDelete', {
        act: act?.name ?? t('admin.timetable.performances.unknownAct'),
      }),
    )

    if (!shouldDelete) {
      return
    }

    setDeletingPerformanceId(performance.id)
    setAdminTimetablePerformancesError('')

    try {
      await deleteTimetablePerformance(performance.id, adminContext)
      await reloadTimetableForAdminChange()
    } catch {
      setAdminTimetablePerformancesError(
        t('admin.timetable.performances.errors.delete'),
      )
    } finally {
      setDeletingPerformanceId(null)
    }
  }

  async function uploadAdminFestivalDocument(
    documentType: FestivalDocumentType,
    file: File,
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    if (!isSupportedFestivalDocumentFile(file)) {
      setAdminFestivalDocumentsError(
        t('admin.documents.errors.unsupportedFileType'),
      )
      return
    }

    setUploadingDocumentType(documentType)
    setAdminFestivalDocumentsError('')

    try {
      await uploadFestivalDocument(
        {
          documentType,
          title: t(`info.documentTypes.${documentType}`),
          file,
        },
        adminContext,
      )

      const [loadedAdminDocuments, loadedDocuments] = await Promise.all([
        loadAdminFestivalDocuments(adminContext),
        loadFestivalDocuments(adminContext),
      ])

      setAdminFestivalDocuments(loadedAdminDocuments)
      setFestivalDocuments(loadedDocuments)
      setFestivalDocumentsError('')
    } catch {
      setAdminFestivalDocumentsError(t('admin.documents.errors.upload'))
    } finally {
      setUploadingDocumentType(null)
    }
  }

  async function removeAdminFestivalDocument(
    documentType: FestivalDocumentType,
  ) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldRemove = window.confirm(
      t('admin.documents.confirmRemove', {
        title: t(`info.documentTypes.${documentType}`),
      }),
    )

    if (!shouldRemove) {
      return
    }

    setRemovingDocumentType(documentType)
    setAdminFestivalDocumentsError('')

    try {
      await deleteFestivalDocument(documentType, adminContext)

      const [loadedAdminDocuments, loadedDocuments] = await Promise.all([
        loadAdminFestivalDocuments(adminContext),
        loadFestivalDocuments(adminContext),
      ])

      setAdminFestivalDocuments(loadedAdminDocuments)
      setFestivalDocuments(loadedDocuments)
      setFestivalDocumentsError('')
    } catch {
      setAdminFestivalDocumentsError(t('admin.documents.errors.remove'))
    } finally {
      setRemovingDocumentType(null)
    }
  }

  async function saveAdminCampLocationLink(link: string) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const normalizedLink = link.trim()

    if (!isSupportedCampLocationLink(normalizedLink)) {
      setAdminCampLocationError(t('admin.campLocation.errors.invalid'))
      return
    }

    setIsSavingCampLocation(true)
    setAdminCampLocationError('')

    try {
      const savedLink = await updateCampLocationLink(normalizedLink, adminContext)

      setAdminCampLocationLink(savedLink)
      setCampLocationLink(savedLink)
      setCampLocationOpenError('')
    } catch {
      setAdminCampLocationError(t('admin.campLocation.errors.save'))
    } finally {
      setIsSavingCampLocation(false)
    }
  }

  async function removeAdminCampLocationLink() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    const shouldRemove = window.confirm(t('admin.campLocation.confirmRemove'))

    if (!shouldRemove) {
      return
    }

    setIsSavingCampLocation(true)
    setAdminCampLocationError('')

    try {
      await deleteCampLocationLink(adminContext)
      setAdminCampLocationLink(null)
      setCampLocationLink(null)
      setCampLocationOpenError('')
    } catch {
      setAdminCampLocationError(t('admin.campLocation.errors.remove'))
    } finally {
      setIsSavingCampLocation(false)
    }
  }

  async function saveAdminMusicPlaylist(link: string) {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return false
    }

    const normalizedLink = link.trim()

    if (!isSupportedMusicPlaylistLink(normalizedLink)) {
      setAdminMusicPlaylistError(t('admin.musicPlaylist.errors.invalid'))
      return false
    }

    setIsSavingMusicPlaylist(true)
    setAdminMusicPlaylistError('')

    try {
      const savedPlaylist = await updateMusicPlaylist(normalizedLink, adminContext)

      setAdminMusicPlaylist(savedPlaylist)
      setMusicPlaylist(savedPlaylist)
      setFestivalDocumentsError('')
      return true
    } catch {
      setAdminMusicPlaylistError(t('admin.musicPlaylist.errors.save'))
      return false
    } finally {
      setIsSavingMusicPlaylist(false)
    }
  }

  async function removeAdminMusicPlaylist() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return false
    }

    const shouldRemove = window.confirm(t('admin.musicPlaylist.confirmRemove'))

    if (!shouldRemove) {
      return false
    }

    setIsSavingMusicPlaylist(true)
    setAdminMusicPlaylistError('')

    try {
      await deleteMusicPlaylist(adminContext)
      setAdminMusicPlaylist(null)
      setMusicPlaylist(null)
      setFestivalDocumentsError('')
      return true
    } catch {
      setAdminMusicPlaylistError(t('admin.musicPlaylist.errors.remove'))
      return false
    } finally {
      setIsSavingMusicPlaylist(false)
    }
  }

  async function startAdminBingoRound() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsSavingBingoRound(true)
    setAdminBingoError('')

    try {
      const startedRound = await startBingoRound(adminContext)
      const loadedBingoCard = await loadOrCreateBingoCard(adminContext)

      setAdminBingoRound(startedRound)
      setBingoCard(loadedBingoCard)
      setBingoError('')
    } finally {
      setIsSavingBingoRound(false)
    }
  }

  async function closeAdminBingoRound() {
    const adminContext = getParticipantAdminContext()

    if (!adminContext) {
      return
    }

    setIsSavingBingoRound(true)
    setAdminBingoError('')

    try {
      await closeBingoRound(adminContext)
      setAdminBingoRound(null)
      setBingoCard(null)
      setBingoError('')

      if (activeMainSection === 'games') {
        setActiveMainSection('awards')
      }
    } finally {
      setIsSavingBingoRound(false)
    }
  }

  async function toggleBingoNumber(number: number) {
    if (!selectedParticipant || !bingoCard) {
      return
    }

    const isMarked = bingoCard.markedNumbers.includes(number)

    setTogglingBingoNumber(number)
    setBingoError('')

    try {
      const markedNumbers = await setBingoMark(number, !isMarked, {
        participantAccessCode: selectedParticipant.accessCode,
      })

      setBingoCard({
        ...bingoCard,
        markedNumbers,
      })
    } catch {
      setBingoError(t('bingo.errors.mark'))
    } finally {
      setTogglingBingoNumber(null)
    }
  }

  async function toggleTimetableFavorite(
    performanceId: string,
    isFavorite: boolean,
  ) {
    if (!selectedParticipant || !timetable) {
      return
    }

    const previousFavoritePerformanceIds = timetable.favoritePerformanceIds
    const previousPerformanceFavorites = timetable.performanceFavorites
    const nextFavoritePerformanceIds = isFavorite
      ? previousFavoritePerformanceIds.filter((id) => id !== performanceId)
      : Array.from(new Set([...previousFavoritePerformanceIds, performanceId]))
    const hasPerformanceFavoritesEntry = previousPerformanceFavorites.some(
      (favorite) => favorite.performanceId === performanceId,
    )
    const nextPerformanceFavoritesSource = hasPerformanceFavoritesEntry
      ? previousPerformanceFavorites
      : [
          ...previousPerformanceFavorites,
          {
            performanceId,
            participants: [],
          },
        ]

    setTogglingFavoritePerformanceId(performanceId)
    setTimetableError('')
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
    })

    try {
      if (isFavorite) {
        await removeTimetableFavorite(performanceId, {
          participantAccessCode: selectedParticipant.accessCode,
        })
      } else {
        await addTimetableFavorite(performanceId, {
          participantAccessCode: selectedParticipant.accessCode,
        })
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
      )
      setTimetableError(t('timetable.favorite.errors.save'))
    } finally {
      setTogglingFavoritePerformanceId(null)
    }
  }

  function openCampLocationLink() {
    if (!campLocationLink) {
      return
    }

    setCampLocationOpenError('')

    window.open(
      campLocationLink,
      '_blank',
      'noopener,noreferrer',
    )
  }

  async function submitVote(categoryId: string) {
    if (!selectedParticipant) {
      return
    }

    const votedForId = selectedVotesByCategory[categoryId]
    const hasAlreadyVoted = votes.some(
      (vote) =>
        vote.voterId === selectedParticipant.id && vote.categoryId === categoryId,
    )

    if (!votedForId || votedForId === selectedParticipant.id || hasAlreadyVoted) {
      return
    }

    const vote = {
      voterId: selectedParticipant.id,
      votedForId,
      categoryId,
      timestamp: new Date().toISOString(),
    }

    setSubmittingCategoryId(categoryId)
    setVotesError('')

    try {
      const savedVote = await saveVote(vote, {
        participantAccessCode: selectedParticipant.accessCode,
      })

      setVotes((currentVotes) => [...currentVotes, savedVote])
      setAllVotes((currentVotes) => [...currentVotes, savedVote])
      setSelectedVotesByCategory((currentVotes) => {
        const remainingVotes = { ...currentVotes }
        delete remainingVotes[categoryId]

        return remainingVotes
      })
    } catch {
      setVotesError(t('categories.errors.voteSave'))
    } finally {
      setSubmittingCategoryId(null)
    }
  }

  if (locationHash === '#impressum') {
    return <LegalNotice festivalName={displayedFestivalName} />
  }

  if (locationHash === '#datenschutz') {
    return <PrivacyNotice festivalName={displayedFestivalName} />
  }

  if (!festivalAccess.isUnlocked) {
    return (
      <FestivalAccess
        festivalName={festivalName}
        onUnlock={festivalAccess.unlock}
      />
    )
  }

  return (
    <main
      className="home"
      aria-label={t('app.ariaLabel', {
        count: participantCount,
        festivalName: displayedFestivalName,
      })}
    >
      <header className="app-header" aria-labelledby="app-title">
        <button
          className="app-header__brand"
          type="button"
          onClick={() => setActiveMainSection('dashboard')}
        >
          <p>{t('dashboard.festivalLabel')}</p>
          <h1 id="app-title">{displayedFestivalName}</h1>
        </button>

        <div className="app-header__actions">
          <PwaInstallPrompt />
          <LanguageSwitcher />
          {selectedParticipant?.isAdmin ? (
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
              <span>{isAdminVisible ? t('hero.adminClose') : t('hero.admin')}</span>
            </button>
          ) : null}
        </div>
      </header>

      {selectedParticipant?.isAdmin && isAdminVisible ? (
        <section
          className="admin"
          id="admin"
          aria-label={t('admin.navigation.label')}
        >
          <nav
            className="admin-navigation"
            aria-label={t('admin.navigation.label')}
          >
            {adminNavigationItems.map((item) => (
              <button
                className="admin-navigation__button"
                type="button"
                key={item.section}
                aria-current={
                  activeAdminSection === item.section ? 'page' : undefined
                }
                onClick={() => setActiveAdminSection(item.section)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {activeAdminSection === 'festival' ? (
            <AdminFestival
              key={`festival-${festivalName}-${festivalCode}`}
              mode="settings"
              festivalName={festivalName}
              error={festivalNameError}
              isSaving={isSavingFestivalName}
              festivalCode={festivalCode}
              festivalCodeError={festivalCodeError}
              isLoadingFestivalCode={isLoadingFestivalCode}
              isSavingFestivalCode={isSavingFestivalCode}
              isExporting={isExportingFestival}
              onSave={saveFestivalName}
              onSaveFestivalCode={saveFestivalCode}
              onArchive={archiveCurrentFestival}
              onExport={exportCurrentFestival}
            />
          ) : null}

          {activeAdminSection === 'participants' ? (
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
              onClearFormError={() => setParticipantFormError('')}
              onDeactivate={deactivateAdminParticipant}
              onReactivate={reactivateAdminParticipant}
            />
          ) : null}

          {activeAdminSection === 'awards' ? (
            <>
              {adminError ? <p className="admin__notice">{adminError}</p> : null}
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

          {activeAdminSection === 'timetable' ? (
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
                error={adminTimetableActsError}
                isLoading={isLoadingAdminTimetableActs}
                deletingActId={deletingActId}
                onCreate={createAdminTimetableAct}
                onUpdate={updateAdminTimetableAct}
                onDelete={deleteAdminTimetableAct}
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

          {activeAdminSection === 'games' ? (
            <AdminBingo
              round={adminBingoRound}
              error={adminBingoError}
              isLoading={isLoadingAdminBingo}
              isSaving={isSavingBingoRound}
              onStart={startAdminBingoRound}
              onClose={closeAdminBingoRound}
            />
          ) : null}

          {activeAdminSection === 'info' ? (
            <AdminFestivalDocuments
              key={`documents-${adminCampLocationLink ?? 'empty'}`}
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
              onClearCampLocationError={() => setAdminCampLocationError('')}
              onSaveMusicPlaylist={saveAdminMusicPlaylist}
              onRemoveMusicPlaylist={removeAdminMusicPlaylist}
              onClearMusicPlaylistError={() => setAdminMusicPlaylistError('')}
              onUpload={uploadAdminFestivalDocument}
              onRemove={removeAdminFestivalDocument}
            />
          ) : null}

          {activeAdminSection === 'archive' ? (
            <AdminFestival
              key={`archive-${festivalName}-${festivalCode}`}
              mode="archive"
              festivalName={festivalName}
              error={festivalNameError}
              isSaving={isSavingFestivalName}
              festivalCode={festivalCode}
              festivalCodeError={festivalCodeError}
              isLoadingFestivalCode={isLoadingFestivalCode}
              isSavingFestivalCode={isSavingFestivalCode}
              isExporting={isExportingFestival}
              onSave={saveFestivalName}
              onSaveFestivalCode={saveFestivalCode}
              onArchive={archiveCurrentFestival}
              onExport={exportCurrentFestival}
            />
          ) : null}
        </section>
      ) : null}

      {activeMainSection === 'dashboard' ? (
        <DashboardSection
          festivalName={displayedFestivalName}
          participantName={selectedParticipant?.displayName ?? null}
          tiles={dashboardTiles}
          isAuthenticated={Boolean(selectedParticipant)}
          onNavigate={setActiveMainSection}
        />
      ) : null}

      {activeMainSection === 'profile' ? (
        <section
          className="identity"
          id="main-profile"
          aria-labelledby="identity-title"
        >
          <div className="identity__content">
            {selectedParticipant ? (
              <>
                <SectionHeader
                  title={t('identity.profileTitle')}
                  titleId="identity-title"
                  description={t('identity.profileDescription')}
                />

                <div className="identity__selected identity__profile-card">
                  <Avatar
                    avatarId={selectedParticipant.avatarId}
                    name={selectedParticipant.displayName}
                    size="large"
                  />
                  <div className="identity__profile-copy">
                    <p>{t('identity.loggedInAs')}</p>
                    <h3>{selectedParticipant.displayName}</h3>
                  </div>
                  <button
                    className="identity__change"
                    type="button"
                    onClick={logout}
                  >
                    {t('identity.logout')}
                  </button>
                </div>

                <div className="avatar-picker" aria-labelledby="avatar-picker-title">
                  <div className="avatar-picker__header">
                    <h3 id="avatar-picker-title">{t('identity.avatar.title')}</h3>
                    <p>{t('identity.avatar.description')}</p>
                  </div>
                  <div className="avatar-picker__grid">
                    {avatars.map((avatar) => {
                      const isSelected =
                        avatar.id ===
                        (selectedParticipant.avatarId ?? avatars[0]?.id)

                      return (
                        <button
                          className={`avatar-picker__option${
                            isSelected ? ' is-selected' : ''
                          }`}
                          type="button"
                          key={avatar.id}
                          onClick={() => {
                            void saveParticipantAvatar(avatar.id)
                          }}
                          disabled={savingAvatarId !== null}
                          aria-pressed={isSelected}
                          aria-label={t('identity.avatar.selectLabel', {
                            avatar: avatar.label,
                          })}
                        >
                          <Avatar
                            avatarId={avatar.id}
                            name={avatar.label}
                            size="large"
                          />
                          <span>{avatar.label}</span>
                          {isSelected ? (
                            <span className="avatar-picker__selected-badge">
                              {t('identity.avatar.selected')}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  {savingAvatarId ? (
                    <p className="identity__error" role="status">
                      {t('identity.avatar.saving')}
                    </p>
                  ) : null}
                  {avatarError ? (
                    <p className="identity__error" role="alert">
                      {avatarError}
                    </p>
                  ) : null}
                </div>

                {participantsError ? (
                  <p className="identity__error">{participantsError}</p>
                ) : null}
              </>
            ) : (
              <>
                <SectionHeader
                  title={t('identity.loginTitle')}
                  titleId="identity-title"
                  description={t('identity.loginDescription')}
                />

                <form className="identity__form" onSubmit={submitAccessCode}>
                  <label htmlFor="participant-access-code">
                    {t('identity.participantCodeLabel')}
                  </label>
                  <input
                    id="participant-access-code"
                    type="text"
                    value={accessCode}
                    disabled={isSubmittingAccessCode || isLoginLocked}
                    onChange={(event) => {
                      setAccessCode(event.target.value)
                      setAccessCodeError('')
                    }}
                    autoComplete="off"
                    inputMode="text"
                    placeholder={t('identity.participantCodePlaceholder')}
                  />
                  {accessCodeError ? (
                    <p className="identity__error">{accessCodeError}</p>
                  ) : null}
                  {isLoginLocked ? (
                    <p className="identity__error" role="status">
                      {t('identity.locked', {
                        seconds: loginLockRemainingSeconds,
                      })}
                    </p>
                  ) : null}
                  <button
                    className="identity__submit"
                    type="submit"
                    disabled={isSubmittingAccessCode || isLoginLocked}
                  >
                    {isSubmittingAccessCode
                      ? t('common.loading')
                      : t('identity.submit')}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      ) : null}

      {selectedParticipant && activeMainSection === 'games' ? (
        <section
          className="games"
          id="main-games"
          aria-labelledby="games-title"
        >
          <SectionHeader
            title={t('games.title')}
            titleId="games-title"
            eyebrow={t('games.eyebrow')}
            description={t('games.description')}
            width="narrow"
          />

          <nav className="games__navigation" aria-label={t('games.navigationLabel')}>
            <button
              className="games__tab is-active"
              type="button"
              aria-current="page"
            >
              {t('games.bingo')}
            </button>
          </nav>

          {bingoCard ? (
            <Bingo
              card={bingoCard}
              error={bingoError}
              togglingNumber={togglingBingoNumber}
              onToggleNumber={toggleBingoNumber}
            />
          ) : (
            <p className="games__notice">{t('games.empty')}</p>
          )}
        </section>
      ) : null}

      {selectedParticipant && activeMainSection === 'timetable' ? (
        <TimetableSection
          timetable={timetable}
          error={timetableError}
          isLoading={isLoadingTimetable}
          currentParticipantId={selectedParticipant?.id ?? null}
          togglingPerformanceId={togglingFavoritePerformanceId}
          onToggleFavorite={toggleTimetableFavorite}
        />
      ) : null}

      {selectedParticipant && activeMainSection === 'info' ? (
        <FestivalInfo
          documents={festivalDocuments}
          campLocationLink={campLocationLink}
          campLocationError={campLocationOpenError}
          musicPlaylist={musicPlaylist}
          error={festivalDocumentsError}
          isLoading={isLoadingFestivalDocuments}
          onOpenCampLocation={openCampLocationLink}
        />
      ) : null}

      {selectedParticipant && activeMainSection === 'awards' ? (
        <div id="main-awards">
          <section className="categories" id="abstimmung" aria-labelledby="categories-title">
            <SectionHeader
              title={t('categories.title')}
              titleId="categories-title"
              eyebrow={t('categories.eyebrow', { count: participantCount })}
            />

            {votesError ? <p className="categories__notice">{votesError}</p> : null}
            {isLoadingData ? (
              <p className="categories__notice" role="status">
                {t('common.loading')}
              </p>
            ) : null}
            {categoriesError ? (
              <p className="categories__notice">{categoriesError}</p>
            ) : null}
            {!isLoadingData && openCategories.length === 0 ? (
              <p className="categories__notice">{t('categories.empty')}</p>
            ) : null}

            <div className="categories__grid">
              {openCategories.map((category) => {
                const eligibleParticipants = participants.filter(
                  (participant) => participant.id !== selectedParticipant.id,
                )
                const selectedVote = selectedVotesByCategory[category.id] ?? ''
                const hasAlreadyVoted = votes.some(
                  (vote) =>
                    vote.voterId === selectedParticipant.id &&
                    vote.categoryId === category.id,
                )
                const selectedParticipantForVote = eligibleParticipants.find(
                  (participant) => participant.id === selectedVote,
                )

                return (
                  <article className="category-card" key={category.id}>
                    <div className="category-card__topline">
                      <span
                        className={`category-card__status category-card__status--${category.status}`}
                      >
                        {statusLabels[category.status]}
                      </span>
                    </div>
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>

                    {hasAlreadyVoted ? (
                      <p className="category-card__voted">
                        {t('categories.alreadyVoted')}
                      </p>
                    ) : (
                      <div className="category-card__vote">
                        <label htmlFor={`vote-${category.id}`}>
                          {t('categories.voteTargetLabel')}
                        </label>
                        <select
                          id={`vote-${category.id}`}
                          value={selectedVote}
                          onChange={(event) =>
                            selectVote(category.id, event.target.value)
                          }
                        >
                          <option value="">{t('categories.selectPerson')}</option>
                          {eligibleParticipants.map((participant) => (
                            <option key={participant.id} value={participant.id}>
                              {participant.displayName}
                            </option>
                          ))}
                        </select>

                        {selectedVote ? (
                          <p className="category-card__selected-vote">
                            <ParticipantName
                              avatarId={selectedParticipantForVote?.avatarId}
                              name={selectedParticipantForVote?.displayName ?? ''}
                            />
                          </p>
                        ) : null}

                        {selectedVote ? (
                          <button
                            className="category-card__submit"
                            type="button"
                            disabled={submittingCategoryId === category.id}
                            onClick={() => submitVote(category.id)}
                          >
                            {submittingCategoryId === category.id
                              ? t('common.saving')
                              : t('categories.submitVote')}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="results" id="ergebnisse" aria-labelledby="results-title">
            <SectionHeader
              title={t('results.title')}
              titleId="results-title"
              eyebrow={t('results.eyebrow')}
            />

            {resultsError ? <p className="results__notice">{resultsError}</p> : null}

            {!hasVotes ? (
              <p className="results__notice">{t('results.empty')}</p>
            ) : (
              <div className="results__grid">
                {resultsByCategory.map(({ category, results, highestVoteCount }) => (
                  <ResultCard
                    category={category}
                    results={results}
                    highestVoteCount={highestVoteCount}
                    key={`${category.id}-${category.status}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section
            className="standings"
            id="gesamtclassement"
            aria-labelledby="standings-title"
          >
            <SectionHeader
              title={t('standings.title')}
              titleId="standings-title"
              eyebrow={t('standings.eyebrow')}
            />

            {isStandingsLoading ? (
              <p className="standings__notice" role="status">
                {t('standings.loading')}
              </p>
            ) : standingsError ? (
              <p className="standings__notice standings__notice--error" role="alert">
                {standingsError}
              </p>
            ) : allTimeStandings.length === 0 ? (
              <p className="standings__notice">{t('standings.empty')}</p>
            ) : (
              <div
                className="standings__table"
                role="table"
                aria-label={t('standings.title')}
              >
                <div className="standings__columns" role="row">
                  <span role="columnheader">{t('standings.columns.rank')}</span>
                  <span role="columnheader">{t('standings.columns.name')}</span>
                  <span role="columnheader">{t('standings.columns.points')}</span>
                </div>
                <ol>
                  {allTimeStandings.map((standing, index) => (
                    <li key={standing.participantId} role="row">
                      <span
                        className="standings__rank"
                        role="cell"
                        aria-label={t('standings.rankLabel', { rank: index + 1 })}
                      >
                        {index + 1}
                      </span>
                      <strong role="cell">{standing.participantName}</strong>
                      <span className="standings__points" role="cell">
                        {standing.totalPoints}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      ) : null}
      <AppFooter />
    </main>
  )
}

export default App
