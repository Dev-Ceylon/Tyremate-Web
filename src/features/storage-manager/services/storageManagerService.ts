import type { StorageManagerPayload } from "../models/storageManager"
import { storageManagerClient } from "./storageManagerClient"

export const storageManagerService = {
  getStorageManagers() {
    return storageManagerClient.getAll()
  },

  getStorageManagersByLocation(locationId: number) {
    return storageManagerClient.getByLocation(locationId)
  },

  getStorageManagerById(id: number) {
    return storageManagerClient.getById(id)
  },

  getStorageManagersByTyreId(tyreId: number) {
    return storageManagerClient.getByTyreId(tyreId)
  },

  getBatchesByTyreId(tyreId: number) {
    return storageManagerClient.getBatchesByTyreId(tyreId)
  },

  getBatchesByStorageManagerId(id: number) {
    return storageManagerClient.getBatchesByStorageManagerId(id)
  },

  getBatchesByLocation(locationId: number) {
    return storageManagerClient.getBatchesByLocation(locationId)
  },

  createStorageManager(data: StorageManagerPayload) {
    return storageManagerClient.create(data)
  },

  updateStorageManager(id: number, data: StorageManagerPayload) {
    return storageManagerClient.update(id, data)
  },

  deleteStorageManager(id: number) {
    return storageManagerClient.remove(id)
  },
}
