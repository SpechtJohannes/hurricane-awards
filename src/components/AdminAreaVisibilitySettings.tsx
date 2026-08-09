import { useTranslation } from "react-i18next";
import type {
  ParticipantAreaKey,
  ParticipantAreaVisibility,
} from "../data/participantAreaVisibility";

type Props = {
  areas: ParticipantAreaKey[];
  visibility: ParticipantAreaVisibility;
  isLoading: boolean;
  savingArea: ParticipantAreaKey | null;
  savedArea: ParticipantAreaKey | null;
  error: string;
  onChange: (area: ParticipantAreaKey, isVisible: boolean) => void;
};

export function AdminAreaVisibilitySettings({
  areas,
  visibility,
  isLoading,
  savingArea,
  savedArea,
  error,
  onChange,
}: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <fieldset className="admin-visibility" disabled={isLoading}>
      <legend>{t("admin.visibility.legend")}</legend>
      {areas.map((area) => (
        <label className="admin-visibility__option" key={area}>
          <span>
            <strong>{t(`admin.visibility.areas.${area}`)}</strong>
            <small>
              {visibility[area]
                ? t("admin.visibility.visible")
                : t("admin.visibility.hidden")}
            </small>
          </span>
          <input
            type="checkbox"
            checked={visibility[area]}
            disabled={isLoading || savingArea !== null}
            onChange={(event) => onChange(area, event.target.checked)}
          />
        </label>
      ))}
      {isLoading ? <p>{t("admin.visibility.loading")}</p> : null}
      {savedArea && areas.includes(savedArea) ? (
        <p className="admin-festival-actions__success">
          {t("admin.visibility.saved")}
        </p>
      ) : null}
      {error ? <p className="admin-participant-form__error" role="alert">{error}</p> : null}
    </fieldset>
  );
}
