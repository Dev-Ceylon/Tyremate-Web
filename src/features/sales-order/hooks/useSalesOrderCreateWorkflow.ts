import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { invoiceService } from "../../invoice/services/invoiceService"
import { salesOrderService } from "../services/salesOrderService"
import type { SalesOrderPaymentInput } from "../models/salesOrder"
import type { CreateSalesOrderWithAutoPOResult } from "../models/salesOrder"
import type { SalesOrderLineForm } from "./useSalesOrderForm"
import type { SoDeliveryRecord } from "../models/delivery"

type SubmitOrder = (payment?: SalesOrderPaymentInput) => Promise<CreateSalesOrderWithAutoPOResult | null>

function formatMoney(value: number) {
  return `LKR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function useSalesOrderCreateWorkflow({
  lines,
  totalAmount,
  submitOrder,
}: {
  lines: SalesOrderLineForm[]
  totalAmount: number
  submitOrder: SubmitOrder
}) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isPaymentTypeModalOpen, setIsPaymentTypeModalOpen] = useState(false)
  const [pendingGatePass, setPendingGatePass] = useState<{
    soId: number
    deliveryId: number
    invoiceId: number
    paymentRecorded: boolean
    eligibility: NonNullable<SoDeliveryRecord["GatePass"]>
  } | null>(null)
  const [isIssuingOverride, setIsIssuingOverride] = useState(false)

  const takingAmount = useMemo(
    () => lines.reduce((sum, line) => sum + line.Price * line.TakeNowQty * (1 - line.Discount / 100), 0),
    [lines],
  )
  const roundedTakingAmount = Math.round((takingAmount + Number.EPSILON) * 100) / 100
  const roundedTotalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100
  const hasTakingNow = lines.some((line) => line.TakeNowQty > 0)
  const paymentTargetAmount = hasTakingNow ? roundedTakingAmount : roundedTotalAmount

  const handleCreatedOrder = useCallback((soId: number, invoiceId?: number, paymentRecorded = false) => {
    showToast({
      variant: "success",
      title: invoiceId
        ? "Invoice created"
        : paymentRecorded
          ? "Sales order & advance payment recorded"
          : "Sales order created",
      message: invoiceId
        ? paymentRecorded
          ? "The taken tyres were invoiced and the payment was recorded. Print or download its customer receipt from the payment card."
          : "The taken tyres were invoiced."
        : paymentRecorded
          ? "The sales order was saved and advance payment was recorded. Customer receipt is available in the order details."
          : "The sales order was saved successfully.",
    })
    navigate(`/sales-orders/${soId}`)
  }, [navigate, showToast])

  const createOrderAndInvoice = useCallback(async (payment?: SalesOrderPaymentInput): Promise<boolean> => {
    const result = await submitOrder(!hasTakingNow ? payment : undefined)
    if (!result) return false
    if (!hasTakingNow) {
      handleCreatedOrder(result.so.SoID, undefined, Boolean(payment))
      return true
    }

    try {
      if (!result.delivery?.ID) throw new Error("The initial tyre hand-over was not recorded.")
      const invoice = await invoiceService.generateFromDelivery(result.delivery.ID)
      if (payment) {
        await invoiceService.recordPayment(invoice.InvoiceID, { Payment: payment })
      }

      let delivery: SoDeliveryRecord | undefined
      try {
        const deliveries = await salesOrderService.getDeliveries(result.so.SoID)
        delivery = deliveries.find((row) => row.ID === result.delivery?.ID)
      } catch (refreshErr) {
        console.error("Failed to read gate pass state after payment", refreshErr)
      }
      if (delivery?.GatePass && !delivery.GatePass.Issued && !delivery.GatePass.CanIssue) {
        setPendingGatePass({
          soId: result.so.SoID,
          deliveryId: result.delivery.ID,
          invoiceId: invoice.InvoiceID,
          paymentRecorded: Boolean(payment),
          eligibility: delivery.GatePass,
        })
        return true
      }
      handleCreatedOrder(result.so.SoID, invoice.InvoiceID, Boolean(payment))
    } catch (err) {
      showToast({
        variant: "error",
        title: "Sales order created, invoice/payment needs attention",
        message: err instanceof Error ? err.message : "Failed to invoice or pay for the taken tyres.",
      })
      setIsPaymentTypeModalOpen(false)
      navigate(`/sales-orders/${result.so.SoID}`)
    }
    return true
  }, [handleCreatedOrder, hasTakingNow, navigate, showToast, submitOrder])

  const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (hasTakingNow) {
      if (roundedTakingAmount > 0) setIsPaymentTypeModalOpen(true)
      else void createOrderAndInvoice()
    } else {
      void createOrderAndInvoice()
    }
  }, [createOrderAndInvoice, hasTakingNow, roundedTakingAmount])

  const handleOpenAdvancePaymentModal = useCallback(() => {
    setIsPaymentTypeModalOpen(true)
  }, [])

  const handleModalConfirm = useCallback(async (payment: SalesOrderPaymentInput) => {
    const created = await createOrderAndInvoice(payment)
    if (created) setIsPaymentTypeModalOpen(false)
  }, [createOrderAndInvoice])

  const handleSkipPayment = useCallback(async () => {
    const created = await createOrderAndInvoice()
    if (created) setIsPaymentTypeModalOpen(false)
  }, [createOrderAndInvoice])

  const finishWithGatePassWithheld = useCallback(() => {
    if (!pendingGatePass) return
    const pending = pendingGatePass
    setPendingGatePass(null)
    showToast({
      variant: "info",
      title: "Gate pass withheld",
      message: `${formatMoney(pending.eligibility.Shortfall)} remains unpaid. The pass can be issued after settled payments cover the delivery.`,
    })
    handleCreatedOrder(pending.soId, pending.invoiceId, pending.paymentRecorded)
  }, [handleCreatedOrder, pendingGatePass, showToast])

  const handleIssueGatePassOverride = useCallback(async () => {
    if (!pendingGatePass) return
    setIsIssuingOverride(true)
    try {
      const issued = await salesOrderService.issueDeliveryGatePass(
        pendingGatePass.soId,
        pendingGatePass.deliveryId,
        true,
      )
      setPendingGatePass(null)
      showToast({
        variant: "success",
        title: issued.GatePassPaymentOverride ? "Gate pass issued with payment override" : "Gate pass issued",
        message: issued.GatePassPaymentOverride
          ? `${issued.GatePassNo || "Gate pass"} was issued with ${formatMoney(issued.GatePassPaymentOverrideShortfall ?? 0)} unpaid. This action was recorded for monitoring.`
          : `${issued.GatePassNo || "Gate pass"} was issued. The payment balance was covered before the pass was created.`,
      })
      navigate(`/sales-orders/${pendingGatePass.soId}`)
    } catch (err) {
      showToast({
        variant: "error",
        title: "Could not issue gate pass",
        message: err instanceof Error ? err.message : "Failed to issue the gate pass override.",
      })
    } finally {
      setIsIssuingOverride(false)
    }
  }, [navigate, pendingGatePass, showToast])

  return {
    takingAmount,
    roundedTakingAmount,
    roundedTotalAmount,
    paymentTargetAmount,
    hasTakingNow,
    isPaymentTypeModalOpen,
    setIsPaymentTypeModalOpen,
    pendingGatePass,
    isIssuingOverride,
    handleFormSubmit,
    handleOpenAdvancePaymentModal,
    handleModalConfirm,
    handleSkipPayment,
    finishWithGatePassWithheld,
    handleIssueGatePassOverride,
  }
}
