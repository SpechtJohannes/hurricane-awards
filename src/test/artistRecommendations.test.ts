import { describe, expect, it } from "vitest";
import { recommendArtists } from "../domain/artistRecommendations";
import type { ArtistWithTags } from "../domain/artistSearch";

const artists: ArtistWithTags[] = [
  { id: "z", name: "Zulu", description: null, tags: [{ id: "rock", name: "Rock" }] },
  { id: "b", name: "Beta", description: null, tags: [{ id: "indie", name: "Indie" }, { id: "rock", name: "Rock" }] },
  { id: "a", name: "Alpha", description: null, tags: [{ id: "rock", name: "Rock" }] },
  { id: "x", name: "Other", description: null, tags: [{ id: "pop", name: "Pop" }] },
];

describe("recommendArtists", () => {
  it("returns matches with stable tag ids, all matching tags and deterministic ranking", () => {
    const result = recommendArtists(artists, new Set(["rock", "indie"]), "de");
    expect(result.map(({ name, matchCount }) => [name, matchCount])).toEqual([["Beta", 2], ["Alpha", 1], ["Zulu", 1]]);
    expect(result[0].matchingTags.map((tag) => tag.name)).toEqual(["Indie", "Rock"]);
  });

  it("does not recommend artists without a matching tag", () => {
    expect(recommendArtists(artists, new Set(["pop"]), "de").map((artist) => artist.name)).toEqual(["Other"]);
  });
});
