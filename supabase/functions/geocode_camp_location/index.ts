import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, fetchJson, json } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const { participantAccessCode, query } = await request.json();
    if (typeof participantAccessCode !== "string" || typeof query !== "string" || !query.trim()) {
      return json({ error: "invalid_request" }, 400);
    }
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin, error } = await client.rpc("ha_has_admin_access", {
      p_participant_access_code: participantAccessCode,
    });
    if (error || !isAdmin) return json({ error: "forbidden" }, 403);
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query.trim());
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "de");
    url.searchParams.set("format", "json");
    const external = await fetchJson(url.toString()) as { results?: Array<Record<string, unknown>> };
    const result = external.results?.[0];
    if (!result || typeof result.name !== "string" || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
      return json({ status: "not_found" });
    }
    const parts = [result.name, result.admin1, result.country].filter((part) => typeof part === "string");
    return json({ status: "available", result: {
      label: [...new Set(parts)].join(", "), latitude: result.latitude,
      longitude: result.longitude, timezone: typeof result.timezone === "string" ? result.timezone : null,
    }});
  } catch {
    return json({ error: "geocoding_unavailable" }, 503);
  }
});
