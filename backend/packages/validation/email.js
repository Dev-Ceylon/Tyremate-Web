const { normalizeText } = require("./normalize")

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    if (fieldName) {
      throw new Error(`${fieldName} is required`)
    }
    return null
  }

  if (!EMAIL_REGEX.test(normalized)) {
    const label = fieldName || "Email address"
    throw new Error(`${label} must be a valid email address`)
  }

  return normalized
}

const normalizeEmail = (value) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  const sanitized = normalized.replace(/\s/g, "").slice(0, 254)

  return sanitized || null
}

module.exports = {
  EMAIL_REGEX,
  validateEmail,
  normalizeEmail,
}
