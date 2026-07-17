import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "./de.json";
import nl from "./nl.json";

export const supportedLanguages = ["de", "nl"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const storageKey = "hurricane-awards-language";

function isSupportedLanguage(language: string): language is SupportedLanguage {
  return supportedLanguages.includes(language as SupportedLanguage);
}

function normalizeLanguage(
  language: string | undefined,
): SupportedLanguage | null {
  if (!language) {
    return null;
  }

  const normalizedLanguage = language.toLowerCase().split("-")[0];

  return isSupportedLanguage(normalizedLanguage) ? normalizedLanguage : null;
}

function getInitialLanguage(): SupportedLanguage {
  const storedLanguage = normalizeLanguage(
    localStorage.getItem(storageKey) ?? undefined,
  );

  if (storedLanguage) {
    return storedLanguage;
  }

  const browserLanguage = normalizeLanguage(navigator.language);

  if (browserLanguage) {
    return browserLanguage;
  }

  return "de";
}

void i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    nl: { translation: nl },
  },
  lng: getInitialLanguage(),
  fallbackLng: "de",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

i18n.on("languageChanged", (language) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (normalizedLanguage) {
    localStorage.setItem(storageKey, normalizedLanguage);
  }
});

export default i18n;
