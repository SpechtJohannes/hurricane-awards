import { describe, expect, it } from "vitest";
import { filterArtists, getAssignedArtistTags, prepareArtists } from "../domain/artistSearch";

const artists = prepareArtists(
  [
    { id: "z", name: "Zulu", description: null },
    { id: "a", name: "Alpha", description: null },
    { id: "z", name: "Duplikat", description: null },
  ],
  [
    { actId: "z", id: "rock", name: "Rock" },
    { actId: "a", id: "techno", name: "Techno" },
    { actId: "missing", id: "unused", name: "Unused" },
  ],
  "de",
);

describe("artistSearch", () => {
  it("bereitet Künstler dedupliziert, alphabetisch und mit typisierten Tags auf", () => {
    expect(artists.map(({ name }) => name)).toEqual(["Alpha", "Zulu"]);
    expect(artists[1].tags).toEqual([{ id: "rock", name: "Rock" }]);
    expect(getAssignedArtistTags(artists, "de").map(({ name }) => name)).toEqual(["Rock", "Techno"]);
  });

  it.each(["de-DE", "nl-NL"])(
    "sortiert sichtbare Namen mit Gross-/Kleinschreibung und Umlaut fuer %s nachvollziehbar",
    (locale) => {
      const sortedArtists = prepareArtists(
        [
          { id: "zulu", name: "Zulu", description: null },
          { id: "lower-alpha", name: "alpha", description: null },
          { id: "umlaut", name: "Ärzte", description: null },
          { id: "upper-alpha", name: "Alpha", description: null },
        ],
        [],
        locale,
      );

      expect(sortedArtists.map(({ name }) => name)).toEqual([
        "alpha",
        "Alpha",
        "Ärzte",
        "Zulu",
      ]);
    },
  );

  it("sucht in Namen und Tag-Teilbegriffen und ignoriert leere Suchwerte", () => {
    expect(filterArtists(artists, "ALP", new Set(), "de").map(({ name }) => name)).toEqual(["Alpha"]);
    expect(filterArtists(artists, "  ock ", new Set(), "de").map(({ name }) => name)).toEqual(["Zulu"]);
    expect(filterArtists(artists, "   ", new Set(), "de")).toHaveLength(2);
  });

  it("wendet mehrere Tags per ODER und anschließend die Suche an", () => {
    expect(filterArtists(artists, "", new Set(["rock", "techno"]), "de")).toHaveLength(2);
    expect(filterArtists(artists, "Zulu", new Set(["techno"]), "de")).toEqual([]);
  });
});
