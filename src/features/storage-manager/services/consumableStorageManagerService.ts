import type { ConsumableStorageManagerPayload } from "../../../shared/models/consumables/consumableStorageManager"
import { consumableStorageManagerClient } from "./consumableStorageManagerClient"

export const consumableStorageManagerService = {
  getConsumableStorageManagers() {
    return consumableStorageManagerClient.getAll()
  },

  getConsumableStorageManagersByLocation(locationId: number) {
    return consumableStorageManagerClient.getByLocation(locationId)
  },

  getConsumableStorageManagerById(id: number) {
    return consumableStorageManagerClient.getById(id)
  },

  createConsumableStorageManager(data: ConsumableStorageManagerPayload) {
    return consumableStorageManagerClient.create(data)
  },

  updateConsumableStorageManager(id: number, data: ConsumableStorageManagerPayload) {
    return consumableStorageManagerClient.update(id, data)
  },

  deleteConsumableStorageManager(id: number) {
    return consumableStorageManagerClient.remove(id)
  },
}
