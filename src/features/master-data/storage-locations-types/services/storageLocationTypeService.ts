import type { StorageLocationTypePayload } from "../models/storageLocationType"
import { storageLocationTypeClient } from "./storageLocationTypeClient"

export const storageLocationTypeService = {
  suggest(field: string, query: string) {
    return storageLocationTypeClient.suggest(field, query)
  },

  getStorageLocationTypes() {
    return storageLocationTypeClient.getAll()
  },

  getStorageLocationTypeById(id: number) {
    return storageLocationTypeClient.getById(id)
  },

  createStorageLocationType(data: StorageLocationTypePayload) {
    return storageLocationTypeClient.create(data)
  },

  updateStorageLocationType(id: number, data: StorageLocationTypePayload) {
    return storageLocationTypeClient.update(id, data)
  },

  deleteStorageLocationType(id: number) {
    return storageLocationTypeClient.remove(id)
  },
}