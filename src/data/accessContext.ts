export type ParticipantAccessContext = {
  participantAccessCode: string;
};

export function participantRpcParams(context: ParticipantAccessContext) {
  return {
    p_participant_access_code: context.participantAccessCode,
  };
}
