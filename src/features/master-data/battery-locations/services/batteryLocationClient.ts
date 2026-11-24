import type {
  BatteryLocationPayload,
  BatteryLocationRecord,
} from "../models/batteryLocation"

export const batteryLocationClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.batteryLocations.suggest(field, query)
  },

  getAll(): Promise<BatteryLocationRecord[]> {
    return window.api.batteryLocations.getBatteryLocations()
  },

  getByBranch(branchId: number): Promise<BatteryLocationRecord[]> {
    return window.api.batteryLocations.getBatteryLocationsByBranch(branchId)
  },

  getById(id: number): Promise<BatteryLocationRecord> {
    return window.api.batteryLocations.getBatteryLocationById(id)
  },

  create(data: BatteryLocationPayload): Promise<BatteryLocationRecord> {
    return window.api.batteryLocations.createBatteryLocation(data)
  },

  update(id: number, data: BatteryLocationPayload): Promise<BatteryLocationRecord> {
    return window.api.batteryLocations.updateBatteryLocation(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.batteryLocations.deleteBatteryLocation(id)
  },
}
