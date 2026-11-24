import type {
  CreatePoPayload,
  PoDetailedRecord,
  PoRecord,
  UpdateStandalonePoPayload,
  PoTyreAllocationPayload,
  PoTyreBatchPayload,
  PoTyreBatchRecord,
  PoTyreBatchStatusRecord,
  PoPendingCount,
} from "../models/purchaseOrder"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"
import { poClient } from "./poClient"

/**
 * Service layer for Purchase Order (PO) operations.
 * This layer provides a clean, async API for UI components and hooks to interact with PO data,
 * abstracting away the direct IPC calls made by the poClient.
 */
export const purchaseOrderService = {
  /**
   * Retrieves a list of all purchase orders, optionally filtered by category.
   */
  async getPurchaseOrders(category?: string): Promise<PoDetailedRecord[]> {
    return poClient.getPOs(category)
  },

  /**
   * Retrieves the count of pending (open) purchase orders, optionally filtered by category.
   */
  async getPendingPOCount(category?: string): Promise<PoPendingCount> {
    return poClient.getPendingPOCount(category)
  },

  /**
   * Retrieves a single purchase order by its ID.
   */
  async getPurchaseOrderById(poId: number): Promise<PoDetailedRecord> {
    return poClient.getPOById(poId)
  },

  /**
   * Creates a new purchase order.
   */
  async createPurchaseOrder(payload: CreatePoPayload): Promise<PoRecord> {
    return poClient.createPO(payload)
  },

  async updatePurchaseOrder(poId: number, payload: Partial<CreatePoPayload>): Promise<PoRecord> {
    return poClient.updatePO(poId, payload)
  },

  async updateStandalonePO(poId: number, payload: UpdateStandalonePoPayload): Promise<PoRecord> {
    return poClient.updateStandalonePO(poId, payload)
  },

  async deletePurchaseOrder(poId: number): Promise<{ success: boolean }> {
    return poClient.deletePO(poId)
  },

  /**
   * Updates the approval status of a specific supplier allocation.
   */
  async updateSupplierApproval(allocationId: number, isApproved: boolean | null): Promise<any> {
    return poClient.updateSupplierApproval(allocationId, isApproved)
  },

  async updateSupplierDeliveryDate(
    allocationId: number,
    dates: { ExpectedDeliveryDate?: string | null; ActualDeliveryDate?: string | null }
  ): Promise<any> {
    return poClient.updateSupplierDeliveryDate(allocationId, dates)
  },

  /**
   * Updates the overall status of a purchase order.
   */
  async updatePurchaseOrderStatus(poId: number, statusCode: string): Promise<any> {
    return poClient.updatePOStatus(poId, statusCode)
  },

  async updatePoTyreStatus(poTyresId: number, statusCode: string): Promise<any> {
    return poClient.updatePoTyreStatus(poTyresId, statusCode)
  },

  async getPoTyreBatches(poTyresId: number): Promise<PoTyreBatchRecord[]> {
    return poClient.getPoTyreBatches(poTyresId)
  },

  async savePoTyreBatches(poTyresId: number, batches: PoTyreBatchPayload[]): Promise<PoTyreBatchRecord[]> {
    return poClient.savePoTyreBatches(poTyresId, batches)
  },

  async getPoTyreBatchStatusByPoId(poId: number): Promise<PoTyreBatchStatusRecord[]> {
    return poClient.getPoTyreBatchStatusByPoId(poId)
  },

  /**
   * Allocates locations for multiple tyres in a purchase order.
   */
  async allocateLocations(payloads: PoTyreAllocationPayload[]): Promise<any> {
    return poClient.allocateLocation(payloads)
  },

  /**
   * Retrieves storage locations filtered by location type.
   */
  async getStorageLocationsByLocationType(locationTypeId: number): Promise<StorageLocationRecord[]> {
    return poClient.getStorageLocationsByLocationType(locationTypeId)
  },
}
