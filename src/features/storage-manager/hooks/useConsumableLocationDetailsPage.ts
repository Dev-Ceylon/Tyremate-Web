import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "@/lib/router"
import type { ConsumableLocationRecord } from "../../../shared/models/consumables/consumableLocation"
import { consumableLocationService } from "../../master-data/consumable-locations/services/consumableLocationService"
import type { ConsumableRecord } from "../../../shared/models/consumables/consumable"
import { consumableService } from "../../master-data/consumables/services/consumableService"
import type { ConsumableStorageManagerRecord } from "../../../shared/models/consumables/consumableStorageManager"
import { consumableStorageManagerService } from "../services/consumableStorageManagerService"

export function useConsumableLocationDetailsPage() {
  const { locationId } = useParams<{ locationId: string }>()
  const parsedLocationId = locationId ? Number(locationId) : null
  const [location, setLocation] = useState<ConsumableLocationRecord | null>(null)
  const [consumables, setConsumables] = useState<ConsumableRecord[]>([])
  const [stockRows, setStockRows] = useState<ConsumableStorageManagerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConsumableId, setSelectedConsumableId] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [batchNumber, setBatchNumber] = useState<string>("")
  const [expiryDate, setExpiryDate] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [editingQty, setEditingQty] = useState<number>(1)
  const [editingBatchNumber, setEditingBatchNumber] = useState<string>("")
  const [editingExpiryDate, setEditingExpiryDate] = useState<string>("")

  const loadDetails = useCallback(async (isActive: () => boolean) => {
    if (!Number.isInteger(parsedLocationId) || parsedLocationId === null || parsedLocationId <= 0) {
      setLocation(null)
      setError("Invalid consumable location id")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [locationData, consumableData, stockData] = await Promise.all([
        consumableLocationService.getConsumableLocationById(parsedLocationId),
        consumableService.getConsumables(),
        consumableStorageManagerService.getConsumableStorageManagersByLocation(parsedLocationId),
      ])

      if (!isActive()) {
        return
      }

      setLocation(locationData)
      setConsumables(consumableData)
      setStockRows(stockData)
    } catch (err) {
      if (!isActive()) {
        return
      }

      const message =
        err instanceof Error ? err.message : "Failed to load consumable location details"
      setError(message)
      setLocation(null)
      setConsumables([])
      setStockRows([])
    } finally {
      if (isActive()) {
        setLoading(false)
      }
    }
  }, [parsedLocationId])

  useEffect(() => {
    let active = true
    void loadDetails(() => active)

    return () => {
      active = false
    }
  }, [loadDetails])

  const remainingCapacity = useMemo(
    () => Number(location?.RemainingCapacity ?? 0),
    [location?.RemainingCapacity],
  )

  const canSaveCreateRow = useMemo(() => {
    if (!selectedConsumableId || selectedConsumableId <= 0) {
      return false
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return false
    }

    return qty <= remainingCapacity
  }, [qty, remainingCapacity, selectedConsumableId])

  const validateQty = useCallback((nextQty: number, maxAllowedQty: number) => {
    if (!Number.isInteger(nextQty) || nextQty <= 0) {
      return "Qty must be greater than 0"
    }

    if (nextQty > maxAllowedQty) {
      return `Qty exceeds remaining capacity (${maxAllowedQty})`
    }

    return null
  }, [])

  const canSaveEditRow = useCallback(
    (row: ConsumableStorageManagerRecord) => {
      const maxAllowedQty = remainingCapacity + Number(row.Qty ?? 0)
      return validateQty(editingQty, maxAllowedQty) === null
    },
    [editingQty, remainingCapacity, validateQty],
  )

  const updateField = useCallback((field: "selectedConsumableId" | "qty" | "batchNumber" | "expiryDate", value: number | string | null) => {
    if (field === "selectedConsumableId") {
      setSelectedConsumableId(value as number | null)
      setSubmitError(null)
      return
    }

    if (field === "batchNumber") {
      setBatchNumber((value as string) ?? "")
      setSubmitError(null)
      return
    }

    if (field === "expiryDate") {
      setExpiryDate((value as string) ?? "")
      setSubmitError(null)
      return
    }

    setQty(Math.max(0, Math.trunc(Number(value ?? 0))))
    setSubmitError(null)
  }, [])

  const startEditRow = useCallback((row: ConsumableStorageManagerRecord) => {
    setEditingRowId(row.Id)
    setEditingQty(Math.max(0, Math.trunc(Number(row.Qty ?? 0))))
    setEditingBatchNumber(row.BatchNumber ?? "")
    setEditingExpiryDate(row.ExpiryDate ?? "")
    setSubmitError(null)
  }, [])

  const cancelEditRow = useCallback(() => {
    setEditingRowId(null)
    setEditingQty(1)
    setEditingBatchNumber("")
    setEditingExpiryDate("")
    setSubmitError(null)
  }, [])

  const updateEditingField = useCallback((field: "qty" | "batchNumber" | "expiryDate", value: number | string | null) => {
    if (field === "batchNumber") {
      setEditingBatchNumber((value as string) ?? "")
      setSubmitError(null)
      return
    }

    if (field === "expiryDate") {
      setEditingExpiryDate((value as string) ?? "")
      setSubmitError(null)
      return
    }

    setEditingQty(Math.max(0, Math.trunc(Number(value ?? 0))))
    setSubmitError(null)
  }, [])

  const resetForm = useCallback(() => {
    setSelectedConsumableId(null)
    setQty(1)
    setBatchNumber("")
    setExpiryDate("")
    setSubmitError(null)
  }, [])

  const handleCreateRow = useCallback(async () => {
    if (!location?.Id) {
      setSubmitError("Location is not available")
      return
    }

    if (!selectedConsumableId || selectedConsumableId <= 0) {
      setSubmitError("Please select a consumable")
      return
    }

    const qtyValidation = validateQty(qty, remainingCapacity)
    if (qtyValidation) {
      setSubmitError(qtyValidation)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await consumableStorageManagerService.createConsumableStorageManager({
        ConsumableID: selectedConsumableId,
        LocationID: location.Id,
        Qty: qty,
        BatchNumber: batchNumber || undefined,
        ExpiryDate: expiryDate || undefined,
      })

      resetForm()
      await loadDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create stock row"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [
    batchNumber,
    expiryDate,
    loadDetails,
    location?.Id,
    qty,
    remainingCapacity,
    resetForm,
    selectedConsumableId,
    validateQty,
  ])

  const handleUpdateRow = useCallback(async (row: ConsumableStorageManagerRecord) => {
    if (!editingRowId || editingRowId !== row.Id) {
      setSubmitError("Please select a row to edit")
      return
    }

    const maxAllowedQty = remainingCapacity + Number(row.Qty ?? 0)
    const qtyValidation = validateQty(editingQty, maxAllowedQty)
    if (qtyValidation) {
      setSubmitError(qtyValidation)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await consumableStorageManagerService.updateConsumableStorageManager(row.Id, {
        ConsumableID: row.ConsumableID,
        LocationID: row.LocationID,
        Qty: editingQty,
        BatchNumber: editingBatchNumber || undefined,
        ExpiryDate: editingExpiryDate || undefined,
      })

      cancelEditRow()
      await loadDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update stock row"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [
    cancelEditRow,
    editingBatchNumber,
    editingExpiryDate,
    editingQty,
    editingRowId,
    loadDetails,
    remainingCapacity,
    validateQty,
  ])

  const handleDeleteRow = useCallback(async (row: ConsumableStorageManagerRecord) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this stock row?")
    if (!shouldDelete) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      await consumableStorageManagerService.deleteConsumableStorageManager(row.Id)
      if (editingRowId === row.Id) {
        cancelEditRow()
      }
      await loadDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete stock row"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [cancelEditRow, editingRowId, loadDetails])

  return {
    location,
    consumables,
    stockRows,
    selectedConsumableId,
    qty,
    batchNumber,
    expiryDate,
    canSaveCreateRow,
    canSaveEditRow,
    loading,
    error,
    submitting,
    submitError,
    editingRowId,
    editingQty,
    editingBatchNumber,
    editingExpiryDate,
    loadDetails,
    updateField,
    startEditRow,
    cancelEditRow,
    updateEditingField,
    handleCreateRow,
    handleUpdateRow,
    handleDeleteRow,
    locationId,
  }
}
