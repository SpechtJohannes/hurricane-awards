export type CategoryStatus = 'upcoming' | 'open' | 'closed'

export type Category = {
  id: string
  title: string
  description: string
  status: CategoryStatus
}

export const categories: Category[] = [
  {
    id: 'tagesvollster-donnerstag',
    title: 'Tagesvollster Donnerstag',
    description: 'Der Auftaktpreis für den stabilsten Start ins Festival.',
    status: 'open',
  },
  {
    id: 'tagesvollster-freitag',
    title: 'Tagesvollster Freitag',
    description: 'Auszeichnung für maximale Freitagsform auf dem Gelände.',
    status: 'upcoming',
  },
  {
    id: 'tagesvollster-samstag',
    title: 'Tagesvollster Samstag',
    description: 'Der finale Härtetest für Kondition, Timing und Eskalation.',
    status: 'upcoming',
  },
  {
    id: 'bestes-outfit',
    title: 'Bestes Outfit',
    description: 'Für den Look, der zwischen Festival, Fashion und Wahnsinn gewinnt.',
    status: 'upcoming',
  },
  {
    id: 'bester-festival-moment',
    title: 'Bester Festival Moment',
    description: 'Der Moment, über den auch 2027 noch gesprochen wird.',
    status: 'upcoming',
  },
]
