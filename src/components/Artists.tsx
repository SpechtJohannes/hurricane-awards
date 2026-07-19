import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TimetableAct } from "../data/timetable";
import { SectionHeader } from "./SectionHeader";

type ArtistsProps = {
  acts: TimetableAct[] | null;
  error: string;
  isLoading: boolean;
  selectedActId: string | null;
  dashboardBackButton: ReactNode;
  onSelectAct: (actId: string) => void;
};

export function Artists({
  acts,
  error,
  isLoading,
  selectedActId,
  dashboardBackButton,
  onSelectAct,
}: ArtistsProps) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const language = i18n.language;
  const normalizedQuery = query.trim().toLocaleLowerCase(language);
  const artists = useMemo(() => {
    const actsById = new Map<string, TimetableAct>();

    for (const act of acts ?? []) {
      if (!actsById.has(act.id)) {
        actsById.set(act.id, act);
      }
    }

    const uniqueActs = Array.from(actsById.values());

    return uniqueActs
      .filter((act) =>
        act.name
          .toLocaleLowerCase(language)
          .includes(normalizedQuery),
      )
      .sort((first, second) =>
        first.name.localeCompare(second.name, language, {
          sensitivity: "base",
        }),
      );
  }, [acts, language, normalizedQuery]);

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
                    <span>{artist.name}</span>
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
