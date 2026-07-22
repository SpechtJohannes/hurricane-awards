import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Artists } from "../components/Artists";
import type { TimetableAct } from "../data/timetable";
import type { ActArtistTag } from "../data/artistTags";
import "../i18n";

const acts: TimetableAct[] = [
  { id: "z", name: "Zulu", description: null },
  { id: "a", name: "Äther", description: null },
  { id: "b", name: "beta", description: null },
  { id: "b", name: "Duplikat", description: null },
];
const artistTags: ActArtistTag[] = [
  { actId: "z", id: "rock", name: "Rock" },
  { actId: "a", id: "techno", name: "Techno" },
  { actId: "b", id: "indie", name: "Indie" },
  { actId: "missing", id: "unused", name: "Nicht zugeordnet" },
];

function renderArtists(
  overrides: Partial<ComponentProps<typeof Artists>> = {},
) {
  const onSelectAct = vi.fn();
  render(
    <Artists
      acts={acts}
      artistTags={artistTags}
      error=""
      isLoading={false}
      selectedActId={null}
      dashboardBackButton={<button type="button">Zurück</button>}
      onSelectAct={onSelectAct}
      {...overrides}
    />,
  );
  return onSelectAct;
}

describe("Artists", () => {
  it("zeigt alle Acts dedupliziert und alphabetisch sortiert", () => {
    renderArtists();
    const names = within(screen.getByRole("list"))
      .getAllByRole("button")
      .map((button) => button.querySelector("strong")?.textContent);

    expect(names).toEqual(["Äther", "beta", "Zulu"]);
    expect(screen.queryByText("Duplikat")).not.toBeInTheDocument();
  });

  it("filtert unmittelbar, ohne Beachtung von Großschreibung und Rand-Leerzeichen", async () => {
    const user = userEvent.setup();
    renderArtists();

    await user.type(
      screen.getByRole("searchbox", { name: /künstler suchen/i }),
      "  BETA  ",
    );

    expect(screen.getByText("beta")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Zulu" }),
    ).not.toBeInTheDocument();
  });

  it("findet Künstler anhand vollständiger und teilweiser Schlagwörter ohne Beachtung der Großschreibung", async () => {
    const user = userEvent.setup();
    renderArtists();
    const search = screen.getByRole("searchbox", { name: /künstler suchen/i });

    await user.type(search, "ROCK");
    expect(screen.getByText("Zulu")).toBeVisible();
    expect(screen.queryByText("beta")).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "tech");
    expect(screen.getByText("Äther")).toBeVisible();
  });

  it("filtert mit mehreren Schlagwörtern per ODER und kombiniert danach die Textsuche", async () => {
    const user = userEvent.setup();
    renderArtists();
    await user.click(screen.getByRole("button", { name: "Rock" }));
    await user.click(screen.getByRole("button", { name: "Indie" }));
    expect(screen.getByText("Zulu")).toBeVisible();
    expect(screen.getByText("beta")).toBeVisible();
    expect(screen.queryByText("Äther")).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "beta");
    expect(screen.getByText("beta")).toBeVisible();
    expect(screen.queryByText("Zulu")).not.toBeInTheDocument();
  });

  it("entfernt einzelne Filter und setzt alle Filter zurück", async () => {
    const user = userEvent.setup();
    renderArtists();
    await user.click(screen.getByRole("button", { name: "Rock" }));
    await user.click(screen.getByRole("button", { name: "Indie" }));
    await user.click(screen.getByRole("button", { name: /filter rock entfernen/i }));
    expect(screen.queryByText("Zulu")).not.toBeInTheDocument();
    expect(screen.getByText("beta")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /alle filter zurücksetzen/i }));
    expect(screen.getByText("Zulu")).toBeVisible();
    expect(screen.getByText("Äther")).toBeVisible();
  });

  it("bietet nur Schlagwörter an, die einem sichtbaren Künstler zugeordnet sind", () => {
    renderArtists();
    expect(screen.getByRole("button", { name: "Rock" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Nicht zugeordnet" })).not.toBeInTheDocument();
  });

  it("zeigt einen eigenen Zustand bei einer erfolglosen Suche", async () => {
    const user = userEvent.setup();
    renderArtists();

    await user.type(
      screen.getByRole("searchbox", { name: /künstler suchen/i }),
      "unbekannt",
    );

    expect(screen.getByText(/keine künstler passen/i)).toBeVisible();
  });

  it("zeigt den Leerzustand, wenn keine Acts vorhanden sind", () => {
    renderArtists({ acts: [] });
    expect(screen.getByText(/noch keine künstler angelegt/i)).toBeVisible();
  });

  it("übergibt beim Aktivieren die Act-ID für die Detailnavigation", async () => {
    const user = userEvent.setup();
    const onSelectAct = renderArtists();

    await user.click(screen.getByRole("button", { name: /Zulu/ }));
    expect(onSelectAct).toHaveBeenCalledWith("z");
  });
});
