const { normalizeText } = require("./normalize")

const PHONE_REGEX = /^\d{9,10}$/

const validatePhoneNumber = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    if (fieldName) {
      throw new Error(`${fieldName} is required`)
    }
    return null
  }

  if (!PHONE_REGEX.test(normalized)) {
    const label = fieldName || "Phone number"
    throw new Error(`${label} must be 9-10 digits`)
  }

  return normalized
}

const normalizePhone = (value) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  const digitsOnly = normalized.replace(/\D/g, "").slice(0, 10)

  return digitsOnly || null
}

module.exports = {
  PHONE_REGEX,
  validatePhoneNumber,
  normalizePhone,
}
