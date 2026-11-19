import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { BranchPayload, BranchRecord } from "../models/branch"
import { branchService } from "../services/branchService"

const initialFormState: BranchPayload = {
  BranchCode: "",
  BranchName: "",
  Contacts: [],
  BillingAddress: null,
  DeliveryAddress: null,
}

type UseBranchFormOptions = {
  branchId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useBranchForm(options?: UseBranchFormOptions) {
  const branchId = options?.branchId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<BranchPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadBranch = useCallback(async (currentBranchId: number, isActive: () => boolean) => {
    setInitializing(true)
    setError(null)

    try {
      const branch = await branchService.getBranchById(currentBranchId)

      if (!isActive()) {
        return
      }

      setFormData(toFormState(branch))
    } catch (err) {
      if (!isActive()) {
        return
      }

      const message = err instanceof Error ? err.message : "Failed to load branch"
      setError(message)
      onError?.(message)
    } finally {
      if (isActive()) {
        setInitializing(false)
      }
    }
  }, [onError])

  useEffect(() => {
    if (!branchId) {
      resetForm()
      return
    }

    let active = true
    void loadBranch(branchId, () => active)

    return () => {
      active = false
    }
  }, [branchId, loadBranch, resetForm])

  function updateField<K extends keyof BranchPayload>(field: K, value: BranchPayload[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: BranchPayload = {
      BranchCode: formData.BranchCode.trim(),
      BranchName: formData.BranchName.trim(),
      Contacts: formData.Contacts,
      BillingAddress: formData.BillingAddress ?? null,
      DeliveryAddress: formData.DeliveryAddress ?? null,
    }

    try {
      if (branchId) {
        await branchService.updateBranch(branchId, payload)
      } else {
        await branchService.createBranch(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : branchId
            ? "Failed to update branch"
            : "Failed to create branch"
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

function toFormState(branch: BranchRecord): BranchPayload {
  return {
    BranchCode: branch.BranchCode,
    BranchName: branch.BranchName,
    Contacts: branch.Contacts ?? [],
    BillingAddress: branch.BillingAddress ?? null,
    DeliveryAddress: branch.DeliveryAddress ?? null,
  }
}
