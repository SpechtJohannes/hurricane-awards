import { describe, expect, it } from "vitest";
import i18n from "../i18n";

describe("i18n test infrastructure", () => {
  it("loads translations and applies replacements", () => {
    expect(
      i18n.t("app.ariaLabel", {
        count: 3,
        festivalName: "Hurricane Awards 2026",
      }),
    ).toContain("3");
  });

  it("falls back to German when a translation is missing", async () => {
    await i18n.changeLanguage("nl");

    expect(
      i18n.t("app.ariaLabel", {
        count: 3,
        festivalName: "Hurricane Awards 2026",
      }),
    ).toBe("Hurricane Awards 2026 met 3 deelnemers");
    expect(i18n.t("test.missing.key")).toBe("test.missing.key");
  });

  it("enthaelt Festival Playlist Texte auf Deutsch und Niederlaendisch", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("info.musicPlaylist.open")).toBe("In Spotify öffnen");
    expect(i18n.t("admin.musicPlaylist.save")).toBe("Playlist speichern");

    await i18n.changeLanguage("nl");

    expect(i18n.t("info.musicPlaylist.open")).toBe("Openen in Spotify");
    expect(i18n.t("admin.musicPlaylist.save")).toBe("Playlist opslaan");
  });

  it("enthaelt Timetable Texte auf Deutsch und Niederlaendisch", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("navigation.timetable")).toBe("Timetable");
    expect(i18n.t("timetable.empty")).toContain("noch keine Auftritte");
    expect(i18n.t("timetable.emptyStages")).toContain("noch keine Bühnen");
    expect(i18n.t("timetable.emptyDay")).toContain("An diesem Tag");
    expect(i18n.t("timetable.scrollHint")).toContain("Seitlich scrollen");
    expect(i18n.t("timetable.unknownAct")).toBe("Unbekannter Act");
    expect(i18n.t("timetable.favorite.add")).toBe("Als Favorit markieren");
    expect(i18n.t("timetable.favorite.badge")).toBe("Favorit");
    expect(i18n.t("timetable.favorite.remove")).toBe("Favorit entfernen");
    expect(i18n.t("timetable.favorite.sharedLabel")).toBe("Auch dabei");
    expect(i18n.t("timetable.favorite.sharedMore", { count: 2 })).toBe("+2");

    await i18n.changeLanguage("nl");

    expect(i18n.t("navigation.timetable")).toBe("Timetable");
    expect(i18n.t("timetable.empty")).toContain("nog geen optredens");
    expect(i18n.t("timetable.emptyStages")).toContain("nog geen podia");
    expect(i18n.t("timetable.emptyDay")).toContain("Voor deze dag");
    expect(i18n.t("timetable.scrollHint")).toContain("Scroll zijwaarts");
    expect(i18n.t("timetable.unknownAct")).toBe("Onbekende act");
    expect(i18n.t("timetable.favorite.add")).toBe("Als favoriet markeren");
    expect(i18n.t("timetable.favorite.badge")).toBe("Favoriet");
    expect(i18n.t("timetable.favorite.remove")).toBe("Favoriet verwijderen");
    expect(i18n.t("timetable.favorite.sharedLabel")).toBe("Ook erbij");
    expect(i18n.t("timetable.favorite.sharedMore", { count: 2 })).toBe("+2");
  });

  it("enthaelt Bingo Erklaerungen auf Deutsch und Niederlaendisch", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("navigation.games")).toBe("Spiele");
    expect(i18n.t("games.title")).toBe("Spiele");
    expect(i18n.t("games.navigationLabel")).toBe("Spielauswahl");
    expect(i18n.t("bingo.description")).toContain(
      "automatisch eine eigene Bingokarte",
    );
    expect(i18n.t("bingo.description")).toContain("außerhalb der App");

    await i18n.changeLanguage("nl");

    expect(i18n.t("navigation.games")).toBe("Spellen");
    expect(i18n.t("games.title")).toBe("Spellen");
    expect(i18n.t("games.navigationLabel")).toBe("Spelkeuze");
    expect(i18n.t("bingo.description")).toContain(
      "automatisch een eigen bingokaart",
    );
    expect(i18n.t("bingo.description")).toContain("buiten de app");
  });

  it("enthaelt Turniertexte auf Deutsch und Niederlaendisch", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("games.tournaments")).toBe("Turniere");
    expect(i18n.t("tournaments.empty")).toContain("noch keine Turniere");
    expect(i18n.t("tournaments.bracket.final")).toBe("Finale");
    expect(i18n.t("tournaments.bracket.openSlot")).toBe("Offen");
    expect(
      i18n.t("tournaments.bracket.byeNotice", { name: "Alice" }),
    ).toContain("Freilos: Alice");
    expect(i18n.t("admin.tournaments.createButton")).toBe("Turnier anlegen");
    expect(i18n.t("admin.tournaments.modes.knockout")).toBe("KO Turnier");
    expect(i18n.t("admin.tournaments.byeNotice")).toContain("Freilos");
    expect(i18n.t("admin.tournaments.errors.participantsRequired")).toContain(
      "mindestens zwei",
    );

    await i18n.changeLanguage("nl");

    expect(i18n.t("games.tournaments")).toBe("Toernooien");
    expect(i18n.t("tournaments.empty")).toContain("nog geen toernooien");
    expect(i18n.t("tournaments.bracket.final")).toBe("Finale");
    expect(i18n.t("tournaments.bracket.openSlot")).toBe("Open");
    expect(
      i18n.t("tournaments.bracket.byeNotice", { name: "Alice" }),
    ).toContain("Vrijloting: Alice");
    expect(i18n.t("admin.tournaments.createButton")).toBe("Toernooi aanmaken");
    expect(i18n.t("admin.tournaments.modes.knockout")).toBe(
      "Knock-outtoernooi",
    );
    expect(i18n.t("admin.tournaments.byeNotice")).toContain("vrijloting");
    expect(i18n.t("admin.tournaments.errors.participantsRequired")).toContain(
      "minimaal twee",
    );
  });

  it("enthaelt Abstimmungs-Empty-State-Texte auf Deutsch und Niederlaendisch", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("categories.empty")).toContain("keine Abstimmungen geöffnet");

    await i18n.changeLanguage("nl");

    expect(i18n.t("categories.empty")).toContain("geen open stemmingen");
  });

  it("enthaelt Profiltexte fuer Login- und Profilzustand", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("navigation.dashboard")).toBe("Start");
    expect(i18n.t("navigation.backToDashboard")).toBe(
      "Zur Dashboard-Übersicht",
    );
    expect(i18n.t("dashboard.greeting", { name: "Alice" })).toBe("Hallo Alice");
    expect(i18n.t("dashboard.tiles.awards.title")).toBe("Awards");
    expect(i18n.t("dashboard.tiles.voting.title")).toBe("Abstimmungen");
    expect(i18n.t("dashboard.tiles.profile.status.guest")).toContain(
      "Teilnehmercode",
    );
    expect(i18n.t("identity.loginTitle")).toContain("Teilnehmercode");
    expect(i18n.t("identity.profileTitle")).toBe("Dein Profil");
    expect(i18n.t("identity.avatar.selected")).toBe("Ausgewählt");

    await i18n.changeLanguage("nl");

    expect(i18n.t("navigation.dashboard")).toBe("Start");
    expect(i18n.t("navigation.backToDashboard")).toBe(
      "Naar dashboardoverzicht",
    );
    expect(i18n.t("dashboard.greeting", { name: "Alice" })).toBe("Hallo Alice");
    expect(i18n.t("dashboard.tiles.awards.title")).toBe("Awards");
    expect(i18n.t("dashboard.tiles.voting.title")).toBe("Stemmingen");
    expect(i18n.t("dashboard.tiles.profile.status.guest")).toContain(
      "deelnemerscode",
    );
    expect(i18n.t("identity.loginTitle")).toContain("deelnemerscode");
    expect(i18n.t("identity.profileTitle")).toBe("Je profiel");
    expect(i18n.t("identity.avatar.selected")).toBe("Gekozen");
  });

  it("enthaelt Admin Texte fuer Festivaltage auf Deutsch und Niederlaendisch", async () => {
    await i18n.changeLanguage("de");

    expect(i18n.t("admin.navigation.timetable")).toBe("Timetable");
    expect(i18n.t("admin.timetable.days.createButton")).toBe(
      "Festivaltag anlegen",
    );
    expect(i18n.t("admin.timetable.stages.createButton")).toBe("Bühne anlegen");
    expect(i18n.t("admin.timetable.stages.colorLabel")).toBe("Farbe");
    expect(i18n.t("admin.timetable.stages.defaultColor")).toBe("Standard");
    expect(i18n.t("admin.timetable.acts.createButton")).toBe("Act anlegen");
    expect(i18n.t("admin.timetable.performances.createButton")).toBe(
      "Auftritt anlegen",
    );

    await i18n.changeLanguage("nl");

    expect(i18n.t("admin.navigation.timetable")).toBe("Timetable");
    expect(i18n.t("admin.timetable.days.createButton")).toBe(
      "Festivaldag aanmaken",
    );
    expect(i18n.t("admin.timetable.stages.createButton")).toBe(
      "Podium aanmaken",
    );
    expect(i18n.t("admin.timetable.stages.colorLabel")).toBe("Kleur");
    expect(i18n.t("admin.timetable.stages.defaultColor")).toBe("Standaard");
    expect(i18n.t("admin.timetable.acts.createButton")).toBe("Act aanmaken");
    expect(i18n.t("admin.timetable.performances.createButton")).toBe(
      "Optreden aanmaken",
    );
  });

  it("stellt deutsche Sonderzeichen auch in dynamischen Übersetzungen korrekt dar", async () => {
    await i18n.changeLanguage("de");

    const translations = [
      i18n.t("info.documentTypes.site_map"),
      i18n.t("admin.horseRacing.openBetting"),
      i18n.t("navigation.backToDashboard"),
      i18n.t("horseRacing.description"),
      i18n.t("tournaments.bracket.label", { name: "Müller & Söhne" }),
    ];

    expect(translations).toEqual([
      "Geländeplan",
      "Wettphase öffnen",
      "Zur Dashboard-Übersicht",
      expect.stringContaining("außerhalb"),
      "Turnierbaum für Müller & Söhne",
    ]);
    expect(translations.join(" ")).not.toMatch(/Ã|Â|�/);
  });
});
