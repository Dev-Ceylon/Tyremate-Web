import { useCallback, useState } from "react"
import { useNavigate, useParams } from "@/lib/router"
import { useInvoiceDetails } from "./useInvoiceDetails"
import { usePrintInvoice } from "./usePrintInvoice"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { useInvoicePaymentForm } from "./useInvoicePaymentForm"
import { useReceiptViewer } from "../../sales-order/hooks/useReceiptViewer"

const fmt = (n: number) => (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })

const SOURCE_LABELS: Record<string, string> = {
  so: "Sales Order",
  other_service: "Other Service",
  direct: "Direct",
  delivery: "Delivery",
  dag: "DAG Retreading",
}

export function useInvoiceDetailsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const params = useParams()
  const invoiceId = params.invoiceId ? Number(params.invoiceId) : null

  const { record, loading, error, submitting, cancelInvoice, createCreditNote, recordPayment, refresh } =
    useInvoiceDetails(invoiceId)

  const {
    isPrinting,
    isDownloadingPdf,
    isPrinterModalOpen,
    handlePrint,
    handleDownloadPdf,
    handleClosePrinterModal,
  } = usePrintInvoice(invoiceId)

  const [isCreditNoteOpen, setCreditNoteOpen] = useState(false)
  const [isCancelOpen, setCancelOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPaying, setIsPaying] = useState(false)

  const balanceDue = record ? record.BalanceDue ?? 0 : 0
  const paymentForm = useInvoicePaymentForm({ totalAmount: balanceDue })

  const invoicePayments = (record?.Payments ?? []) as Array<Record<string, unknown>>
  const receiptViewer = useReceiptViewer({ payments: invoicePayments as never, onReceiptsChanged: () => void refresh() })

  const sourceLabel = record ? SOURCE_LABELS[record.SourceType] || record.SourceType : ""
  const sourceText = record && record.SourceID !== null ? `${sourceLabel} #${record.SourceID}` : sourceLabel
  const isCancelled = record?.Status === "can"
  const isCreditNote = record?.IsCreditNote === 1
  const canCreditNote = record ? !isCreditNote && !isCancelled : false
  const canRecordPayment = record ? (record.BalanceDue ?? 0) > 0 && !isCancelled && !isCreditNote : false

  const handleCreditNote = useCallback(
    async (data: Parameters<typeof createCreditNote>[0]) => {
      if (!record) return
      try {
        await createCreditNote(data)
        setCreditNoteOpen(false)
        showToast({ variant: "success", title: "Credit note issued", message: `For ${record.InvoiceNumber}.` })
      } catch (err) {
        showToast({
          variant: "error",
          title: "Credit note failed",
          message: err instanceof Error ? err.message : "Failed to issue credit note",
        })
      }
    },
    [createCreditNote, record, showToast],
  )

  const handleCancel = useCallback(
    async (data: Parameters<typeof cancelInvoice>[0]) => {
      if (!record) return
      try {
        await cancelInvoice(data)
        setCancelOpen(false)
        showToast({ variant: "success", title: "Invoice cancelled", message: `${record.InvoiceNumber} has been cancelled.` })
      } catch (err) {
        showToast({
          variant: "error",
          title: "Cancel failed",
          message: err instanceof Error ? err.message : "Failed to cancel invoice",
        })
      }
    },
    [cancelInvoice, record, showToast],
  )

  const handleBack = useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) {
      navigate(-1)
    } else {
      navigate("/invoices")
    }
  }, [navigate])

  const handleRecordPayment = useCallback(
    async (payload: { Payment: unknown }) => {
      if (!record) return
      setIsPaying(true)
      try {
        await recordPayment(payload)
        setIsPaymentModalOpen(false)
        showToast({ variant: "success", title: "Payment recorded", message: `${record.InvoiceNumber} has been updated.` })
      } catch (err) {
        showToast({
          variant: "error",
          title: "Payment failed",
          message: err instanceof Error ? err.message : "Failed to record payment",
        })
      } finally {
        setIsPaying(false)
      }
    },
    [record, recordPayment, showToast],
  )

  const openPaymentModal = useCallback(() => setIsPaymentModalOpen(true), [])
  const closePaymentModal = useCallback(() => setIsPaymentModalOpen(false), [])
  const openCreditNote = useCallback(() => setCreditNoteOpen(true), [])
  const closeCreditNote = useCallback(() => setCreditNoteOpen(false), [])
  const openCancel = useCallback(() => setCancelOpen(true), [])
  const closeCancel = useCallback(() => setCancelOpen(false), [])

  return {
    record,
    loading,
    error,
    submitting,
    isPrinting,
    isDownloadingPdf,
    isPrinterModalOpen,
    handlePrint,
    handleDownloadPdf,
    handleClosePrinterModal,
    isCreditNoteOpen,
    isCancelOpen,
    isPaymentModalOpen,
    isPaying,
    paymentForm,
    invoicePayments,
    receiptViewer,
    sourceText,
    isCancelled,
    isCreditNote,
    canCreditNote,
    canRecordPayment,
    handleCreditNote,
    handleCancel,
    handleBack,
    handleRecordPayment,
    openPaymentModal,
    closePaymentModal,
    openCreditNote,
    closeCreditNote,
    openCancel,
    closeCancel,
    fmt,
  }
}

export { SOURCE_LABELS }
