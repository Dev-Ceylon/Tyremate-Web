import { useState, type FormEvent } from "react"
import { AppModal } from "../../../../shared/ui/modal/AppModal"
import type { CustomerPayload, CustomerRecord } from "../models/customer"
import { customerService } from "../services/customerService"
import { CustomerForm } from "./CustomerForm"

type CreateCustomerDialogProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: (customer: CustomerRecord) => void
}

const initialFormState: CustomerPayload = {
  CustomerCode: "",
  Name: "",
  TinNo: "",
  VatNo: "",
  NoOfInquiries: 0,
  NoOfActualOrders: 0,
  TotalPurchasedValue: 0,
  Birthday: "",
  Contacts: [],
  Emails: [],
  Addresses: [],
}

export function CreateCustomerDialog({ isOpen, onClose, onCreated }: CreateCustomerDialogProps) {
  const [formData, setFormData] = useState<CustomerPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <K extends keyof CustomerPayload>(field: K, value: CustomerPayload[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const reset = () => {
    setFormData(initialFormState)
    setSubmitting(false)
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const created = await customerService.createCustomer(formData)
      reset()
      onCreated(created)
      onClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create customer"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppModal isOpen={isOpen} title="Create New Customer" onClose={handleClose}>
      {error ? <p className="hero-text">{error}</p> : null}
      <CustomerForm
        formData={formData}
        onChange={updateField}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitting={submitting}
        submitLabel="Create Customer"
        submittingLabel="Creating..."
      />
    </AppModal>
  )
}
