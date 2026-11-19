export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function sanitizeEmailInput(value: string): string {
  return value.replace(/\s/g, "").slice(0, 254)
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address"
  return null
}
