import type {
  StorageLocationTypePayload,
  StorageLocationTypeRecord,
} from "../models/storageLocationType"

export const storageLocationTypeClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.storageLocationTypes.suggest(field, query)
  },

  getAll(): Promise<StorageLocationTypeRecord[]> {
    return window.api.storageLocationTypes.getStorageLocationTypes()
  },

  getById(id: number): Promise<StorageLocationTypeRecord> {
    return window.api.storageLocationTypes.getStorageLocationTypeById(id)
  },

  create(data: StorageLocationTypePayload): Promise<StorageLocationTypeRecord> {
    return window.api.storageLocationTypes.createStorageLocationType(data)
  },

  update(id: number, data: StorageLocationTypePayload): Promise<StorageLocationTypeRecord> {
    return window.api.storageLocationTypes.updateStorageLocationType(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.storageLocationTypes.deleteStorageLocationType(id)
  },
}