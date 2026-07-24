import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Timetable, TimetableAct } from "../data/timetable";
import type { ActArtistTag, ArtistTag } from "../data/artistTags";
import {
  filterArtists,
  getAssignedArtistTags,
  prepareArtists,
  type ArtistWithTags,
} from "../domain/artistSearch";
import {
  recommendArtists,
  type ArtistRecommendation,
} from "../domain/artistRecommendations";
import { SectionHeader } from "./SectionHeader";

type ArtistsProps = {
  acts: TimetableAct[] | null;
  artistTags: ActArtistTag[];
  error: string;
  isLoading: boolean;
  selectedActId: string | null;
  dashboardBackButton: ReactNode;
  onSelectAct: (actId: string) => void;
  timetable: Timetable | null;
  preferredTagIds: ReadonlySet<string>;
  preferencesError: string;
  arePreferencesLoading: boolean;
  isSavingFavorite: boolean;
  onToggleFavorite: (performanceIds: string[], isFavorite: boolean) => void;
  onOpenProfile: () => void;
};

type ArtistFavorite = {
  performanceIds: string[];
  isFavorite: boolean;
};

function getArtistFavorite(
  artistId: string,
  timetable: Timetable | null,
): ArtistFavorite {
  const performanceIds = (timetable?.performances ?? [])
    .filter((performance) => performance.actId === artistId)
    .map((performance) => performance.id);
  const favorites = new Set(timetable?.favoritePerformanceIds ?? []);

  return {
    performanceIds,
    isFavorite:
      performanceIds.length > 0 &&
      performanceIds.every((id) => favorites.has(id)),
  };
}

