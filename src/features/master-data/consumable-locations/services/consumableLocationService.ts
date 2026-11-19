import type { ConsumableLocationPayload } from "../../../../shared/models/consumables/consumableLocation"
import { consumableLocationClient } from "./consumableLocationClient"

export const consumableLocationService = {
  suggest(field: string, query: string) {
    return consumableLocationClient.suggest(field, query)
  },

  getConsumableLocations() {
    return consumableLocationClient.getAll()
  },

  getConsumableLocationsByBranch(branchId: number) {
    return consumableLocationClient.getByBranch(branchId)
  },

  getConsumableLocationById(id: number) {
    return consumableLocationClient.getById(id)
  },

  createConsumableLocation(data: ConsumableLocationPayload) {
    return consumableLocationClient.create(data)
  },

  updateConsumableLocation(id: number, data: ConsumableLocationPayload) {
    return consumableLocationClient.update(id, data)
  },

  deleteConsumableLocation(id: number) {
    return consumableLocationClient.remove(id)
  },
}
