import { useEffect, useState } from 'react'
import { festivalStorageKey, type FestivalConfig } from '../config/festivals'
import {
  loadFestivalAccessVersion,
  verifyFestivalAccessCode,
} from '../data/festival'

type FestivalAccessState = {
  isUnlocked: boolean
  unlock: (code: string) => Promise<boolean>
  rememberAccessVersion: (version: string) => void
}

type StoredFestivalAccess = {
  version: string
}

export function festivalAccessStorageKey(festivalId: string) {
  return festivalStorageKey(festivalId, 'festival-access')
}

function parseStoredFestivalAccess(festival: FestivalConfig) {
  const storedValue = localStorage.getItem(festivalAccessStorageKey(festival.id))

  if (!storedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<StoredFestivalAccess>

    if (typeof parsedValue.version === 'string' && parsedValue.version) {
      return {
        version: parsedValue.version,
      }
    }
  } catch {
    localStorage.removeItem(festivalAccessStorageKey(festival.id))
  }

  return null
}

function storeFestivalAccess(festival: FestivalConfig, version: string) {
  localStorage.setItem(
    festivalAccessStorageKey(festival.id),
    JSON.stringify({ version }),
  )
}

export function useFestivalAccess(festival: FestivalConfig): FestivalAccessState {
  const [isUnlocked, setIsUnlocked] = useState(() =>
    Boolean(parseStoredFestivalAccess(festival)),
  )

  useEffect(() => {
    const storedAccess = parseStoredFestivalAccess(festival)

    if (!storedAccess) {
      return
    }

    const storedVersion = storedAccess.version
    let isCurrent = true

    async function validateStoredAccess() {
      try {
        const currentVersion = await loadFestivalAccessVersion()

        if (!isCurrent) {
          return
        }

        if (currentVersion && currentVersion === storedVersion) {
          setIsUnlocked(true)
          return
        }

        localStorage.removeItem(festivalAccessStorageKey(festival.id))
        setIsUnlocked(false)
      } catch {
        if (isCurrent) {
          setIsUnlocked(false)
        }
      }
    }

    void validateStoredAccess()

    return () => {
      isCurrent = false
    }
  }, [festival])

  async function unlock(code: string) {
    const verification = await verifyFestivalAccessCode(code)

    if (!verification.isValid || !verification.version) {
      return false
    }

    storeFestivalAccess(festival, verification.version)
    setIsUnlocked(true)
    return true
  }

  function rememberAccessVersion(version: string) {
    storeFestivalAccess(festival, version)
    setIsUnlocked(true)
  }

  return {
    isUnlocked,
    unlock,
    rememberAccessVersion,
  }
}
