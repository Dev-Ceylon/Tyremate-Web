import type { TyreSupplier, TyreSupplierApiRecord } from "../models/tyreSupplier"

const normalizeNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const mapSupplierRecord = (
  record: TyreSupplierApiRecord,
  tyreId?: string | number
): TyreSupplier => {
  const supplierId = record.supplierId ?? record.SupplierID ?? record.id ?? ""

  return {
    id: record.id ?? supplierId,
    supplierId,
    tyreId: record.tyreId ?? record.TyreId ?? tyreId ?? "",
    supplierName: record.supplierName ?? record.Name ?? "",
    supplierContact: record.supplierContact ?? record.Contact ?? "",
    price: normalizeNumber(record.price ?? record.Price),
    quantity: normalizeNumber(record.quantity ?? record.Quantity ?? record.AvailableQuantity),
    leadTime: record.leadTime ?? record.LeadTime ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}