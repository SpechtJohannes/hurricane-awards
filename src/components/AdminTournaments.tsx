import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Participant } from '../data/participants'
import {
  largestPowerOfTwo,
  type Tournament,
  type TournamentMode,
} from '../data/tournaments'
import { ParticipantName } from './Avatar'
import { SectionHeader } from './SectionHeader'
import { TournamentBracket } from './TournamentBracket'

type TournamentFormState = {
  id: string | null
  name: string
  mode: TournamentMode
  participantIds: string[]
}

type AdminTournamentsProps = {
  tournaments: Tournament[]
  participants: Participant[]
  error: string
  isLoading: boolean
  savingTournamentId: string | null
  deletingTournamentId: string | null
  onCreate: (input: {
    name: string
    mode: TournamentMode
    participantIds: string[]
  }) => Promise<void>
  onUpdate: (
    tournamentId: string,
    input: { name: string; mode: TournamentMode; participantIds: string[] },
  ) => Promise<void>
  onDelete: (tournamentId: string) => Promise<void>
}

function emptyForm(): TournamentFormState {
  return {
    id: null,
    name: '',
    mode: 'knockout',
    participantIds: [],
  }
}

export function AdminTournaments({
  tournaments,
  participants,
  error,
  isLoading,
  savingTournamentId,
  deletingTournamentId,
  onCreate,
  onUpdate,
  onDelete,
}: AdminTournamentsProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<TournamentFormState | null>(null)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const activeParticipants = participants.filter(
    (participant) => participant.isActive,
  )

  function startEdit(tournament: Tournament) {
    setFormError('')
    setActionError('')
    setForm({
      id: tournament.id,
      name: tournament.name,
      mode: tournament.mode,
      participantIds: tournament.selectedParticipantIds,
    })
  }

  function toggleParticipant(participantId: string) {
    setFormError('')
    setForm((currentForm) => {
      if (!currentForm) {
        return currentForm
      }

      const participantIds = currentForm.participantIds.includes(participantId)
        ? currentForm.participantIds.filter((id) => id !== participantId)
        : [...currentForm.participantIds, participantId]

      return {
        ...currentForm,
        participantIds,
      }
    })
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form) {
      return
    }

    const name = form.name.trim()

    if (!name) {
      setFormError(t('admin.tournaments.errors.nameRequired'))
      return
    }

    if (form.participantIds.length < 2) {
      setFormError(t('admin.tournaments.errors.participantsRequired'))
      return
    }

    setFormError('')
    setActionError('')

    try {
      if (form.id) {
        await onUpdate(form.id, {
          name,
          mode: 'knockout',
          participantIds: form.participantIds,
        })
      } else {
        await onCreate({
          name,
          mode: 'knockout',
          participantIds: form.participantIds,
        })
      }

      setForm(null)
    } catch {
      setFormError(t('admin.tournaments.errors.save'))
    }
  }

  async function deleteCurrentTournament(tournament: Tournament) {
    if (!window.confirm(t('admin.tournaments.confirmDelete', {
      name: tournament.name,
    }))) {
      return
    }

    setActionError('')

    try {
      await onDelete(tournament.id)
    } catch {
      setActionError(t('admin.tournaments.errors.delete'))
    }
  }

  return (
    <>
      <SectionHeader
        title={t('admin.tournaments.title')}
        titleId="admin-tournaments-title"
        eyebrow={t('admin.tournaments.eyebrow')}
      />

      <div className="admin-tournaments">
        {form ? (
          <form className="admin-tournaments__form" onSubmit={submitForm}>
            <div>
              <label htmlFor="tournament-name">
                {t('admin.tournaments.nameLabel')}
              </label>
              <input
                id="tournament-name"
                type="text"
                value={form.name}
                disabled={savingTournamentId !== null}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value })
                  setFormError('')
                }}
              />
            </div>

            <div
              className="admin-tournaments__participants"
              aria-label={t('admin.tournaments.participantsLabel')}
            >
              {activeParticipants.map((participant) => (
                <label key={participant.id}>
                  <input
                    type="checkbox"
                    checked={form.participantIds.includes(participant.id)}
                    disabled={savingTournamentId !== null}
                    onChange={() => toggleParticipant(participant.id)}
                  />
                  <ParticipantName
                    avatarId={participant.avatarId}
                    name={participant.displayName}
                  />
                </label>
              ))}
            </div>

            {activeParticipants.length === 0 ? (
              <p className="admin-bingo__status">
                {t('admin.tournaments.noActiveParticipants')}
              </p>
            ) : null}

            {form.participantIds.length >= 2 &&
            largestPowerOfTwo(form.participantIds.length) !==
              form.participantIds.length ? (
              <p className="admin-bingo__status">
                {t('admin.tournaments.byeNotice')}
              </p>
            ) : null}

            {formError ? (
              <p className="admin-participant-form__error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="admin-tournaments__form-actions">
              <button
                className="admin-card__reset admin-card__reset--primary"
                type="submit"
                disabled={savingTournamentId !== null}
              >
                {savingTournamentId
                  ? t('common.saving')
                  : t('admin.tournaments.save')}
              </button>
              <button
                className="admin-card__reset admin-card__reset--secondary"
                type="button"
                disabled={savingTournamentId !== null}
                onClick={() => {
                  setForm(null)
                  setFormError('')
                }}
              >
                {t('admin.tournaments.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <button
            className="admin-card__reset admin-card__reset--primary"
            type="button"
            onClick={() => setForm(emptyForm())}
          >
            {t('admin.tournaments.createButton')}
          </button>
        )}

        {isLoading ? (
          <p className="admin-bingo__status">{t('admin.tournaments.loading')}</p>
        ) : null}

        {error || actionError ? (
          <p className="admin-participant-form__error" role="alert">
            {error || actionError}
          </p>
        ) : null}

        {!isLoading && tournaments.length === 0 ? (
          <p className="admin-bingo__status">{t('admin.tournaments.empty')}</p>
        ) : null}

        <div className="admin-tournaments__list">
          {tournaments.map((tournament) => (
            <article className="admin-tournament" key={tournament.id}>
              <div className="admin-tournament__header">
                <div>
                  <h3>{tournament.name}</h3>
                  <p>
                    {t('admin.tournaments.status', {
                      count: tournament.selectedParticipantIds.length,
                    })}
                  </p>
                  <p>{t('admin.tournaments.modes.knockout')}</p>
                </div>
                <div className="admin-tournament__actions">
                  <button
                    className="admin-card__reset admin-card__reset--secondary"
                    type="button"
                    disabled={savingTournamentId !== null}
                    onClick={() => startEdit(tournament)}
                  >
                    {t('admin.tournaments.edit')}
                  </button>
                  <button
                    className="admin-card__reset admin-card__reset--secondary"
                    type="button"
                    disabled={deletingTournamentId === tournament.id}
                    onClick={() => {
                      void deleteCurrentTournament(tournament)
                    }}
                  >
                    {deletingTournamentId === tournament.id
                      ? t('admin.tournaments.deleting')
                      : t('admin.tournaments.delete')}
                  </button>
                </div>
              </div>
              <TournamentBracket tournament={tournament} />
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
