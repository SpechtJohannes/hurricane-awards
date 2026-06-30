import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

type AdminFestivalProps = {
  festivalName: string
  error: string
  isSaving: boolean
  onSave: (name: string) => Promise<void>
}

export function AdminFestival({
  festivalName,
  error,
  isSaving,
  onSave,
}: AdminFestivalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(festivalName)
  const [formError, setFormError] = useState('')

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError(t('admin.festival.errors.nameRequired'))
      return
    }

    setFormError('')

    try {
      await onSave(trimmedName)
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : t('admin.festival.errors.save'),
      )
    }
  }

  return (
    <>
      <div className="admin__header">
        <p className="admin__eyebrow">{t('admin.festival.eyebrow')}</p>
        <h2 id="admin-title">{t('admin.festival.title')}</h2>
      </div>

      {error ? <p className="admin__notice">{error}</p> : null}

      <form className="admin-festival" onSubmit={submitForm}>
        <div>
          <label htmlFor="admin-festival-name">
            {t('admin.festival.nameLabel')}
          </label>
          <input
            id="admin-festival-name"
            type="text"
            value={name}
            disabled={isSaving}
            onChange={(event) => {
              setName(event.target.value)
              setFormError('')
            }}
          />
        </div>

        {formError ? (
          <p className="admin-participant-form__error">{formError}</p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--primary"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? t('common.saving') : t('admin.festival.save')}
        </button>
      </form>
    </>
  )
}
