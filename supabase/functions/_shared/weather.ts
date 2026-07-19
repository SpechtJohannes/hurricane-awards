export const weatherConditions = [
  "clear", "partly_cloudy", "cloudy", "fog", "drizzle", "rain", "snow",
  "showers", "thunderstorm", "unknown",
] as const;
export type WeatherCondition = (typeof weatherConditions)[number];

export type WeatherPayload = {
  status: "available" | "unavailable" | "missing_location";
  temperatureCelsius: number | null;
  weatherCode: number | null;
  condition: WeatherCondition;
  observedAt: string | null;
  fetchedAt: string;
  locationName: string | null;
  sourceName: "Open Meteo";
  sourceUrl: string | null;
  cached: boolean;
  stale: boolean;
};

export function weatherConditionForCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly_cloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([80, 81, 82].includes(code)) return "showers";
  if ([95, 96, 99].includes(code)) return "thunderstorm";
  return "unknown";
}

export function normalizeOpenMeteoWeather(
  input: unknown,
  locationName: string,
  fetchedAt = new Date().toISOString(),
): WeatherPayload | null {
  if (!input || typeof input !== "object") return null;
  const current = (input as { current?: unknown }).current;
  if (!current || typeof current !== "object") return null;
  const value = current as Record<string, unknown>;
  if (!Number.isFinite(value.temperature_2m) || !Number.isInteger(value.weather_code)) return null;
  if (typeof value.time !== "string" || !Number.isFinite(Date.parse(value.time))) return null;
  const code = value.weather_code as number;
  if (code < 0 || code > 99) return null;
  return {
    status: "available",
    temperatureCelsius: value.temperature_2m as number,
    weatherCode: code,
    condition: weatherConditionForCode(code),
    observedAt: new Date(value.time).toISOString(),
    fetchedAt,
    locationName,
    sourceName: "Open Meteo",
    sourceUrl: "https://open-meteo.com/",
    cached: false,
    stale: false,
  };
}

export function unavailableWeather(status: "unavailable" | "missing_location"): WeatherPayload {
  return {
    status, temperatureCelsius: null, weatherCode: null, condition: "unknown",
    observedAt: null, fetchedAt: new Date().toISOString(), locationName: null,
    sourceName: "Open Meteo", sourceUrl: status === "unavailable" ? "https://open-meteo.com/" : null,
    cached: false, stale: false,
  };
}
