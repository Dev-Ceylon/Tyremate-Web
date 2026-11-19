import type { ConsumablePayload } from "../../../../shared/models/consumables/consumable"
import { consumableClient } from "./consumableClient"

export const consumableService = {
  suggest(field: string, query: string) {
    return consumableClient.suggest(field, query)
  },

  getConsumables() {
    return consumableClient.getAll()
  },

  getConsumableById(id: number) {
    return consumableClient.getById(id)
  },

  getConsumablesByCategory(category: string) {
    return consumableClient.getByCategory(category)
  },

  getConsumablesWithStock() {
    return consumableClient.getWithStock()
  },

  getLowStockCount() {
    return consumableClient.getLowStockCount()
  },

  createConsumable(data: ConsumablePayload) {
    return consumableClient.create(data)
  },

  updateConsumable(id: number, data: ConsumablePayload) {
    return consumableClient.update(id, data)
  },

  deleteConsumable(id: number) {
    return consumableClient.remove(id)
  },
}
