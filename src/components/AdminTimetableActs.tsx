import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  type CreateTimetableActInput,
  type TimetableAct,
  type UpdateTimetableActInput,
} from "../data/timetable";
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
  onCreate: (input: CreateTimetableActInput) => Promise<void>;
  onUpdate: (input: UpdateTimetableActInput) => Promise<void>;
  onDelete: (act: TimetableAct) => void;
};

export function AdminTimetableActs({
  acts,
  error,
  isLoading,
  deletingActId,
  onCreate,
  onUpdate,
  onDelete,
}: AdminTimetableActsProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ActFormState | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
          >
            {t("admin.timetable.acts.createButton")}
          </button>
        </div>

        {form ? (
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
              <p className="admin-participant-form__error">{formError}</p>
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
                  <h3>{act.name}</h3>
                  {act.description ? <p>{act.description}</p> : null}
                </div>

                <div className="admin-category-card__controls">
                  <div className="admin-category-card__actions">
                    <button
                      className="admin-card__reset admin-card__reset--secondary"
                      type="button"
                      disabled={deletingActId === act.id}
                      onClick={() => startEdit(act)}
                    >
                      {t("admin.timetable.acts.edit")}
                    </button>
                    <button
                      className="admin-card__reset"
                      type="button"
                      disabled={deletingActId === act.id}
                      onClick={() => onDelete(act)}
                    >
                      {deletingActId === act.id
                        ? t("admin.timetable.acts.deleting")
                        : t("admin.timetable.acts.delete")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
