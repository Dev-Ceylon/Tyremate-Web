import type {
  BatteryStorageManagerBatchPayload,
  BatteryStorageManagerBatchRecord,
  BatteryStorageManagerLocationBatchRecord,
  BatteryStorageManagerLocationRecord,
  BatteryStorageManagerPayload,
  BatteryStorageManagerRecord,
} from "../models/batteryStorageManager"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"

export const batteryStorageManagerClient = {
  getAll(): Promise<BatteryStorageManagerRecord[]> {
    return window.api.batteryStorageManagers.getBatteryStorageManagers()
  },

  getByLocation(locationId: number): Promise<BatteryStorageManagerLocationRecord[]> {
    return window.api.batteryStorageManagers.getBatteryStorageManagersByLocation(locationId)
  },

  getById(id: number): Promise<BatteryStorageManagerRecord> {
    return window.api.batteryStorageManagers.getBatteryStorageManagerById(id)
  },

  getByBatteryId(batteryId: number): Promise<BatteryStorageManagerRecord[]> {
    return window.api.batteryStorageManagers.getBatteryStorageManagersByBatteryId(batteryId)
  },

  getBatchesByBatteryId(batteryId: number): Promise<BatteryStorageManagerBatchRecord[]> {
    return window.api.batteryStorageManagers.getBatchesByBatteryId(batteryId)
  },

  getBatchesByStorageManagerId(id: number): Promise<BatteryStorageManagerBatchRecord[]> {
    return window.api.batteryStorageManagers.getBatchesByStorageManagerId(id)
  },

  getBatchesByLocation(locationId: number): Promise<BatteryStorageManagerLocationBatchRecord[]> {
    return window.api.batteryStorageManagers.getBatchesByLocation(locationId)
  },

  getStorageLocationsByBranch(branchId: number): Promise<StorageLocationRecord[]> {
    return window.api.batteryStorageManagers.getStorageLocationsByBranch(branchId)
  },

  getStorageLocationById(id: number): Promise<StorageLocationRecord> {
    return window.api.batteryStorageManagers.getStorageLocationById(id)
  },

  create(data: BatteryStorageManagerPayload): Promise<BatteryStorageManagerRecord> {
    return window.api.batteryStorageManagers.createBatteryStorageManager(data)
  },

  update(id: number, data: BatteryStorageManagerPayload): Promise<BatteryStorageManagerRecord> {
    return window.api.batteryStorageManagers.updateBatteryStorageManager(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.batteryStorageManagers.deleteBatteryStorageManager(id)
  },

  createBatch(storageManagerId: number, data: BatteryStorageManagerBatchPayload): Promise<BatteryStorageManagerBatchRecord> {
    return window.api.batteryStorageManagers.createBatch(storageManagerId, data)
  },

  updateBatch(id: number, data: BatteryStorageManagerBatchPayload): Promise<BatteryStorageManagerBatchRecord> {
    return window.api.batteryStorageManagers.updateBatch(id, data)
  },

  removeBatch(id: number): Promise<{ success: true }> {
    return window.api.batteryStorageManagers.deleteBatch(id)
  },
}
