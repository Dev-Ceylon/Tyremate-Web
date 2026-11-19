import type { ConsumablePayload, ConsumableRecord } from "../../../../shared/models/consumables/consumable"
import type { CountRecord } from "../../../../shared/models/common/count"

export const consumableClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.consumables.suggest(field, query)
  },

  getAll(): Promise<ConsumableRecord[]> {
    return window.api.consumables.getConsumables()
  },

  getById(id: number): Promise<ConsumableRecord> {
    return window.api.consumables.getConsumableById(id)
  },

  getByCategory(category: string): Promise<ConsumableRecord[]> {
    return window.api.consumables.getConsumablesByCategory(category)
  },

  getWithStock(): Promise<ConsumableRecord[]> {
    return window.api.consumables.getConsumablesWithStock()
  },

  getLowStockCount(): Promise<CountRecord> {
    return window.api.consumables.getLowStockCount()
  },

  create(data: ConsumablePayload): Promise<ConsumableRecord> {
    return window.api.consumables.createConsumable(data)
  },

  update(id: number, data: ConsumablePayload): Promise<ConsumableRecord> {
    return window.api.consumables.updateConsumable(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.consumables.deleteConsumable(id)
  },
}
