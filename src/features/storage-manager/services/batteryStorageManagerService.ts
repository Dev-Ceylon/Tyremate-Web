import type {
  BatteryStorageManagerBatchPayload,
  BatteryStorageManagerPayload,
} from "../models/batteryStorageManager"
import { batteryStorageManagerClient } from "./batteryStorageManagerClient"

export const batteryStorageManagerService = {
  getBatteryStorageManagers() {
    return batteryStorageManagerClient.getAll()
  },

  getBatteryStorageManagersByLocation(locationId: number) {
    return batteryStorageManagerClient.getByLocation(locationId)
  },

  getBatteryStorageManagerById(id: number) {
    return batteryStorageManagerClient.getById(id)
  },

  getBatteryStorageManagersByBatteryId(batteryId: number) {
    return batteryStorageManagerClient.getByBatteryId(batteryId)
  },

  getBatchesByBatteryId(batteryId: number) {
    return batteryStorageManagerClient.getBatchesByBatteryId(batteryId)
  },

  getBatchesByStorageManagerId(id: number) {
    return batteryStorageManagerClient.getBatchesByStorageManagerId(id)
  },

  getBatchesByLocation(locationId: number) {
    return batteryStorageManagerClient.getBatchesByLocation(locationId)
  },

  getStorageLocationsByBranch(branchId: number) {
    return batteryStorageManagerClient.getStorageLocationsByBranch(branchId)
  },

  getStorageLocationById(id: number) {
    return batteryStorageManagerClient.getStorageLocationById(id)
  },

  createBatteryStorageManager(data: BatteryStorageManagerPayload) {
    return batteryStorageManagerClient.create(data)
  },

  updateBatteryStorageManager(id: number, data: BatteryStorageManagerPayload) {
    return batteryStorageManagerClient.update(id, data)
  },

  deleteBatteryStorageManager(id: number) {
    return batteryStorageManagerClient.remove(id)
  },

  createBatch(storageManagerId: number, data: BatteryStorageManagerBatchPayload) {
    return batteryStorageManagerClient.createBatch(storageManagerId, data)
  },

  updateBatch(id: number, data: BatteryStorageManagerBatchPayload) {
    return batteryStorageManagerClient.updateBatch(id, data)
  },

  deleteBatch(id: number) {
    return batteryStorageManagerClient.removeBatch(id)
  },
}
