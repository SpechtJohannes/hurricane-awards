import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type CreateTimetablePerformanceInput,
  type FestivalDay,
  type TimetableAct,
  type TimetablePerformance,
  type TimetableStage,
  type UpdateTimetablePerformanceInput,
} from '../data/timetable'
import { SectionHeader } from './SectionHeader'

type PerformanceFormState = {
  id: string | null
  festivalDayId: string
  stageId: string
  actId: string
  startsAt: string
  endsAt: string
}

type AdminTimetablePerformancesProps = {
  performances: TimetablePerformance[]
  festivalDays: FestivalDay[]
  stages: TimetableStage[]
  acts: TimetableAct[]
  error: string
  isLoading: boolean
  deletingPerformanceId: string | null
  onCreate: (input: CreateTimetablePerformanceInput) => Promise<void>
  onUpdate: (input: UpdateTimetablePerformanceInput) => Promise<void>
  onDelete: (performance: TimetablePerformance) => void
}

function toDateTimeLocalValue(value: string) {
  return value.slice(0, 16)
}

export function AdminTimetablePerformances({
  performances,
  festivalDays,
  stages,
  acts,
  error,
  isLoading,
  deletingPerformanceId,
  onCreate,
  onUpdate,
  onDelete,
}: AdminTimetablePerformancesProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<PerformanceFormState | null>(null)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const dayById = useMemo(
    () => new Map(festivalDays.map((day) => [day.id, day])),
    [festivalDays],
  )
  const stageById = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage])),
    [stages],
  )
  const actById = useMemo(() => new Map(acts.map((act) => [act.id, act])), [acts])

  function startCreate() {
    setFormError('')
    setForm({
      id: null,
      festivalDayId: festivalDays[0]?.id ?? '',
      stageId: stages[0]?.id ?? '',
      actId: acts[0]?.id ?? '',
      startsAt: '',
      endsAt: '',
    })
  }

  function startEdit(performance: TimetablePerformance) {
    setFormError('')
    setForm({
      id: performance.id,
      festivalDayId: performance.festivalDayId,
      stageId: performance.stageId,
      actId: performance.actId,
      startsAt: toDateTimeLocalValue(performance.startsAt),
      endsAt: performance.endsAt ? toDateTimeLocalValue(performance.endsAt) : '',
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

    if (!form.festivalDayId) {
      setFormError(t('admin.timetable.performances.errors.dayRequired'))
      return
    }

    if (!form.stageId) {
      setFormError(t('admin.timetable.performances.errors.stageRequired'))
      return
    }

    if (!form.actId) {
      setFormError(t('admin.timetable.performances.errors.actRequired'))
      return
    }

    if (!form.startsAt) {
      setFormError(t('admin.timetable.performances.errors.startRequired'))
      return
    }

    if (!form.endsAt) {
      setFormError(t('admin.timetable.performances.errors.endRequired'))
      return
    }

    if (form.endsAt <= form.startsAt) {
      setFormError(t('admin.timetable.performances.errors.endAfterStart'))
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      if (form.id) {
        await onUpdate({
          id: form.id,
          festivalDayId: form.festivalDayId,
          stageId: form.stageId,
          actId: form.actId,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
        })
      } else {
        await onCreate({
          festivalDayId: form.festivalDayId,
          stageId: form.stageId,
          actId: form.actId,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
        })
      }

      setForm(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsSaving(false)
    }
  }

  const canCreate = festivalDays.length > 0 && stages.length > 0 && acts.length > 0

  return (
    <section
      className="admin-timetable-performances"
      aria-labelledby="admin-timetable-performances-title"
    >
      <SectionHeader
        title={t('admin.timetable.performances.title')}
        titleId="admin-timetable-performances-title"
        eyebrow={t('admin.timetable.eyebrow')}
      />

      {error ? <p className="admin__notice">{error}</p> : null}

      <div className="admin-categories">
        <div className="admin-categories__toolbar">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            disabled={!canCreate}
            onClick={startCreate}
          >
            {t('admin.timetable.performances.createButton')}
          </button>
        </div>

        {!canCreate ? (
          <p className="admin__notice">
            {t('admin.timetable.performances.missingBaseData')}
          </p>
        ) : null}

        {form ? (
          <form className="admin-category-form" onSubmit={submitForm}>
            <h3>
              {form.id
                ? t('admin.timetable.performances.editTitle')
                : t('admin.timetable.performances.createTitle')}
            </h3>

            <label htmlFor="admin-timetable-performance-day">
              {t('admin.timetable.performances.dayLabel')}
              <select
                id="admin-timetable-performance-day"
                value={form.festivalDayId}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, festivalDayId: event.target.value })
                  setFormError('')
                }}
              >
                {festivalDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="admin-timetable-performance-stage">
              {t('admin.timetable.performances.stageLabel')}
              <select
                id="admin-timetable-performance-stage"
                value={form.stageId}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, stageId: event.target.value })
                  setFormError('')
                }}
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="admin-timetable-performance-act">
              {t('admin.timetable.performances.actLabel')}
              <select
                id="admin-timetable-performance-act"
                value={form.actId}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, actId: event.target.value })
                  setFormError('')
                }}
              >
                {acts.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="admin-timetable-performance-start">
              {t('admin.timetable.performances.startLabel')}
              <input
                id="admin-timetable-performance-start"
                type="datetime-local"
                value={form.startsAt}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, startsAt: event.target.value })
                  setFormError('')
                }}
              />
            </label>

            <label htmlFor="admin-timetable-performance-end">
              {t('admin.timetable.performances.endLabel')}
              <input
                id="admin-timetable-performance-end"
                type="datetime-local"
                value={form.endsAt}
                disabled={isSaving}
                onChange={(event) => {
                  setForm({ ...form, endsAt: event.target.value })
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
                {isSaving
                  ? t('common.saving')
                  : t('admin.timetable.performances.save')}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSaving}
                onClick={cancelForm}
              >
                {t('admin.timetable.performances.cancel')}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="admin__notice" role="status">
            {t('admin.timetable.performances.loading')}
          </p>
        ) : performances.length === 0 ? (
          <p className="admin__notice">{t('admin.timetable.performances.empty')}</p>
        ) : (
          <div className="admin-categories__list">
            {performances.map((performance) => (
              <article className="admin-category-card" key={performance.id}>
                <div className="admin-category-card__main">
                  <h3>
                    {actById.get(performance.actId)?.name ??
                      t('admin.timetable.performances.unknownAct')}
                  </h3>
                  <dl>
                    <div>
                      <dt>{t('admin.timetable.performances.dayLabel')}</dt>
                      <dd>
                        {dayById.get(performance.festivalDayId)?.label ??
                          t('admin.timetable.performances.unknownDay')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('admin.timetable.performances.stageLabel')}</dt>
                      <dd>
                        {stageById.get(performance.stageId)?.name ??
                          t('admin.timetable.performances.unknownStage')}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('admin.timetable.performances.startLabel')}</dt>
                      <dd>{toDateTimeLocalValue(performance.startsAt)}</dd>
                    </div>
                    <div>
                      <dt>{t('admin.timetable.performances.endLabel')}</dt>
                      <dd>
                        {performance.endsAt
                          ? toDateTimeLocalValue(performance.endsAt)
                          : '-'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="admin-category-card__controls">
                  <div className="admin-category-card__actions">
                    <button
                      className="admin-card__reset admin-card__reset--secondary"
                      type="button"
                      disabled={deletingPerformanceId === performance.id}
                      onClick={() => startEdit(performance)}
                    >
                      {t('admin.timetable.performances.edit')}
                    </button>
                    <button
                      className="admin-card__reset"
                      type="button"
                      disabled={deletingPerformanceId === performance.id}
                      onClick={() => onDelete(performance)}
                    >
                      {deletingPerformanceId === performance.id
                        ? t('admin.timetable.performances.deleting')
                        : t('admin.timetable.performances.delete')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
