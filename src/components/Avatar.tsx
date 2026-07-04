import { avatarById } from '../config/avatars'

type AvatarProps = {
  avatarId?: string | null
  name: string
  size?: 'small' | 'medium' | 'large'
}

type ParticipantNameProps = AvatarProps & {
  className?: string
}

export function ParticipantAvatar({ avatarId, name, size = 'medium' }: AvatarProps) {
  const avatar = avatarById(avatarId)

  return (
    <span className={`avatar avatar--${size}`} title={avatar.label}>
      <img src={avatar.imageSrc} alt={`${name}: ${avatar.label}`} />
    </span>
  )
}

export const Avatar = ParticipantAvatar

export function ParticipantName({
  avatarId,
  name,
  size = 'small',
  className,
}: ParticipantNameProps) {
  return (
    <span className={className ? `participant-name ${className}` : 'participant-name'}>
      <ParticipantAvatar avatarId={avatarId} name={name} size={size} />
      <span>{name}</span>
    </span>
  )
}
