import { useState } from "react";
import { useTranslation } from "react-i18next";

type EventBrandProps = {
  festivalName: string;
  logoUrl: string | null;
  onClick: () => void;
};

export function EventBrand({
  festivalName,
  logoUrl,
  onClick,
}: EventBrandProps) {
  const { t } = useTranslation();
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogo = Boolean(logoUrl) && logoUrl !== failedLogoUrl;

  return (
    <button
      className="app-header__brand"
      type="button"
      title={festivalName}
      aria-label={festivalName}
      onClick={onClick}
    >
      <p>{t("dashboard.festivalLabel")}</p>
      {showLogo ? (
        <span className="app-header__logo-frame">
          <img
            className="app-header__logo"
            src={logoUrl ?? undefined}
            alt={t("header.eventLogoAlt", { festivalName })}
            onError={() => setFailedLogoUrl(logoUrl)}
          />
        </span>
      ) : (
        <h1 id="app-title">{festivalName}</h1>
      )}
    </button>
  );
}
