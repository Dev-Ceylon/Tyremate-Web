import type { SupplierPayload, SupplierRecord, SupplierTypeRecord } from "../models/supplier"

export const supplierClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.suppliers.suggest(field, query)
  },

  getAll(): Promise<SupplierRecord[]> {
    return window.api.suppliers.getSuppliers()
  },

  getById(supplierId: number): Promise<SupplierRecord> {
    return window.api.suppliers.getSupplierById(supplierId)
  },

  getTypes(): Promise<SupplierTypeRecord[]> {
    return window.api.suppliers.getSupplierTypes()
  },

  create(data: SupplierPayload): Promise<SupplierRecord> {
    return window.api.suppliers.createSupplier(data)
  },

  update(supplierId: number, data: SupplierPayload): Promise<SupplierRecord> {
    return window.api.suppliers.updateSupplier(supplierId, data)
  },

  remove(supplierId: number): Promise<{ success: true }> {
    return window.api.suppliers.deleteSupplier(supplierId)
  },
}
