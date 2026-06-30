import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

type AdminFestivalProps = {
  festivalName: string
  error: string
  isSaving: boolean
  onSave: (name: string) => Promise<void>
  onArchive: () => Promise<string>
}

export function AdminFestival({
  festivalName,
  error,
  isSaving,
  onSave,
  onArchive,
}: AdminFestivalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(festivalName)
  const [formError, setFormError] = useState('')
  const [archiveMessage, setArchiveMessage] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)

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

  async function archiveCurrentFestival() {
    const shouldArchive = window.confirm(t('admin.festival.archiveConfirm'))

    if (!shouldArchive) {
      return
    }

    setIsArchiving(true)
    setArchiveMessage('')
    setArchiveError('')

    try {
      const archiveId = await onArchive()

      setArchiveMessage(
        t('admin.festival.archiveSuccess', {
          archiveId,
        }),
      )
    } catch {
      setArchiveError(t('admin.festival.errors.archive'))
    } finally {
      setIsArchiving(false)
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
          disabled={isSaving || isArchiving}
        >
          {isSaving ? t('common.saving') : t('admin.festival.save')}
        </button>
      </form>

      <div className="admin-festival-archive">
        <button
          className="admin-card__reset admin-card__reset--secondary"
          type="button"
          disabled={isSaving || isArchiving}
          onClick={archiveCurrentFestival}
        >
          {isArchiving
            ? t('admin.festival.archiving')
            : t('admin.festival.archive')}
        </button>

        {archiveMessage ? (
          <p className="admin-festival-archive__success">{archiveMessage}</p>
        ) : null}

        {archiveError ? (
          <p className="admin-participant-form__error">{archiveError}</p>
        ) : null}
      </div>
    </>
  )
}
