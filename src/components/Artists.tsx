import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TimetableAct } from "../data/timetable";
import type { Timetable } from "../data/timetable";
import type { ActArtistTag } from "../data/artistTags";
import { filterArtists, getAssignedArtistTags, prepareArtists } from "../domain/artistSearch";
import { recommendArtists } from "../domain/artistRecommendations";
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
  const preparedArtists = useMemo(() => prepareArtists(acts, artistTags, language), [acts, artistTags, language]);
  const availableTags = useMemo(() => getAssignedArtistTags(preparedArtists, language), [preparedArtists, language]);
  const artists = useMemo(() => filterArtists(preparedArtists, query, selectedTagIds, language), [preparedArtists, query, selectedTagIds, language]);
  const recommendations = useMemo(() => recommendArtists(preparedArtists, preferredTagIds, language), [preparedArtists, preferredTagIds, language]);
  const selectedTags = availableTags.filter((tag) => selectedTagIds.has(tag.id));

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId); else next.add(tagId);
      return next;
    });
  }

  return (
    <section
      className="artists"
      id="main-artists"
      aria-labelledby="artists-title"
    >
      {dashboardBackButton}
      <SectionHeader
        eyebrow={t("artists.eyebrow")}
        title={t("artists.title")}
        titleId="artists-title"
        description={t("artists.description")}
      />

      <section className="artists__recommendations" aria-labelledby="artist-recommendations-title">
        <h3 id="artist-recommendations-title">{t("artists.recommendations.title")}</h3>
        {isLoading || arePreferencesLoading ? <p className="artists__notice" role="status">{t("artists.recommendations.loading")}</p>
          : preferencesError ? <p className="artists__notice artists__notice--error" role="alert">{preferencesError}</p>
          : preferredTagIds.size === 0 ? <div className="artists__notice"><p>{t("artists.recommendations.noPreferences")}</p><button type="button" onClick={onOpenProfile}>{t("artists.recommendations.openProfile")}</button></div>
          : recommendations.length === 0 ? <p className="artists__notice">{t("artists.recommendations.noMatches")}</p>
          : <ul className="artists__list artists__recommendation-list">{recommendations.map((artist) => {
              const performanceIds = (timetable?.performances ?? []).filter((performance) => performance.actId === artist.id).map((performance) => performance.id);
              const favorites = new Set(timetable?.favoritePerformanceIds ?? []);
              const isFavorite = performanceIds.length > 0 && performanceIds.every((id) => favorites.has(id));
              return <li key={artist.id} className="artists__recommendation">
                <button type="button" className="artists__item" onClick={() => onSelectAct(artist.id)}><span className="artists__item-content"><strong>{artist.name}</strong><span className="artists__tags" aria-label={t("artists.tags.label")}>{artist.tags.map((tag) => <span key={tag.id}>{tag.name}</span>)}</span><span className="artists__reason">{t("artists.recommendations.reason", { tags: artist.matchingTags.map((tag) => tag.name).join(", ") })}</span></span></button>
                <button type="button" className="artists__favorite" aria-pressed={isFavorite} disabled={performanceIds.length === 0 || isSavingFavorite} onClick={() => onToggleFavorite(performanceIds, isFavorite)}>{isFavorite ? t("artistDetail.favorite.remove") : t("artistDetail.favorite.add")}</button>
              </li>;
            })}</ul>}
      </section>

      {isLoading ? (
        <p className="artists__notice" role="status">
          {t("artists.loading")}
        </p>
      ) : error ? (
        <p className="artists__notice artists__notice--error" role="alert">
          {error}
        </p>
      ) : (acts?.length ?? 0) === 0 ? (
        <p className="artists__notice">{t("artists.empty")}</p>
      ) : (
        <div className="artists__content">
          <label className="artists__search">
            <span>{t("artists.search.label")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("artists.search.placeholder")}
            />
          </label>

          {availableTags.length > 0 ? (
            <div className="artists__filters">
              <span className="artists__filter-label">{t("artists.filters.label")}</span>
              <div className="artists__filter-options" aria-label={t("artists.filters.label")}>
                {availableTags.map((tag) => (
                  <button key={tag.id} type="button" aria-pressed={selectedTagIds.has(tag.id)} onClick={() => toggleTag(tag.id)}>{tag.name}</button>
                ))}
              </div>
              {selectedTags.length > 0 ? (
                <div className="artists__selected-filters">
                  <span>{t("artists.filters.selected")}</span>
                  <div className="artists__selected-list">
                    {selectedTags.map((tag) => (
                      <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} aria-label={t("artists.filters.remove", { tag: tag.name })}>{tag.name}<span aria-hidden="true"> ×</span></button>
                    ))}
                    <button className="artists__reset" type="button" onClick={() => setSelectedTagIds(new Set())}>{t("artists.filters.reset")}</button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {artists.length === 0 ? (
            <p className="artists__notice" role="status">
              {t("artists.noResults")}
            </p>
          ) : (
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
                      {artist.tags.length > 0 ? <span className="artists__tags" aria-label={t("artists.tags.label")}>
                        {artist.tags.map((tag) => <span key={tag.id}>{tag.name}</span>)}
                      </span> : null}
                    </span>
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                      <path d="m9.3 6.7 5.3 5.3-5.3 5.3 1.4 1.4 6.7-6.7-6.7-6.7-1.4 1.4Z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
