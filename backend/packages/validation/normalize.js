const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

const normalizeRequiredText = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  return normalized
}

const normalizeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer`)
  }

  return normalized
}

const normalizeReal = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const normalized = Number(value)

  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`)
  }

  return normalized
}

const normalizeDate = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
  }

  return normalized
}

const normalizeBooleanFlag = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  if (value === true || value === "true") {
    return 1
  }

  if (value === false || value === "false") {
    return 0
  }

  const num = Number(value)

  if (num === 1) {
    return 1
  }

  if (num === 0) {
    return 0
  }

  if (fieldName) {
    throw new Error(`${fieldName} must be a boolean value`)
  }

  return 0
}

module.exports = {
  normalizeText,
  normalizeRequiredText,
  normalizeInteger,
  normalizeReal,
  normalizeDate,
  normalizeBooleanFlag,
}
