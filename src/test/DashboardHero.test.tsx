import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardHero } from "../components/DashboardHero";
import type { Timetable } from "../data/timetable";
import i18n from "../i18n";

const referenceInstant = new Date("2026-07-30T10:00:00.000Z");

const timetable: Timetable = {
  festivalDays: [
    { id: "day-1", date: "2026-07-30", label: "Donnerstag", sortOrder: 1 },
    { id: "day-2", date: "2026-07-31", label: "Freitag", sortOrder: 2 },
  ],
  stages: [{ id: "stage-1", name: "Main Stage", sortOrder: 1, color: null }],
  acts: [
    { id: "act-past", name: "Vergangener Act", description: null },
    { id: "act-next", name: "Nächster Act", description: null },
    { id: "act-later", name: "Späterer Act", description: null },
  ],
  performances: [
    {
      id: "past",
      festivalDayId: "day-1",
      stageId: "stage-1",
      actId: "act-past",
      startsAt: "2026-07-30T09:00:00.000Z",
      endsAt: "2026-07-30T09:45:00.000Z",
    },
    {
      id: "later",
      festivalDayId: "day-2",
      stageId: "stage-1",
      actId: "act-later",
      startsAt: "2026-07-31T18:00:00.000Z",
      endsAt: null,
    },
    {
      id: "next",
      festivalDayId: "day-1",
      stageId: "stage-1",
      actId: "act-next",
      startsAt: "2026-07-30T12:00:00.000Z",
      endsAt: null,
    },
  ],
  favoritePerformanceIds: ["past", "later", "next"],
  performanceFavorites: [],
};

type RenderHeroOptions = {
  eventLogoUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  loadedTimetable?: Timetable | null;
  activeCategory?: {
    id: string;
    title: string;
    description: string;
    status: "open";
  } | null;
};

function renderHero({
  eventLogoUrl = null,
  startDate = "2026-08-01",
  endDate = "2026-08-03",
  loadedTimetable = timetable,
  activeCategory = {
    id: "category-1",
    title: "Beste Festival-Energie",
    description: "",
    status: "open" as const,
  },
}: RenderHeroOptions = {}) {
  return render(
    <DashboardHero
      festivalName="Hurricane Awards 2026"
      eventLogoUrl={eventLogoUrl}
      participantName="Alice Beispielname"
      isAuthenticated
      eventStartDate={startDate}
      eventEndDate={endDate}
      referenceInstant={referenceInstant}
      timetable={loadedTimetable}
      activeCategory={activeCategory}
      showEventStatus
      onOpenTimetable={vi.fn()}
      onOpenVoting={vi.fn()}
    />,
  );
}

describe("DashboardHero", () => {
  it("zeigt Eventname, persoenliche Begruessung und Countdown", async () => {
    await i18n.changeLanguage("de");
    renderHero();

    expect(screen.getByText("Hurricane Awards 2026")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Hallo Alice Beispielname" }),
    ).toBeVisible();
    expect(screen.getByText("Noch 2 Tage bis zum Event")).toBeVisible();
  });

  it("bindet ein vorhandenes Eventlogo unverzerrt in die Visualisierung ein", async () => {
    await i18n.changeLanguage("de");
    renderHero({ eventLogoUrl: "https://example.test/event-logo.png" });

    const logo = screen.getByRole("img", {
      name: "Logo von Hurricane Awards 2026",
    });
    expect(logo).toBeVisible();
    expect(logo).toHaveAttribute("src", "https://example.test/event-logo.png");
  });

  it("bleibt ohne Eventlogo vollstaendig und kennzeichnet die Szene als dekorativ", async () => {
    await i18n.changeLanguage("de");
    const { container } = renderHero({ eventLogoUrl: null });

    expect(screen.getByTestId("dashboard-hero")).toBeVisible();
    expect(screen.getByText("Hurricane Awards 2026")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      container.querySelector(".dashboard-hero__festival-scene"),
    ).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: /Beste Festival-Energie/i })).toBeEnabled();
  });

  it("zeigt ohne Eventdatum einen neutralen Status", async () => {
    await i18n.changeLanguage("de");
    renderHero({ startDate: null, endDate: null });

    expect(
      screen.getByText("Der Eventzeitraum ist noch nicht hinterlegt"),
    ).toBeVisible();
  });

  it("waehlt den naechsten zukuenftigen Favoriten und ignoriert vergangene", async () => {
    await i18n.changeLanguage("de");
    renderHero();

    expect(screen.getByText("Nächster Act")).toBeVisible();
    expect(screen.getByText(/Main Stage/)).toBeVisible();
    expect(screen.queryByText("Vergangener Act")).not.toBeInTheDocument();
    expect(screen.queryByText("Späterer Act")).not.toBeInTheDocument();
  });

  it("zeigt nur eine tatsaechlich aktive Abstimmung", async () => {
    await i18n.changeLanguage("de");
    const { rerender } = renderHero();

    expect(screen.getByText("Beste Festival-Energie")).toBeVisible();

    rerender(
      <DashboardHero
        festivalName="Hurricane Awards 2026"
        participantName="Alice"
        isAuthenticated
        eventStartDate="2026-08-01"
        eventEndDate="2026-08-03"
        referenceInstant={referenceInstant}
        timetable={timetable}
        activeCategory={null}
        showEventStatus
        onOpenTimetable={vi.fn()}
        onOpenVoting={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("Beste Festival-Energie"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Aktive Abstimmung")).not.toBeInTheDocument();
  });
});
