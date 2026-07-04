import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BingoRound } from '../data/bingo'

type AdminBingoProps = {
  round: BingoRound | null
  error: string
  isLoading: boolean
  isSaving: boolean
  onStart: () => Promise<void>
  onClose: () => Promise<void>
}

export function AdminBingo({
  round,
  error,
  isLoading,
  isSaving,
  onStart,
  onClose,
}: AdminBingoProps) {
  const { t } = useTranslation()
  const [actionError, setActionError] = useState('')
  const isDisabled = isLoading || isSaving

  async function startRound() {
    setActionError('')

    try {
      await onStart()
    } catch {
      setActionError(t('admin.bingo.errors.start'))
    }
  }

  async function closeRound() {
    if (!window.confirm(t('admin.bingo.confirmClose'))) {
      return
    }

    setActionError('')

    try {
      await onClose()
    } catch {
      setActionError(t('admin.bingo.errors.close'))
    }
  }

  return (
    <>
      <div className="admin__header">
        <p className="admin__eyebrow">{t('admin.bingo.eyebrow')}</p>
        <h2 id="admin-bingo-title">{t('admin.bingo.title')}</h2>
      </div>

      <div className="admin-bingo">
        {isLoading ? (
          <p className="admin-bingo__status">{t('admin.bingo.loading')}</p>
        ) : round ? (
          <p className="admin-bingo__status">
            {t('admin.bingo.active', {
              startedAt: new Date(round.startedAt).toLocaleString(),
            })}
          </p>
        ) : (
          <p className="admin-bingo__status">{t('admin.bingo.inactive')}</p>
        )}

        {error ? (
          <p className="admin-participant-form__error" role="alert">
            {error}
          </p>
        ) : null}

        {actionError ? (
          <p className="admin-participant-form__error" role="alert">
            {actionError}
          </p>
        ) : null}

        {round ? (
          <button
            className="admin-card__reset admin-card__reset--secondary"
            type="button"
            disabled={isDisabled}
            onClick={closeRound}
          >
            {isSaving ? t('common.saving') : t('admin.bingo.close')}
          </button>
        ) : (
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            disabled={isDisabled}
            onClick={startRound}
          >
            {isSaving ? t('common.saving') : t('admin.bingo.start')}
          </button>
        )}
      </div>
    </>
  )
}
