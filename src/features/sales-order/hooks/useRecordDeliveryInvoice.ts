import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "@/lib/router"
import { INVOICE_STATUS_CODES, type InvoiceDetailedRecord, type InvoiceRecord } from "../../invoice/models/invoice"
import { invoiceService } from "../../invoice/services/invoiceService"
import { useInvoicePaymentForm } from "../../invoice/hooks/useInvoicePaymentForm"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import type { RecordSoDeliveryPayload, SoDeliveryRecord } from "../models/delivery"

type UseRecordDeliveryInvoiceOptions = {
  salesOrderId: number | null
  recordDelivery: (payload: RecordSoDeliveryPayload) => Promise<SoDeliveryRecord>
  refresh: () => Promise<void>
  deliveries: SoDeliveryRecord[]
  onDeliveryRecorded?: () => void
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function useRecordDeliveryInvoice({
  salesOrderId,
  recordDelivery,
  refresh,
  deliveries,
  onDeliveryRecorded,
}: UseRecordDeliveryInvoiceOptions) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isRecordingDelivery, setIsRecordingDelivery] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [preparingPaymentDeliveryId, setPreparingPaymentDeliveryId] = useState<number | null>(null)
  const [deliveryInvoices, setDeliveryInvoices] = useState<Map<number, InvoiceRecord>>(new Map())
  const [invoice, setInvoice] = useState<InvoiceDetailedRecord | null>(null)
  const paymentForm = useInvoicePaymentForm({ totalAmount: invoice?.BalanceDue ?? 0 })

  const refreshDeliveryInvoices = useCallback(async () => {
    const deliveryIds = new Set(deliveries.map((delivery) => delivery.ID))
    if (deliveryIds.size === 0) {
      setDeliveryInvoices(new Map())
      return
    }

    try {
      const invoices = await invoiceService.getAll()
      const invoicesByDelivery = new Map<number, InvoiceRecord>()
      invoices.forEach((row) => {
        if (
          row.SourceType === "delivery" &&
          row.SourceID !== null &&
          deliveryIds.has(row.SourceID) &&
          !invoicesByDelivery.has(row.SourceID)
        ) {
          invoicesByDelivery.set(row.SourceID, row)
        }
      })
      setDeliveryInvoices(invoicesByDelivery)
    } catch {
      setDeliveryInvoices(new Map())
    }
  }, [deliveries])

  useEffect(() => {
    void refreshDeliveryInvoices()
  }, [refreshDeliveryInvoices])

  const handleRecordDelivery = useCallback(async (payload: RecordSoDeliveryPayload) => {
    setIsRecordingDelivery(true)
    let deliveryWasRecorded = false
    try {
      const delivery = await recordDelivery(payload)
      deliveryWasRecorded = true
      onDeliveryRecorded?.()

      // The delivery is always recorded; the gate pass is not, until the
      // hand-over is covered by settled payments.
      if (delivery.GatePass && !delivery.GatePass.Issued && !delivery.GatePass.CanIssue) {
        showToast({
          variant: "info",
          title: "Gate pass withheld",
          message: `Delivery recorded, but LKR ${formatMoney(delivery.GatePass.Shortfall)} is still unpaid. The gate pass will be issued once the payment settles.`,
        })
      }

      const createdInvoice = await invoiceService.generateFromDelivery(delivery.ID)
      await refresh()
      setInvoice(createdInvoice)
      if (createdInvoice.BalanceDue > 0) {
        setIsPaymentModalOpen(true)
      } else {
        if (createdInvoice.AmountPaid > 0) {
          showToast({
            variant: "success",
            title: "Delivery recorded & invoice settled",
            message: `${createdInvoice.InvoiceNumber} was fully covered by the sales order advance deposit.`,
          })
        }
        navigate(`/invoices/${createdInvoice.InvoiceID}`)
      }
    } catch (err) {
      showToast({
        variant: "error",
        title: deliveryWasRecorded ? "Delivery recorded, invoice creation failed" : "Delivery failed",
        message: err instanceof Error ? err.message : "Failed to record the delivery and create its invoice.",
      })
    } finally {
      setIsRecordingDelivery(false)
    }
  }, [navigate, onDeliveryRecorded, recordDelivery, refresh, showToast])

  const handlePayment = useCallback(async (payload: { Payment: unknown }) => {
    if (!invoice) return
    setIsPaying(true)
    try {
      await invoiceService.recordPayment(invoice.InvoiceID, payload)
      setIsPaymentModalOpen(false)
      showToast({
        variant: "success",
        title: "Invoice payment recorded",
        message: `${invoice.InvoiceNumber} has been updated. The customer receipt is available on this payment in the Sales Order details.`,
      })
      navigate(`/invoices/${invoice.InvoiceID}`)
    } catch (err) {
      showToast({
        variant: "error",
        title: "Payment failed",
        message: err instanceof Error ? err.message : "Failed to record invoice payment.",
      })
    } finally {
      setIsPaying(false)
    }
  }, [invoice, navigate, showToast])

  const openDeliveryPayment = useCallback(async (deliveryId: number) => {
    setPreparingPaymentDeliveryId(deliveryId)
    try {
      const existingInvoice = await invoiceService.generateFromDelivery(deliveryId)
      if (existingInvoice.Status === INVOICE_STATUS_CODES.CANCELLED) {
        showToast({
          variant: "error",
          title: "Invoice cancelled",
          message: `${existingInvoice.InvoiceNumber} cannot accept payments.`,
        })
        return
      }

      if (existingInvoice.BalanceDue <= 0) {
        navigate(`/invoices/${existingInvoice.InvoiceID}`)
        return
      }

      setInvoice(existingInvoice)
      setIsPaymentModalOpen(true)
    } catch (err) {
      showToast({
        variant: "error",
        title: "Unable to load delivery invoice",
        message: err instanceof Error ? err.message : "Failed to load the invoice for this delivery.",
      })
    } finally {
      setPreparingPaymentDeliveryId(null)
    }
  }, [navigate, showToast])

  const handleClosePayment = useCallback(() => {
    setIsPaymentModalOpen(false)
    if (salesOrderId) navigate(`/sales-orders/${salesOrderId}`)
  }, [navigate, salesOrderId])

  return {
    isRecordingDelivery,
    isPaymentModalOpen,
    isPaying,
    preparingPaymentDeliveryId,
    deliveryInvoices,
    refreshDeliveryInvoices,
    paymentForm,
    handleRecordDelivery,
    handlePayment,
    handleClosePayment,
    openDeliveryPayment,
  }
}
