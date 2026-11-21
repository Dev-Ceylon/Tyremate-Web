import type { BatterySupplier } from "../models/batterySupplier"
import { mapBatterySupplierRecord } from "../mappers/batterySupplierMapper"

export const batterySupplierClient = {
  async getSuppliers(batteryId: string | number): Promise<BatterySupplier[]> {
    const records = await window.api.batterySuppliers.getSuppliersByBatteryId(Number(batteryId))
    return records.map((record) => mapBatterySupplierRecord(record, batteryId))
  },

  async getAllSuppliers(): Promise<BatterySupplier[]> {
    const records = (await window.api.batterySuppliers.getAll?.()) || []
    return records.map((record) => mapBatterySupplierRecord(record))
  },
}
