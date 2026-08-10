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

  it("recommends Roy Bianco for the same italo Schlager tag id", () => {
    const italoSchlagerId = "45ed53bb-ffbd-4d24-bca8-a103fcd52b84";
    const royBianco: ArtistWithTags = {
      id: "roy-bianco",
      name: "Roy Bianco & Die Abbrunzati Boys",
      description: null,
      tags: [
        { id: "another-tag", name: "Schlager" },
        { id: italoSchlagerId, name: "italo Schlager" },
      ],
    };

    expect(
      recommendArtists([royBianco], new Set([italoSchlagerId]), "de").map(
        (artist) => artist.name,
      ),
    ).toEqual(["Roy Bianco & Die Abbrunzati Boys"]);
  });

  it("returns each artist once for multiple matches and none without preferences", () => {
    const result = recommendArtists(artists, new Set(["rock", "indie"]), "de");
    expect(result.filter((artist) => artist.id === "b")).toHaveLength(1);
    expect(recommendArtists(artists, new Set(), "de")).toEqual([]);
  });
});
