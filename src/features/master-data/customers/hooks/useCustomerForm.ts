import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { CustomerPayload, CustomerRecord } from "../models/customer"
import { customerService } from "../services/customerService"

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

type UseCustomerFormOptions = {
  customerId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useCustomerForm(options?: UseCustomerFormOptions) {
  const customerId = options?.customerId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<CustomerPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadCustomer = useCallback(
    async (currentCustomerId: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const customer = await customerService.getCustomerById(currentCustomerId)

        if (!isActive()) {
          return
        }

        setFormData(toFormState(customer))
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load customer"
        setError(message)
        onError?.(message)
      } finally {
        if (isActive()) {
          setInitializing(false)
        }
      }
    },
    [onError]
  )

  useEffect(() => {
    if (!customerId) {
      resetForm()
      return
    }

    let active = true
    loadCustomer(customerId, () => active)

    return () => {
      active = false
    }
  }, [customerId, loadCustomer, resetForm])

  function updateField<K extends keyof CustomerPayload>(
    field: K,
    value: CustomerPayload[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const basePayload: Omit<CustomerPayload, "NoOfInquiries" | "NoOfActualOrders" | "TotalPurchasedValue"> = {
      CustomerCode: customerId ? formData.CustomerCode : "",
      Name: formData.Name.trim(),
      TinNo: formData.TinNo?.trim() || null,
      VatNo: formData.VatNo?.trim() || null,
      Birthday: formData.Birthday?.trim() || null,
      Contacts: formData.Contacts,
      Emails: formData.Emails,
      Addresses: formData.Addresses,
    }

    try {
      if (customerId) {
        await customerService.updateCustomer(customerId, basePayload)
      } else {
        await customerService.createCustomer({
          ...basePayload,
          NoOfInquiries: 0,
          NoOfActualOrders: 0,
          TotalPurchasedValue: 0,
        })
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : customerId
            ? "Failed to update customer"
            : "Failed to create customer"
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return { formData, submitting, initializing, error, updateField, handleSubmit }
}

// function toNonNegativeInteger(value?: number) {
//   const normalized = Number(value ?? 0)

//   if (!Number.isFinite(normalized) || normalized < 0) {
//     return 0
//   }

//   return Math.trunc(normalized)
// }

// function toNonNegativeNumber(value?: number) {
//   const normalized = Number(value ?? 0)

//   if (!Number.isFinite(normalized) || normalized < 0) {
//     return 0
//   }

//   return normalized
// }

function toFormState(customer: CustomerRecord): CustomerPayload {
  return {
    CustomerCode: customer.CustomerCode,
    Name: customer.Name,
    TinNo: customer.TinNo ?? "",
    VatNo: customer.VatNo ?? "",
    NoOfInquiries: customer.NoOfInquiries ?? 0,
    NoOfActualOrders: customer.NoOfActualOrders ?? 0,
    TotalPurchasedValue: customer.TotalPurchasedValue ?? 0,
    Birthday: customer.Birthday ?? "",
    Contacts: customer.Contacts ?? [],
    Emails: customer.Emails ?? [],
    Addresses: customer.Addresses ?? [],
  }
}
