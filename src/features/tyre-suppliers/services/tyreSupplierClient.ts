import type { TyreSupplier } from "../models/tyreSupplier"
import { mapSupplierRecord } from "../mappers/tyreSupplierMapper"

export const tyreSupplierClient = {
  async getSuppliers(tyreId: string | number): Promise<TyreSupplier[]> {
    const records = await window.api.tyreSuppliers.getSuppliersByTyreId(Number(tyreId))
    return records.map((record) => mapSupplierRecord(record, tyreId))
  },

  async getAllSuppliers(): Promise<TyreSupplier[]> {
    const records = (await window.api.tyreSuppliers.getAll?.()) || []
    return records.map((record) => mapSupplierRecord(record))
  },
}
