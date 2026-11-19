import {
  WALKIN_CUSTOMER_FIELDS,
  type WalkinCustomerFieldErrors,
  type WalkinCustomerFieldKey,
  type WalkinCustomerForm,
} from "../models/walkinCustomer"

type WalkinCustomerFieldsProps = {
  value: WalkinCustomerForm
  onChange: (patch: Partial<WalkinCustomerForm>) => void
  onBlur?: (fieldKey: WalkinCustomerFieldKey) => void
  errors?: WalkinCustomerFieldErrors
  disabled?: boolean
  className?: string
}

/**
 * Renders the walk-in customer field set from WALKIN_CUSTOMER_FIELDS. Field
 * order, labels, placeholders and required markers all come from the schema, so
 * this component never needs to change when a field is added.
 */
export function WalkinCustomerFields({
  value,
  onChange,
  onBlur,
  errors = {},
  disabled = false,
  className = "walkin-customer-fields login-form-full-span",
}: WalkinCustomerFieldsProps) {
  return (
    <div className={className}>
      {WALKIN_CUSTOMER_FIELDS.map((field) => {
        const error = errors[field.key]

        return (
          <label className="field-label" key={field.key}>
            {field.label}
            <input
              className="text-input"
              type="text"
              inputMode={field.inputMode}
              placeholder={field.placeholder}
              value={value[field.key]}
              onChange={(event) => onChange({ [field.key]: event.target.value } as Partial<WalkinCustomerForm>)}
              onBlur={() => onBlur?.(field.key)}
              disabled={disabled}
              required={field.required}
              aria-invalid={error ? true : undefined}
            />
            {error ? <span className="validation-error">{error}</span> : null}
          </label>
        )
      })}
    </div>
  )
}