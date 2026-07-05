import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type CreateTimetableStageInput,
  type TimetableStage,
  type UpdateTimetableStageInput,
} from '../data/timetable'

type StageFormState = {
  id: string | null
  name: string
  sortOrder: string
  color: string
  hasColor: boolean
}

type AdminTimetableStagesProps = {
  stages: TimetableStage[]
  error: string
  isLoading: boolean
  savingStageId: string | null
  deletingStageId: string | null
  onCreate: (input: CreateTimetableStageInput) => Promise<void>
  onUpdate: (input: UpdateTimetableStageInput) => Promise<void>
  onDelete: (stage: TimetableStage) => void
  onMove: (stage: TimetableStage, direction: 'up' | 'down') => void
}

export function AdminTimetableStages({
  stages,
  error,
  isLoading,
  savingStageId,
  deletingStageId,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
}: AdminTimetableStagesProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<StageFormState | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function startCreate() {
    setFormError('')
    setForm({
      id: null,
      name: '',
      sortOrder: String(stages.length + 1),
      color: '#ffbe0b',
      hasColor: false,
    })
  }

  function startEdit(stage: TimetableStage) {
    setFormError('')
    setForm({
      id: stage.id,
      name: stage.name,
      sortOrder: String(stage.sortOrder),
      color: stage.color ?? '#ffbe0b',
      hasColor: Boolean(stage.color),
    })
  }

  function cancelForm() {
    setForm(null)
    setFormError('')
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form) {
      return
    }

    const name = form.name.trim()
    const sortOrder = Number(form.sortOrder)
    const color = form.hasColor ? form.color : null

    if (!name) {
      setFormError(t('admin.timetable.stages.errors.nameRequired'))
      return
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setFormError(t('admin.timetable.stages.errors.sortOrderInvalid'))
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      if (form.id) {
        await onUpdate({
          id: form.id,
          name,
          sortOrder,
          color,
        })
      } else {
        await onCreate({
          name,
          sortOrder,
          color,
        })
      }

      setForm(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="admin__header">
        <p className="admin__eyebrow">{t('admin.timetable.eyebrow')}</p>
        <h2>{t('admin.timetable.stages.title')}</h2>
      </div>

      {error ? <p className="admin__notice">{error}</p> : null}

      <div className="admin-categories">
        <div className="admin-categories__toolbar">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            onClick={startCreate}
          >
            {t('admin.timetable.stages.createButton')}
          </button>
        </div>

        {form ? (
          <form className="admin-category-form" onSubmit={submitForm}>
            <h3>
              {form.id
                ? t('admin.timetable.stages.editTitle')
                : t('admin.timetable.stages.createTitle')}
            </h3>

            <label htmlFor="admin-timetable-stage-name">
              {t('admin.timetable.stages.nameLabel')}
              <input
                id="admin-timetable-stage-name"
                type="text"
                value={form.name}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <label htmlFor="admin-timetable-stage-sort-order">
              {t('admin.timetable.stages.sortOrderLabel')}
              <input
                id="admin-timetable-stage-sort-order"
                type="number"
                value={form.sortOrder}
                disabled={isSaving}
                inputMode="numeric"
                onChange={(event) => {
                  setForm({ ...form, sortOrder: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <div className="admin-stage-color">
              <label className="admin-stage-color__toggle">
                <input
                  type="checkbox"
                  checked={form.hasColor}
                  disabled={isSaving}
                  onChange={(event) => {
                    setForm({ ...form, hasColor: event.target.checked })
                    setFormError('')
                  }}
                />
                {t('admin.timetable.stages.useColorLabel')}
              </label>

              <label htmlFor="admin-timetable-stage-color">
                {t('admin.timetable.stages.colorLabel')}
                <input
                  id="admin-timetable-stage-color"
                  type="color"
                  value={form.color}
                  disabled={isSaving || !form.hasColor}
                  onChange={(event) => {
                    setForm({ ...form, color: event.target.value })
                    setFormError('')
                  }}
                />
              </label>
            </div>

            {formError ? (
              <p className="admin-participant-form__error">{formError}</p>
            ) : null}

            <div className="admin-participant-form__actions">
              <button
                className="admin-card__reset admin-card__reset--primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('admin.timetable.stages.save')}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSaving}
                onClick={cancelForm}
              >
                {t('admin.timetable.stages.cancel')}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="admin__notice" role="status">
            {t('admin.timetable.stages.loading')}
          </p>
        ) : stages.length === 0 ? (
          <p className="admin__notice">{t('admin.timetable.stages.empty')}</p>
        ) : (
          <div className="admin-categories__list">
            {stages.map((stage, index) => {
              const isBusy =
                savingStageId === stage.id || deletingStageId === stage.id

              return (
                <article className="admin-category-card" key={stage.id}>
                  <div className="admin-category-card__main">
                    <h3>{stage.name}</h3>
                    <dl>
                      <div>
                        <dt>{t('admin.timetable.stages.sortOrderLabel')}</dt>
                        <dd>{stage.sortOrder}</dd>
                      </div>
                      <div>
                        <dt>{t('admin.timetable.stages.colorLabel')}</dt>
                        <dd>
                          {stage.color ? (
                            <span className="admin-stage-color__preview">
                              <span
                                className="admin-stage-color__swatch"
                                style={{ background: stage.color }}
                              />
                              {stage.color}
                            </span>
                          ) : (
                            t('admin.timetable.stages.defaultColor')
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="admin-category-card__controls">
                    <div className="admin-category-card__actions">
                      <button
                        className="admin-card__reset admin-card__reset--secondary"
                        type="button"
                        disabled={isBusy || index === 0}
                        onClick={() => onMove(stage, 'up')}
                      >
                        {t('admin.timetable.stages.moveUp')}
                      </button>
                      <button
                        className="admin-card__reset admin-card__reset--secondary"
                        type="button"
                        disabled={isBusy || index === stages.length - 1}
                        onClick={() => onMove(stage, 'down')}
                      >
                        {t('admin.timetable.stages.moveDown')}
                      </button>
                      <button
                        className="admin-card__reset admin-card__reset--secondary"
                        type="button"
                        disabled={isBusy}
                        onClick={() => startEdit(stage)}
                      >
                        {t('admin.timetable.stages.edit')}
                      </button>
                      <button
                        className="admin-card__reset"
                        type="button"
                        disabled={isBusy}
                        onClick={() => onDelete(stage)}
                      >
                        {deletingStageId === stage.id
                          ? t('admin.timetable.stages.deleting')
                          : t('admin.timetable.stages.delete')}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
