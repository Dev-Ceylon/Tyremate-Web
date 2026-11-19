import { useState } from "react"
import { cashFlowReportClient } from "../services/cashFlowReportClient"
import { useToast } from "../../../../shared/ui/toast/ToastProvider"
import type { ExportCashFlowParams } from "../models/cashFlowReport"

export function useCashFlowExport() {
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const { showToast } = useToast()

  const exportReport = async (
    type: "ledger" | "summary",
    params: Omit<ExportCashFlowParams, "type"> = {}
  ) => {
    setIsExporting(true)
    try {
      const result = await cashFlowReportClient.saveCsv({
        type,
        ...params,
      })

      if (result.success && result.filePath) {
        showToast({
          title: "Cash Flow Report Exported Successfully",
          message: `Saved to: ${result.filePath}`,
          variant: "success",
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export cash flow report"
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
