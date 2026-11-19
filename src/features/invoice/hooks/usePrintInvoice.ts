import { useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePrinterStore } from "../../../shared/state/printerStore"
import { downloadInvoicePdf, printInvoice } from "../services/invoicePrintService"

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback

export function usePrintInvoice(invoiceId: number | null) {
  const { showToast } = useToast()
  const selectedPrinter = usePrinterStore((s) => s.selectedPrinter)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isPrinterModalOpen, setPrinterModalOpen] = useState(false)

  const handlePrint = async () => {
    if (!invoiceId) return

    if (!selectedPrinter) {
      setPrinterModalOpen(true)
      return
    }

    setIsPrinting(true)
    try {
      await printInvoice(invoiceId, selectedPrinter)
      showToast({
        variant: "success",
        title: "Invoice printed",
        message: `Invoice #${invoiceId} was sent to ${selectedPrinter}.`,
      })
    } catch (err: unknown) {
      showToast({
        variant: "error",
        title: "Print failed",
        message: messageOf(err, "Failed to print invoice"),
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!invoiceId) return

    setIsDownloadingPdf(true)
    try {
      const result = await downloadInvoicePdf(invoiceId)

      if (result?.canceled) {
        showToast({
          variant: "info",
          title: "PDF download canceled",
          message: "No file was saved.",
        })
        return
      }

      showToast({
        variant: "success",
        title: "Invoice PDF ready",
        message: result?.filePath ? `Saved to ${result.filePath}` : "Invoice PDF generated successfully.",
      })
    } catch (err: unknown) {
      showToast({
        variant: "error",
        title: "PDF download failed",
        message: messageOf(err, "Failed to download invoice PDF"),
      })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleClosePrinterModal = () => setPrinterModalOpen(false)

  return {
    isPrinting,
    isDownloadingPdf,
    isPrinterModalOpen,
    handlePrint,
    handleDownloadPdf,
    handleClosePrinterModal,
  }
}
