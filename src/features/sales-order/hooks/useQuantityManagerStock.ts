import { useCallback, useEffect, useMemo, useState } from "react"
import { storageManagerService } from "../../storage-manager/services/storageManagerService"
import type { StorageAllocationInput } from "../models/salesOrder"

export type StockLotRow = {
  StorageManagerID: number | null
  StorageManagerBatchID: number | null
  dot: string | null
  locationName: string
  availableQty: number
  allocated: string
  takeNow: string
  receivedDate?: string
}

/**
 * Loads the tyre's DOT batches (ordered oldest-DOT-first) whenever the
 * Quantity Manager modal opens for a tyre, pre-filling each batch's allocated
 * quantity from the line's existing allocations.
 */
export function useQuantityManagerStock(
  isOpen: boolean,
  tyreId: number | null,
  initialAllocations: StorageAllocationInput[],
) {
  const [rows, setRows] = useState<StockLotRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || tyreId === null) {
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      setRows([])

      try {
        const batches = await storageManagerService.getBatchesByTyreId(tyreId)

        if (cancelled) return

        const allocatedByBatch = new Map<number, number>()
        const takeNowByBatch = new Map<number, number>()
        let autoQty = 0
        let autoTakeNow = 0

        for (const allocation of initialAllocations) {
          if (allocation.StorageManagerBatchID === null || allocation.StorageManagerBatchID === undefined) {
            if (allocation.StorageManagerID === null) {
              autoQty += allocation.Qty
              autoTakeNow += allocation.TakeNowQty ?? 0
            }
          } else {
            allocatedByBatch.set(
              allocation.StorageManagerBatchID,
              (allocatedByBatch.get(allocation.StorageManagerBatchID) ?? 0) + allocation.Qty,
            )
            takeNowByBatch.set(
              allocation.StorageManagerBatchID,
              (takeNowByBatch.get(allocation.StorageManagerBatchID) ?? 0) + (allocation.TakeNowQty ?? 0),
            )
          }
        }

        const nextRows: StockLotRow[] = batches.map((batch) => ({
          StorageManagerID: batch.StorageManagerID,
          StorageManagerBatchID: batch.Id,
          dot: batch.DOT,
          locationName: batch.LocationName ?? `Location #${batch.StorageManagerID}`,
          availableQty: batch.Qty,
          allocated: String(allocatedByBatch.get(batch.Id) ?? 0),
          takeNow: String(takeNowByBatch.get(batch.Id) ?? 0),
          receivedDate: batch.createdDate,
        }))

        nextRows.push({
          StorageManagerID: null,
          StorageManagerBatchID: null,
          dot: null,
          locationName: "Auto (FIFO)",
          availableQty: Number.POSITIVE_INFINITY,
          allocated: String(autoQty || 0),
          takeNow: String(autoTakeNow || 0),
        })

        setRows(nextRows)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load stock batches")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isOpen, tyreId, initialAllocations])

  const totalQty = useMemo(
    () =>
      rows.reduce(
        (sum, row) => (row.StorageManagerBatchID === null ? sum : sum + row.availableQty),
        0,
      ),
    [rows],
  )

  const updateAllocated = useCallback((batchId: number | null, raw: string) => {
    const isAutoRow = batchId === null

    setRows((prev) =>
      prev.map((row) => {
        if (row.StorageManagerBatchID === batchId) {
          // Take-now can never exceed the lot's allocation; clamp it down when
          // the allocated qty shrinks below what was already marked to collect.
          const nextAllocated = raw
          const allocatedInt = Number(nextAllocated)
          const takeNowInt = Number(row.takeNow)
          const nextTakeNow =
            Number.isInteger(allocatedInt) && Number.isInteger(takeNowInt) && takeNowInt > allocatedInt
              ? String(Math.max(allocatedInt, 0))
              : row.takeNow
          return { ...row, allocated: nextAllocated, takeNow: nextTakeNow }
        }

        // Auto (FIFO) and specific batches are mutually exclusive in BOTH
        // directions: typing into the auto bucket zeroes every real batch, and
        // typing into any real batch zeroes the auto bucket. Cleared rows show
        // 0 (not a blank/deleted field).
        if (isAutoRow) {
          return row.allocated === "0" && row.takeNow === "0"
            ? row
            : { ...row, allocated: "0", takeNow: "0" }
        }

        if (row.StorageManagerBatchID === null) {
          return row.allocated === "0" && row.takeNow === "0"
            ? row
            : { ...row, allocated: "0", takeNow: "0" }
        }

        return row
      }),
    )
  }, [])

  const updateTakeNow = useCallback((batchId: number | null, raw: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.StorageManagerBatchID !== batchId) return row

        // Take-now is capped by the lot's allocation (and by real stock for
        // concrete batches); the Auto row is capped by its allocated qty.
        const allocatedInt = Number(row.allocated)
        const rawInt = Number(raw)
        const cap =
          row.StorageManagerBatchID === null
            ? Number.isInteger(allocatedInt)
              ? allocatedInt
              : 0
            : row.availableQty

        if (!Number.isInteger(rawInt) || rawInt < 0) return { ...row, takeNow: raw }

        return { ...row, takeNow: String(Math.min(rawInt, Math.max(cap, 0))) }
      }),
    )
  }, [])

  return { rows, loading, error, totalQty, updateAllocated, updateTakeNow }
}