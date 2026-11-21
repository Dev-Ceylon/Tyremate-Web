export interface BatterySupplier {
  id: string | number
  supplierId: string | number
  batteryId: string | number
  supplierName: string
  supplierContact: string
  price: number
  quantity?: number
  leadTime?: string
  createdAt?: string
  updatedAt?: string
}

export type BatterySupplierApiRecord = Partial<BatterySupplier> & {
  SupplierID?: string | number
  BatteryId?: string | number
  Name?: string
  Contact?: string
  Price?: number | string | null
  Quantity?: number | string | null
  AvailableQuantity?: number | string | null
  LeadTime?: string | null
}
