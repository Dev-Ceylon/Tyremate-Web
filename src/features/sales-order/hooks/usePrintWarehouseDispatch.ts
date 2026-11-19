import { useCallback, useState } from "react"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { usePrinterStore } from "../../../shared/state/printerStore"
import { salesOrderService } from "../services/salesOrderService"
import { downloadWarehouseDispatchPdf, printWarehouseDispatch } from "../services/salesOrderPrintService"
import type { SoWarehouseDispatch, SoWarehouseDispatchSite } from "../models/salesOrder"

export function usePrintWarehouseDispatch(soId: number | null) {
  const { showToast } = useToast()
  const selectedPrinter = usePrinterStore((s) => s.selectedPrinter)
  const [dispatch, setDispatch] = useState<SoWarehouseDispatch | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isNoteModalOpen, setNoteModalOpen] = useState(false)
  const [isPrinterModalOpen, setPrinterModalOpen] = useState(false)
  const [loadingDeliveryId, setLoadingDeliveryId] = useState<number | null>(null)

  const openNote = useCallback(async () => {
    if (!soId) return

    setIsLoading(true)
    try {
      const data = await salesOrderService.getWarehouseDispatch(soId)

      if (!data.warehouses || data.warehouses.length === 0) {
        showToast({
          variant: "info",
          title: "Nothing to issue",
          message: `SO #${soId} has no stored tyres allocated to any warehouse.`,
        })
        return
      }

      setDispatch(data)
      setNoteModalOpen(true)
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Could not load warehouses",
        message: err.message || "Failed to load warehouse dispatch details",
      })
    } finally {
      setIsLoading(false)
    }
  }, [soId, showToast])

  const openDeliveryNote = useCallback(async (deliveryId: number) => {
    if (!soId) return

    setIsLoading(true)
    setLoadingDeliveryId(deliveryId)
    try {
      const data = await salesOrderService.getDeliveryWarehouseDispatch(soId, deliveryId)
      if (!data.warehouses || data.warehouses.length === 0) {
        showToast({
          variant: "info",
          title: "Nothing to issue",
          message: `Delivery #${deliveryId} has no warehouse stock to issue.`,
        })
        return
      }

      setDispatch(data)
      setNoteModalOpen(true)
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Could not load delivery warehouses",
        message: err.message || "Failed to load warehouse dispatch details for this delivery",
      })
    } finally {
      setIsLoading(false)
      setLoadingDeliveryId(null)
    }
  }, [soId, showToast])

  const closeNote = useCallback(() => setNoteModalOpen(false), [])

  const handlePrint = useCallback(
    async (sites: SoWarehouseDispatchSite[]) => {
      if (!dispatch || sites.length === 0) return

      if (!selectedPrinter) {
        setPrinterModalOpen(true)
        showToast({
          variant: "info",
          title: "Select a printer",
          message: "Choose a printer to send the warehouse issue note to.",
        })
        return
      }

      setIsPrinting(true)
      try {
        await printWarehouseDispatch(dispatch, sites, selectedPrinter)
        showToast({
          variant: "success",
          title: "Warehouse issue note printed",
          message: `${sites.length} warehouse note${sites.length !== 1 ? "s" : ""} sent to ${selectedPrinter}.`,
        })
      } catch (err: any) {
        showToast({
          variant: "error",
          title: "Print failed",
          message: err.message || "Failed to print warehouse issue note",
        })
      } finally {
        setIsPrinting(false)
      }
    },
    [dispatch, selectedPrinter, showToast],
  )

  const handleDownloadPdf = useCallback(
    async (sites: SoWarehouseDispatchSite[]) => {
      if (!dispatch || sites.length === 0) return

      setIsDownloadingPdf(true)
      try {
        const result = await downloadWarehouseDispatchPdf(dispatch, sites)

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
          title: "Warehouse issue note PDF ready",
          message: result?.filePath ? `Saved to ${result.filePath}` : "PDF was generated successfully.",
        })
      } catch (err: any) {
        showToast({
          variant: "error",
          title: "PDF download failed",
          message: err.message || "Failed to download warehouse issue note PDF",
        })
      } finally {
        setIsDownloadingPdf(false)
      }
    },
    [dispatch, showToast],
  )

  const closePrinterModal = useCallback(() => setPrinterModalOpen(false), [])

  return {
    dispatch,
    isLoading,
    isPrinting,
    isDownloadingPdf,
    isNoteModalOpen,
    isPrinterModalOpen,
    loadingDeliveryId,
    openNote,
    openDeliveryNote,
    closeNote,
    handlePrint,
    handleDownloadPdf,
    closePrinterModal,
  }
}
