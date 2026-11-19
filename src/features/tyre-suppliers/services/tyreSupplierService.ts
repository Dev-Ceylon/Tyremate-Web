import { tyreSupplierClient } from "./tyreSupplierClient"
import type { TyreSupplier } from "../models/tyreSupplier"

export const tyreSupplierService = {
  getSuppliers(tyreId: string | number): Promise<TyreSupplier[]> {
    return tyreSupplierClient.getSuppliers(tyreId)
  },

  getAllSuppliers(): Promise<TyreSupplier[]> {
    return tyreSupplierClient.getAllSuppliers()
  },

  // Business logic methods can be added here
  filterByPrice(suppliers: TyreSupplier[], maxPrice: number): TyreSupplier[] {
    return suppliers.filter((supplier) => supplier.price <= maxPrice)
  },

  sortByPrice(suppliers: TyreSupplier[], ascending = true): TyreSupplier[] {
    return [...suppliers].sort((a, b) =>
      ascending ? a.price - b.price : b.price - a.price
    )
  },

  sortByQuantity(suppliers: TyreSupplier[], ascending = false): TyreSupplier[] {
    return [...suppliers].sort((a, b) =>
      ascending ? a.quantity - b.quantity : b.quantity - a.quantity
    )
  },
}
