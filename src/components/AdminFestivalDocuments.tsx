import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  festivalDocumentTypes,
  type FestivalDocument,
  type FestivalDocumentType,
} from "../data/festivalDocuments";
import type { MusicPlaylist } from "../data/musicEmbeds";
import { SectionHeader } from "./SectionHeader";

type AdminFestivalDocumentsProps = {
  documents: FestivalDocument[];
  campLocationLink: string | null;
  campLocationError: string;
  musicPlaylist: MusicPlaylist | null;
  musicPlaylistError: string;
  error: string;
  isLoading: boolean;
  isSavingCampLocation: boolean;
  isSavingMusicPlaylist: boolean;
  uploadingDocumentType: FestivalDocumentType | null;
  removingDocumentType: FestivalDocumentType | null;
  onSaveCampLocation: (link: string) => void;
  onRemoveCampLocation: () => void;
  onClearCampLocationError: () => void;
  onSaveMusicPlaylist: (link: string) => Promise<boolean>;
  onRemoveMusicPlaylist: () => Promise<boolean>;
  onClearMusicPlaylistError: () => void;
  onUpload: (documentType: FestivalDocumentType, file: File) => void;
  onRemove: (documentType: FestivalDocumentType) => void;
};

function documentByType(
  documents: FestivalDocument[],
  documentType: FestivalDocumentType,
) {
  return documents.find((document) => document.documentType === documentType);
}

