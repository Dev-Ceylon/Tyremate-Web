import { useState } from "react"
import { poReportClient } from "../services/poReportClient"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import type { ExportPoReportParams } from "../models/poReport"

export function usePoReportExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const { showToast } = useToast()

  const exportReport = async (
    type: "transactions" | "summary",
    params: Omit<ExportPoReportParams, "type"> = {}
  ) => {
    setIsExporting(true)
    try {
      const result = await poReportClient.saveCsv({
        type,
        ...params,
      })

      if (result.success && result.filePath) {
        showToast({
          title: "PO Report Exported Successfully",
          message: `Saved to: ${result.filePath}`,
          variant: "success",
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export PO report"
      showToast({
        title: "Export Failed",
        message,
        variant: "error",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportReport,
  }
}
