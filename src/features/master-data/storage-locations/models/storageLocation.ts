export type StorageLocationPayload = {
  LocationCode: string
  LocationName: string
  BranchId?: number | null
  LocationTypeId?: number | null
  Capacity?: number | null
}

export type StorageLocationRecord = {
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
