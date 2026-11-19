export interface TyreSupplier {
  id: string | number
  supplierId: string | number
  tyreId: string | number
  supplierName: string
  supplierContact: string
  price: number
  quantity: number
  leadTime?: string
  createdAt?: string
  updatedAt?: string
}

export type TyreSupplierApiRecord = Partial<TyreSupplier> & {
  SupplierID?: string | number
  TyreId?: string | number
  Name?: string
  Contact?: string
  Price?: number | string | null
  Quantity?: number | string | null
  AvailableQuantity?: number | string | null
  LeadTime?: string | null
}
