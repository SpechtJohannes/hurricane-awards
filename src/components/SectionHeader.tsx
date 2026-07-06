import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: ReactNode
  titleId?: string
  eyebrow?: ReactNode
  description?: ReactNode
  width?: 'standard' | 'narrow'
  className?: string
}

export function SectionHeader({
  title,
  titleId,
  eyebrow,
  description,
  width = 'standard',
  className,
}: SectionHeaderProps) {
  const classNames = [
    'section-header',
    width === 'narrow' ? 'section-header--narrow' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      {eyebrow ? <p className="section-header__eyebrow">{eyebrow}</p> : null}
      <h2 className="section-header__title" id={titleId}>
        {title}
      </h2>
      {description ? (
        <p className="section-header__description">{description}</p>
      ) : null}
    </div>
  )
}
