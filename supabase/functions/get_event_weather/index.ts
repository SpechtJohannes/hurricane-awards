import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, fetchJson, json } from "../_shared/http.ts";
import { normalizeOpenMeteoWeather, unavailableWeather, type WeatherPayload } from "../_shared/weather.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(unavailableWeather("unavailable"), 405);
  try {
    const { participantAccessCode } = await request.json();
    if (typeof participantAccessCode !== "string") return json(unavailableWeather("unavailable"), 400);
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: rows, error: locationError } = await client.rpc("ha_get_camp_location_link", {
      p_participant_access_code: participantAccessCode,
    });
    if (locationError) return json(unavailableWeather("unavailable"), 403);
    const location = Array.isArray(rows) ? rows[0] : rows;
    if (location?.camp_location_latitude == null || location?.camp_location_longitude == null || !location?.camp_location_label) {
      return json(unavailableWeather("missing_location"));
    }
    const now = new Date();
    const { data: cache } = await client.from("event_weather_cache").select("payload,fetched_at,expires_at").eq("event_key", "current").maybeSingle();
    if (cache && Date.parse(cache.expires_at) > now.getTime()) {
      return json({ ...(cache.payload as WeatherPayload), cached: true, stale: false });
    }
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(location.camp_location_latitude));
      url.searchParams.set("longitude", String(location.camp_location_longitude));
      url.searchParams.set("current", "temperature_2m,weather_code");
      url.searchParams.set("timezone", "UTC");
      const payload = normalizeOpenMeteoWeather(await fetchJson(url.toString()), location.camp_location_label, now.toISOString());
      if (!payload) throw new Error("invalid upstream payload");
      await client.from("event_weather_cache").upsert({
        event_key: "current", payload, fetched_at: payload.fetchedAt,
        expires_at: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      });
      return json(payload);
    } catch {
      if (cache) return json({ ...(cache.payload as WeatherPayload), cached: true, stale: true });
      return json(unavailableWeather("unavailable"));
    }
  } catch {
    return json(unavailableWeather("unavailable"));
  }
});
