import type { TyrePayload, TyreRecord } from "../models/tyre"
import type { CountRecord } from "../../../../shared/models/common/count"

export const tyreClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.tyres.suggest(field, query)
  },

  getAll(): Promise<TyreRecord[]> {
    return window.api.tyres.getTyres()
  },

  getById(tyreId: number): Promise<TyreRecord> {
    return window.api.tyres.getTyreById(tyreId)
  },

  getTyresWithAvailableQuantity(): Promise<TyreRecord[]> {
    return window.api.tyres.getTyresWithAvailableQuantity()
  },

  getLowStockCount(): Promise<CountRecord> {
    return window.api.tyres.getLowStockCount()
  },

  getByIdWithAvailableQuantity(tyreId: number): Promise<TyreRecord> {
    return window.api.tyres.getTyreByIdWithAvailableQuantity(tyreId)
  },

  create(data: TyrePayload): Promise<TyreRecord> {
    return window.api.tyres.createTyre(data)
  },

  update(tyreId: number, data: TyrePayload): Promise<TyreRecord> {
    return window.api.tyres.updateTyre(tyreId, data)
  },

  remove(tyreId: number): Promise<{ success: true }> {
    return window.api.tyres.deleteTyre(tyreId)
  },
}
