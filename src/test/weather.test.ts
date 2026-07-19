import { describe, expect, it } from "vitest";
import { normalizeOpenMeteoWeather, weatherConditionForCode } from "../../supabase/functions/_shared/weather";

describe("Open Meteo normalization", () => {
  it.each([
    [0, "clear"], [2, "partly_cloudy"], [3, "cloudy"], [45, "fog"],
    [55, "drizzle"], [63, "rain"], [75, "snow"], [82, "showers"],
    [95, "thunderstorm"], [42, "unknown"],
  ])("maps code %s to %s", (code, condition) => {
    expect(weatherConditionForCode(code)).toBe(condition);
  });

  it("normalizes a valid current-weather response", () => {
    expect(normalizeOpenMeteoWeather({ current: {
      temperature_2m: 21.4, weather_code: 2, time: "2026-07-19T10:00:00Z",
    } }, "Scheeßel", "2026-07-19T10:01:00Z")).toMatchObject({
      status: "available", temperatureCelsius: 21.4, condition: "partly_cloudy",
      locationName: "Scheeßel", sourceName: "Open Meteo", cached: false, stale: false,
    });
  });

  it.each([
    {}, { current: {} }, { current: { temperature_2m: null, weather_code: 2, time: "2026-07-19T10:00:00Z" } },
    { current: { temperature_2m: 20, weather_code: "2", time: "bad" } },
  ])("rejects missing or invalid external values", (input) => {
    expect(normalizeOpenMeteoWeather(input, "Scheeßel")).toBeNull();
  });
});