export function AdminFestivalDocuments({
  documents,
  campLocationLink,
  campLocationError,
  musicPlaylist,
  musicPlaylistError,
  error,
  isLoading,
  isSavingCampLocation,
  isSavingMusicPlaylist,
  uploadingDocumentType,
  removingDocumentType,
  onSaveCampLocation,
  onRemoveCampLocation,
  onClearCampLocationError,
  onSaveMusicPlaylist,
  onRemoveMusicPlaylist,
  onClearMusicPlaylistError,
  onUpload,
  onRemove,
}: AdminFestivalDocumentsProps) {
  const { t } = useTranslation();
  const [campLocationInput, setCampLocationInput] = useState(
    campLocationLink ?? "",
  );
  const [musicPlaylistInput, setMusicPlaylistInput] = useState(
    musicPlaylist?.externalUrl ?? "",
  );
  const [musicPlaylistMessage, setMusicPlaylistMessage] = useState("");

  function submitCampLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveCampLocation(campLocationInput);
  }

  async function submitMusicPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMusicPlaylistMessage("");
    const wasSaved = await onSaveMusicPlaylist(musicPlaylistInput);

    if (wasSaved) {
      setMusicPlaylistMessage(t("admin.musicPlaylist.saveSuccess"));
    }
  }

  async function removeMusicPlaylist() {
    setMusicPlaylistMessage("");
    const wasRemoved = await onRemoveMusicPlaylist();

    if (wasRemoved) {
      setMusicPlaylistInput("");
      setMusicPlaylistMessage(t("admin.musicPlaylist.removeSuccess"));
    }
  }

  function changeFile(
    documentType: FestivalDocumentType,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    onUpload(documentType, file);
  }

  return (
    <>
      <SectionHeader
        title={t("admin.documents.title")}
        eyebrow={t("admin.documents.eyebrow")}
      />

      {error ? (
        <p className="admin__notice" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="admin__notice" role="status">
          {t("admin.documents.loading")}
        </p>
      ) : null}

      <div className="admin-documents">
        <form
          className="admin-document-card admin-camp-location"
          onSubmit={submitCampLocation}
        >
          <div className="admin-document-card__main">
            <p>{t("admin.campLocation.eyebrow")}</p>
            <h3>{t("admin.campLocation.title")}</h3>
            <label htmlFor="admin-camp-location-link">
              {t("admin.campLocation.linkLabel")}
              <input
                id="admin-camp-location-link"
                type="url"
                value={campLocationInput}
                disabled={isSavingCampLocation}
                placeholder={t("admin.campLocation.linkPlaceholder")}
                onChange={(event) => {
                  setCampLocationInput(event.target.value);
                  onClearCampLocationError();
                }}
              />
            </label>
            {campLocationError ? (
              <p className="admin-participant-form__error">
                {campLocationError}
              </p>
            ) : null}
          </div>

          <div className="admin-document-card__actions">
            <button
              className="admin-card__reset admin-card__reset--primary"
              type="submit"
              disabled={isSavingCampLocation}
            >
              {isSavingCampLocation
                ? t("common.saving")
                : t("admin.campLocation.save")}
            </button>
            {campLocationLink ? (
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSavingCampLocation}
                onClick={onRemoveCampLocation}
              >
                {t("admin.campLocation.remove")}
              </button>
            ) : null}
          </div>
        </form>

        <form
          className="admin-document-card admin-camp-location"
          onSubmit={submitMusicPlaylist}
        >
          <div className="admin-document-card__main">
            <p>{t("admin.musicPlaylist.eyebrow")}</p>
            <h3>{t("admin.musicPlaylist.title")}</h3>
            <label htmlFor="admin-music-playlist-link">
              {t("admin.musicPlaylist.linkLabel")}
              <input
                id="admin-music-playlist-link"
                type="text"
                value={musicPlaylistInput}
                disabled={isSavingMusicPlaylist}
                placeholder={t("admin.musicPlaylist.linkPlaceholder")}
                onChange={(event) => {
                  setMusicPlaylistInput(event.target.value);
                  setMusicPlaylistMessage("");
                  onClearMusicPlaylistError();
                }}
              />
            </label>
            {musicPlaylistError ? (
              <p className="admin-participant-form__error" role="alert">
                {musicPlaylistError}
              </p>
            ) : null}
            {musicPlaylistMessage ? (
              <p className="admin-festival-actions__success">
                {musicPlaylistMessage}
              </p>
            ) : null}
          </div>

          <div className="admin-document-card__actions">
            <button
              className="admin-card__reset admin-card__reset--primary"
              type="submit"
              disabled={isSavingMusicPlaylist}
            >
              {isSavingMusicPlaylist
                ? t("common.saving")
                : t("admin.musicPlaylist.save")}
            </button>
            {musicPlaylist ? (
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSavingMusicPlaylist}
                onClick={() => void removeMusicPlaylist()}
              >
                {t("admin.musicPlaylist.remove")}
              </button>
            ) : null}
          </div>
        </form>

        {festivalDocumentTypes.map((documentType) => {
          const document = documentByType(documents, documentType);
          const inputId = `admin-document-${documentType}`;
          const isUploading = uploadingDocumentType === documentType;
          const isRemoving = removingDocumentType === documentType;

          return (
            <article className="admin-document-card" key={documentType}>
              <div className="admin-document-card__main">
                <p>{t(`info.documentTypes.${documentType}`)}</p>
                <h3>{document?.title ?? t("admin.documents.emptyDocument")}</h3>
                {document ? (
                  <dl>
                    <div>
                      <dt>{t("admin.documents.fileType")}</dt>
                      <dd>{document.mimeType}</dd>
                    </div>
                    <div>
                      <dt>{t("admin.documents.updatedAt")}</dt>
                      <dd>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(document.updatedAt))}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="admin-document-card__notice">
                    {t("admin.documents.missingDocument")}
                  </p>
                )}
              </div>

              <div className="admin-document-card__actions">
                <label
                  className="admin-card__reset admin-card__reset--primary"
                  htmlFor={inputId}
                >
                  {isUploading
                    ? t("admin.documents.uploading")
                    : document
                      ? t("admin.documents.replace")
                      : t("admin.documents.upload")}
                </label>
                <input
                  id={inputId}
                  className="admin-document-card__file"
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={isUploading || isRemoving}
                  onChange={(event) => changeFile(documentType, event)}
                />

                {document ? (
                  <button
                    className="admin-card__reset admin-card__reset--secondary"
                    type="button"
                    disabled={isUploading || isRemoving}
                    onClick={() => onRemove(documentType)}
                  >
                    {isRemoving
                      ? t("admin.documents.removing")
                      : t("admin.documents.remove")}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
