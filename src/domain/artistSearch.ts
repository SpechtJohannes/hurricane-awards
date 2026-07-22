import type { ActArtistTag, ArtistTag } from "../data/artistTags";
import type { TimetableAct } from "../data/timetable";

export type ArtistWithTags = TimetableAct & { tags: ArtistTag[] };

export function prepareArtists(acts: TimetableAct[] | null, assignments: ActArtistTag[], locale: string): ArtistWithTags[] {
  const tagsByAct = new Map<string, ArtistTag[]>();
  for (const { actId, id, name } of assignments) {
    const tags = tagsByAct.get(actId) ?? [];
    if (!tags.some((tag) => tag.id === id)) tags.push({ id, name });
    tagsByAct.set(actId, tags);
  }
  const uniqueActs = new Map<string, TimetableAct>();
  for (const act of acts ?? []) if (!uniqueActs.has(act.id)) uniqueActs.set(act.id, act);
  return Array.from(uniqueActs.values())
    .map((act) => ({ ...act, tags: (tagsByAct.get(act.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" })) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
}

export function getAssignedArtistTags(artists: ArtistWithTags[], locale: string): ArtistTag[] {
  const tags = new Map<string, ArtistTag>();
  for (const artist of artists) for (const tag of artist.tags) tags.set(tag.id, tag);
  return Array.from(tags.values()).sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
}

export function filterArtists(artists: ArtistWithTags[], query: string, selectedTagIds: ReadonlySet<string>, locale: string): ArtistWithTags[] {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  return artists.filter((artist) => {
    if (selectedTagIds.size > 0 && !artist.tags.some((tag) => selectedTagIds.has(tag.id))) return false;
    if (!normalizedQuery) return true;
    return [artist.name, ...artist.tags.map((tag) => tag.name)].some((value) => value.toLocaleLowerCase(locale).includes(normalizedQuery));
  });
}
