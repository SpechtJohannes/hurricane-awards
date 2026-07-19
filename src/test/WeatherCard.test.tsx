import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WeatherCard } from "../components/WeatherCard";
import { loadEventWeather } from "../data/weather";
import i18n from "../i18n";

vi.mock("../data/weather", async (original) => ({
  ...(await original<typeof import("../data/weather")>()), loadEventWeather: vi.fn(),
}));

describe("WeatherCard", () => {
  beforeEach(async () => { vi.clearAllMocks(); await i18n.changeLanguage("de"); });

  it("shows loading and then available weather with camp location, source and time", async () => {
    vi.mocked(loadEventWeather).mockResolvedValue({
      status: "available", temperatureCelsius: 18.6, weatherCode: 61, condition: "rain",
      observedAt: "2026-07-19T10:00:00Z", fetchedAt: "2026-07-19T10:01:00Z",
      locationName: "Scheeßel", sourceName: "Open Meteo", sourceUrl: "https://open-meteo.com/",
      cached: false, stale: false,
    });
    render(<WeatherCard participantAccessCode="ALICE42" />);
    expect(screen.getByRole("status")).toHaveTextContent(/geladen/i);
    expect(await screen.findByText("19 °C")).toBeVisible();
    expect(screen.getByText("Campstandort: Scheeßel")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Meteo" })).toBeVisible();
    expect(screen.getByText(/Letzte Aktualisierung:/)).toBeVisible();
  });

  it.each([
    ["missing_location", /noch kein Campstandort/i],
    ["unavailable", /derzeit nicht verfügbar/i],
  ] as const)("shows the %s state", async (status, message) => {
    vi.mocked(loadEventWeather).mockResolvedValue({
      status, temperatureCelsius: null, weatherCode: null, condition: "unknown",
      observedAt: null, fetchedAt: "2026-07-19T10:01:00Z", locationName: null,
      sourceName: "Open Meteo", sourceUrl: null, cached: false, stale: false,
    });
    render(<WeatherCard participantAccessCode="ALICE42" />);
    expect(await screen.findByText(message)).toBeVisible();
  });

  it("labels stale cached data", async () => {
    vi.mocked(loadEventWeather).mockResolvedValue({
      status: "available", temperatureCelsius: 12, weatherCode: 3, condition: "cloudy",
      observedAt: "2026-07-19T09:00:00Z", fetchedAt: "2026-07-19T09:01:00Z",
      locationName: "Scheeßel", sourceName: "Open Meteo", sourceUrl: null, cached: true, stale: true,
    });
    render(<WeatherCard participantAccessCode="ALICE42" />);
    expect(await screen.findByText("Zuletzt verfügbare Wetterdaten")).toBeVisible();
  });
});
