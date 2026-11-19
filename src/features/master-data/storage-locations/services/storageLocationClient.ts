import type {
  StorageLocationPayload,
  StorageLocationRecord,
} from "../models/storageLocation"

export const storageLocationClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.storageLocations.suggest(field, query)
  },

  getAll(): Promise<StorageLocationRecord[]> {
    return window.api.storageLocations.getStorageLocations()
  },

  getByBranch(branchId: number): Promise<StorageLocationRecord[]> {
    return window.api.storageLocations.getStorageLocationsByBranch(branchId)
  },

  getByLocationType(locationTypeId: number): Promise<StorageLocationRecord[]> {
    return window.api.storageLocations.getStorageLocationsByLocationType(locationTypeId);
  },

  getById(id: number): Promise<StorageLocationRecord> {
    return window.api.storageLocations.getStorageLocationById(id)
  },

  create(data: StorageLocationPayload): Promise<StorageLocationRecord> {
    return window.api.storageLocations.createStorageLocation(data)
  },

  update(id: number, data: StorageLocationPayload): Promise<StorageLocationRecord> {
    return window.api.storageLocations.updateStorageLocation(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.storageLocations.deleteStorageLocation(id)
  },
}
