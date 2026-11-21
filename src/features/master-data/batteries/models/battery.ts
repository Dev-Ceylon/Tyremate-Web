export type BatteryPayload = {
  Brand?: string | null
  Model?: string | null
  Series?: string | null
  Voltage?: string | null
  Capacity?: string | null
  Technology?: string | null
  Application?: string | null
  WarrantyMonths?: number | null
  BatchCode?: string | null
  SupplierIDs?: number[]
  PriceValidityFrom?: string | null
  PriceValidityTo?: string | null
  PurchasedPrice?: number | null
  DiscountOffered?: number | null
  DiscountAmount?: number | null
  MRP_WithoutVAT?: number | null
  MRP_WithVAT?: number | null
  ActualSellingPrice?: number | null
}

export type BatteryRecord = BatteryPayload & {
  Id: number
  SupplierCodes?: string | null
  SupplierNames?: string | null
  AvailableQuantity?: number | null
}
