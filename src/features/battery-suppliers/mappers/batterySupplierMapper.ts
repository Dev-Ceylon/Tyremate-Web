import type { BatterySupplier, BatterySupplierApiRecord } from "../models/batterySupplier"

const normalizeNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const mapBatterySupplierRecord = (
  record: BatterySupplierApiRecord,
  batteryId?: string | number
): BatterySupplier => {
  const supplierId = record.supplierId ?? record.SupplierID ?? record.id ?? ""

  return {
    id: record.id ?? supplierId,
    supplierId,
    batteryId: record.batteryId ?? record.BatteryId ?? batteryId ?? "",
    supplierName: record.supplierName ?? record.Name ?? "",
    supplierContact: record.supplierContact ?? record.Contact ?? "",
    price: normalizeNumber(record.price ?? record.Price),
    quantity: normalizeNumber(record.quantity ?? record.Quantity ?? record.AvailableQuantity),
    leadTime: record.leadTime ?? record.LeadTime ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}
