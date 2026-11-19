export type ConsumableStorageManagerPayload = {
  ConsumableID: number
  LocationID: number
  Qty?: number | null
  BatchNumber?: string | null
  ExpiryDate?: string | null
}

export type ConsumableStorageManagerRecord = {
  Id: number
  ConsumableID: number
  LocationID: number
  Qty: number
  BatchNumber: string | null
  ExpiryDate: string | null
  createdDate: string
  ConsumableName: string
  ConsumableUnit: string
  LocationName: string
}
