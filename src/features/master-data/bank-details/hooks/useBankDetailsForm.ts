import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { BankDetailPayload, BankDetailRecord } from "../models/bankDetail"
import { bankDetailsService } from "../services/bankDetailsService"

const initialFormState: BankDetailPayload = {
  BankName: "",
  AccountNumber: "",
  AccountName: "",
  Branch: "",
}

type UseBankDetailsFormOptions = {
  bankDetailId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useBankDetailsForm(options?: UseBankDetailsFormOptions) {
  const bankDetailId = options?.bankDetailId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<BankDetailPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadBankDetail = useCallback(async (currentBankDetailId: number, isActive: () => boolean) => {
    setInitializing(true)
    setError(null)

    try {
      const bankDetail = await bankDetailsService.getBankDetailById(currentBankDetailId)

      if (!isActive()) {
        return
      }

      setFormData(toFormState(bankDetail))
    } catch (err) {
      if (!isActive()) {
        return
      }

      const message = err instanceof Error ? err.message : "Failed to load bank detail"
      setError(message)
      onError?.(message)
    } finally {
      if (isActive()) {
        setInitializing(false)
      }
    }
  }, [onError])

  useEffect(() => {
    if (!bankDetailId) {
      resetForm()
      return
    }

    let active = true
    void loadBankDetail(bankDetailId, () => active)

    return () => {
      active = false
    }
  }, [bankDetailId, loadBankDetail, resetForm])

  function updateField<K extends keyof BankDetailPayload>(field: K, value: BankDetailPayload[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: BankDetailPayload = {
      BankName: formData.BankName.trim(),
      AccountNumber: formData.AccountNumber.trim(),
      AccountName: formData.AccountName.trim(),
      Branch: formData.Branch.trim(),
    }

    try {
      if (bankDetailId) {
        await bankDetailsService.updateBankDetail(bankDetailId, payload)
      } else {
        await bankDetailsService.createBankDetail(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : bankDetailId
            ? "Failed to update bank detail"
            : "Failed to create bank detail"
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formData,
    submitting,
    initializing,
    error,
    updateField,
    handleSubmit,
  }
}

function toFormState(bankDetail: BankDetailRecord): BankDetailPayload {
  return {
    BankName: bankDetail.BankName,
    AccountNumber: bankDetail.AccountNumber,
    AccountName: bankDetail.AccountName,
    Branch: bankDetail.Branch,
  }
}