import type { TyrePayload } from "../models/tyre"
import { tyreClient } from "./tyreClient"

export const tyreService = {
  suggest(field: string, query: string) {
    return tyreClient.suggest(field, query)
  },

  getTyres() {
    return tyreClient.getAll()
  },

  getTyresWithAvailableQuantity() {
    return tyreClient.getTyresWithAvailableQuantity()
  },

  getLowStockCount() {
    return tyreClient.getLowStockCount()
  },

  getTyreById(tyreId: number) {
    return tyreClient.getById(tyreId)
  },

  getTyreByIdWithAvailableQuantity(tyreId: number) {
    return tyreClient.getByIdWithAvailableQuantity(tyreId)
  },

  createTyre(data: TyrePayload) {
    return tyreClient.create(data)
  },

  updateTyre(tyreId: number, data: TyrePayload) {
    return tyreClient.update(tyreId, data)
  },

  deleteTyre(tyreId: number) {
    return tyreClient.remove(tyreId)
  },
}
