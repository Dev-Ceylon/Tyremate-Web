export type StockSnapshotRecord = {
  TyreID: number
  Size?: string | null
  Pattern?: string | null
  LL_SR?: string | null
  PR?: string | null
  SideWall?: string | null
  DOT?: string | null
  PurchasedPrice?: number | null
  ActualSellingPrice?: number | null
  SupplierCodes?: string | null
  SupplierNames?: string | null
  OnHandQty: number
  AllocatedSalesQty: number
  AvailableToSellQty: number
}
