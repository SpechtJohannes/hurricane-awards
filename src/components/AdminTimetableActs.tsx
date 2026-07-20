import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  type CreateTimetableActInput,
  type TimetableAct,
  type UpdateTimetableActInput,
} from "../data/timetable";
import type { ActArtistTag, ArtistTag } from "../data/artistTags";
import { SectionHeader } from "./SectionHeader";

type ActFormState = {
  id: string | null;
  name: string;
  description: string;
};

type AdminTimetableActsProps = {
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

export function AdminTimetableActs({
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
}: AdminTimetableActsProps) {
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
      setTagErrorByAct((current) => ({ ...current, [actId]: t("admin.timetable.acts.tags.errors.required") }));
      return;
    }
    setSavingTagForAct(actId);
    setTagErrorByAct((current) => ({ ...current, [actId]: "" }));
    try {
      await onAddTag(actId, value);
      setTagInputByAct((current) => ({ ...current, [actId]: "" }));
    } catch {
      setTagErrorByAct((current) => ({ ...current, [actId]: t("admin.timetable.acts.tags.errors.save") }));
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

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setFormError(t("admin.timetable.acts.errors.nameRequired"));
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
        title={t("admin.timetable.acts.title")}
        eyebrow={t("admin.timetable.eyebrow")}
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
            {t("admin.timetable.acts.createButton")}
          </button>
        </div>

        {form?.id === null ? (
          <form className="admin-category-form" onSubmit={submitForm}>
            <h3>
              {form.id
                ? t("admin.timetable.acts.editTitle")
                : t("admin.timetable.acts.createTitle")}
            </h3>

            <label htmlFor="admin-timetable-act-name">
              {t("admin.timetable.acts.nameLabel")}
              <input
                id="admin-timetable-act-name"
                type="text"
                value={form.name}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  setFormError("");
                }}
              />
            </label>

            <label htmlFor="admin-timetable-act-description">
              {t("admin.timetable.acts.descriptionLabel")}
              <textarea
                id="admin-timetable-act-description"
                value={form.description}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, description: event.target.value });
                  setFormError("");
                }}
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
                {isSaving ? t("common.saving") : t("admin.timetable.acts.save")}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSaving}
                onClick={cancelForm}
              >
                {t("admin.timetable.acts.cancel")}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="admin__notice" role="status">
            {t("admin.timetable.acts.loading")}
          </p>
        ) : acts.length === 0 ? (
          <p className="admin__notice">{t("admin.timetable.acts.empty")}</p>
        ) : (
          <div className="admin-categories__list">
            {acts.map((act) => (
              <article className="admin-category-card" key={act.id}>
                <div className="admin-category-card__main">
                  {form?.id === act.id ? (
                    <form className="admin-category-form admin-category-form--inline" onSubmit={submitForm}>
                      <h3>{t("admin.timetable.acts.editTitle")}</h3>
                      <label htmlFor={`admin-timetable-act-name-${act.id}`}>
                        {t("admin.timetable.acts.nameLabel")}
                        <input
                          ref={editNameInputRef}
                          id={`admin-timetable-act-name-${act.id}`}
                          type="text"
                          value={form.name}
                          disabled={isSaving}
                          onChange={(event) => {
                            setForm({ ...form, name: event.target.value });
                            setFormError("");
                          }}
                        />
                      </label>
                      <label htmlFor={`admin-timetable-act-description-${act.id}`}>
                        {t("admin.timetable.acts.descriptionLabel")}
                        <textarea
                          id={`admin-timetable-act-description-${act.id}`}
                          value={form.description}
                          disabled={isSaving}
                          onChange={(event) => {
                            setForm({ ...form, description: event.target.value });
                            setFormError("");
                          }}
                        />
                      </label>
                      {formError ? <p className="admin-participant-form__error" role="alert">{formError}</p> : null}
                      <div className="admin-participant-form__actions">
                        <button className="admin-card__reset admin-card__reset--primary" type="submit" disabled={isSaving}>
                          {isSaving ? t("common.saving") : t("admin.timetable.acts.save")}
                        </button>
                        <button className="admin-card__reset admin-card__reset--secondary" type="button" disabled={isSaving} onClick={cancelForm}>
                          {t("admin.timetable.acts.cancel")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h3>{act.name}</h3>
                      {act.description ? <p>{act.description}</p> : null}
                    </>
                  )}
                  <div className="artist-tags" aria-label={t("admin.timetable.acts.tags.assigned")}>
                    {actTags.filter((tag) => tag.actId === act.id).map((tag) => (
                      <span className="artist-tag" key={tag.id}>
                        {tag.name}
                        <button
                          type="button"
                          disabled={savingTagForAct === act.id}
                          aria-label={t("admin.timetable.acts.tags.remove", { name: tag.name })}
                          onClick={async () => {
                            setSavingTagForAct(act.id);
                            setTagErrorByAct((current) => ({ ...current, [act.id]: "" }));
                            try {
                              await onRemoveTag(act.id, tag.id);
                            } catch {
                              setTagErrorByAct((current) => ({ ...current, [act.id]: t("admin.timetable.acts.tags.errors.remove") }));
                            } finally {
                              setSavingTagForAct(null);
                            }
                          }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <div className="artist-tag-editor">
                    <select
                      value={selectedTagByAct[act.id] ?? ""}
                      disabled={savingTagForAct === act.id}
                      aria-label={t("admin.timetable.acts.tags.selectLabel")}
                      onChange={async (event) => {
                        const tagId = event.target.value;
                        setSelectedTagByAct((current) => ({ ...current, [act.id]: tagId }));
                        if (!tagId) return;
                        setSavingTagForAct(act.id);
                        setTagErrorByAct((current) => ({ ...current, [act.id]: "" }));
                        try {
                          await onAssignTag(act.id, tagId);
                          setSelectedTagByAct((current) => ({ ...current, [act.id]: "" }));
                        } catch {
                          setTagErrorByAct((current) => ({ ...current, [act.id]: t("admin.timetable.acts.tags.errors.save") }));
                        } finally {
                          setSavingTagForAct(null);
                        }
                      }}
                    >
                      <option value="">{t("admin.timetable.acts.tags.selectPlaceholder")}</option>
                      {tags.filter((tag) => !actTags.some((assigned) => assigned.actId === act.id && assigned.id === tag.id)).map((tag) => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={tagInputByAct[act.id] ?? ""}
                      disabled={savingTagForAct === act.id}
                      placeholder={t("admin.timetable.acts.tags.placeholder")}
                      aria-label={t("admin.timetable.acts.tags.inputLabel")}
                      onChange={(event) => setTagInputByAct((current) => ({ ...current, [act.id]: event.target.value }))}
                    />
                    <button
                      className="admin-card__reset admin-card__reset--secondary"
                      type="button"
                      disabled={savingTagForAct === act.id}
                      onClick={() => addTag(act.id)}
                    >{savingTagForAct === act.id ? t("common.saving") : t("admin.timetable.acts.tags.add")}</button>
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
                      {t("admin.timetable.acts.edit")}
                    </button>
                    <button
                      className="admin-card__reset"
                      type="button"
                      disabled={form !== null || deletingActId === act.id}
                      onClick={() => onDelete(act)}
                    >
                      {deletingActId === act.id
                        ? t("admin.timetable.acts.deleting")
                        : t("admin.timetable.acts.delete")}
                    </button>
                  </div>
                </div> : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
