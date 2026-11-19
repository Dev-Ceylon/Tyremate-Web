import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { ConsumablePayload } from "../../../../shared/models/consumables/consumable"
import { consumableService } from "../services/consumableService"

const initialFormState: ConsumablePayload = {
  Name: "",
  Category: null,
  Unit: "",
  CostPrice: null,
  ReorderLevel: null,
  IsActive: 1,
}

type UseConsumableFormOptions = {
  consumableId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useConsumableForm(options?: UseConsumableFormOptions) {
  const consumableId = options?.consumableId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<ConsumablePayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadConsumable = useCallback(
    async (id: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const consumable = await consumableService.getConsumableById(id)

        if (!isActive()) {
          return
        }

        setFormData({
          Name: consumable.Name ?? "",
          Category: consumable.Category ?? null,
          Unit: consumable.Unit ?? "",
          CostPrice: consumable.CostPrice ?? null,
          ReorderLevel: consumable.ReorderLevel ?? null,
          IsActive: consumable.IsActive ?? 1,
        })
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load consumable"
        setError(message)
        onError?.(message)
      } finally {
        if (isActive()) {
          setInitializing(false)
        }
      }
    },
    [onError],
  )

  useEffect(() => {
    if (!consumableId) {
      resetForm()
      return
    }

    let active = true
    loadConsumable(consumableId, () => active)

    return () => {
      active = false
    }
  }, [consumableId, loadConsumable, resetForm])

  function updateField<K extends keyof ConsumablePayload>(
    field: K,
    value: ConsumablePayload[K],
  ) {
    setFormData((prev: ConsumablePayload) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.Name.trim()) {
      setError("Name is required")
      setSubmitting(false)
      return
    }

    if (!formData.Unit.trim()) {
      setError("Unit is required")
      setSubmitting(false)
      return
    }

    const payload: ConsumablePayload = {
      Name: formData.Name.trim(),
      Category: formData.Category?.trim() || null,
      Unit: formData.Unit.trim(),
      CostPrice: normalizeNumber(formData.CostPrice),
      ReorderLevel: normalizeNumber(formData.ReorderLevel),
      IsActive: formData.IsActive ?? 1,
    }

    try {
      if (consumableId) {
        await consumableService.updateConsumable(consumableId, payload)
      } else {
        await consumableService.createConsumable(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : consumableId
            ? "Failed to update consumable"
            : "Failed to create consumable"
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

function normalizeNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
}
