import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { SectionHeader } from "./SectionHeader";
import type { EventSettings } from "../data/festival";
import { AdminEventLogo } from "./AdminEventLogo";

type AdminFestivalProps = {
  mode?: "settings" | "archive";
  festivalName: string;
  eventStartDate: string | null;
  eventEndDate: string | null;
  error: string;
  isSaving: boolean;
  festivalCode: string;
  festivalCodeError: string;
  isLoadingFestivalCode: boolean;
  isSavingFestivalCode: boolean;
  isExporting: boolean;
  logoUrl?: string | null;
  isUploadingLogo?: boolean;
  isRemovingLogo?: boolean;
  onSave: (settings: EventSettings) => Promise<void>;
  onSaveFestivalCode: (code: string) => Promise<void>;
  onArchive: () => Promise<string>;
  onExport: (includeParticipantAccessCodes: boolean) => Promise<void>;
  onUploadLogo?: (file: File) => Promise<void>;
  onRemoveLogo?: () => Promise<void>;
};

type ArchiveActionsProps = {
  includeParticipantAccessCodes: boolean;
  isDisabled: boolean;
  isArchiving: boolean;
  isExporting: boolean;
  exportMessage: string;
  exportError: string;
  archiveMessage: string;
  archiveError: string;
  onIncludeParticipantAccessCodesChange: (checked: boolean) => void;
  onExport: () => void;
  onArchive: () => void;
};

