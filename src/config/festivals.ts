export type FestivalConfig = {
  id: string
}

const storagePrefix = 'hurricane-awards'

export const activeFestival: FestivalConfig = {
  id: 'hurricane-awards-2026',
}

export function festivalStorageKey(festivalId: string, key: string) {
  return `${storagePrefix}:${festivalId}:${key}`
}

export function normalizeFestivalCode(code: string) {
  return code.trim().toUpperCase()
}
