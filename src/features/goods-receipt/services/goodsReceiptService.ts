import { goodsReceiptClient } from "./goodsReceiptClient"
import type {
  DagGoodsReceiptPayload,
  DagGoodsReceiptResult,
  GoodsReceiptLineRecord,
  GoodsReceiptPayload,
  PendingDagGoodsReceiptRecord,
  PendingGoodsReceiptFilters,
  PendingGoodsReceiptRecord,
} from "../models/goodsReceipt"

export const goodsReceiptService = {
  async getGoodsReceiptsByPoId(poId: number): Promise<GoodsReceiptLineRecord[]> {
    return goodsReceiptClient.getByPoId(poId)
  },

  async getPendingGoodsReceipts(filters?: PendingGoodsReceiptFilters): Promise<PendingGoodsReceiptRecord[]> {
    return goodsReceiptClient.getPending(filters)
  },

  async postGoodsReceipt(payload: GoodsReceiptPayload): Promise<GoodsReceiptLineRecord> {
    return goodsReceiptClient.post(payload)
  },

  async getPendingDagGoodsReceipts(): Promise<PendingDagGoodsReceiptRecord[]> {
    return goodsReceiptClient.getPendingDag()
  },

  async postDagGoodsReceipt(payload: DagGoodsReceiptPayload): Promise<DagGoodsReceiptResult> {
    return goodsReceiptClient.postDag(payload)
  },
}