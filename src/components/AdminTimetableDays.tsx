import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type CreateFestivalDayInput,
  type FestivalDay,
  type UpdateFestivalDayInput,
} from '../data/timetable'
import { SectionHeader } from './SectionHeader'

type FestivalDayFormState = {
  id: string | null
  date: string
  label: string
  sortOrder: string
}

type AdminTimetableDaysProps = {
  festivalDays: FestivalDay[]
  error: string
  isLoading: boolean
  savingFestivalDayId: string | null
  deletingFestivalDayId: string | null
  onCreate: (input: CreateFestivalDayInput) => Promise<void>
  onUpdate: (input: UpdateFestivalDayInput) => Promise<void>
  onDelete: (festivalDay: FestivalDay) => void
  onMove: (festivalDay: FestivalDay, direction: 'up' | 'down') => void
}

export function AdminTimetableDays({
  festivalDays,
  error,
  isLoading,
  savingFestivalDayId,
  deletingFestivalDayId,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
}: AdminTimetableDaysProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<FestivalDayFormState | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function startCreate() {
    setFormError('')
    setForm({
      id: null,
      date: '',
      label: '',
      sortOrder: String(festivalDays.length + 1),
    })
  }

  function startEdit(festivalDay: FestivalDay) {
    setFormError('')
    setForm({
      id: festivalDay.id,
      date: festivalDay.date,
      label: festivalDay.label,
      sortOrder: String(festivalDay.sortOrder),
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

    const date = form.date.trim()
    const label = form.label.trim()
    const sortOrder = Number(form.sortOrder)

    if (!date) {
      setFormError(t('admin.timetable.days.errors.dateRequired'))
      return
    }

    if (!label) {
      setFormError(t('admin.timetable.days.errors.labelRequired'))
      return
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setFormError(t('admin.timetable.days.errors.sortOrderInvalid'))
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      if (form.id) {
        await onUpdate({
          id: form.id,
          date,
          label,
          sortOrder,
        })
      } else {
        await onCreate({
          date,
          label,
          sortOrder,
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
      <SectionHeader
        title={t('admin.timetable.title')}
        titleId="admin-title"
        eyebrow={t('admin.timetable.eyebrow')}
      />

      {error ? <p className="admin__notice">{error}</p> : null}

      <div className="admin-categories">
        <div className="admin-categories__toolbar">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            onClick={startCreate}
          >
            {t('admin.timetable.days.createButton')}
          </button>
        </div>

        {form ? (
          <form className="admin-category-form" onSubmit={submitForm}>
            <h3>
              {form.id
                ? t('admin.timetable.days.editTitle')
                : t('admin.timetable.days.createTitle')}
            </h3>

            <label htmlFor="admin-festival-day-date">
              {t('admin.timetable.days.dateLabel')}
              <input
                id="admin-festival-day-date"
                type="date"
                value={form.date}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, date: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <label htmlFor="admin-festival-day-label">
              {t('admin.timetable.days.labelLabel')}
              <input
                id="admin-festival-day-label"
                type="text"
                value={form.label}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, label: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <label htmlFor="admin-festival-day-sort-order">
              {t('admin.timetable.days.sortOrderLabel')}
              <input
                id="admin-festival-day-sort-order"
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

            {formError ? (
              <p className="admin-participant-form__error">{formError}</p>
            ) : null}

            <div className="admin-participant-form__actions">
              <button
                className="admin-card__reset admin-card__reset--primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? t('common.saving') : t('admin.timetable.days.save')}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSaving}
                onClick={cancelForm}
              >
                {t('admin.timetable.days.cancel')}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="admin__notice" role="status">
            {t('admin.timetable.days.loading')}
          </p>
        ) : festivalDays.length === 0 ? (
          <p className="admin__notice">{t('admin.timetable.days.empty')}</p>
        ) : (
          <div className="admin-categories__list">
            {festivalDays.map((festivalDay, index) => {
              const isBusy =
                savingFestivalDayId === festivalDay.id ||
                deletingFestivalDayId === festivalDay.id

              return (
                <article className="admin-category-card" key={festivalDay.id}>
                  <div className="admin-category-card__main">
                    <h3>{festivalDay.label}</h3>
                    <dl>
                      <div>
                        <dt>{t('admin.timetable.days.dateLabel')}</dt>
                        <dd>{festivalDay.date}</dd>
                      </div>
                      <div>
                        <dt>{t('admin.timetable.days.sortOrderLabel')}</dt>
                        <dd>{festivalDay.sortOrder}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="admin-category-card__controls">
                    <div className="admin-category-card__actions">
                      <button
                        className="admin-card__reset admin-card__reset--secondary"
                        type="button"
                        disabled={isBusy || index === 0}
                        onClick={() => onMove(festivalDay, 'up')}
                      >
                        {t('admin.timetable.days.moveUp')}
                      </button>
                      <button
                        className="admin-card__reset admin-card__reset--secondary"
                        type="button"
                        disabled={isBusy || index === festivalDays.length - 1}
                        onClick={() => onMove(festivalDay, 'down')}
                      >
                        {t('admin.timetable.days.moveDown')}
                      </button>
                      <button
                        className="admin-card__reset admin-card__reset--secondary"
                        type="button"
                        disabled={isBusy}
                        onClick={() => startEdit(festivalDay)}
                      >
                        {t('admin.timetable.days.edit')}
                      </button>
                      <button
                        className="admin-card__reset"
                        type="button"
                        disabled={isBusy}
                        onClick={() => onDelete(festivalDay)}
                      >
                        {deletingFestivalDayId === festivalDay.id
                          ? t('admin.timetable.days.deleting')
                          : t('admin.timetable.days.delete')}
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
