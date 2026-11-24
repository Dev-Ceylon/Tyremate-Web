import type { BatteryLocationPayload } from "../models/batteryLocation"
import { batteryLocationClient } from "./batteryLocationClient"

export const batteryLocationService = {
  suggest(field: string, query: string) {
    return batteryLocationClient.suggest(field, query)
  },

  getBatteryLocations() {
    return batteryLocationClient.getAll()
  },

  getBatteryLocationsByBranch(branchId: number) {
    return batteryLocationClient.getByBranch(branchId)
  },

  getBatteryLocationById(id: number) {
    return batteryLocationClient.getById(id)
  },

  createBatteryLocation(data: BatteryLocationPayload) {
    return batteryLocationClient.create(data)
  },

  updateBatteryLocation(id: number, data: BatteryLocationPayload) {
    return batteryLocationClient.update(id, data)
  },

  deleteBatteryLocation(id: number) {
    return batteryLocationClient.remove(id)
  },
}
