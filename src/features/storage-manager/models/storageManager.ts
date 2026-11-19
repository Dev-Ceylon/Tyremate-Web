export type StorageManagerPayload = {
  TyreId: number
  LocationID: number
  Qty?: number | null
  OrderID?: number | null
  SourceTypeId?: number | null
  SourceId?: number | null
  CreatedBy?: string | null
}

export type StorageManagerRecord = {
  Id: number
  TyreId: number
  LocationID: number
  Qty: number
  OrderID: number | null
  SourceTypeId: number | null
  SourceId: number | null
  CreatedBy: string | null
  createdDate: string
}

export type StorageManagerBatchRecord = {
  Id: number
  StorageManagerID: number
  DOT: string | null
  Qty: number
  CreatedBy: string | null
  createdDate: string
  LocationName?: string | null
}

export type StorageManagerLocationBatchRecord = {
  Id: number
  StorageManagerID: number
  LocationID: number
  TyreId: number
  DOT: string | null
  Qty: number
  Size?: string | null
  Pattern?: string | null
  LL_SR?: string | null
  PR?: string | null
  SideWall?: string | null
  ManufactureDate?: string | null
  ExpiryDate?: string | null
  DaysLeft?: number | null
}

export type StorageManagerLocationRecord = StorageManagerRecord & {
  Size?: string | null
  Pattern?: string | null
  LL_SR?: string | null
  PR?: string | null
  SideWall?: string | null
  DOT?: string | null
  SourceCode?: string | null
  batches?: StorageManagerLocationBatchRecord[]
}
