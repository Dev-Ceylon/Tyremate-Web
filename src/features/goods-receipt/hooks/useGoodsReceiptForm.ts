import { useCallback, useEffect, useState } from "react"
import type { GoodsReceiptBatchPayload, GoodsReceiptPayload } from "../models/goodsReceipt"

type BatchDraft = {
  key: number
  DOT: string
  ReceivedQty: string
  AcceptedQty: string
}

type UseGoodsReceiptFormOptions = {
  isOpen: boolean
  poId: number
  supplierAllocationId: number | null
  allocationQty: number
  receivedToDate: number
  locationName: string
  onClose: () => void
  onPost: (payload: GoodsReceiptPayload) => Promise<void>
}

const today = () => {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
}

const emptyBatch = (key: number): BatchDraft => ({
  key,
  DOT: "",
  ReceivedQty: "",
  AcceptedQty: "",
})

export function useGoodsReceiptForm({
  isOpen,
  poId,
  supplierAllocationId,
  allocationQty,
  receivedToDate,
  locationName,
  onClose,
  onPost,
}: UseGoodsReceiptFormOptions) {
  const [receiptDate, setReceiptDate] = useState(today)
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("")
  const [dispatchedQty, setDispatchedQty] = useState("")
  const [damagedQty, setDamagedQty] = useState("0")
  const [discrepancyReason, setDiscrepancyReason] = useState("")
  const [batches, setBatches] = useState<BatchDraft[]>([emptyBatch(1)])
  const [nextBatchKey, setNextBatchKey] = useState(2)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setReceiptDate(today())
    setDeliveryNoteNumber("")
    setDispatchedQty(String(Math.max(allocationQty - receivedToDate, 0)))
    setDamagedQty("0")
    setDiscrepancyReason("")
    setBatches([emptyBatch(1)])
    setNextBatchKey(2)
    setValidationMessage(null)
  }, [isOpen, supplierAllocationId, allocationQty, receivedToDate])

  const receivedTotal = batches.reduce((total, batch) => total + (Number(batch.ReceivedQty) || 0), 0)
  const acceptedTotal = batches.reduce((total, batch) => total + (Number(batch.AcceptedQty) || 0), 0)
  const shortage = Math.max((Number(dispatchedQty) || 0) - receivedTotal, 0)
  const overReceipt = Math.max(receivedTotal - (Number(dispatchedQty) || 0), 0)
  const rejectedTotal = receivedTotal - acceptedTotal

  const updateBatch = useCallback((key: number, patch: Partial<BatchDraft>) => {
    setBatches((current) => current.map((batch) => batch.key === key ? { ...batch, ...patch } : batch))
  }, [])

  const addBatch = useCallback(() => {
    setBatches((current) => [...current, emptyBatch(nextBatchKey)])
    setNextBatchKey((current) => current + 1)
  }, [nextBatchKey])

  const removeBatch = useCallback((key: number) => {
    setBatches((current) => current.filter((batch) => batch.key !== key))
  }, [])

  const submit = useCallback(async () => {
    setValidationMessage(null)
    if (!supplierAllocationId) return
    if (!locationName) {
      setValidationMessage("Allocate a storage location to this tyre line before posting a receipt.")
      return
    }
    if (!receiptDate) {
      setValidationMessage("Select the receipt date.")
      return
    }
    if (batches.length === 0 || batches.some((batch) => !Number.isInteger(Number(batch.ReceivedQty)) || Number(batch.ReceivedQty) <= 0)) {
      setValidationMessage("Enter a positive received quantity for each batch.")
      return
    }
    if (batches.some((batch) => !Number.isInteger(Number(batch.AcceptedQty)) || Number(batch.AcceptedQty) < 0 || Number(batch.AcceptedQty) > Number(batch.ReceivedQty))) {
      setValidationMessage("Accepted batch quantities must be between zero and each batch's received quantity.")
      return
    }
    if (!Number.isInteger(Number(dispatchedQty)) || Number(dispatchedQty) < 0) {
      setValidationMessage("Dispatched quantity must be a non-negative whole number.")
      return
    }
    if (!Number.isInteger(Number(damagedQty)) || Number(damagedQty) < 0 || Number(damagedQty) > rejectedTotal) {
      setValidationMessage("Damaged quantity must be no greater than the rejected quantity.")
      return
    }
    if ((shortage > 0 || overReceipt > 0 || Number(damagedQty) > 0) && !discrepancyReason.trim()) {
      setValidationMessage("Enter a reason for shortages, over-receipts, or damaged tyres.")
      return
    }

    try {
      const receiptBatches: GoodsReceiptBatchPayload[] = batches.map(({ DOT, ReceivedQty, AcceptedQty }) => ({
        DOT: DOT.trim() || null,
        ReceivedQty: Number(ReceivedQty),
        AcceptedQty: Number(AcceptedQty),
      }))
      await onPost({
        POID: poId,
        PoTyresSupplierID: supplierAllocationId,
        ReceiptDate: receiptDate,
        DeliveryNoteNumber: deliveryNoteNumber.trim() || null,
        DispatchedQty: Number(dispatchedQty),
        DamagedQty: Number(damagedQty),
        DiscrepancyReason: discrepancyReason.trim() || null,
        Batches: receiptBatches,
      })
      onClose()
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "Failed to post goods receipt.")
    }
  }, [
    supplierAllocationId,
    locationName,
    receiptDate,
    batches,
    dispatchedQty,
    damagedQty,
    rejectedTotal,
    shortage,
    overReceipt,
    discrepancyReason,
    onPost,
    poId,
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
    damagedQty,
    setDamagedQty,
    discrepancyReason,
    setDiscrepancyReason,
    batches,
    validationMessage,
    receivedTotal,
    acceptedTotal,
    shortage,
    overReceipt,
    actions: {
      updateBatch,
      addBatch,
      removeBatch,
      submit,
    },
  }
}
