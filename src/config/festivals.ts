export type FestivalConfig = {
  id: string
  name: string
  accessCode: string
}

const storagePrefix = 'hurricane-awards'

export const activeFestival: FestivalConfig = {
  id: 'hurricane-awards-2026',
  name: 'Hurricane Awards 2026',
  accessCode: 'HURRICANE2026',
}

export function festivalStorageKey(festivalId: string, key: string) {
  return `${storagePrefix}:${festivalId}:${key}`
}

export function normalizeFestivalCode(code: string) {
  return code.trim().toUpperCase()
}

export function isValidFestivalCode(festival: FestivalConfig, code: string) {
  return normalizeFestivalCode(code) === normalizeFestivalCode(festival.accessCode)
}
