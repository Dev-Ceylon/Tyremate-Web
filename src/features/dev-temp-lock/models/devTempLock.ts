export type DevTempLockStatus = {
  enabled: boolean
  locked: boolean
  firstStartedAtUtc: string | null
  expiresAtUtc: string | null
  lockedAtUtc: string | null
}
