import { sanitizeEmailInput, validateEmail } from "../../validation/email"
import { sanitizePhoneInput, validatePhone } from "../../validation/phone"

export type WalkinCustomerFieldKey =
  | "CustomerName"
  | "CustomerPhone"
  | "CustomerAddress"
  | "CustomerEmail"
  | "VehicleNumber"
  | "TinNo"
  | "VatNo"

export type WalkinCustomerForm = Record<WalkinCustomerFieldKey, string>

export type WalkinCustomerFieldErrors = Partial<Record<WalkinCustomerFieldKey, string>>

type WalkinCustomerFieldDefinition = {
  key: WalkinCustomerFieldKey
  label: string
  placeholder?: string
  inputMode?: "numeric" | "email"
  required?: boolean
  requiredMessage?: string
  sanitize?: (value: string) => string
  validate?: (value: string) => string | null
}

/**
 * Single source of truth for the walk-in customer field set. Rendering, empty
 * state, input sanitization, validation and the create payload are all derived
 * from this list, so adding a field is a one-line change here.
 */
export const WALKIN_CUSTOMER_FIELDS: readonly WalkinCustomerFieldDefinition[] = [
  { key: "CustomerName", label: "Customer Name", required: true, requiredMessage: "Customer name is required" },
  {
    key: "CustomerPhone",
    label: "Phone",
    placeholder: "e.g. 0771234567",
    inputMode: "numeric",
    sanitize: sanitizePhoneInput,
    validate: validatePhone,
  },
  { key: "CustomerAddress", label: "Address", required: true, requiredMessage: "Customer address is required" },
  {
    key: "CustomerEmail",
    label: "Email",
    placeholder: "e.g. name@example.com",
    inputMode: "email",
    sanitize: sanitizeEmailInput,
    validate: validateEmail,
  },
  { key: "VehicleNumber", label: "Vehicle Number" },
  { key: "TinNo", label: "TIN No" },
  { key: "VatNo", label: "VAT No" },
]

const FIELD_BY_KEY = new Map<WalkinCustomerFieldKey, WalkinCustomerFieldDefinition>(
  WALKIN_CUSTOMER_FIELDS.map((field) => [field.key, field]),
)

export const createEmptyWalkinCustomer = (): WalkinCustomerForm =>
  Object.fromEntries(WALKIN_CUSTOMER_FIELDS.map((field) => [field.key, ""])) as WalkinCustomerForm

export const sanitizeWalkinCustomerValue = (key: WalkinCustomerFieldKey, value: string): string => {
  const sanitize = FIELD_BY_KEY.get(key)?.sanitize
  return sanitize ? sanitize(value) : value
}

/**
 * Returns a message only for fields that break their own rule. Blank optional
 * fields never produce an error, so they cannot block submission. Required
 * fields are reported ahead of format errors so the first surfaced problem stays
 * stable regardless of field order in the UI.
 */
export const validateWalkinCustomer = (values: WalkinCustomerForm): WalkinCustomerFieldErrors => {
  const errors: WalkinCustomerFieldErrors = {}

  for (const field of WALKIN_CUSTOMER_FIELDS) {
    if (field.required && !values[field.key].trim()) {
      errors[field.key] = field.requiredMessage ?? `${field.label} is required`
    }
  }

  for (const field of WALKIN_CUSTOMER_FIELDS) {
    const value = values[field.key].trim()
    if (!value || !field.validate) continue

    const message = field.validate(value)
    if (message) errors[field.key] = message
  }

  return errors
}