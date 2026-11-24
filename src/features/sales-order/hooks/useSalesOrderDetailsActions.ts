import { useCallback, useState } from "react"
import type { SalesOrderPaymentPayload } from "../models/payment"
import type { SoDetailedRecord, SoTyreRecord, ReturnAllocationItem } from "../models/salesOrder"
import type { SoDeliveryRecord } from "../models/delivery"
import { PAYMENT_TYPE_CODES } from "../../../shared/payment/constants/paymentTypeConstants"
import { useConfirm } from "../../../shared/ui/confirm/ConfirmProvider"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { useSalesOrderPaymentForm } from "./useSalesOrderPaymentForm"
import { salesOrderService } from "../services/salesOrderService"
import { salesReturnService } from "../../sales-return/services/salesReturnService"

type Options = {
  order: SoDetailedRecord | null
  deliveries?: SoDeliveryRecord[]
  makePayment: (payment: SalesOrderPaymentPayload) => Promise<boolean>
  completeChequePayment: (paymentId: number) => Promise<boolean>
  refreshOrder: () => Promise<void>
  refreshDeliveries: () => Promise<void>
  refreshDeliveryInvoices?: () => Promise<void>
}

export function useSalesOrderDetailsActions({
  order,
  deliveries = [],
  makePayment,
  completeChequePayment,
  refreshOrder,
  refreshDeliveries,
  refreshDeliveryInvoices,
}: Options) {
  const confirm = useConfirm()
  const { showToast } = useToast()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [tyreToReturn, setTyreToReturn] = useState<SoTyreRecord | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [issuingGatePassId, setIssuingGatePassId] = useState<number | null>(null)

  const netTotal = (order?.TotalSale ?? 0) - (order?.TotalDiscount ?? 0)
  const paymentAmount = order
    ? (order.RemainingAmount ?? (order.TotalSale ?? 0) - (order.TotalDiscount ?? 0))
    : 0
  const paymentForm = useSalesOrderPaymentForm({ totalAmount: paymentAmount })

  const hasChequePayment = order?.Payments?.some(
    (payment) => payment.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE,
  ) ?? false
  const showMakePaymentButton = order?.IsPaymentCompleted !== 1 && !hasChequePayment
  const showCompleteSalesOrderButton = Boolean(
    order &&
      (order.PO?.IsPOArrived ?? true) &&
      order.IsPaymentCompleted === 1 &&
      order.IsCompleted !== 1,
  )

  const handleMakePayment = useCallback(async (payload: SalesOrderPaymentPayload) => {
    setIsSubmittingPayment(true)
    try {
      const isAdvance = (deliveries?.length ?? 0) === 0
      if (await makePayment({ ...payload, IsAdvance: isAdvance })) {
        setIsPaymentModalOpen(false)
        showToast({
          variant: "success",
          title: "Payment recorded",
          message: "Print or download the customer receipt from this payment's card below.",
        })
        // Settling a payment can release a withheld gate pass and settle invoices,
        // so refresh the delivery rows and invoices to show the new state immediately.
        await Promise.all([refreshDeliveries(), refreshDeliveryInvoices?.()])
      }
    } finally {
      setIsSubmittingPayment(false)
    }
  }, [makePayment, refreshDeliveries, refreshDeliveryInvoices, showToast])

  const handleOpenReturnModal = useCallback(async (tyre: SoTyreRecord) => {
    if (!order?.SoID) return
    try {
      const alreadyReturned = Number(tyre.returnedQty) || 0
      const maxQty = Math.max(0, (Number(tyre.Qty) || 0) - alreadyReturned)
      if (maxQty <= 0) {
        showToast({
          variant: "info",
          title: "Nothing to return",
          message: "This line has no returnable quantity left.",
        })
        return
      }
      setTyreToReturn({ ...tyre, maxReturnQty: maxQty } as SoTyreRecord & { maxReturnQty?: number })
      setIsReturnModalOpen(true)
    } catch (err) {
      showToast({
        variant: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to check returnable quantity",
      })
    }
  }, [order?.SoID, showToast])

  const handleCloseReturnModal = useCallback(() => {
    setIsReturnModalOpen(false)
    setTyreToReturn(null)
  }, [])

  const handleConfirmReturn = useCallback(async (items: ReturnAllocationItem[], reason?: string, returnType = "UNUSED") => {
    if (!order || !tyreToReturn) return

    const confirmed = await confirm({
      title: "Confirm Return",
      message: `Receive ${items.reduce((sum, i) => sum + i.returnQty, 0)} tyre(s) from ${tyreToReturn.Brand} / ${tyreToReturn.Size} - ${tyreToReturn.Pattern} into quarantine for inspection?`,
      confirmLabel: "Receive into Quarantine",
      danger: false,
    })

    if (!confirmed) return

    setIsSubmittingPayment(true)
    try {
      const created = await salesReturnService.createRequest({
        soId: order.SoID,
        returnType,
        notes: reason,
        lines: items.map((item) => ({
          soTyreId: tyreToReturn.ID,
          returnedQty: item.returnQty,
          unitPrice: tyreToReturn.Price,
          discount: tyreToReturn.Discount,
          returnReason: reason,
          allocationId: item.allocationId,
          storageManagerId: item.storageManagerId,
          storageManagerBatchId: item.storageManagerBatchId,
          serialNo: null,
        })),
      })
      if (!created?.SalesReturnID) throw new Error("Return request was not created")
      setIsReturnModalOpen(false)
      await refreshOrder()
      showToast({
        variant: "success",
        title: "Return received into quarantine",
        message: `${created.ReturnNo} is awaiting inspection. No saleable stock was increased.`,
      })
    } catch (err) {
      showToast({
        variant: "error",
        title: "Return could not be recorded",
        message: err instanceof Error ? err.message : "Failed to create sales return",
      })
    } finally {
      setIsSubmittingPayment(false)
      setTyreToReturn(null)
    }
  }, [order, tyreToReturn, confirm, showToast, refreshOrder])

  const handleCompleteCheque = useCallback(async (paymentId?: number) => {
    if (!paymentId) return
    const confirmed = await confirm({
      title: "Mark Cheque as Collected",
      message: "Are you sure you want to mark this cheque as collected?",
      confirmLabel: "Mark Collected",
    })
    if (!confirmed) return

    // A collected cheque becomes settled money, so it can release a pass and settle invoices.
    const completed = await completeChequePayment(paymentId)
    if (completed) {
      await Promise.all([refreshDeliveries(), refreshDeliveryInvoices?.()])
    }
  }, [completeChequePayment, confirm, refreshDeliveries, refreshDeliveryInvoices])

  const handleIssueGatePass = useCallback(async (deliveryId: number) => {
    if (!order?.SoID) return
    setIssuingGatePassId(deliveryId)
    try {
      const delivery = await salesOrderService.issueDeliveryGatePass(order.SoID, deliveryId)
      await refreshDeliveries()
      showToast({
        variant: "success",
        title: "SO Gate Pass issued",
        message: `${delivery.GatePassNo} was issued for Delivery #${deliveryId}.`,
      })
    } catch (err) {
      showToast({
        variant: "error",
        title: "Could not issue gate pass",
        message: err instanceof Error ? err.message : "Failed to issue the delivery gate pass.",
      })
    } finally {
      setIssuingGatePassId(null)
    }
  }, [order?.SoID, refreshDeliveries, showToast])

  return {
    netTotal,
    showMakePaymentButton,
    showCompleteSalesOrderButton,
    paymentForm,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isReturnModalOpen,
    tyreToReturn,
    isSubmittingPayment,
    issuingGatePassId,
    handleMakePayment,
    handleOpenReturnModal,
    handleCloseReturnModal,
    handleConfirmReturn,
    handleCompleteCheque,
    handleIssueGatePass,
  }
}
