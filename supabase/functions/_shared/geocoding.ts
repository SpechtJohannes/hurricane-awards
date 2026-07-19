export type GeocodedLocation = {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

export type GeocodingResult =
  | { status: "available"; result: GeocodedLocation; matchedQuery: string; fallbackUsed: boolean }
  | { status: "not_found" };

type OpenMeteoGeocodingResponse = {
  results?: Array<Record<string, unknown>>;
};

const streetTokenPattern = /(?:allee|chaussee|damm|gasse|platz|ring|straße|strasse|ufer|weg)$/iu;
const houseNumberPattern = /^\d+[a-z]?(?:[-/]\d+[a-z]?)?$/iu;

export function simplifiedGeocodingQuery(input: string): string | null {
  const query = input.trim().replace(/\s+/gu, " ");
  const commaParts = query.split(",").map((part) => part.trim()).filter(Boolean);

  if (commaParts.length > 1) {
    const locality = commaParts.at(-1)!;
    return locality !== query ? locality : null;
  }

  const tokens = query.split(" ");
  if (tokens.length < 2 || !streetTokenPattern.test(tokens[0])) return null;

  let localityStart = 1;
  while (localityStart < tokens.length && houseNumberPattern.test(tokens[localityStart])) {
    localityStart += 1;
  }
  const locality = tokens.slice(localityStart).join(" ");
  return locality && locality !== query ? locality : null;
}

export function normalizeGeocodingResponse(input: unknown): GeocodedLocation | null {
  if (!input || typeof input !== "object") return null;
  const result = (input as OpenMeteoGeocodingResponse).results?.[0];
  if (!result || typeof result.name !== "string" || !result.name.trim() ||
      !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) return null;

  const parts = [result.name, result.admin1, result.country]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .map((part) => part.trim());
  return {
    label: [...new Set(parts)].join(", "),
    latitude: result.latitude as number,
    longitude: result.longitude as number,
    timezone: typeof result.timezone === "string" && result.timezone.trim() ? result.timezone : null,
  };
}

export async function resolveGeocoding(
  input: string,
  search: (query: string) => Promise<unknown>,
): Promise<GeocodingResult> {
  const fullQuery = input.trim();
  const direct = normalizeGeocodingResponse(await search(fullQuery));
  if (direct) return { status: "available", result: direct, matchedQuery: fullQuery, fallbackUsed: false };

  const fallbackQuery = simplifiedGeocodingQuery(fullQuery);
  if (!fallbackQuery) return { status: "not_found" };
  const fallback = normalizeGeocodingResponse(await search(fallbackQuery));
  if (!fallback) return { status: "not_found" };
  return { status: "available", result: fallback, matchedQuery: fallbackQuery, fallbackUsed: true };
}
