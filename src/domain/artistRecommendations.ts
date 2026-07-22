import type { ArtistTag } from "../data/artistTags";
import type { ArtistWithTags } from "./artistSearch";

export type ArtistRecommendation = ArtistWithTags & {
  matchingTags: ArtistTag[];
  matchCount: number;
};

/** Ranks by descending match count, then artist name alphabetically. */
export function recommendArtists(artists: readonly ArtistWithTags[], preferredTagIds: ReadonlySet<string>, locale: string): ArtistRecommendation[] {
  return artists
    .map((artist) => {
      const matchingTags = artist.tags
        .filter((tag) => preferredTagIds.has(tag.id))
        .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
      return { ...artist, matchingTags, matchCount: matchingTags.length };
    })
    .filter((artist) => artist.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
}
