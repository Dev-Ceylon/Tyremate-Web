export const PHONE_REGEX = /^\d{9,10}$/

export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10)
}

export function validatePhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!PHONE_REGEX.test(trimmed)) return "Must be 9-10 digits"
  return null
}
