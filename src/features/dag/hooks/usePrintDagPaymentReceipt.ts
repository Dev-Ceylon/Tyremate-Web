import { useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePrinterStore } from "../../../shared/state/printerStore"
import type { DagDetailedRecord, DagPaymentDetail } from "../models/dag"
import {
  downloadDAGPaymentReceipt,
  downloadDAGPaymentSummaryReceipt,
  printDAGPaymentReceipt,
  printDAGPaymentSummaryReceipt,
} from "../services/dagPaymentReceiptPrintService"

export function usePrintDagPaymentReceipt(dag: DagDetailedRecord | null) {
  const { showToast } = useToast()
  const selectedPrinter = usePrinterStore((state) => state.selectedPrinter)
  const [printingPaymentId, setPrintingPaymentId] = useState<number | null>(null)
  const [downloadingPaymentId, setDownloadingPaymentId] = useState<number | null>(null)
  const [isPrintingSummary, setIsPrintingSummary] = useState(false)
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false)
  const [isPrinterModalOpen, setPrinterModalOpen] = useState(false)

  const handlePrint = async (payment: DagPaymentDetail) => {
    if (!dag || !payment.PaymentID) return
    if (!selectedPrinter) {
      setPrinterModalOpen(true)
      return
    }

    setPrintingPaymentId(payment.PaymentID)
    try {
      await printDAGPaymentReceipt(dag, payment, selectedPrinter)
      showToast({
        variant: "success",
        title: "Payment receipt printed",
        message: `Receipt PR-${payment.PaymentID} was sent to ${selectedPrinter}.`,
      })
    } catch (err) {
      showToast({
        variant: "error",
        title: "Receipt print failed",
        message: err instanceof Error ? err.message : "Failed to print the payment receipt.",
      })
    } finally {
      setPrintingPaymentId(null)
    }
  }

  const handleDownload = async (payment: DagPaymentDetail) => {
    if (!dag || !payment.PaymentID) return
    setDownloadingPaymentId(payment.PaymentID)
    try {
      const result = await downloadDAGPaymentReceipt(dag, payment)
      if (result.canceled) {
        showToast({ variant: "info", title: "Download canceled", message: "No receipt was saved." })
        return
      }
      showToast({
        variant: "success",
        title: "Payment receipt ready",
        message: result.filePath ? `Saved to ${result.filePath}` : `Receipt PR-${payment.PaymentID} was generated.`,
      })
    } catch (err) {
      showToast({
        variant: "error",
        title: "Receipt download failed",
        message: err instanceof Error ? err.message : "Failed to download the payment receipt.",
      })
    } finally {
      setDownloadingPaymentId(null)
    }
  }

  const handlePrintSummary = async () => {
    if (!dag?.Payments?.length) return
    if (!selectedPrinter) {
      setPrinterModalOpen(true)
      return
    }

    setIsPrintingSummary(true)
    try {
      await printDAGPaymentSummaryReceipt(dag, selectedPrinter)
      showToast({
        variant: "success",
        title: "Consolidated receipt printed",
        message: `The payment summary for DAG #${dag.ID} was sent to ${selectedPrinter}.`,
      })
    } catch (err) {
      showToast({
        variant: "error",
        title: "Receipt print failed",
        message: err instanceof Error ? err.message : "Failed to print the consolidated receipt.",
      })
    } finally {
      setIsPrintingSummary(false)
    }
  }

  const handleDownloadSummary = async () => {
    if (!dag?.Payments?.length) return
    setIsDownloadingSummary(true)
    try {
      const result = await downloadDAGPaymentSummaryReceipt(dag)
      if (result.canceled) {
        showToast({ variant: "info", title: "Download canceled", message: "No receipt was saved." })
        return
      }
      showToast({
        variant: "success",
        title: "Consolidated receipt ready",
        message: result.filePath ? `Saved to ${result.filePath}` : `DAG #${dag.ID} receipt generated.`,
      })
    } catch (err) {
      showToast({
        variant: "error",
        title: "Receipt download failed",
        message: err instanceof Error ? err.message : "Failed to download the consolidated receipt.",
      })
    } finally {
      setIsDownloadingSummary(false)
    }
  }

  return {
    printingPaymentId,
    downloadingPaymentId,
    isPrintingSummary,
    isDownloadingSummary,
    isPrinterModalOpen,
    handlePrint,
    handleDownload,
    handlePrintSummary,
    handleDownloadSummary,
    closePrinterModal: () => setPrinterModalOpen(false),
  }
}
