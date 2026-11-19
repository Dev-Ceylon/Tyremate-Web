import type {
  ConsumableStorageManagerPayload,
  ConsumableStorageManagerRecord,
} from "../../../shared/models/consumables/consumableStorageManager"

export const consumableStorageManagerClient = {
  getAll(): Promise<ConsumableStorageManagerRecord[]> {
    return window.api.consumableStorageManagers.getConsumableStorageManagers()
  },

  getByLocation(locationId: number): Promise<ConsumableStorageManagerRecord[]> {
    return window.api.consumableStorageManagers.getConsumableStorageManagersByLocation(locationId)
  },

  getById(id: number): Promise<ConsumableStorageManagerRecord> {
    return window.api.consumableStorageManagers.getConsumableStorageManagerById(id)
  },

  create(data: ConsumableStorageManagerPayload): Promise<ConsumableStorageManagerRecord> {
    return window.api.consumableStorageManagers.createConsumableStorageManager(data)
  },

  update(
    id: number,
    data: ConsumableStorageManagerPayload,
  ): Promise<ConsumableStorageManagerRecord> {
    return window.api.consumableStorageManagers.updateConsumableStorageManager(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.consumableStorageManagers.deleteConsumableStorageManager(id)
  },
}
