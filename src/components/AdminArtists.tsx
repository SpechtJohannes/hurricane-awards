import {
  useEffect,
  useRef,
  useState,
  type FormEventHandler,
  type Ref,
  type SubmitEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  type CreateTimetableActInput,
  type TimetableAct,
  type UpdateTimetableActInput,
} from "../data/timetable";
import type { ActArtistTag, ArtistTag } from "../data/artistTags";
import { SectionHeader } from "./SectionHeader";
import { AdminLoadingNotice } from "./AdminLoadingNotice";

type ActFormState = {
  id: string | null;
  name: string;
  description: string;
};

type ArtistFormProps = {
  form: ActFormState;
  formError: string;
  isSaving: boolean;
  nameInputRef?: Ref<HTMLInputElement>;
  onChange: (field: "name" | "description", value: string) => void;
  onCancel: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

function ArtistForm({
  form,
  formError,
  isSaving,
  nameInputRef,
  onChange,
  onCancel,
  onSubmit,
}: Readonly<ArtistFormProps>) {
  const { t } = useTranslation();
  const isEdit = form.id !== null;
  const inputSuffix = isEdit ? `-${form.id}` : "";

  return (
    <form
      className={`admin-category-form${isEdit ? " admin-category-form--inline" : ""}`}
      onSubmit={onSubmit}
    >
      <h3>{t(isEdit ? "admin.artists.editTitle" : "admin.artists.createTitle")}</h3>
      <label htmlFor={`admin-timetable-act-name${inputSuffix}`}>
        {t("admin.artists.nameLabel")}
        <input
          ref={nameInputRef}
          id={`admin-timetable-act-name${inputSuffix}`}
          type="text"
          value={form.name}
          disabled={isSaving}
          onChange={(event) => onChange("name", event.target.value)}
        />
      </label>
      <label htmlFor={`admin-timetable-act-description${inputSuffix}`}>
        {t("admin.artists.descriptionLabel")}
        <textarea
          id={`admin-timetable-act-description${inputSuffix}`}
          value={form.description}
          disabled={isSaving}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </label>
      {formError ? (
        <p className="admin-participant-form__error" role="alert">{formError}</p>
      ) : null}
      <div className="admin-participant-form__actions">
        <button
          className="admin-card__reset admin-card__reset--primary"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? t("common.saving") : t("admin.artists.save")}
        </button>
        <button
          className="admin-card__reset admin-card__reset--secondary"
          type="button"
          disabled={isSaving}
          onClick={onCancel}
        >
          {t("admin.artists.cancel")}
        </button>
      </div>
    </form>
  );
}

type AdminArtistsProps = {
  acts: TimetableAct[];
  error: string;
  isLoading: boolean;
  deletingActId: string | null;
  tags: ArtistTag[];
  actTags: ActArtistTag[];
  onCreate: (input: CreateTimetableActInput) => Promise<void>;
  onUpdate: (input: UpdateTimetableActInput) => Promise<void>;
  onDelete: (act: TimetableAct) => void;
  onAddTag: (actId: string, name: string) => Promise<void>;
  onAssignTag: (actId: string, tagId: string) => Promise<void>;
  onRemoveTag: (actId: string, tagId: string) => Promise<void>;
};

