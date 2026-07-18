import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { AdminRandomPairingAction } from "../data/randomPairings";
import type { Participant } from "../data/participants";
import { ParticipantName } from "./Avatar";
import { SectionHeader } from "./SectionHeader";

type AdminRandomPairingsProps = {
  actions: AdminRandomPairingAction[];
  participants: Participant[];
  error: string;
  isLoading: boolean;
  savingActionId: string | null;
  isCreating: boolean;
  onCreate: (name: string) => Promise<void>;
  onUpdateParticipants: (
    actionId: string,
    participantIds: string[],
  ) => Promise<void>;
  onDraw: (actionId: string, replaceExisting: boolean) => Promise<void>;
  onReset: (actionId: string) => Promise<void>;
};

export function AdminRandomPairings({
  actions,
  participants,
  error,
  isLoading,
  savingActionId,
  isCreating,
  onCreate,
  onUpdateParticipants,
  onDraw,
  onReset,
}: AdminRandomPairingsProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [resetCandidate, setResetCandidate] =
    useState<AdminRandomPairingAction | null>(null);
  const [resetSuccess, setResetSuccess] = useState("");
  const activeParticipants = participants.filter(
    (participant) => participant.isActive,
  );
  const participantNamesById = new Map(
    participants.map((participant) => [
      participant.id,
      participant.displayName,
    ]),
  );

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setFormError(t("admin.randomPairings.errors.nameRequired"));
      return;
    }

    setFormError("");

    try {
      await onCreate(trimmedName);
      setName("");
    } catch {
      setFormError(t("admin.randomPairings.errors.create"));
    }
  }

  async function toggleParticipant(
    action: AdminRandomPairingAction,
    participantId: string,
    isSelected: boolean,
  ) {
    const nextParticipantIds = isSelected
      ? action.selectedParticipantIds.filter((id) => id !== participantId)
      : Array.from(new Set([...action.selectedParticipantIds, participantId]));

    setActionErrors((currentErrors) => ({
      ...currentErrors,
      [action.id]: "",
    }));

    try {
      await onUpdateParticipants(action.id, nextParticipantIds);
    } catch {
      setActionErrors((currentErrors) => ({
        ...currentErrors,
        [action.id]: t("admin.randomPairings.errors.participants"),
      }));
    }
  }

  async function drawAction(action: AdminRandomPairingAction) {
    const replaceExisting =
      action.status === "drawn"
        ? window.confirm(t("admin.randomPairings.confirmRedraw"))
        : false;

    if (action.status === "drawn" && !replaceExisting) {
      return;
    }

    setActionErrors((currentErrors) => ({
      ...currentErrors,
      [action.id]: "",
    }));

    try {
      await onDraw(action.id, replaceExisting);
    } catch {
      setActionErrors((currentErrors) => ({
        ...currentErrors,
        [action.id]: t("admin.randomPairings.errors.draw"),
      }));
    }
  }

  async function resetAction() {
    if (!resetCandidate) {
      return;
    }

    const action = resetCandidate;
    setActionErrors((currentErrors) => ({
      ...currentErrors,
      [action.id]: "",
    }));
    setResetSuccess("");

    try {
      await onReset(action.id);
      setResetCandidate(null);
      setResetSuccess(
        t("admin.randomPairings.reset.success", { name: action.name }),
      );
    } catch {
      setActionErrors((currentErrors) => ({
        ...currentErrors,
        [action.id]: t("admin.randomPairings.errors.reset"),
      }));
      setResetCandidate(null);
    }
  }

  return (
    <>
      <SectionHeader
        title={t("admin.randomPairings.title")}
        titleId="admin-random-pairings-title"
        eyebrow={t("admin.randomPairings.eyebrow")}
      />

      <div className="admin-random-pairings">
        <form className="admin-random-pairings__form" onSubmit={submitAction}>
          <div>
            <label htmlFor="random-pairing-name">
              {t("admin.randomPairings.nameLabel")}
            </label>
            <input
              id="random-pairing-name"
              type="text"
              value={name}
              disabled={isCreating}
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
            />
          </div>

          {formError ? (
            <p className="admin-participant-form__error" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            className="admin-card__reset admin-card__reset--primary"
            type="submit"
            disabled={isCreating}
          >
            {isCreating ? t("common.saving") : t("admin.randomPairings.create")}
          </button>
        </form>

        {isLoading ? (
          <p className="admin-bingo__status">
            {t("admin.randomPairings.loading")}
          </p>
        ) : null}

        {error ? (
          <p className="admin-participant-form__error" role="alert">
            {error}
          </p>
        ) : null}

        {resetSuccess ? (
          <p className="admin-random-pairings__notice" role="status">
            {resetSuccess}
          </p>
        ) : null}

        {!isLoading && actions.length === 0 ? (
          <p className="admin-bingo__status">
            {t("admin.randomPairings.empty")}
          </p>
        ) : null}

        <div className="admin-random-pairings__list">
          {actions.map((action) => {
            const isDrawn = action.status === "drawn";
            const isSaving = savingActionId === action.id;
            const actionError = actionErrors[action.id] ?? "";

            return (
              <article className="admin-random-pairing" key={action.id}>
                <div className="admin-random-pairing__header">
                  <div>
                    <h3>{action.name}</h3>
                    <p>
                      {isDrawn
                        ? t("admin.randomPairings.status.drawn", {
                            count: action.assignments.length,
                          })
                        : t("admin.randomPairings.status.draft", {
                            count: action.selectedParticipantIds.length,
                          })}
                    </p>
                  </div>
                  <button
                    className="admin-card__reset admin-card__reset--primary"
                    type="button"
                    disabled={
                      isSaving || action.selectedParticipantIds.length < 2
                    }
                    onClick={() => {
                      void drawAction(action);
                    }}
                  >
                    {isSaving
                      ? t("common.saving")
                      : isDrawn
                        ? t("admin.randomPairings.redraw")
                        : t("admin.randomPairings.draw")}
                  </button>
                </div>

                {actionError ? (
                  <p className="admin-participant-form__error" role="alert">
                    {actionError}
                  </p>
                ) : null}

                <div
                  className="admin-random-pairing__participants"
                  aria-label={t("admin.randomPairings.participantsLabel", {
                    name: action.name,
                  })}
                >
                  {activeParticipants.map((participant) => {
                    const isSelected = action.selectedParticipantIds.includes(
                      participant.id,
                    );

                    return (
                      <label key={participant.id}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isSaving || isDrawn}
                          onChange={() => {
                            void toggleParticipant(
                              action,
                              participant.id,
                              isSelected,
                            );
                          }}
                        />
                        <ParticipantName
                          avatarId={participant.avatarId}
                          name={participant.displayName}
                        />
                      </label>
                    );
                  })}
                </div>

                {isDrawn ? (
                  <>
                    <div className="admin-random-pairing__assignments">
                      <h4>{t("admin.randomPairings.resultsTitle")}</h4>
                      <ul>
                        {action.assignments.map((assignment) => (
                          <li key={assignment.participantId}>
                            <span>
                              {assignment.participantName ||
                                participantNamesById.get(
                                  assignment.participantId,
                                ) ||
                                assignment.participantId}
                            </span>
                            <strong>
                              {assignment.assignedParticipantName ||
                                participantNamesById.get(
                                  assignment.assignedParticipantId,
                                ) ||
                                assignment.assignedParticipantId}
                            </strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {action.assignments.length > 0 ? (
                      <button
                        className="admin-card__reset"
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setResetSuccess("");
                          setResetCandidate(action);
                        }}
                      >
                        {t("admin.randomPairings.reset.open")}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      {resetCandidate ? (
        <div className="admin-dialog-backdrop">
          <div
            className="admin-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-random-pairing-title"
            aria-describedby="reset-random-pairing-description"
          >
            <h3 id="reset-random-pairing-title">
              {t("admin.randomPairings.reset.title")}
            </h3>
            <p id="reset-random-pairing-description">
              {t("admin.randomPairings.reset.description", {
                name: resetCandidate.name,
              })}
            </p>
            <div className="admin-dialog__actions">
              <button
                className="admin-card__reset"
                type="button"
                disabled={savingActionId === resetCandidate.id}
                onClick={() => setResetCandidate(null)}
              >
                {t("admin.randomPairings.reset.cancel")}
              </button>
              <button
                className="admin-card__reset admin-card__reset--primary"
                type="button"
                disabled={savingActionId === resetCandidate.id}
                onClick={() => void resetAction()}
              >
                {savingActionId === resetCandidate.id
                  ? t("common.saving")
                  : t("admin.randomPairings.reset.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
