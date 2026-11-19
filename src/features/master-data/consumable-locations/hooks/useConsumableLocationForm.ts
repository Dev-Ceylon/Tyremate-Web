import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { BranchRecord } from "../../branches/models/branch"
import { branchService } from "../../branches/services/branchService"
import type { StorageLocationTypeRecord } from "../../storage-locations-types/models/storageLocationType"
import { storageLocationTypeService } from "../../storage-locations-types/services/storageLocationTypeService"
import type { ConsumableLocationPayload } from "../../../../shared/models/consumables/consumableLocation"
import { consumableLocationService } from "../services/consumableLocationService"

const initialFormState: ConsumableLocationPayload = {
  LocationCode: "",
  LocationName: "",
  BranchId: null,
  LocationTypeId: null,
  Capacity: 0,
}

type UseConsumableLocationFormOptions = {
  locationId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useConsumableLocationForm(options?: UseConsumableLocationFormOptions) {
  const locationId = options?.locationId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<ConsumableLocationPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<BranchRecord[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [locationTypes, setLocationTypes] = useState<StorageLocationTypeRecord[]>([])
  const [loadingLocationTypes, setLoadingLocationTypes] = useState(false)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadLocation = useCallback(
    async (id: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const location = await consumableLocationService.getConsumableLocationById(id)

        if (!isActive()) {
          return
        }

        setFormData({
          LocationCode: location.LocationCode ?? "",
          LocationName: location.LocationName ?? "",
          BranchId: location.BranchId ?? null,
          LocationTypeId: location.LocationTypeId ?? null,
          Capacity: location.Capacity ?? 0,
        })
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load consumable location"
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

  const loadBranches = useCallback(async (isActive: () => boolean) => {
    setLoadingBranches(true)

    try {
      const data = await branchService.getBranches()

      if (!isActive()) {
        return
      }

      setBranches(data)
    } catch (err) {
      if (!isActive()) {
        return
      }

      const message = err instanceof Error ? err.message : "Failed to load branches"
      setError(message)
      onError?.(message)
    } finally {
      if (isActive()) {
        setLoadingBranches(false)
      }
    }
  }, [onError])

  const loadLocationTypes = useCallback(async (isActive: () => boolean) => {
    setLoadingLocationTypes(true)

    try {
      const data = await storageLocationTypeService.getStorageLocationTypes()

      if (!isActive()) {
        return
      }

      setLocationTypes(data)
    } catch (err) {
      if (!isActive()) {
        return
      }

      const message = err instanceof Error ? err.message : "Failed to load location types"
      setError(message)
      onError?.(message)
    } finally {
      if (isActive()) {
        setLoadingLocationTypes(false)
      }
    }
  }, [onError])

  useEffect(() => {
    let active = true
    void loadBranches(() => active)
    void loadLocationTypes(() => active)

    return () => {
      active = false
    }
  }, [loadBranches, loadLocationTypes])

  useEffect(() => {
    if (!locationId) {
      resetForm()
      return
    }

    let active = true
    loadLocation(locationId, () => active)

    return () => {
      active = false
    }
  }, [locationId, loadLocation, resetForm])

  function updateField<K extends keyof ConsumableLocationPayload>(
    field: K,
    value: ConsumableLocationPayload[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.LocationTypeId) {
      setError("Location type is required")
      setSubmitting(false)
      return
    }

    const payload: ConsumableLocationPayload = {
      LocationCode: formData.LocationCode.trim(),
      LocationName: formData.LocationName.trim(),
      BranchId: toPositiveIntegerOrNull(formData.BranchId),
      LocationTypeId: toPositiveIntegerOrNull(formData.LocationTypeId),
      Capacity: toNonNegativeInteger(formData.Capacity),
    }

    try {
      if (locationId) {
        await consumableLocationService.updateConsumableLocation(locationId, payload)
      } else {
        await consumableLocationService.createConsumableLocation(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : locationId
            ? "Failed to update consumable location"
            : "Failed to create consumable location"
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
    branches,
    loadingBranches,
    locationTypes,
    loadingLocationTypes,
    updateField,
    handleSubmit,
  }
}

function toNonNegativeInteger(value?: number | null) {
  const normalized = Number(value ?? 0)

  if (!Number.isFinite(normalized) || normalized < 0) {
    return 0
  }

  return Math.trunc(normalized)
}

function toPositiveIntegerOrNull(value?: number | null) {
  if (value === undefined || value === null || value === 0) {
    return null
  }

  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    return null
  }

  return normalized
}
