import type { TyreRecord } from "../../master-data/tyres/models/tyre"

type LineAmountInput = {
  Price: number
  Qty: number
  Discount: number
  MRP_WithVAT: number
  MaxDiscount?: number | null
  LineTotal?: number | null
}

type LineAvailabilityInput = {
  TyreID?: number | ""
  BatteryID?: number | ""
  Qty: number
}

export type NewestStockCheckInput = {
  StorageManagerID: number | null
  StorageManagerBatchID: number | null
  dot?: string | null
  batchCode?: string | null
  expiryDate?: string | null
  availableQty: number
  allocated: string
  receivedDate?: string
}

const parseIntegerQty = (raw: string): number => {
  if (raw.trim() === "") return 0
  const value = Number(raw)
  return Number.isInteger(value) && value >= 0 ? value : 0
}

const dotYear = (dot: string | null | undefined): number => {
  if (!dot || dot.length < 4 || /[^0-9]/.test(dot)) return Number.MAX_SAFE_INTEGER
  return Number("20" + dot.slice(-2))
}

const dotWeek = (dot: string | null | undefined): number => {
  if (!dot || dot.length < 4 || /[^0-9]/.test(dot)) return Number.MAX_SAFE_INTEGER
  return Number(dot.slice(0, 2))
}

/**
 * FIFO / FEFO rule check: returns true when a specific (newer) batch is being
 * allocated while an OLDER batch — ranked by ExpiryDate for batteries or DOT for tyres —
 * still has available stock that is not fully allocated. The auto row is ignored.
 */
export const isUsingNewerLotWhileOlderAvailable = (
  rows: NewestStockCheckInput[],
): boolean => {
  const isBatteryBatch = rows.some((r) => r.expiryDate || r.batchCode)

  const batches = rows
    .filter((row) => row.StorageManagerBatchID !== null)
    .map((row) => ({
      StorageManagerBatchID: row.StorageManagerBatchID as number,
      availableQty: row.availableQty,
      allocatedQty: parseIntegerQty(row.allocated),
      year: dotYear(row.dot),
      week: dotWeek(row.dot),
      expiryDate: row.expiryDate ?? "",
      id: row.StorageManagerBatchID as number,
    }))
    .sort((a, b) => {
      if (isBatteryBatch && (a.expiryDate || b.expiryDate)) {
        if (a.expiryDate && b.expiryDate) {
          const comp = a.expiryDate.localeCompare(b.expiryDate)
          if (comp !== 0) return comp
        } else if (a.expiryDate) {
          return -1
        } else {
          return 1
        }
      } else {
        if (a.year !== b.year) return a.year - b.year
        if (a.week !== b.week) return a.week - b.week
      }
      return a.id - b.id
    })
    .map((row) => ({
      StorageManagerBatchID: row.StorageManagerBatchID,
      availableQty: row.availableQty,
      remaining: Math.max(row.availableQty - row.allocatedQty, 0),
    }))

  for (let i = 0; i < batches.length; i += 1) {
    const current = batches[i]
    const isAllocated = current.remaining < current.availableQty
    if (!isAllocated) continue

    const hasOlderStockStillAvailable = batches
      .slice(0, i)
      .some((older) => older.remaining > 0)

    if (hasOlderStockStillAvailable) return true
  }

  return false
}

export const getDiscountAmount = (discountPercentage: number, mrpWithVat: number): number => {
  return (discountPercentage / 100) * mrpWithVat
}

export const calculateDiscountAmount = (line: LineAmountInput) => {
  return (line.MRP_WithVAT * line.Qty * line.Discount) / 100
}

export const calculateLineTotal = (line: LineAmountInput) => {
  if (line.LineTotal != null) return line.LineTotal
  return getMaxLineTotal(line)
}

export const getMaxLineTotal = (line: LineAmountInput) =>
  line.MRP_WithVAT * line.Qty * (1 - line.Discount / 100)

export const parseLineTotalOverride = (raw: string, line: LineAmountInput): number | null => {
  if (raw === "") return null
  const val = Number(raw)
  if (val > getMaxLineTotal(line)) return null
  return val
}

export const parseLineDiscountOverride = (raw: string): number | null => {
  if (raw === "") return null
  const val = Number(raw)
  if (!Number.isFinite(val) || val < 0) return null
  if (val > 100) return null
  return val
}

export const getAvailableQuantity = (item?: { AvailableQuantity?: number | null } | null) => {
  return Number(item?.AvailableQuantity ?? 0)
}

export const calculateNeedToOrderQty = (qty: number, availableQty: number) => {
  return Math.max(qty - availableQty, 0)
}

export const calculateRemainingAvailableQty = (qty: number, availableQty: number) => {
  return Math.max(availableQty - qty, 0)
}

export const calculateRemainingAvailableForLine = (
  line: LineAvailabilityInput,
  itemsById: ReadonlyMap<number, { AvailableQuantity?: number | null }>,
) => {
  const itemId = line.BatteryID !== undefined && line.BatteryID !== "" ? line.BatteryID : line.TyreID
  if (itemId === "" || itemId === undefined) {
    return 0
  }

  const selectedItem = itemsById.get(Number(itemId))
  const availableQty = getAvailableQuantity(selectedItem)
  return calculateRemainingAvailableQty(line.Qty, availableQty)
}
