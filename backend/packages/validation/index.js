const {
  normalizeText,
  normalizeRequiredText,
  normalizeInteger,
  normalizeReal,
  normalizeDate,
  normalizeBooleanFlag,
} = require("./normalize")

const { PHONE_REGEX, validatePhoneNumber, normalizePhone } = require("./phone")

const { EMAIL_REGEX, validateEmail, normalizeEmail } = require("./email")

module.exports = {
  normalizeText,
  normalizeRequiredText,
  normalizeInteger,
  normalizeReal,
  normalizeDate,
  normalizeBooleanFlag,
  PHONE_REGEX,
  validatePhoneNumber,
  normalizePhone,
  EMAIL_REGEX,
  validateEmail,
  normalizeEmail,
}
