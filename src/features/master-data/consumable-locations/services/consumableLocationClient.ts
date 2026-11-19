import type {
  ConsumableLocationPayload,
  ConsumableLocationRecord,
} from "../../../../shared/models/consumables/consumableLocation"

export const consumableLocationClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.consumableLocations.suggest(field, query)
  },

  getAll(): Promise<ConsumableLocationRecord[]> {
    return window.api.consumableLocations.getConsumableLocations()
  },

  getByBranch(branchId: number): Promise<ConsumableLocationRecord[]> {
    return window.api.consumableLocations.getConsumableLocationsByBranch(branchId)
  },

  getById(id: number): Promise<ConsumableLocationRecord> {
    return window.api.consumableLocations.getConsumableLocationById(id)
  },

  create(data: ConsumableLocationPayload): Promise<ConsumableLocationRecord> {
    return window.api.consumableLocations.createConsumableLocation(data)
  },

  update(id: number, data: ConsumableLocationPayload): Promise<ConsumableLocationRecord> {
    return window.api.consumableLocations.updateConsumableLocation(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.consumableLocations.deleteConsumableLocation(id)
  },
}
