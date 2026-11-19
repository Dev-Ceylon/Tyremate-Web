const repository = require("../repositories/devTempLockRepository")
const {
  DEV_TEMP_LOCK_ENABLED,
  DEV_TEMP_LOCK_DURATION_DAYS,
} = require("../config/devTempLockConfig")

const initialize = () => {
  if (!DEV_TEMP_LOCK_ENABLED) return null

  const current = repository.get()
  if (current) return current

  const firstStartedAt = new Date()
  const expiresAt = new Date(
    firstStartedAt.getTime() + DEV_TEMP_LOCK_DURATION_DAYS * 24 * 60 * 60 * 1000,
  )

  return repository.initialize({
    firstStartedAtUtc: firstStartedAt.toISOString(),
    expiresAtUtc: expiresAt.toISOString(),
  })
}

const getStatus = () => {
  if (!DEV_TEMP_LOCK_ENABLED) {
    return {
      enabled: false,
      locked: false,
      firstStartedAtUtc: null,
      expiresAtUtc: null,
      lockedAtUtc: null,
    }
  }

  const state = repository.get() || initialize()
  if (!state) throw new Error("Development lock state could not be initialized")

  const now = new Date()
  const expiry = Date.parse(state.ExpiresAtUtc)
  const invalidExpiry = !Number.isFinite(expiry)
  const isExpired = invalidExpiry || now.getTime() >= expiry
  const lockedState = state.LockedAtUtc || (isExpired ? now.toISOString() : null)
  const finalState = isExpired && !state.LockedAtUtc
    ? repository.markLocked(lockedState)
    : state

  return {
    enabled: true,
    locked: Boolean(finalState.LockedAtUtc) || invalidExpiry,
    firstStartedAtUtc: finalState.FirstStartedAtUtc,
    expiresAtUtc: finalState.ExpiresAtUtc,
    lockedAtUtc: finalState.LockedAtUtc || null,
  }
}

module.exports = {
  initialize,
  getStatus,
}
