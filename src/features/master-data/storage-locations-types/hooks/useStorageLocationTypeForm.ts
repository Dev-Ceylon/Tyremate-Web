import { useCallback, useEffect, useState, type FormEvent } from "react"
import type {
  StorageLocationTypePayload,
} from "../models/storageLocationType"
import { storageLocationTypeService } from "../services/storageLocationTypeService"

const initialFormState: StorageLocationTypePayload = {
  LocationTypeCode: "",
  LocationTypeName: "",
}

type UseStorageLocationTypeFormOptions = {
  storageLocationTypeId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useStorageLocationTypeForm(options?: UseStorageLocationTypeFormOptions) {
  const storageLocationTypeId = options?.storageLocationTypeId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<StorageLocationTypePayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadStorageLocationType = useCallback(
    async (currentId: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const storageLocationType = await storageLocationTypeService.getStorageLocationTypeById(currentId)

        if (!isActive()) return

        setFormData({
          LocationTypeCode: storageLocationType.LocationTypeCode ?? "",
          LocationTypeName: storageLocationType.LocationTypeName ?? "",
        })
      } catch (err) {
        if (!isActive()) return

        const message = err instanceof Error ? err.message : "Failed to load storage location type"
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
    if (!storageLocationTypeId) {
      resetForm()
      return
    }

    let active = true
    loadStorageLocationType(storageLocationTypeId, () => active)

    return () => {
      active = false
    }
  }, [storageLocationTypeId, loadStorageLocationType, resetForm])

  function updateField<K extends keyof StorageLocationTypePayload>(
    field: K,
    value: StorageLocationTypePayload[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: StorageLocationTypePayload = {
      LocationTypeCode: formData.LocationTypeCode.trim(),
      LocationTypeName: formData.LocationTypeName.trim(),
    }

    try {
      if (storageLocationTypeId) {
        await storageLocationTypeService.updateStorageLocationType(storageLocationTypeId, payload)
      } else {
        await storageLocationTypeService.createStorageLocationType(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save storage location type"
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