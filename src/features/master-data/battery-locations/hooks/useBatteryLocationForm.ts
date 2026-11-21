import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { BranchRecord } from "../../branches/models/branch"
import { branchService } from "../../branches/services/branchService"
import type { StorageLocationTypeRecord } from "../../storage-locations-types/models/storageLocationType"
import { storageLocationTypeService } from "../../storage-locations-types/services/storageLocationTypeService"
import type { BatteryLocationPayload } from "../models/batteryLocation"
import { batteryLocationService } from "../services/batteryLocationService"

const initialFormState: BatteryLocationPayload = {
  LocationCode: "",
  LocationName: "",
  BranchId: null,
  LocationTypeId: null,
  Capacity: 0,
}

type UseBatteryLocationFormOptions = {
  locationId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useBatteryLocationForm(options?: UseBatteryLocationFormOptions) {
  const locationId = options?.locationId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<BatteryLocationPayload>(initialFormState)
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
        const location = await batteryLocationService.getBatteryLocationById(id)

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
          err instanceof Error ? err.message : "Failed to load battery location"
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

  const loadBranches = useCallback(async (isActive: () => boolean) => {
    setLoadingBranches(true)

    try {
      const data = await branchService.getBranches()

      if (!isActive()) {
        return
      }

      setBranches(data)
    } catch {
      if (isActive()) {
        setBranches([])
      }
    } finally {
      if (isActive()) {
        setLoadingBranches(false)
      }
    }
  }, [])

  const loadLocationTypes = useCallback(async (isActive: () => boolean) => {
    setLoadingLocationTypes(true)

    try {
      const data = await storageLocationTypeService.getStorageLocationTypes()

      if (!isActive()) {
        return
      }

      setLocationTypes(data)
    } catch {
      if (isActive()) {
        setLocationTypes([])
      }
    } finally {
      if (isActive()) {
        setLoadingLocationTypes(false)
      }
    }
  }, [])

  useEffect(() => {
    let active = true

    void loadBranches(() => active)
    void loadLocationTypes(() => active)

    return () => {
      active = false
    }
  }, [loadBranches, loadLocationTypes])

  useEffect(() => {
    let active = true

    if (locationId !== undefined) {
      void loadLocation(locationId, () => active)
    } else {
      resetForm()
    }

    return () => {
      active = false
    }
  }, [locationId, loadLocation, resetForm])

  const setField = useCallback(
    <K extends keyof BatteryLocationPayload>(
      field: K,
      value: BatteryLocationPayload[K]
    ) => {
      setFormData((current) => ({
        ...current,
        [field]: value,
      }))
    },
    []
  )

  const submit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault()

      setSubmitting(true)
      setError(null)

      try {
        const payload: BatteryLocationPayload = {
          LocationCode: formData.LocationCode.trim(),
          LocationName: formData.LocationName.trim(),
          BranchId: formData.BranchId ? Number(formData.BranchId) : null,
          LocationTypeId: formData.LocationTypeId
            ? Number(formData.LocationTypeId)
            : null,
          Capacity: formData.Capacity ? Number(formData.Capacity) : 0,
        }

        if (locationId !== undefined) {
          await batteryLocationService.updateBatteryLocation(locationId, payload)
        } else {
          await batteryLocationService.createBatteryLocation(payload)
        }

        onSuccess?.()
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to save battery location"
        setError(message)
        onError?.(message)
      } finally {
        setSubmitting(false)
      }
    },
    [formData, locationId, onSuccess, onError]
  )

  return {
    formData,
    submitting,
    initializing,
    error,
    branches,
    loadingBranches,
    locationTypes,
    loadingLocationTypes,
    setField,
    updateField: setField,
    submit,
    handleSubmit: submit,
    resetForm,
    fetchSuggestions: (field: string, query: string) =>
      batteryLocationService.suggest(field, query),
  }
}