function RecommendationList({
  recommendations,
  timetable,
  isSavingFavorite,
  onSelectAct,
  onToggleFavorite,
}: {
  recommendations: ArtistRecommendation[];
  timetable: Timetable | null;
  isSavingFavorite: boolean;
  onSelectAct: ArtistsProps["onSelectAct"];
  onToggleFavorite: ArtistsProps["onToggleFavorite"];
}) {
  const { t } = useTranslation();

  return (
    <ul className="artists__list artists__recommendation-list">
      {recommendations.map((artist) => {
        const { performanceIds, isFavorite } = getArtistFavorite(
          artist.id,
          timetable,
        );

        return (
          <li key={artist.id} className="artists__recommendation">
            <button
              type="button"
              className="artists__item"
              onClick={() => onSelectAct(artist.id)}
            >
              <span className="artists__item-content">
                <strong>{artist.name}</strong>
                <span
                  className="artists__tags"
                  aria-label={t("artists.tags.label")}
                >
                  {artist.tags.map((tag) => (
                    <span key={tag.id}>{tag.name}</span>
                  ))}
                </span>
                <span className="artists__reason">
                  {t("artists.recommendations.reason", {
                    tags: artist.matchingTags
                      .map((tag) => tag.name)
                      .join(", "),
                  })}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="artists__favorite"
              aria-pressed={isFavorite}
              disabled={performanceIds.length === 0 || isSavingFavorite}
              onClick={() => onToggleFavorite(performanceIds, isFavorite)}
            >
              {isFavorite
                ? t("artistDetail.favorite.remove")
                : t("artistDetail.favorite.add")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ArtistRecommendations({
  recommendations,
  timetable,
  preferredTagIds,
  preferencesError,
  isLoading,
  arePreferencesLoading,
  isSavingFavorite,
  onSelectAct,
  onToggleFavorite,
  onOpenProfile,
}: Pick<
  ArtistsProps,
  | "timetable"
  | "preferredTagIds"
  | "preferencesError"
  | "isLoading"
  | "arePreferencesLoading"
  | "isSavingFavorite"
  | "onSelectAct"
  | "onToggleFavorite"
  | "onOpenProfile"
> & { recommendations: ArtistRecommendation[] }) {
  const { t } = useTranslation();
  let content: ReactNode;

  if (isLoading || arePreferencesLoading) {
    content = (
      <p className="artists__notice" role="status">
        {t("artists.recommendations.loading")}
      </p>
    );
  } else if (preferencesError) {
    content = (
      <p className="artists__notice artists__notice--error" role="alert">
        {preferencesError}
      </p>
    );
  } else if (preferredTagIds.size === 0) {
    content = (
      <div className="artists__notice">
        <p>{t("artists.recommendations.noPreferences")}</p>
        <button type="button" onClick={onOpenProfile}>
          {t("artists.recommendations.openProfile")}
        </button>
      </div>
    );
  } else if (recommendations.length === 0) {
    content = (
      <p className="artists__notice">
        {t("artists.recommendations.noMatches")}
      </p>
    );
  } else {
    content = (
      <RecommendationList
        recommendations={recommendations}
        timetable={timetable}
        isSavingFavorite={isSavingFavorite}
        onSelectAct={onSelectAct}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <section
      className="artists__recommendations"
      aria-labelledby="artist-recommendations-title"
    >
      <h3 id="artist-recommendations-title">
        {t("artists.recommendations.title")}
      </h3>
      {content}
    </section>
  );
}

function ArtistFilters({
  availableTags,
  selectedTagIds,
  onToggleTag,
  onReset,
}: {
  availableTags: ArtistTag[];
  selectedTagIds: ReadonlySet<string>;
  onToggleTag: (tagId: string) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.has(tag.id),
  );

  if (availableTags.length === 0) return null;

  return (
    <div className="artists__filters">
      <span className="artists__filter-label">{t("artists.filters.label")}</span>
      <div
        className="artists__filter-options"
        aria-label={t("artists.filters.label")}
      >
        {availableTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selectedTagIds.has(tag.id)}
            onClick={() => onToggleTag(tag.id)}
          >
            {tag.name}
          </button>
        ))}
      </div>
      {selectedTags.length > 0 ? (
        <div className="artists__selected-filters">
          <span>{t("artists.filters.selected")}</span>
          <div className="artists__selected-list">
            {selectedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                aria-label={t("artists.filters.remove", { tag: tag.name })}
              >
                {tag.name}
                <span aria-hidden="true"> ×</span>
              </button>
            ))}
            <button
              className="artists__reset"
              type="button"
              onClick={onReset}
            >
              {t("artists.filters.reset")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArtistList({
  artists,
  selectedActId,
  onSelectAct,
}: {
  artists: ArtistWithTags[];
  selectedActId: string | null;
  onSelectAct: ArtistsProps["onSelectAct"];
}) {
  const { t } = useTranslation();

  if (artists.length === 0) {
    return (
      <p className="artists__notice" role="status">
        {t("artists.noResults")}
      </p>
    );
  }

  return (
    <ul className="artists__list">
      {artists.map((artist) => (
        <li key={artist.id}>
          <button
            type="button"
            className="artists__item"
            onClick={() => onSelectAct(artist.id)}
            aria-current={selectedActId === artist.id ? "page" : undefined}
          >
            <span className="artists__item-content">
              <strong>{artist.name}</strong>
              {artist.tags.length > 0 ? (
                <span
                  className="artists__tags"
                  aria-label={t("artists.tags.label")}
                >
                  {artist.tags.map((tag) => (
                    <span key={tag.id}>{tag.name}</span>
                  ))}
                </span>
              ) : null}
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
              <path d="m9.3 6.7 5.3 5.3-5.3 5.3 1.4 1.4 6.7-6.7-6.7-6.7-1.4 1.4Z" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ArtistsBody({
  acts,
  artists,
  availableTags,
  error,
  isLoading,
  query,
  selectedActId,
  selectedTagIds,
  onQueryChange,
  onToggleTag,
  onResetTags,
  onSelectAct,
}: Pick<ArtistsProps, "acts" | "error" | "isLoading" | "selectedActId" | "onSelectAct"> & {
  artists: ArtistWithTags[];
  availableTags: ArtistTag[];
  query: string;
  selectedTagIds: ReadonlySet<string>;
  onQueryChange: (query: string) => void;
  onToggleTag: (tagId: string) => void;
  onResetTags: () => void;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return <p className="artists__notice" role="status">{t("artists.loading")}</p>;
  }
  if (error) {
    return <p className="artists__notice artists__notice--error" role="alert">{error}</p>;
  }
  if ((acts?.length ?? 0) === 0) {
    return <p className="artists__notice">{t("artists.empty")}</p>;
  }

  return (
    <div className="artists__content">
      <label className="artists__search">
        <span>{t("artists.search.label")}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("artists.search.placeholder")}
        />
      </label>
      <ArtistFilters
        availableTags={availableTags}
        selectedTagIds={selectedTagIds}
        onToggleTag={onToggleTag}
        onReset={onResetTags}
      />
      <ArtistList
        artists={artists}
        selectedActId={selectedActId}
        onSelectAct={onSelectAct}
      />
    </div>
  );
}

export function Artists({
  acts,
  artistTags,
  error,
  isLoading,
  selectedActId,
  dashboardBackButton,
  onSelectAct,
  timetable,
  preferredTagIds,
  preferencesError,
  arePreferencesLoading,
  isSavingFavorite,
  onToggleFavorite,
  onOpenProfile,
}: ArtistsProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const language = i18n.language;
  const preparedArtists = useMemo(
    () => prepareArtists(acts, artistTags, language),
    [acts, artistTags, language],
  );
  const availableTags = useMemo(
    () => getAssignedArtistTags(preparedArtists, language),
    [preparedArtists, language],
  );
  const artists = useMemo(
    () => filterArtists(preparedArtists, query, selectedTagIds, language),
    [preparedArtists, query, selectedTagIds, language],
  );
  const recommendations = useMemo(
    () => recommendArtists(preparedArtists, preferredTagIds, language),
    [preparedArtists, preferredTagIds, language],
  );

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  return (
    <section className="artists" id="main-artists" aria-labelledby="artists-title">
      {dashboardBackButton}
      <SectionHeader
        eyebrow={t("artists.eyebrow")}
        title={t("artists.title")}
        titleId="artists-title"
        description={t("artists.description")}
      />
      <ArtistRecommendations
        recommendations={recommendations}
        timetable={timetable}
        preferredTagIds={preferredTagIds}
        preferencesError={preferencesError}
        isLoading={isLoading}
        arePreferencesLoading={arePreferencesLoading}
        isSavingFavorite={isSavingFavorite}
        onSelectAct={onSelectAct}
        onToggleFavorite={onToggleFavorite}
        onOpenProfile={onOpenProfile}
      />
      <ArtistsBody
        acts={acts}
        artists={artists}
        availableTags={availableTags}
        error={error}
        isLoading={isLoading}
        query={query}
        selectedActId={selectedActId}
        selectedTagIds={selectedTagIds}
        onQueryChange={setQuery}
        onToggleTag={toggleTag}
        onResetTags={() => setSelectedTagIds(new Set())}
        onSelectAct={onSelectAct}
      />
    </section>
  );
}