function ArchiveActions({
  includeParticipantAccessCodes,
  isDisabled,
  isArchiving,
  isExporting,
  exportMessage,
  exportError,
  archiveMessage,
  archiveError,
  onIncludeParticipantAccessCodesChange,
  onExport,
  onArchive,
}: ArchiveActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader
        title={t("admin.archive.title")}
        titleId="admin-archive-title"
        eyebrow={t("admin.archive.eyebrow")}
      />

      <div className="admin-festival-actions">
        <label className="admin-festival-actions__option">
          <input
            type="checkbox"
            checked={includeParticipantAccessCodes}
            disabled={isDisabled}
            onChange={(event) =>
              onIncludeParticipantAccessCodesChange(event.target.checked)
            }
          />
          {t("admin.festival.exportIncludeAccessCodes")}
        </label>

        {includeParticipantAccessCodes ? (
          <p className="admin-participant-form__error" role="alert">
            {t("admin.festival.exportAccessCodeWarning")}
          </p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--primary"
          type="button"
          disabled={isDisabled}
          onClick={onExport}
        >
          {isExporting
            ? t("admin.festival.exporting")
            : t("admin.festival.export")}
        </button>

        {exportMessage ? (
          <p className="admin-festival-actions__success">{exportMessage}</p>
        ) : null}
        {exportError ? (
          <p className="admin-participant-form__error">{exportError}</p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--secondary"
          type="button"
          disabled={isDisabled}
          onClick={onArchive}
        >
          {isArchiving
            ? t("admin.festival.archiving")
            : t("admin.festival.archive")}
        </button>

        {archiveMessage ? (
          <p className="admin-festival-actions__success">{archiveMessage}</p>
        ) : null}
        {archiveError ? (
          <p className="admin-participant-form__error">{archiveError}</p>
        ) : null}
      </div>
    </>
  );
}

export function AdminFestival({
  mode = "settings",
  festivalName,
  eventStartDate,
  eventEndDate,
  error,
  isSaving,
  festivalCode,
  festivalCodeError,
  isLoadingFestivalCode,
  isSavingFestivalCode,
  isExporting,
  logoUrl = null,
  isUploadingLogo = false,
  isRemovingLogo = false,
  onSave,
  onSaveFestivalCode,
  onArchive,
  onExport,
  onUploadLogo = async () => undefined,
  onRemoveLogo = async () => undefined,
}: AdminFestivalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(festivalName);
  const [startDate, setStartDate] = useState(eventStartDate ?? "");
  const [endDate, setEndDate] = useState(eventEndDate ?? "");
  const [code, setCode] = useState(festivalCode);
  const [formError, setFormError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [codeFormError, setCodeFormError] = useState("");
  const [archiveMessage, setArchiveMessage] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const [includeParticipantAccessCodes, setIncludeParticipantAccessCodes] =
    useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError(t("admin.festival.errors.nameRequired"));
      return;
    }

    if (Boolean(startDate) !== Boolean(endDate)) {
      setFormError(t("admin.festival.errors.periodIncomplete"));
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setFormError(t("admin.festival.errors.periodOrder"));
      return;
    }

    setFormError("");
    setSaveMessage("");

    try {
      await onSave({
        name: trimmedName,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setSaveMessage(t("admin.festival.saveSuccess"));
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : t("admin.festival.errors.save"),
      );
    }
  }

  async function submitCodeForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedCode) {
      setCodeFormError(t("admin.festival.errors.codeRequired"));
      return;
    }

    setCodeFormError("");

    try {
      await onSaveFestivalCode(trimmedCode);
    } catch (saveError) {
      setCodeFormError(
        saveError instanceof Error
          ? saveError.message
          : t("admin.festival.errors.codeSave"),
      );
    }
  }

  async function archiveCurrentFestival() {
    const shouldArchive = window.confirm(t("admin.festival.archiveConfirm"));

    if (!shouldArchive) {
      return;
    }

    setIsArchiving(true);
    setArchiveMessage("");
    setArchiveError("");

    try {
      const archiveId = await onArchive();

      setArchiveMessage(
        t("admin.festival.archiveSuccess", {
          archiveId,
        }),
      );
    } catch {
      setArchiveError(t("admin.festival.errors.archive"));
    } finally {
      setIsArchiving(false);
    }
  }

  async function exportCurrentFestival() {
    setExportMessage("");
    setExportError("");

    try {
      await onExport(includeParticipantAccessCodes);
      setExportMessage(t("admin.festival.exportSuccess"));
    } catch {
      setExportError(t("admin.festival.errors.export"));
    }
  }

  const isActionDisabled =
    isSaving ||
    isArchiving ||
    isExporting ||
    isLoadingFestivalCode ||
    isSavingFestivalCode;

  if (mode === "archive") {
    return (
      <ArchiveActions
        includeParticipantAccessCodes={includeParticipantAccessCodes}
        isDisabled={isActionDisabled}
        isArchiving={isArchiving}
        isExporting={isExporting}
        exportMessage={exportMessage}
        exportError={exportError}
        archiveMessage={archiveMessage}
        archiveError={archiveError}
        onIncludeParticipantAccessCodesChange={
          setIncludeParticipantAccessCodes
        }
        onExport={exportCurrentFestival}
        onArchive={archiveCurrentFestival}
      />
    );
  }

  return (
    <>
      <SectionHeader
        title={t("admin.festival.title")}
        titleId="admin-title"
        eyebrow={t("admin.festival.eyebrow")}
      />

      {error ? <p className="admin__notice">{error}</p> : null}

      <form className="admin-festival" onSubmit={submitForm}>
        <div>
          <label htmlFor="admin-festival-name">
            {t("admin.festival.nameLabel")}
          </label>
          <input
            id="admin-festival-name"
            type="text"
            value={name}
            disabled={isSaving}
            onChange={(event) => {
              setName(event.target.value);
              setFormError("");
            }}
          />
        </div>

        <div className="admin-festival__dates">
          <div>
            <label htmlFor="admin-event-start-date">
              {t("admin.festival.startDateLabel")}
            </label>
            <input
              id="admin-event-start-date"
              type="date"
              value={startDate}
              disabled={isSaving}
              onChange={(event) => {
                setStartDate(event.target.value);
                setFormError("");
                setSaveMessage("");
              }}
            />
          </div>
          <div>
            <label htmlFor="admin-event-end-date">
              {t("admin.festival.endDateLabel")}
            </label>
            <input
              id="admin-event-end-date"
              type="date"
              value={endDate}
              disabled={isSaving}
              onChange={(event) => {
                setEndDate(event.target.value);
                setFormError("");
                setSaveMessage("");
              }}
            />
          </div>
        </div>

        {!startDate && !endDate ? (
          <p className="admin__notice">{t("admin.festival.periodMissing")}</p>
        ) : null}

        {formError ? (
          <p className="admin-participant-form__error" role="alert">
            {formError}
          </p>
        ) : null}

        {saveMessage ? (
          <p className="admin-festival-actions__success" role="status">
            {saveMessage}
          </p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--primary"
          type="submit"
          disabled={isActionDisabled}
        >
          {isSaving ? t("common.saving") : t("admin.festival.save")}
        </button>
      </form>

      <AdminEventLogo
        logoUrl={logoUrl}
        isUploading={isUploadingLogo}
        isRemoving={isRemovingLogo}
        onUpload={onUploadLogo}
        onRemove={onRemoveLogo}
      />

      <form className="admin-festival" onSubmit={submitCodeForm}>
        <div>
          <label htmlFor="admin-festival-code">
            {t("admin.festival.codeLabel")}
          </label>
          <input
            id="admin-festival-code"
            type="text"
            value={code}
            disabled={isLoadingFestivalCode || isSavingFestivalCode}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setCodeFormError("");
            }}
            autoComplete="off"
            inputMode="text"
            placeholder={
              isLoadingFestivalCode
                ? t("admin.festival.codeLoading")
                : undefined
            }
          />
        </div>

        {festivalCodeError ? (
          <p className="admin-participant-form__error">{festivalCodeError}</p>
        ) : null}

        {codeFormError ? (
          <p className="admin-participant-form__error">{codeFormError}</p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--primary"
          type="submit"
          disabled={isActionDisabled}
        >
          {isSavingFestivalCode
            ? t("common.saving")
            : t("admin.festival.codeSave")}
        </button>
      </form>
    </>
  );
}
