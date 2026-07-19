import { getSupabase } from "../lib/supabase";
import type { ParticipantAccessContext } from "./accessContext";
import type { WeatherPayload } from "../../supabase/functions/_shared/weather";

export type { WeatherPayload, WeatherCondition } from "../../supabase/functions/_shared/weather";

export async function loadEventWeather(context: ParticipantAccessContext): Promise<WeatherPayload> {
  const { data, error } = await getSupabase().functions.invoke("get_event_weather", {
    body: { participantAccessCode: context.participantAccessCode },
  });
  if (error || !data || !["available", "unavailable", "missing_location"].includes(data.status)) {
    throw new Error("weather unavailable");
  }
  return data as WeatherPayload;
}
