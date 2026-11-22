import { PoGoodsReceiptModal } from "./PoGoodsReceiptModal"
import { DagGoodsReceiptModal } from "./DagGoodsReceiptModal"
import type { DagGoodsReceiptPayload, GoodsReceiptPayload, PendingDagGoodsReceiptRecord } from "../models/goodsReceipt"

type PoGoodsReceiptModalProps = {
  source?: "po"
  isOpen: boolean
  poId: number
  category?: "tyre" | "battery"
  supplierAllocationId: number | null
  supplierName: string
  tyreLabel: string
  allocationQty: number
  receivedToDate: number
  locationName: string
  isSaving: boolean
  onClose: () => void
  onPost: (payload: GoodsReceiptPayload) => Promise<void>
}

type DagGoodsReceiptModalProps = {
  source: "dag"
  isOpen: boolean
  pending: PendingDagGoodsReceiptRecord
  isSaving: boolean
  onClose: () => void
  onPost: (payload: DagGoodsReceiptPayload) => Promise<void>
}

type GoodsReceiptModalProps = PoGoodsReceiptModalProps | DagGoodsReceiptModalProps

/**
 * Source-aware goods receipt dialog. Purchase order and DAG receipts share the
 * same screen entry point but have different line shapes, so this picks the
 * right body while callers keep a single import.
 */
export function GoodsReceiptModal(props: GoodsReceiptModalProps) {
  if (props.source === "dag") {
    return (
      <DagGoodsReceiptModal
        isOpen={props.isOpen}
        pending={props.pending}
        isSaving={props.isSaving}
        onClose={props.onClose}
        onPost={props.onPost}
      />
    )
  }

  return <PoGoodsReceiptModal {...props} />
}
