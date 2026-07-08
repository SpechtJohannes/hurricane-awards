import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  AdminHorseRacingBet,
  AdminHorseRacingState,
  HorseRacingBettingStatus,
} from '../data/horseRacing'
import { SectionHeader } from './SectionHeader'

type AdminHorseRacingProps = {
  state: AdminHorseRacingState | null
  bets: AdminHorseRacingBet[]
  error: string
  isLoading: boolean
  isSaving: boolean
  onUpdate: (input: {
    isEnabled: boolean
    bettingStatus: HorseRacingBettingStatus
  }) => Promise<void>
}

export function AdminHorseRacing({
  state,
  bets,
  error,
  isLoading,
  isSaving,
  onUpdate,
}: AdminHorseRacingProps) {
  const { t } = useTranslation()
  const [actionError, setActionError] = useState('')
  const isEnabled = state?.isEnabled === true
  const bettingStatus = state?.bettingStatus ?? 'closed'
  const isBettingOpen = isEnabled && bettingStatus === 'open'
  const isDisabled = isLoading || isSaving

  async function updateState(input: {
    isEnabled: boolean
    bettingStatus: HorseRacingBettingStatus
  }) {
    setActionError('')

    try {
      await onUpdate(input)
    } catch {
      setActionError(t('admin.horseRacing.errors.save'))
    }
  }

  return (
    <>
      <SectionHeader
        title={t('admin.horseRacing.title')}
        titleId="admin-horse-racing-title"
        eyebrow={t('admin.horseRacing.eyebrow')}
      />

      <div className="admin-bingo admin-horse-racing">
        {isLoading ? (
          <p className="admin-bingo__status">{t('admin.horseRacing.loading')}</p>
        ) : (
          <p className="admin-bingo__status">
            {isEnabled
              ? isBettingOpen
                ? t('admin.horseRacing.open', {
                    count: state?.betCount ?? 0,
                  })
                : t('admin.horseRacing.closed', {
                    count: state?.betCount ?? 0,
                  })
              : t('admin.horseRacing.disabled')}
          </p>
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

        <div className="admin-horse-racing__actions">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            disabled={isDisabled || isEnabled}
            onClick={() => updateState({ isEnabled: true, bettingStatus })}
          >
            {isSaving ? t('common.saving') : t('admin.horseRacing.enable')}
          </button>
          <button
            className="admin-card__reset admin-card__reset--secondary"
            type="button"
            disabled={isDisabled || !isEnabled}
            onClick={() =>
              updateState({ isEnabled: false, bettingStatus: 'closed' })
            }
          >
            {t('admin.horseRacing.disable')}
          </button>
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            disabled={isDisabled || !isEnabled || isBettingOpen}
            onClick={() =>
              updateState({ isEnabled: true, bettingStatus: 'open' })
            }
          >
            {t('admin.horseRacing.openBetting')}
          </button>
          <button
            className="admin-card__reset admin-card__reset--secondary"
            type="button"
            disabled={isDisabled || !isEnabled || !isBettingOpen}
            onClick={() =>
              updateState({ isEnabled: true, bettingStatus: 'closed' })
            }
          >
            {t('admin.horseRacing.closeBetting')}
          </button>
        </div>

        {bets.length > 0 ? (
          <div className="admin-horse-racing__bets">
            <h3>{t('admin.horseRacing.betsTitle')}</h3>
            <ul>
              {bets.map((bet) => (
                <li key={bet.participantId}>
                  <span>{bet.participantName}</span>
                  <strong>{t(`horseRacing.suits.${bet.suit}`)}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="admin-bingo__status">{t('admin.horseRacing.noBets')}</p>
        )}
      </div>
    </>
  )
}
