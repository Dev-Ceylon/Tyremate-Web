import type {
  DagGoodsReceiptPayload,
  DagGoodsReceiptResult,
  GoodsReceiptLineRecord,
  GoodsReceiptPayload,
  PendingDagGoodsReceiptRecord,
  PendingGoodsReceiptFilters,
  PendingGoodsReceiptRecord,
} from "../models/goodsReceipt"

/**
 * Client for Goods Receipt (GRN) APIs via the Electron preload bridge.
 * GRN posting is its own domain: it spans purchase orders but is not owned by them.
 */
export const goodsReceiptClient = {
  /**
   * Fetches posted goods receipt lines for a single purchase order.
   */
  getByPoId(poId: number): Promise<GoodsReceiptLineRecord[]> {
    return window.api.goodsReceipts.getByPOId(poId)
  },

  /**
   * Fetches supplier allocations that are approved but not fully received yet.
   */
  getPending(filters?: PendingGoodsReceiptFilters): Promise<PendingGoodsReceiptRecord[]> {
    return window.api.goodsReceipts.getPending(filters)
  },

  /**
   * Posts a goods receipt, creating the GRN header, lines and stock batches.
   */
  post(payload: GoodsReceiptPayload): Promise<GoodsReceiptLineRecord> {
    return window.api.goodsReceipts.post(payload)
  },

  /**
   * Fetches DAG stock sitting in quarantine that still needs to be received.
   */
  getPendingDag(): Promise<PendingDagGoodsReceiptRecord[]> {
    return window.api.goodsReceipts.getPendingDag()
  },

  /**
   * Posts a DAG goods receipt, moving the accepted quantity out of quarantine.
   */
  postDag(payload: DagGoodsReceiptPayload): Promise<DagGoodsReceiptResult> {
    return window.api.goodsReceipts.postDag(payload)
  },
}