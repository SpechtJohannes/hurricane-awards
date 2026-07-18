import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  isEventLogoFileSizeAllowed,
  isSupportedEventLogoFile,
} from "../data/festivalLogo";

type AdminEventLogoProps = {
  logoUrl: string | null;
  isUploading: boolean;
  isRemoving: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
};

export function AdminEventLogo({
  logoUrl,
  isUploading,
  isRemoving,
  onUpload,
  onRemove,
}: AdminEventLogoProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isBusy = isUploading || isRemoving;

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function clearSelection() {
    setFile(null);
    setPreviewUrl(null);
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    event.target.value = "";
    setError("");
    setSuccess("");

    if (!selectedFile) return;
    if (!isSupportedEventLogoFile(selectedFile)) {
      clearSelection();
      setError(t("admin.festival.logo.errors.type"));
      return;
    }
    if (!isEventLogoFileSizeAllowed(selectedFile)) {
      clearSelection();
      setError(t("admin.festival.logo.errors.size"));
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function upload() {
    if (!file) return;
    setError("");
    setSuccess("");
    try {
      await onUpload(file);
      clearSelection();
      setSuccess(t("admin.festival.logo.uploadSuccess"));
    } catch {
      setError(t("admin.festival.logo.errors.upload"));
    }
  }

  async function remove() {
    if (!window.confirm(t("admin.festival.logo.removeConfirm"))) return;
    setError("");
    setSuccess("");
    try {
      await onRemove();
      clearSelection();
      setSuccess(t("admin.festival.logo.removeSuccess"));
    } catch {
      setError(t("admin.festival.logo.errors.remove"));
    }
  }

  const displayedPreview = previewUrl ?? logoUrl;

  return (
    <section className="admin-event-logo" aria-labelledby="event-logo-title">
      <div>
        <h3 id="event-logo-title">{t("admin.festival.logo.title")}</h3>
        <p>{t("admin.festival.logo.description")}</p>
      </div>

      {displayedPreview ? (
        <div className="admin-event-logo__preview">
          <img
            src={displayedPreview}
            alt={t("admin.festival.logo.previewAlt")}
          />
          <span>
            {previewUrl
              ? t("admin.festival.logo.localPreview")
              : t("admin.festival.logo.savedPreview")}
          </span>
        </div>
      ) : (
        <p className="admin__notice">{t("admin.festival.logo.empty")}</p>
      )}

      <div className="admin-event-logo__actions">
        <label className="admin-card__reset admin-card__reset--secondary">
          {logoUrl
            ? t("admin.festival.logo.replace")
            : t("admin.festival.logo.select")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={isBusy}
            onChange={selectFile}
          />
        </label>
        {file ? (
          <>
            <button
              className="admin-card__reset admin-card__reset--primary"
              type="button"
              disabled={isBusy}
              onClick={() => void upload()}
            >
              {isUploading
                ? t("admin.festival.logo.uploading")
                : t("admin.festival.logo.save")}
            </button>
            <button
              className="admin-card__reset"
              type="button"
              disabled={isBusy}
              onClick={clearSelection}
            >
              {t("admin.festival.logo.discard")}
            </button>
          </>
        ) : null}
        {logoUrl ? (
          <button
            className="admin-card__reset"
            type="button"
            disabled={isBusy}
            onClick={() => void remove()}
          >
            {isRemoving
              ? t("admin.festival.logo.removing")
              : t("admin.festival.logo.remove")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="admin-participant-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="admin-festival-actions__success" role="status">
          {success}
        </p>
      ) : null}
    </section>
  );
}
