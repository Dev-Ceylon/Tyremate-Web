import { useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePrinterStore } from "../../../shared/state/printerStore"
import { downloadSalesOrderPdf, printSalesOrder } from "../services/salesOrderPrintService"

export function usePrintSalesOrder(soId: number | null) {
  const { showToast } = useToast()
  const selectedPrinter = usePrinterStore((s) => s.selectedPrinter)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isPrinterModalOpen, setPrinterModalOpen] = useState(false)

  const handlePrint = async () => {
    if (!soId) return

    if (!selectedPrinter) {
      setPrinterModalOpen(true)
      return
    }

    setIsPrinting(true)
    try {
      await printSalesOrder(soId, selectedPrinter)
      showToast({
        variant: "success",
        title: "Sales order printed",
        message: `SO #${soId} was sent to ${selectedPrinter}.`,
      })
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Print failed",
        message: err.message || "Failed to print sales order",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!soId) return

    setIsDownloadingPdf(true)
    try {
      const result = await downloadSalesOrderPdf(soId)

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
        title: "Sales order PDF ready",
        message: result?.filePath ? `Saved to ${result.filePath}` : `SO #${soId} PDF was generated successfully.`,
      })
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "PDF download failed",
        message: err.message || "Failed to download sales order PDF",
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
