import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ArtistDetail } from "../components/ArtistDetail";
import type { Timetable } from "../data/timetable";
import "../i18n";

const timetable: Timetable = {
  festivalDays: [
    { id: "day-1", date: "2026-06-19", label: "Freitag", sortOrder: 1 },
    { id: "day-2", date: "2026-06-20", label: "Samstag", sortOrder: 2 },
  ],
  stages: [
    { id: "stage-1", name: "Mainstage", sortOrder: 1, color: null },
    { id: "stage-2", name: "Zeltbühne", sortOrder: 2, color: null },
  ],
  acts: [
    { id: "act-1", name: "The Headliners", description: null },
    { id: "act-2", name: "Ohne Auftritt", description: null },
  ],
  performances: [
    { id: "late", festivalDayId: "day-2", stageId: "stage-2", actId: "act-1", startsAt: "2026-06-20T22:00:00.000Z", endsAt: null },
    { id: "early", festivalDayId: "day-1", stageId: "stage-1", actId: "act-1", startsAt: "2026-06-19T20:00:00.000Z", endsAt: "2026-06-19T21:00:00.000Z" },
  ],
  favoritePerformanceIds: [],
  performanceFavorites: [],
};

function renderDetail(overrides: Partial<ComponentProps<typeof ArtistDetail>> = {}) {
  const onToggleFavorite = vi.fn();
  render(
    <ArtistDetail timetable={timetable} actId="act-1" loadError="" favoriteError="" isLoading={false} isSavingFavorite={false} backButton={<button type="button">Zurück</button>} onToggleFavorite={onToggleFavorite} {...overrides} />,
  );
  return onToggleFavorite;
}

describe("ArtistDetail", () => {
  it("zeigt Act, alle Auftritte sowie Tag, Uhrzeit und Bühne chronologisch", () => {
    renderDetail();
    expect(screen.getByRole("heading", { name: "The Headliners" })).toBeVisible();
    const entries = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(entries).toHaveLength(2);
    expect(entries[0]).toHaveTextContent("Freitag");
    expect(entries[0]).toHaveTextContent("20:00–21:00 Uhr");
    expect(entries[0]).toHaveTextContent("Bühne: Mainstage");
    expect(entries[1]).toHaveTextContent("Samstag");
    expect(entries[1]).toHaveTextContent("Ab 22:00 Uhr");
    expect(entries[1]).toHaveTextContent("Bühne: Zeltbühne");
  });

  it("zeigt den Leerzustand für einen Act ohne Auftritte", () => {
    renderDetail({ actId: "act-2" });
    expect(screen.getByText(/noch keine auftritte geplant/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /als favorit/i })).toBeDisabled();
  });

  it("zeigt für eine ungültige Act-ID einen Fehlerzustand", () => {
    renderDetail({ actId: "missing" });
    expect(screen.getByRole("alert")).toHaveTextContent(/nicht gefunden/i);
  });

  it("zeigt einen vorhandenen Favoritenstatus und entfernt ihn", async () => {
    const user = userEvent.setup();
    const onToggleFavorite = renderDetail({ timetable: { ...timetable, favoritePerformanceIds: ["early", "late"] } });
    const button = screen.getByRole("button", { name: /aus favoriten entfernen/i });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(button);
    expect(onToggleFavorite).toHaveBeenCalledWith(["early", "late"], true);
  });

  it("markiert alle Auftritte über die bestehende Performance-Auswahl", async () => {
    const user = userEvent.setup();
    const onToggleFavorite = renderDetail();
    await user.click(screen.getByRole("button", { name: /als favorit markieren/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith(["early", "late"], false);
  });

  it("sperrt widersprüchliche Aktionen während des Speicherns", () => {
    renderDetail({ isSavingFavorite: true });
    expect(screen.getByRole("button", { name: /wird gespeichert/i })).toBeDisabled();
  });

  it("zeigt Lade-, Ladefehler- und Speicherfehlerzustände", () => {
    const props: ComponentProps<typeof ArtistDetail> = { timetable: null, actId: "act-1", loadError: "", favoriteError: "", isLoading: true, isSavingFavorite: false, backButton: null, onToggleFavorite: vi.fn() };
    const { rerender } = render(<ArtistDetail {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent(/werden geladen/i);
    rerender(<ArtistDetail {...props} isLoading={false} loadError="Laden fehlgeschlagen" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Laden fehlgeschlagen");
    rerender(<ArtistDetail {...props} timetable={timetable} isLoading={false} favoriteError="Speichern fehlgeschlagen" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen");
  });
});
