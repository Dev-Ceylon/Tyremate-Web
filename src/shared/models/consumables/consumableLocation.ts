export type ConsumableLocationPayload = {
  LocationCode: string
  LocationName: string
  BranchId?: number | null
  LocationTypeId?: number | null
  Capacity?: number | null
}

export type ConsumableLocationRecord = {
  Id: number
  LocationCode: string | null
  LocationName: string | null
  BranchId: number | null
  LocationTypeId: number | null
  LocationType: string | null
  LocationTypeCode: string | null
  Branch: string | null
  Capacity: number | null
  UsedCapacity: number
  RemainingCapacity: number
}
