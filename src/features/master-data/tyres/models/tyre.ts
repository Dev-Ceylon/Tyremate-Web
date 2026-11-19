export type TyrePayload = {
  Brand?: string | null
  Size?: string | null
  Pattern?: string | null
  LL_SR?: string | null
  PR?: string | null
  SideWall?: string | null
  DOT?: string | null
  SupplierIDs?: number[]
  PriceValidityFrom?: string | null
  PriceValidityTo?: string | null
  PurchasedPrice?: number | null
  DAGCost?: number | null
  DiscountOffered?: number | null
  DiscountAmount?: number | null
  MRP_WithoutVAT?: number | null
  MRP_WithVAT?: number | null
  ActualSellingPrice?: number | null
}

export type TyreRecord = TyrePayload & {
  Id: number
  SupplierCodes?: string | null
  SupplierNames?: string | null
  AvailableQuantity?: number | null
}
