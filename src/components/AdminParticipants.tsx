import { type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { type Participant } from '../data/participants'

export type ParticipantFormState = {
  id: string | null
  displayName: string
  accessCode: string
}

type AdminParticipantsProps = {
  participants: Participant[]
  error: string
  isLoading: boolean
  form: ParticipantFormState | null
  formError: string
  isSaving: boolean
  togglingParticipantId: string | null
  onCreate: () => void
  onEdit: (participant: Participant) => void
  onCancelForm: () => void
  onSubmitForm: (event: FormEvent<HTMLFormElement>) => void
  onChangeForm: (form: ParticipantFormState) => void
  onClearFormError: () => void
  onDeactivate: (participant: Participant) => void
  onReactivate: (participant: Participant) => void
}

export function AdminParticipants({
  participants,
  error,
  isLoading,
  form,
  formError,
  isSaving,
  togglingParticipantId,
  onCreate,
  onEdit,
  onCancelForm,
  onSubmitForm,
  onChangeForm,
  onClearFormError,
  onDeactivate,
  onReactivate,
}: AdminParticipantsProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="admin__header admin__header--participants">
        <p className="admin__eyebrow">{t('admin.participants.eyebrow')}</p>
        <h2>{t('admin.participants.title')}</h2>
      </div>

      {error ? <p className="admin__notice">{error}</p> : null}

      <div className="admin-participants">
        <div className="admin-participants__toolbar">
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            onClick={onCreate}
          >
            {t('admin.participants.createButton')}
          </button>
        </div>

        {form ? (
          <form className="admin-participant-form" onSubmit={onSubmitForm}>
            <h3>
              {form.id
                ? t('admin.participants.editTitle')
                : t('admin.participants.createTitle')}
            </h3>

            <label htmlFor="admin-participant-display-name">
              {t('admin.participants.displayNameLabel')}
              <input
                id="admin-participant-display-name"
                type="text"
                value={form.displayName}
                disabled={isSaving}
                onChange={(event) => {
                  onChangeForm({
                    ...form,
                    displayName: event.target.value,
                  })
                  onClearFormError()
                }}
              />
            </label>

            <label htmlFor="admin-participant-access-code">
              {t('admin.participants.accessCodeLabel')}
              <input
                id="admin-participant-access-code"
                type="text"
                value={form.accessCode}
                disabled={isSaving}
                onChange={(event) => {
                  onChangeForm({
                    ...form,
                    accessCode: event.target.value.toUpperCase(),
                  })
                  onClearFormError()
                }}
                autoComplete="off"
                inputMode="text"
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
                {isSaving ? t('common.saving') : t('admin.participants.save')}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={isSaving}
                onClick={onCancelForm}
              >
                {t('admin.participants.cancel')}
              </button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="admin__notice" role="status">
            {t('admin.participants.loading')}
          </p>
        ) : (
          <div className="admin-participants__list">
            {participants.map((participant) => (
              <article
                className={`admin-participant-card${
                  participant.isActive
                    ? ''
                    : ' admin-participant-card--inactive'
                }`}
                key={participant.id}
              >
                <div className="admin-participant-card__main">
                  <h3>{participant.displayName}</h3>
                  <dl>
                    <div>
                      <dt>{t('admin.participants.codeLabel')}</dt>
                      <dd>{participant.accessCode}</dd>
                    </div>
                    <div>
                      <dt>{t('admin.participants.statusLabel')}</dt>
                      <dd>
                        {participant.isActive
                          ? t('admin.participants.status.active')
                          : t('admin.participants.status.inactive')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="admin-participant-card__actions">
                  <button
                    className="admin-card__reset admin-card__reset--secondary"
                    type="button"
                    onClick={() => onEdit(participant)}
                  >
                    {t('admin.participants.edit')}
                  </button>

                  {participant.isActive ? (
                    <button
                      className="admin-card__reset"
                      type="button"
                      disabled={togglingParticipantId === participant.id}
                      onClick={() => onDeactivate(participant)}
                    >
                      {togglingParticipantId === participant.id
                        ? t('admin.participants.deactivating')
                        : t('admin.participants.deactivate')}
                    </button>
                  ) : (
                    <button
                      className="admin-card__reset admin-card__reset--primary"
                      type="button"
                      disabled={togglingParticipantId === participant.id}
                      onClick={() => onReactivate(participant)}
                    >
                      {togglingParticipantId === participant.id
                        ? t('admin.participants.reactivating')
                        : t('admin.participants.reactivate')}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
