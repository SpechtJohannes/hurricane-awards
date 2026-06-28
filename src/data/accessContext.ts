export type ParticipantAccessContext = {
  participantAccessCode: string
}

export type AdminAccessContext = ParticipantAccessContext

export function participantRpcParams(context: ParticipantAccessContext) {
  return {
    p_participant_access_code: context.participantAccessCode,
  }
}
