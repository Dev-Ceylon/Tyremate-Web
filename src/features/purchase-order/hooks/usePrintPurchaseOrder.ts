import { useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePrinterStore } from "../../../shared/state/printerStore"
import { downloadPurchaseOrderPdf, printPurchaseOrder } from "../services/purchaseOrderPrintService"

export function usePrintPurchaseOrder(poId: number | null) {
  const { showToast } = useToast()
  const selectedPrinter = usePrinterStore((s) => s.selectedPrinter)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isPrinterModalOpen, setPrinterModalOpen] = useState(false)

  const handlePrint = async () => {
    if (!poId) return

    if (!selectedPrinter) {
      setPrinterModalOpen(true)
      return
    }

    setIsPrinting(true)
    try {
      await printPurchaseOrder(poId, selectedPrinter)
      showToast({
        variant: "success",
        title: "Purchase order printed",
        message: `PO #${poId} was sent to ${selectedPrinter}.`,
      })
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Print failed",
        message: err.message || "Failed to print purchase order",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!poId) return

    setIsDownloadingPdf(true)
    try {
      const result = await downloadPurchaseOrderPdf(poId)

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
        title: "Purchase order PDF ready",
        message: result?.filePath ? `Saved to ${result.filePath}` : `PO #${poId} PDF was generated successfully.`,
      })
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "PDF download failed",
        message: err.message || "Failed to download purchase order PDF",
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