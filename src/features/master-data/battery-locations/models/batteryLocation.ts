export type BatteryLocationPayload = {
  LocationCode: string
  LocationName: string
  BranchId?: number | null
  LocationTypeId?: number | null
  Capacity?: number | null
}

export type BatteryLocationRecord = {
  Id: number
  LocationCode: string | null
  LocationName: string | null
  BranchId: number | null
  LocationTypeId: number | null
  Branch: string | null
  LocationType: string | null
  Capacity: number | null
  UsedCapacity: number
  RemainingCapacity: number
}
