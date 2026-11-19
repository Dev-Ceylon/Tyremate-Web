import type { CreatePoPayload, PoDetailedRecord, PoRecord, UpdateStandalonePoPayload, PoTyreAllocationPayload, PoPendingCount, PoTyreBatchPayload, PoTyreBatchRecord, PoTyreBatchStatusRecord } from "../models/purchaseOrder"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"

/**
 * Client for interacting with Purchase Order (PO) APIs via the Electron preload bridge.
 * This layer directly calls the IPC methods exposed by the main process.
 */
export const poClient = {
  /**
   * Fetches all purchase orders.
   */
  getPOs(): Promise<PoDetailedRecord[]> {
    return window.api.po.getPOs()
  },

  /**
   * Fetches the count of pending (open) purchase orders.
   */
  getPendingPOCount(): Promise<PoPendingCount> {
    return window.api.po.getPendingPOCount()
  },

  /**
   * Fetches a single purchase order by its ID.
   */
  getPOById(poId: number): Promise<PoDetailedRecord> {
    return window.api.po.getPOById(poId)
  },

  createPO(data: CreatePoPayload): Promise<PoRecord> {
    return window.api.po.createStandalonePO(data)
  },

  updatePO(poId: number, data: Partial<CreatePoPayload>): Promise<PoRecord> {
    return window.api.po.updateStandalonePO(poId, data)
  },

  updateStandalonePO(poId: number, data: UpdateStandalonePoPayload): Promise<PoRecord> {
    return window.api.po.updateStandalonePO(poId, data)
  },

  deletePO(poId: number): Promise<{ success: boolean }> {
    return window.api.po.deletePO(poId)
  },

  updateSupplierApproval(id: number, isApproved: boolean | null): Promise<any> {
    return window.api.po.updateSupplierApproval(id, isApproved)
  },

  updateSupplierDeliveryDate(
    id: number,
    dates: { ExpectedDeliveryDate?: string | null; ActualDeliveryDate?: string | null }
  ): Promise<any> {
    return window.api.po.updateSupplierDeliveryDate(id, dates)
  },

  updatePOStatus(poId: number, statusCode: string): Promise<any> {
    return window.api.po.updatePOStatus(poId, statusCode)
  },

  updatePoTyreStatus(poTyresId: number, statusCode: string): Promise<any> {
    return window.api.poTyres.updatePoTyreStatus(poTyresId, statusCode)
  },

  getPoTyreBatches(poTyresId: number): Promise<PoTyreBatchRecord[]> {
    return window.api.poTyres.getPoTyreBatches(poTyresId)
  },

  savePoTyreBatches(poTyresId: number, batches: PoTyreBatchPayload[]): Promise<PoTyreBatchRecord[]> {
    return window.api.poTyres.savePoTyreBatches(poTyresId, batches)
  },

  getPoTyreBatchStatusByPoId(poId: number): Promise<PoTyreBatchStatusRecord[]> {
    return window.api.poTyres.getPoTyreBatchStatusByPoId(poId)
  },

  allocateLocation(payloads: PoTyreAllocationPayload[]): Promise<any> {
    return window.api.po.allocateLocation(payloads)
  },

  getStorageLocationsByLocationType(locationTypeId: number): Promise<StorageLocationRecord[]> {
    return window.api.storageLocations.getStorageLocationsByLocationType(locationTypeId)
  },
}