export function AdminArtists({
  acts,
  error,
  isLoading,
  deletingActId,
  tags,
  actTags,
  onCreate,
  onUpdate,
  onDelete,
  onAddTag,
  onAssignTag,
  onRemoveTag,
}: Readonly<AdminArtistsProps>) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ActFormState | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [tagInputByAct, setTagInputByAct] = useState<Record<string, string>>({});
  const [selectedTagByAct, setSelectedTagByAct] = useState<Record<string, string>>({});
  const [tagErrorByAct, setTagErrorByAct] = useState<Record<string, string>>({});
  const [savingTagForAct, setSavingTagForAct] = useState<string | null>(null);
  const editNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (form?.id) {
      editNameInputRef.current?.focus();
    }
  }, [form?.id]);

  async function addTag(actId: string) {
    const value = (tagInputByAct[actId] ?? "").trim();
    if (!value) {
      setTagErrorByAct((current) => ({ ...current, [actId]: t("admin.artists.tags.errors.required") }));
      return;
    }
    setSavingTagForAct(actId);
    setTagErrorByAct((current) => ({ ...current, [actId]: "" }));
    try {
      await onAddTag(actId, value);
      setTagInputByAct((current) => ({ ...current, [actId]: "" }));
    } catch {
      setTagErrorByAct((current) => ({ ...current, [actId]: t("admin.artists.tags.errors.save") }));
    } finally {
      setSavingTagForAct(null);
    }
  }

  async function removeTag(actId: string, tagId: string) {
    setSavingTagForAct(actId);
    setTagErrorByAct((current) => ({ ...current, [actId]: "" }));
    try {
      await onRemoveTag(actId, tagId);
    } catch {
      setTagErrorByAct((current) => ({
        ...current,
        [actId]: t("admin.artists.tags.errors.remove"),
      }));
    } finally {
      setSavingTagForAct(null);
    }
  }

  async function assignTag(actId: string, tagId: string) {
    setSelectedTagByAct((current) => ({ ...current, [actId]: tagId }));
    if (!tagId) return;

    setSavingTagForAct(actId);
    setTagErrorByAct((current) => ({ ...current, [actId]: "" }));
    try {
      await onAssignTag(actId, tagId);
      setSelectedTagByAct((current) => ({ ...current, [actId]: "" }));
    } catch {
      setTagErrorByAct((current) => ({
        ...current,
        [actId]: t("admin.artists.tags.errors.save"),
      }));
    } finally {
      setSavingTagForAct(null);
    }
  }

  function startCreate() {
    setFormError("");
    setForm({
      id: null,
      name: "",
      description: "",
    });
  }

  function startEdit(act: TimetableAct) {
    setFormError("");
    setForm({
      id: act.id,
      name: act.name,
      description: act.description ?? "",
    });
  }

  function cancelForm() {
    setForm(null);
    setFormError("");
  }

  function changeForm(field: "name" | "description", value: string) {
    setForm((current) => current ? { ...current, [field]: value } : current);
    setFormError("");
  }

  async function submitForm(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setFormError(t("admin.artists.errors.nameRequired"));
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      if (form.id) {
        await onUpdate({
          id: form.id,
          name,
          description,
        });
      } else {
        await onCreate({
          name,
          description,
        });
      }

      setForm(null);
    } catch (error) {
      console.error(
        form.id ? `Failed to update timetable act ${form.id}` : "Failed to create timetable act",
        error,
      );
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <SectionHeader
        title={t("admin.artists.title")}
        eyebrow={t("admin.artists.eyebrow")}
      />

      {error ? <p className="admin__notice">{error}</p> : null}

      <div className="admin-categories">
        <div className="admin-categories__toolbar">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            onClick={startCreate}
            disabled={form !== null}
          >
            {t("admin.artists.createButton")}
          </button>
        </div>

        {form?.id === null ? (
          <ArtistForm
            form={form}
            formError={formError}
            isSaving={isSaving}
            onChange={changeForm}
            onCancel={cancelForm}
            onSubmit={submitForm}
          />
        ) : null}

        {isLoading ? (
          <AdminLoadingNotice message={t("admin.artists.loading")} />
        ) : null}
        {!isLoading && acts.length === 0 ? (
          <p className="admin__notice">{t("admin.artists.empty")}</p>
        ) : null}
        {!isLoading && acts.length > 0 ? (
          <div className="admin-categories__list">
            {acts.map((act) => (
              <article className="admin-category-card" key={act.id}>
                <div className="admin-category-card__main">
                  {form?.id === act.id ? (
                    <ArtistForm
                      form={form}
                      formError={formError}
                      isSaving={isSaving}
                      nameInputRef={editNameInputRef}
                      onChange={changeForm}
                      onCancel={cancelForm}
                      onSubmit={submitForm}
                    />
                  ) : (
                    <>
                      <h3>{act.name}</h3>
                      {act.description ? <p>{act.description}</p> : null}
                    </>
                  )}
                  <div className="artist-tags" aria-label={t("admin.artists.tags.assigned")}>
                    {actTags.filter((tag) => tag.actId === act.id).map((tag) => (
                      <span className="artist-tag" key={tag.id}>
                        {tag.name}
                        <button
                          type="button"
                          disabled={savingTagForAct === act.id}
                          aria-label={t("admin.artists.tags.remove", { name: tag.name })}
                          onClick={() => void removeTag(act.id, tag.id)}
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <div className="artist-tag-editor">
                    <select
                      value={selectedTagByAct[act.id] ?? ""}
                      disabled={savingTagForAct === act.id}
                      aria-label={t("admin.artists.tags.selectLabel")}
                      onChange={(event) => void assignTag(act.id, event.target.value)}
                    >
                      <option value="">{t("admin.artists.tags.selectPlaceholder")}</option>
                      {tags.filter((tag) => !actTags.some((assigned) => assigned.actId === act.id && assigned.id === tag.id)).map((tag) => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={tagInputByAct[act.id] ?? ""}
                      disabled={savingTagForAct === act.id}
                      placeholder={t("admin.artists.tags.placeholder")}
                      aria-label={t("admin.artists.tags.inputLabel")}
                      onChange={(event) => setTagInputByAct((current) => ({ ...current, [act.id]: event.target.value }))}
                    />
                    <button
                      className="admin-card__reset admin-card__reset--secondary"
                      type="button"
                      disabled={savingTagForAct === act.id}
                      onClick={() => addTag(act.id)}
                    >{savingTagForAct === act.id ? t("common.saving") : t("admin.artists.tags.add")}</button>
                  </div>
                  {tagErrorByAct[act.id] ? <p className="admin-participant-form__error" role="alert">{tagErrorByAct[act.id]}</p> : null}
                </div>

                {form?.id !== act.id ? <div className="admin-category-card__controls">
                  <div className="admin-category-card__actions">
                    <button
                      className="admin-card__reset admin-card__reset--secondary"
                      type="button"
                      disabled={form !== null || deletingActId === act.id}
                      onClick={() => startEdit(act)}
                    >
                      {t("admin.artists.edit")}
                    </button>
                    <button
                      className="admin-card__reset"
                      type="button"
                      disabled={form !== null || deletingActId === act.id}
                      onClick={() => onDelete(act)}
                    >
                      {deletingActId === act.id
                        ? t("admin.artists.deleting")
                        : t("admin.artists.delete")}
                    </button>
                  </div>
                </div> : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
