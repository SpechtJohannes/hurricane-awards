import { useTranslation } from 'react-i18next'
import type { BingoCard } from '../data/bingo'

type BingoProps = {
  card: BingoCard
  error: string
  togglingNumber: number | null
  onToggleNumber: (number: number) => Promise<void>
}

export function Bingo({
  card,
  error,
  togglingNumber,
  onToggleNumber,
}: BingoProps) {
  const { t } = useTranslation()
  const markedNumbers = new Set(card.markedNumbers)

  return (
    <section className="bingo" id="main-bingo" aria-labelledby="bingo-title">
      <div className="bingo__header">
        <p className="bingo__eyebrow">{t('bingo.eyebrow')}</p>
        <h2 id="bingo-title">{t('bingo.title')}</h2>
        <p>{t('bingo.description')}</p>
      </div>

      {error ? (
        <p className="bingo__notice bingo__notice--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="bingo-card" aria-label={t('bingo.cardLabel')}>
        {card.numbers.map((number) => {
          const isMarked = markedNumbers.has(number)

          return (
            <button
              className={`bingo-card__number${isMarked ? ' is-marked' : ''}`}
              type="button"
              key={number}
              aria-pressed={isMarked}
              disabled={togglingNumber !== null}
              onClick={() => {
                void onToggleNumber(number)
              }}
            >
              {number}
            </button>
          )
        })}
      </div>
    </section>
  )
}
