import type { BatteryPayload } from "../models/battery"
import { batteryClient } from "./batteryClient"

export const batteryService = {
  suggest(field: string, query: string) {
    return batteryClient.suggest(field, query)
  },

  getBatteries() {
    return batteryClient.getAll()
  },

  getBatteriesWithAvailableQuantity() {
    return batteryClient.getBatteriesWithAvailableQuantity()
  },

  getLowStockCount() {
    return batteryClient.getLowStockCount()
  },

  getBatteryById(batteryId: number) {
    return batteryClient.getById(batteryId)
  },

  getBatteryByIdWithAvailableQuantity(batteryId: number) {
    return batteryClient.getByIdWithAvailableQuantity(batteryId)
  },

  createBattery(data: BatteryPayload) {
    return batteryClient.create(data)
  },

  updateBattery(batteryId: number, data: BatteryPayload) {
    return batteryClient.update(batteryId, data)
  },

  deleteBattery(batteryId: number) {
    return batteryClient.remove(batteryId)
  },
}
