export type ConsumablePayload = {
  Name: string
  Category?: string | null
  Unit: string
  CostPrice?: number | null
  ReorderLevel?: number | null
  IsActive?: number
}

export type ConsumableRecord = {
  Id: number
  Name: string
  Category: string | null
  Unit: string
  CostPrice: number
  ReorderLevel: number
  IsActive: number
  CreatedDate: string
  ModifiedDate: string
  AvailableQty?: number
}
