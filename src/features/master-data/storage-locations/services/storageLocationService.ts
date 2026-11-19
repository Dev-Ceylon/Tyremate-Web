import type { StorageLocationPayload } from "../models/storageLocation"
import { storageLocationClient } from "./storageLocationClient"

export const storageLocationService = {
  suggest(field: string, query: string) {
    return storageLocationClient.suggest(field, query)
  },

  getStorageLocations() {
    return storageLocationClient.getAll()
  },

  getStorageLocationsByBranch(branchId: number) {
    return storageLocationClient.getByBranch(branchId)
  },

  getStorageLocationsByLocationType(locationTypeId: number) {
    return storageLocationClient.getByLocationType(locationTypeId)
  },

  getStorageLocationById(id: number) {
    return storageLocationClient.getById(id)
  },

  createStorageLocation(data: StorageLocationPayload) {
    return storageLocationClient.create(data)
  },

  updateStorageLocation(id: number, data: StorageLocationPayload) {
    return storageLocationClient.update(id, data)
  },

  deleteStorageLocation(id: number) {
    return storageLocationClient.remove(id)
  },
}
