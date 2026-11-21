import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "@/lib/router"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import { batteryService } from "../../master-data/batteries/services/batteryService"
import type {
  BatteryStorageManagerLocationBatchRecord,
  BatteryStorageManagerLocationRecord,
} from "../models/batteryStorageManager"
import { batteryStorageManagerService } from "../services/batteryStorageManagerService"

export function useBatteryLocationDetailsPage() {
  const { locationId } = useParams<{
    locationId: string
  }>()
  const parsedLocationId = locationId ? Number(locationId) : null
  const [storageLocation, setStorageLocation] = useState<StorageLocationRecord | null>(null)
  const [batteries, setBatteries] = useState<BatteryRecord[]>([])
  const [storageManagerRows, setStorageManagerRows] = useState<
    BatteryStorageManagerLocationRecord[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Creation form state
  const [selectedBatteryId, setSelectedBatteryId] = useState<number | null>(null)
  const [qty, setQty] = useState<number>(1)
  const [batchCode, setBatchCode] = useState<string>("")
  const [mfgDate, setMfgDate] = useState<string>("")
  const [expiryDate, setExpiryDate] = useState<string>("")

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Inline edit state
  const [editingRowId, setEditingRowId] = useState<number | null>(null)
  const [editingQty, setEditingQty] = useState<number>(1)

  const loadLocationDetails = useCallback(
    async (isActive: () => boolean) => {
      if (!Number.isInteger(parsedLocationId) || parsedLocationId === null || parsedLocationId <= 0) {
        setStorageLocation(null)
        setError("Invalid storage location id")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [locationData, batteryData, storageData, batchData] = await Promise.all([
          batteryStorageManagerService.getStorageLocationById(parsedLocationId),
          batteryService.getBatteries(),
          batteryStorageManagerService.getBatteryStorageManagersByLocation(parsedLocationId),
          batteryStorageManagerService.getBatchesByLocation(parsedLocationId),
        ])

        if (!isActive()) {
          return
        }

        const batchesBySmId = batchData.reduce<
          Record<number, BatteryStorageManagerLocationBatchRecord[]>
        >((acc, batch) => {
          const key = batch.BatteryStorageManagerID
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(batch)
          return acc
        }, {})

        const rowsWithBatches = storageData.map((row) => ({
          ...row,
          batches: batchesBySmId[row.Id] ?? [],
        }))

        setStorageLocation(locationData)
        setBatteries(batteryData)
        setStorageManagerRows(rowsWithBatches)
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load battery storage location details"
        setError(message)
        setStorageLocation(null)
        setBatteries([])
        setStorageManagerRows([])
      } finally {
        if (isActive()) {
          setLoading(false)
        }
      }
    },
    [parsedLocationId],
  )

  useEffect(() => {
    let active = true
    void loadLocationDetails(() => active)

    return () => {
      active = false
    }
  }, [loadLocationDetails])

  const availableBatteries = useMemo(() => {
    const usedBatteryIds = new Set(storageManagerRows.map((row) => row.BatteryId))
    return batteries.filter((battery) => !usedBatteryIds.has(battery.Id))
  }, [batteries, storageManagerRows])

  const remainingCapacity = useMemo(
    () => Number(storageLocation?.RemainingCapacity ?? 0),
    [storageLocation?.RemainingCapacity],
  )

  const canSaveCreateRow = useMemo(() => {
    if (!selectedBatteryId || selectedBatteryId <= 0) {
      return false
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      return false
    }

    if (availableBatteries.length === 0) {
      return false
    }

    return qty <= remainingCapacity
  }, [availableBatteries.length, qty, remainingCapacity, selectedBatteryId])

  const validateStorageRowQty = useCallback((nextQty: number, maxAllowedQty: number) => {
    if (!Number.isInteger(nextQty) || nextQty <= 0) {
      return "Qty must be greater than 0"
    }

    if (nextQty > maxAllowedQty) {
      return `Qty exceeds remaining capacity (${maxAllowedQty})`
    }

    return null
  }, [])

  const canSaveEditRow = useCallback(
    (row: BatteryStorageManagerLocationRecord) => {
      const maxAllowedQty = remainingCapacity + Number(row.Qty ?? 0)
      return validateStorageRowQty(editingQty, maxAllowedQty) === null
    },
    [editingQty, remainingCapacity, validateStorageRowQty],
  )

  const updateField = useCallback(
    (
      field: "selectedBatteryId" | "qty" | "batchCode" | "mfgDate" | "expiryDate",
      value: string | number | null,
    ) => {
      if (field === "selectedBatteryId") {
        setSelectedBatteryId(typeof value === "number" ? value : null)
      } else if (field === "qty") {
        setQty(Math.max(0, Math.trunc(Number(value ?? 0))))
      } else if (field === "batchCode") {
        setBatchCode(typeof value === "string" ? value : "")
      } else if (field === "mfgDate") {
        setMfgDate(typeof value === "string" ? value : "")
      } else if (field === "expiryDate") {
        setExpiryDate(typeof value === "string" ? value : "")
      }
      setSubmitError(null)
    },
    [],
  )

  const startEditStorageRow = useCallback((row: BatteryStorageManagerLocationRecord) => {
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

  const resetCreateForm = useCallback(() => {
    setSelectedBatteryId(null)
    setQty(1)
    setBatchCode("")
    setMfgDate("")
    setExpiryDate("")
    setSubmitError(null)
  }, [])

  const handleCreateStorageRow = useCallback(async () => {
    if (!storageLocation?.Id) {
      setSubmitError("Storage location is not available")
      return
    }

    if (!selectedBatteryId || selectedBatteryId <= 0) {
      setSubmitError("Please select a battery")
      return
    }

    const isAlreadyStored = storageManagerRows.some((row) => row.BatteryId === selectedBatteryId)
    if (isAlreadyStored) {
      setSubmitError("Selected battery is already added to this location")
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
      await batteryStorageManagerService.createBatteryStorageManager({
        BatteryId: selectedBatteryId,
        LocationID: storageLocation.Id,
        Qty: qty,
        BatchCode: batchCode.trim() || null,
        MfgDate: mfgDate.trim() || null,
        ExpiryDate: expiryDate.trim() || null,
      })

      resetCreateForm()
      await loadLocationDetails(() => true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add battery to storage location"
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }, [
    batchCode,
    expiryDate,
    loadLocationDetails,
    mfgDate,
    qty,
    remainingCapacity,
    resetCreateForm,
    selectedBatteryId,
    storageLocation?.Id,
    storageManagerRows,
    validateStorageRowQty,
  ])

  const handleUpdateStorageRow = useCallback(
    async (row: BatteryStorageManagerLocationRecord) => {
      const maxAllowedQty = remainingCapacity + Number(row.Qty ?? 0)
      const qtyValidationMessage = validateStorageRowQty(editingQty, maxAllowedQty)

      if (qtyValidationMessage) {
        setSubmitError(qtyValidationMessage)
        return
      }

      setSubmitting(true)
      setSubmitError(null)

      try {
        await batteryStorageManagerService.updateBatteryStorageManager(row.Id, {
          BatteryId: row.BatteryId,
          LocationID: row.LocationID,
          Qty: editingQty,
          OrderID: row.OrderID,
          CreatedBy: row.CreatedBy,
        })

        cancelEditStorageRow()
        await loadLocationDetails(() => true)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update stored battery quantity"
        setSubmitError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [cancelEditStorageRow, editingQty, loadLocationDetails, remainingCapacity, validateStorageRowQty],
  )

  const handleDeleteStorageRow = useCallback(
    async (row: BatteryStorageManagerLocationRecord) => {
      const confirmed = window.confirm(
        `Are you sure you want to remove this battery from storage? All associated batch lots will be deleted.`,
      )

      if (!confirmed) {
        return
      }

      setSubmitting(true)
      setSubmitError(null)

      try {
        await batteryStorageManagerService.deleteBatteryStorageManager(row.Id)
        await loadLocationDetails(() => true)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete stored battery record"
        setSubmitError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [loadLocationDetails],
  )

  return {
    storageLocation,
    batteries,
    availableBatteries,
    storageManagerRows,
    selectedBatteryId,
    qty,
    batchCode,
    mfgDate,
    expiryDate,
    canSaveCreateRow,
    canSaveEditRow,
    loading,
    error,
    submitting,
    submitError,
    editingRowId,
    editingQty,
    updateField,
    startEditStorageRow,
    cancelEditStorageRow,
    updateEditingQty,
    handleCreateStorageRow,
    handleUpdateStorageRow,
    handleDeleteStorageRow,
  }
}
