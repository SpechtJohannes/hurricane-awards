import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

type AdminFestivalProps = {
  festivalName: string
  error: string
  isSaving: boolean
  festivalCode: string
  festivalCodeError: string
  isLoadingFestivalCode: boolean
  isSavingFestivalCode: boolean
  isExporting: boolean
  onSave: (name: string) => Promise<void>
  onSaveFestivalCode: (code: string) => Promise<void>
  onArchive: () => Promise<string>
  onExport: () => Promise<void>
}

export function AdminFestival({
  festivalName,
  error,
  isSaving,
  festivalCode,
  festivalCodeError,
  isLoadingFestivalCode,
  isSavingFestivalCode,
  isExporting,
  onSave,
  onSaveFestivalCode,
  onArchive,
  onExport,
}: AdminFestivalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(festivalName)
  const [code, setCode] = useState(festivalCode)
  const [formError, setFormError] = useState('')
  const [codeFormError, setCodeFormError] = useState('')
  const [archiveMessage, setArchiveMessage] = useState('')
  const [archiveError, setArchiveError] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [exportError, setExportError] = useState('')
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

  async function submitCodeForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedCode = code.trim().toUpperCase()

    if (!trimmedCode) {
      setCodeFormError(t('admin.festival.errors.codeRequired'))
      return
    }

    setCodeFormError('')

    try {
      await onSaveFestivalCode(trimmedCode)
    } catch (saveError) {
      setCodeFormError(
        saveError instanceof Error
          ? saveError.message
          : t('admin.festival.errors.codeSave'),
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

  async function exportCurrentFestival() {
    setExportMessage('')
    setExportError('')

    try {
      await onExport()
      setExportMessage(t('admin.festival.exportSuccess'))
    } catch {
      setExportError(t('admin.festival.errors.export'))
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
          disabled={
            isSaving ||
            isArchiving ||
            isExporting ||
            isLoadingFestivalCode ||
            isSavingFestivalCode
          }
        >
          {isSaving ? t('common.saving') : t('admin.festival.save')}
        </button>
      </form>

      <form className="admin-festival" onSubmit={submitCodeForm}>
        <div>
          <label htmlFor="admin-festival-code">
            {t('admin.festival.codeLabel')}
          </label>
          <input
            id="admin-festival-code"
            type="text"
            value={code}
            disabled={isLoadingFestivalCode || isSavingFestivalCode}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase())
              setCodeFormError('')
            }}
            autoComplete="off"
            inputMode="text"
            placeholder={
              isLoadingFestivalCode
                ? t('admin.festival.codeLoading')
                : undefined
            }
          />
        </div>

        {festivalCodeError ? (
          <p className="admin-participant-form__error">{festivalCodeError}</p>
        ) : null}

        {codeFormError ? (
          <p className="admin-participant-form__error">{codeFormError}</p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--primary"
          type="submit"
          disabled={
            isSaving ||
            isArchiving ||
            isExporting ||
            isLoadingFestivalCode ||
            isSavingFestivalCode
          }
        >
          {isSavingFestivalCode
            ? t('common.saving')
            : t('admin.festival.codeSave')}
        </button>
      </form>

      <div className="admin-festival-actions">
        <button
          className="admin-card__reset admin-card__reset--primary"
          type="button"
          disabled={
            isSaving ||
            isArchiving ||
            isExporting ||
            isLoadingFestivalCode ||
            isSavingFestivalCode
          }
          onClick={exportCurrentFestival}
        >
          {isExporting
            ? t('admin.festival.exporting')
            : t('admin.festival.export')}
        </button>

        {exportMessage ? (
          <p className="admin-festival-actions__success">{exportMessage}</p>
        ) : null}

        {exportError ? (
          <p className="admin-participant-form__error">{exportError}</p>
        ) : null}

        <button
          className="admin-card__reset admin-card__reset--secondary"
          type="button"
          disabled={
            isSaving ||
            isArchiving ||
            isExporting ||
            isLoadingFestivalCode ||
            isSavingFestivalCode
          }
          onClick={archiveCurrentFestival}
        >
          {isArchiving
            ? t('admin.festival.archiving')
            : t('admin.festival.archive')}
        </button>

        {archiveMessage ? (
          <p className="admin-festival-actions__success">{archiveMessage}</p>
        ) : null}

        {archiveError ? (
          <p className="admin-participant-form__error">{archiveError}</p>
        ) : null}
      </div>
    </>
  )
}
