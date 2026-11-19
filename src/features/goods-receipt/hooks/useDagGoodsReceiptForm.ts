import { useCallback, useState } from "react"
import type { DagGoodsReceiptPayload, PendingDagGoodsReceiptRecord } from "../models/goodsReceipt"

type UseDagGoodsReceiptFormOptions = {
  isOpen: boolean
  pending: PendingDagGoodsReceiptRecord
  onClose: () => void
  onPost: (payload: DagGoodsReceiptPayload) => Promise<void>
}

const today = () => {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
}

export function useDagGoodsReceiptForm({ pending, onClose, onPost }: UseDagGoodsReceiptFormOptions) {
  const [receiptDate, setReceiptDate] = useState(today)
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("")
  const [dispatchedQty, setDispatchedQty] = useState(String(pending.PendingQty))
  const [receivedQty, setReceivedQty] = useState(String(pending.PendingQty))
  const [acceptedQty, setAcceptedQty] = useState(String(pending.PendingQty))
  const [damagedQty, setDamagedQty] = useState("0")
  const [discrepancyReason, setDiscrepancyReason] = useState("")
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const received = Number(receivedQty)
  const accepted = Number(acceptedQty)
  const dispatched = Number(dispatchedQty)
  const damaged = Number(damagedQty)
  const rejectedTotal = (Number.isInteger(received) ? received : 0) - (Number.isInteger(accepted) ? accepted : 0)
  const shortage = Math.max((Number.isInteger(dispatched) ? dispatched : 0) - (Number.isInteger(received) ? received : 0), 0)
  const overReceipt = Math.max((Number.isInteger(received) ? received : 0) - (Number.isInteger(dispatched) ? dispatched : 0), 0)

  const submit = useCallback(async () => {
    setValidationMessage(null)
    if (!pending.DestinationLocationId) {
      setValidationMessage("This DAG tyre has no receiving location assigned. Assign one before receiving.")
      return
    }
    if (!receiptDate) {
      setValidationMessage("Select the receipt date.")
      return
    }
    if (!Number.isInteger(received) || received <= 0) {
      setValidationMessage("Enter a positive received quantity.")
      return
    }
    if (received > pending.PendingQty) {
      setValidationMessage("Received quantity cannot exceed the quantity in quarantine.")
      return
    }
    if (!Number.isInteger(accepted) || accepted < 0 || accepted > received) {
      setValidationMessage("Accepted quantity must be between zero and the received quantity.")
      return
    }
    if (!Number.isInteger(dispatched) || dispatched < 0) {
      setValidationMessage("Dispatched quantity must be a non-negative whole number.")
      return
    }
    if (!Number.isInteger(damaged) || damaged < 0 || damaged > rejectedTotal) {
      setValidationMessage("Damaged quantity must be no greater than the rejected quantity.")
      return
    }
    if ((shortage > 0 || overReceipt > 0 || damaged > 0) && !discrepancyReason.trim()) {
      setValidationMessage("Enter a reason for shortages, over-receipts, or damaged tyres.")
      return
    }

    try {
      await onPost({
        SourceStorageManagerID: pending.SourceStorageManagerID,
        DAGID: pending.DAGID,
        ReceiptDate: receiptDate,
        DeliveryNoteNumber: deliveryNoteNumber.trim() || null,
        DispatchedQty: dispatched,
        ReceivedQty: received,
        AcceptedQty: accepted,
        DamagedQty: damaged,
        DiscrepancyReason: discrepancyReason.trim() || null,
      })
      onClose()
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "Failed to post goods receipt.")
    }
  }, [
    pending,
    receiptDate,
    received,
    accepted,
    dispatched,
    damaged,
    rejectedTotal,
    shortage,
    overReceipt,
    discrepancyReason,
    onPost,
    deliveryNoteNumber,
    onClose,
  ])

  return {
    receiptDate,
    setReceiptDate,
    deliveryNoteNumber,
    setDeliveryNoteNumber,
    dispatchedQty,
    setDispatchedQty,
    receivedQty,
    setReceivedQty,
    acceptedQty,
    setAcceptedQty,
    damagedQty,
    setDamagedQty,
    discrepancyReason,
    setDiscrepancyReason,
    validationMessage,
    acceptedTotal: accepted,
    rejectedTotal,
    shortage,
    overReceipt,
    actions: { submit },
  }
}
