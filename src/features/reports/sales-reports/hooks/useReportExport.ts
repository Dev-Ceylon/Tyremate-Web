import { useState } from "react"
import { reportClient } from "../services/salesReportClient"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import type { ExportReportParams } from "../models/salesReport"

export function useReportExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const { showToast } = useToast()

  const exportReport = async (
    type: "transactions" | "summary" | "top_products",
    params: Omit<ExportReportParams, "type"> = {}
  ) => {
    setIsExporting(true)
    try {
      const result = await reportClient.saveCsv({
        type,
        ...params,
      })

      if (result.success && result.filePath) {
        showToast({
          title: "Report Exported Successfully",
          message: `Saved to: ${result.filePath}`,
          variant: "success",
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export report"
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
