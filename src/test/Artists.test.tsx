import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Artists } from "../components/Artists";
import type { TimetableAct } from "../data/timetable";
import "../i18n";

const acts: TimetableAct[] = [
  { id: "z", name: "Zulu", description: null },
  { id: "a", name: "Äther", description: null },
  { id: "b", name: "beta", description: null },
  { id: "b", name: "Duplikat", description: null },
];

function renderArtists(
  overrides: Partial<ComponentProps<typeof Artists>> = {},
) {
  const onSelectAct = vi.fn();
  render(
    <Artists
      acts={acts}
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
      .map((button) => button.textContent);

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

    expect(screen.getByRole("button", { name: "beta" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Zulu" }),
    ).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Zulu" }));
    expect(onSelectAct).toHaveBeenCalledWith("z");
  });
});
