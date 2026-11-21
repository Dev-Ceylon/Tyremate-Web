import type { SupplierPayload } from "../models/supplier"
import { supplierClient } from "./supplierClient"

export const supplierService = {
  suggest(field: string, query: string) {
    return supplierClient.suggest(field, query)
  },

  getSuppliers() {
    return supplierClient.getAll()
  },

  getSupplierById(supplierId: number) {
    return supplierClient.getById(supplierId)
  },

  getSupplierTypes() {
    return supplierClient.getTypes()
  },

  createSupplier(data: SupplierPayload) {
    return supplierClient.create(data)
  },

  updateSupplier(supplierId: number, data: SupplierPayload) {
    return supplierClient.update(supplierId, data)
  },

  deleteSupplier(supplierId: number) {
    return supplierClient.remove(supplierId)
  },
}
