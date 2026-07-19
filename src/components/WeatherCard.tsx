import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadEventWeather, type WeatherPayload, type WeatherCondition } from "../data/weather";

const weatherIcons: Record<WeatherCondition, string> = {
  clear: "☀", partly_cloudy: "⛅", cloudy: "☁", fog: "≋", drizzle: "🌦",
  rain: "🌧", snow: "❄", showers: "🌦", thunderstorm: "⛈", unknown: "–",
};

export function WeatherCard({ participantAccessCode }: { participantAccessCode: string | null }) {
  const { t, i18n } = useTranslation();
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(Boolean(participantAccessCode));

  useEffect(() => {
    let current = true;
    if (!participantAccessCode) {
      return;
    }
    loadEventWeather({ participantAccessCode })
      .then((result) => { if (current) setWeather(result); })
      .catch(() => { if (current) setWeather(null); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [participantAccessCode]);

  const locale = i18n.resolvedLanguage?.startsWith("nl") ? "nl-NL" : "de-DE";
  return (
    <article className="dashboard-weather" aria-label={t("dashboard.weather.title")}>
      <span className="dashboard-weather__title">{t("dashboard.weather.title")}</span>
      {loading ? <p role="status">{t("dashboard.weather.loading")}</p> : null}
      {!loading && (!weather || weather.status === "unavailable") ?
        <p>{t("dashboard.weather.unavailable")}</p> : null}
      {!loading && weather?.status === "missing_location" ?
        <p>{t("dashboard.weather.missingLocation")}</p> : null}
      {!loading && weather?.status === "available" ? <>
        {weather.stale ? <small className="dashboard-weather__stale">{t("dashboard.weather.stale")}</small> : null}
        <div className="dashboard-weather__reading">
          <span aria-hidden="true">{weatherIcons[weather.condition]}</span>
          <strong>{Math.round(weather.temperatureCelsius ?? 0)} °C</strong>
        </div>
        <p>{t(`dashboard.weather.conditions.${weather.condition}`)}</p>
        <p className="dashboard-weather__location">{t("dashboard.weather.atCampLocation", { location: weather.locationName })}</p>
        <small>{t("dashboard.weather.updatedAt", { time: new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(weather.observedAt ?? weather.fetchedAt)) })}</small>
        <small>{t("dashboard.weather.source")} <a href={weather.sourceUrl ?? "https://open-meteo.com/"} target="_blank" rel="noreferrer">{weather.sourceName}</a></small>
      </> : null}
    </article>
  );
}
