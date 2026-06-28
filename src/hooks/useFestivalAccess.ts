import { useState } from 'react'
import {
  festivalStorageKey,
  isValidFestivalCode,
  type FestivalConfig,
} from '../config/festivals'

type FestivalAccessState = {
  isUnlocked: boolean
  unlock: (code: string) => boolean
}

export function festivalAccessStorageKey(festivalId: string) {
  return festivalStorageKey(festivalId, 'festival-access')
}

function readStoredFestivalAccess(festival: FestivalConfig) {
  return localStorage.getItem(festivalAccessStorageKey(festival.id)) === 'unlocked'
}

export function useFestivalAccess(festival: FestivalConfig): FestivalAccessState {
  const [isUnlocked, setIsUnlocked] = useState(() =>
    readStoredFestivalAccess(festival),
  )

  function unlock(code: string) {
    if (!isValidFestivalCode(festival, code)) {
      return false
    }

    localStorage.setItem(festivalAccessStorageKey(festival.id), 'unlocked')
    setIsUnlocked(true)
    return true
  }

  return {
    isUnlocked,
    unlock,
  }
}
