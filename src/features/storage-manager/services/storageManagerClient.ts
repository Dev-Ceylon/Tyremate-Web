import type {
  StorageManagerBatchRecord,
  StorageManagerLocationBatchRecord,
  StorageManagerLocationRecord,
  StorageManagerPayload,
  StorageManagerRecord,
} from "../models/storageManager"

export const storageManagerClient = {
  getAll(): Promise<StorageManagerRecord[]> {
    return window.api.storageManagers.getStorageManagers()
  },

  getByLocation(locationId: number): Promise<StorageManagerLocationRecord[]> {
    return window.api.storageManagers.getStorageManagersByLocation(locationId)
  },

  getById(id: number): Promise<StorageManagerRecord> {
    return window.api.storageManagers.getStorageManagerById(id)
  },

  getByTyreId(tyreId: number): Promise<StorageManagerRecord[]> {
    return window.api.storageManagers.getStorageManagersByTyreId(tyreId)
  },

  getBatchesByTyreId(tyreId: number): Promise<StorageManagerBatchRecord[]> {
    return window.api.storageManagers.getBatchesByTyreId(tyreId)
  },

  getBatchesByStorageManagerId(id: number): Promise<StorageManagerBatchRecord[]> {
    return window.api.storageManagers.getBatchesByStorageManagerId(id)
  },

  getBatchesByLocation(locationId: number): Promise<StorageManagerLocationBatchRecord[]> {
    return window.api.storageManagers.getBatchesByLocation(locationId)
  },

  create(data: StorageManagerPayload): Promise<StorageManagerRecord> {
    return window.api.storageManagers.createStorageManager(data)
  },

  update(id: number, data: StorageManagerPayload): Promise<StorageManagerRecord> {
    return window.api.storageManagers.updateStorageManager(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.storageManagers.deleteStorageManager(id)
  },
}
