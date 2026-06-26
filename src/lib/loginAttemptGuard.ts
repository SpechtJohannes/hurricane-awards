export type LoginAttemptGuardConfig = {
  maxInvalidAttempts: number
  lockDurationMs: number
}

export type LoginAttemptGuardState = {
  invalidAttempts: number
  lockedUntil: number | null
}

export const loginAttemptGuardConfig: LoginAttemptGuardConfig = {
  maxInvalidAttempts: 3,
  lockDurationMs: 30_000,
}

export const initialLoginAttemptGuardState: LoginAttemptGuardState = {
  invalidAttempts: 0,
  lockedUntil: null,
}

function isLoginAttemptGuardState(
  value: unknown,
): value is LoginAttemptGuardState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const state = value as Partial<LoginAttemptGuardState>

  return (
    typeof state.invalidAttempts === 'number' &&
    Number.isInteger(state.invalidAttempts) &&
    state.invalidAttempts >= 0 &&
    (state.lockedUntil === null ||
      (typeof state.lockedUntil === 'number' && Number.isFinite(state.lockedUntil)))
  )
}

export function getLoginLockRemainingMs(
  state: LoginAttemptGuardState,
  now: number,
): number {
  if (!state.lockedUntil) {
    return 0
  }

  return Math.max(0, state.lockedUntil - now)
}

export function registerInvalidLoginAttempt(
  state: LoginAttemptGuardState,
  now: number,
  config = loginAttemptGuardConfig,
): LoginAttemptGuardState {
  if (getLoginLockRemainingMs(state, now) > 0) {
    return state
  }

  const invalidAttempts = state.invalidAttempts + 1

  if (invalidAttempts >= config.maxInvalidAttempts) {
    return {
      invalidAttempts: 0,
      lockedUntil: now + config.lockDurationMs,
    }
  }

  return {
    invalidAttempts,
    lockedUntil: null,
  }
}

export function resetLoginAttemptGuard(): LoginAttemptGuardState {
  return initialLoginAttemptGuardState
}

export function readStoredLoginAttemptGuard(
  storage: Storage,
  storageKey: string,
  now: number,
): LoginAttemptGuardState {
  const storedState = storage.getItem(storageKey)

  if (!storedState) {
    return initialLoginAttemptGuardState
  }

  try {
    const parsedState = JSON.parse(storedState) as unknown

    if (!isLoginAttemptGuardState(parsedState)) {
      storage.removeItem(storageKey)
      return initialLoginAttemptGuardState
    }

    if (parsedState.lockedUntil && parsedState.lockedUntil <= now) {
      storage.removeItem(storageKey)
      return initialLoginAttemptGuardState
    }

    return parsedState
  } catch {
    storage.removeItem(storageKey)
    return initialLoginAttemptGuardState
  }
}

export function storeLoginAttemptGuard(
  storage: Storage,
  storageKey: string,
  state: LoginAttemptGuardState,
) {
  if (
    state.invalidAttempts === initialLoginAttemptGuardState.invalidAttempts &&
    state.lockedUntil === initialLoginAttemptGuardState.lockedUntil
  ) {
    storage.removeItem(storageKey)
    return
  }

  storage.setItem(storageKey, JSON.stringify(state))
}

export function clearStoredLoginAttemptGuard(
  storage: Storage,
  storageKey: string,
) {
  storage.removeItem(storageKey)
}
