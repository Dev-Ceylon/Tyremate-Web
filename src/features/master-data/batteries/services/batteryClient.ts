import type { BatteryPayload, BatteryRecord } from "../models/battery"
import type { CountRecord } from "../../../../shared/models/common/count"

export const batteryClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.batteries.suggest(field, query)
  },

  getAll(): Promise<BatteryRecord[]> {
    return window.api.batteries.getBatteries()
  },

  getById(batteryId: number): Promise<BatteryRecord> {
    return window.api.batteries.getBatteryById(batteryId)
  },

  getBatteriesWithAvailableQuantity(): Promise<BatteryRecord[]> {
    return window.api.batteries.getBatteriesWithAvailableQuantity()
  },

  getLowStockCount(): Promise<CountRecord> {
    return window.api.batteries.getLowStockCount()
  },

  getByIdWithAvailableQuantity(batteryId: number): Promise<BatteryRecord> {
    return window.api.batteries.getBatteryByIdWithAvailableQuantity(batteryId)
  },

  create(data: BatteryPayload): Promise<BatteryRecord> {
    return window.api.batteries.createBattery(data)
  },

  update(batteryId: number, data: BatteryPayload): Promise<BatteryRecord> {
    return window.api.batteries.updateBattery(batteryId, data)
  },

  remove(batteryId: number): Promise<{ success: true }> {
    return window.api.batteries.deleteBattery(batteryId)
  },
}
