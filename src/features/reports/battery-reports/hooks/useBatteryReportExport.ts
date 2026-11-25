import { useState } from "react"
import { batteryReportClient } from "../services/batteryReportClient"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import type { ExportBatteryReportParams } from "../models/batteryReport"

export function useBatteryReportExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const { showToast } = useToast()

  const exportReport = async (
    exportType: "transactions" | "summary",
    params: Omit<ExportBatteryReportParams, "exportType"> = {}
  ) => {
    setIsExporting(true)
    try {
      const result = await batteryReportClient.saveCsv({
        exportType,
        ...params,
      })

      if (result.success && result.filePath) {
        showToast({
          title: "Report Exported Successfully",
          message: `Saved file: ${result.filePath}`,
          variant: "success",
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export battery report"
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
