import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ArtistTag } from "../data/artistTags";

type Props = {
  availableTags: ArtistTag[];
  selectedTagIds: ReadonlySet<string>;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string;
  saveError: string;
  success: string;
  onToggle: (tagId: string) => void;
  onReset: () => void;
  onSave: () => void;
};

export function MusicalPreferences({ availableTags, selectedTagIds, isLoading, isSaving, loadError, saveError, success, onToggle, onReset, onSave }: Props) {
  const { t } = useTranslation();
  function submit(event: FormEvent) { event.preventDefault(); onSave(); }

  return <form className="musical-preferences" onSubmit={submit}>
    <h3>{t("preferences.title")}</h3>
    <p>{t("preferences.description")}</p>
    {isLoading ? <p role="status">{t("preferences.loading")}</p> : loadError ? <p role="alert" className="identity__error">{loadError}</p> : availableTags.length === 0 ? <p>{t("preferences.empty")}</p> : <>
      <div className="musical-preferences__options" aria-label={t("preferences.title")}>
        {availableTags.map((tag) => <button key={tag.id} type="button" aria-pressed={selectedTagIds.has(tag.id)} disabled={isSaving} onClick={() => onToggle(tag.id)} aria-label={selectedTagIds.has(tag.id) ? t("preferences.remove", { tag: tag.name }) : t("preferences.select", { tag: tag.name })}>
          <span aria-hidden="true">{selectedTagIds.has(tag.id) ? "✓ " : "+ "}</span>{tag.name}
        </button>)}
      </div>
      <div className="musical-preferences__actions">
        <button type="button" disabled={isSaving || selectedTagIds.size === 0} onClick={onReset}>{t("preferences.reset")}</button>
        <button type="submit" disabled={isSaving}>{isSaving ? t("preferences.saving") : t("preferences.save")}</button>
      </div>
    </>}
    {saveError ? <p role="alert" className="identity__error">{saveError}</p> : null}
    {success ? <p role="status" className="profile-editor__success">{success}</p> : null}
  </form>;
}
