import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "@/lib/router"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"
import { storageLocationService } from "../../master-data/storage-locations/services/storageLocationService"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import { tyreService } from "../../master-data/tyres/services/tyreService"
import type {
  StorageManagerLocationBatchRecord,
  StorageManagerLocationRecord,
} from "../models/storageManager"
import { storageManagerService } from "../services/storageManagerService"

export function useStorageLocationDetailsPage() {
  const { locationId } = useParams<{
    locationId: string
  }>()
  const parsedLocationId = locationId ? Number(locationId) : null
  const [storageLocation, setStorageLocation] = useState<StorageLocationRecord | null>(null)
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [storageManagerRows, setStorageManagerRows] = useState<StorageManagerLocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTyreId, setSelectedTyreId] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [editingQty, setEditingQty] = useState<number>(1)

  const loadStorageLocationDetails = useCallback(async (isActive: () => boolean) => {
    if (!Number.isInteger(parsedLocationId) || parsedLocationId === null || parsedLocationId <= 0) {
      setStorageLocation(null)
      setError("Invalid storage location id")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [storageLocationData, tyreData, storageManagerData, batchData] = await Promise.all([
        storageLocationService.getStorageLocationById(parsedLocationId),
        tyreService.getTyres(),
        storageManagerService.getStorageManagersByLocation(parsedLocationId),
        storageManagerService.getBatchesByLocation(parsedLocationId),
      ])

      if (!isActive()) {
        return
      }

      const batchesByStorageManagerId = batchData.reduce<Record<number, StorageManagerLocationBatchRecord[]>>(
        (acc, batch) => {
          if (!acc[batch.StorageManagerID]) {
            acc[batch.StorageManagerID] = []
          }
          acc[batch.StorageManagerID].push(batch)
          return acc
        },
        {},
      )

      const storageManagerRowsWithBatches = storageManagerData.map((row) => ({
        ...row,
        batches: batchesByStorageManagerId[row.Id] ?? [],
      }))

      setStorageLocation(storageLocationData)
      setTyres(tyreData)
      setStorageManagerRows(storageManagerRowsWithBatches)
    } catch (err) {
      if (!isActive()) {
        return
      }

      const message =
        err instanceof Error ? err.message : "Failed to load storage location details"
      setError(message)
      setStorageLocation(null)
      setTyres([])
      setStorageManagerRows([])
    } finally {
      if (isActive()) {
        setLoading(false)
      }
    }
  }, [parsedLocationId])

  useEffect(() => {
    let active = true
    void loadStorageLocationDetails(() => active)

    return () => {
      active = false
    }
  }, [loadStorageLocationDetails])

  const availableTyres = useMemo(() => {
    const usedTyreIds = new Set(storageManagerRows.map((row) => row.TyreId))
    return tyres.filter((tyre) => !usedTyreIds.has(tyre.Id))
  }, [storageManagerRows, tyres])

  const remainingCapacity = useMemo(
    () => Number(storageLocation?.RemainingCapacity ?? 0),
    [storageLocation?.RemainingCapacity]
  )

  const canSaveCreateRow = useMemo(() => {
    if (!selectedTyreId || selectedTyreId <= 0) {
      return false
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return false
    }

    if (availableTyres.length === 0) {
      return false
    }

    return qty <= remainingCapacity
  }, [availableTyres.length, qty, remainingCapacity, selectedTyreId])

  const validateStorageRowQty = useCallback((nextQty: number, maxAllowedQty: number) => {
    if (!Number.isInteger(nextQty) || nextQty <= 0) {
      return "Qty must be greater than 0"
    }

    if (nextQty > maxAllowedQty) {
      return `Qty exceeds remaining capacity (${maxAllowedQty})`
    }

    return null
  }, [])

  const canSaveEditRow = useCallback((row: StorageManagerLocationRecord) => {
    const maxAllowedQty = remainingCapacity + Number(row.Qty ?? 0)
    return validateStorageRowQty(editingQty, maxAllowedQty) === null
  }, [editingQty, remainingCapacity, validateStorageRowQty])

  const updateField = useCallback((field: "selectedTyreId" | "qty", value: number | null) => {
    if (field === "selectedTyreId") {
      setSelectedTyreId(value)
      setSubmitError(null)
      return
    }

    setQty(Math.max(0, Math.trunc(Number(value ?? 0))))
    setSubmitError(null)
  }, [])

  const startEditStorageRow = useCallback((row: StorageManagerLocationRecord) => {
    setEditingRowId(row.Id)
    setEditingQty(Math.max(0, Math.trunc(Number(row.Qty ?? 0))))
    setSubmitError(null)
  }, [])

  const cancelEditStorageRow = useCallback(() => {
    setEditingRowId(null)
    setEditingQty(1)
    setSubmitError(null)
  }, [])

  const updateEditingQty = useCallback((value: number | null) => {
    setEditingQty(Math.max(0, Math.trunc(Number(value ?? 0))))
    setSubmitError(null)
  }, [])

  const resetForm = useCallback(() => {
    setSelectedTyreId(null)
    setQty(1)
    setSubmitError(null)
  }, [])

  const handleCreateStorageRow = useCallback(async () => {
    if (!storageLocation?.Id) {
      setSubmitError("Storage location is not available")
      return
    }

    if (!selectedTyreId || selectedTyreId <= 0) {
      setSubmitError("Please select a tyre")
      return
    }

    const isAlreadyStored = storageManagerRows.some((row) => row.TyreId === selectedTyreId)
    if (isAlreadyStored) {
      setSubmitError("Selected tyre is already added to this location")
      return
    }

    const qtyValidationMessage = validateStorageRowQty(qty, remainingCapacity)
    if (qtyValidationMessage) {
      setSubmitError(qtyValidationMessage)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await storageManagerService.createStorageManager({
        TyreId: selectedTyreId,
        LocationID: storageLocation.Id,
        Qty: qty,
      })

      resetForm()
      await loadStorageLocationDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create storage manager row"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [
    loadStorageLocationDetails,
    qty,
    resetForm,
    selectedTyreId,
    storageLocation?.Id,
    remainingCapacity,
    storageManagerRows,
    validateStorageRowQty
  ])

  const handleUpdateStorageRow = useCallback(async (row: StorageManagerLocationRecord) => {
    if (!editingRowId || editingRowId !== row.Id) {
      setSubmitError("Please select a row to edit")
      return
    }

    const maxAllowedQty = remainingCapacity + Number(row.Qty ?? 0)
    const qtyValidationMessage = validateStorageRowQty(editingQty, maxAllowedQty)
    if (qtyValidationMessage) {
      setSubmitError(qtyValidationMessage)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await storageManagerService.updateStorageManager(row.Id, {
        TyreId: row.TyreId,
        LocationID: row.LocationID,
        Qty: editingQty,
      })

      cancelEditStorageRow()
      await loadStorageLocationDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update storage manager row"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [
    cancelEditStorageRow,
    editingQty,
    editingRowId,
    loadStorageLocationDetails,
    remainingCapacity,
    validateStorageRowQty,
  ])

  const handleDeleteStorageRow = useCallback(async (row: StorageManagerLocationRecord) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this storage row?")
    if (!shouldDelete) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await storageManagerService.deleteStorageManager(row.Id)
      if (editingRowId === row.Id) {
        cancelEditStorageRow()
      }
      await loadStorageLocationDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete storage manager row"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [cancelEditStorageRow, editingRowId, loadStorageLocationDetails])

  return {
    storageLocation,
    tyres,
    storageManagerRows,
    availableTyres,
    selectedTyreId,
    qty,
    canSaveCreateRow,
    canSaveEditRow,
    loading,
    error,
    submitting,
    submitError,
    editingRowId,
    editingQty,
    loadStorageLocationDetails,
    updateField,
    startEditStorageRow,
    cancelEditStorageRow,
    updateEditingQty,
    handleCreateStorageRow,
    handleUpdateStorageRow,
    handleDeleteStorageRow,
    locationId,
  }
}
