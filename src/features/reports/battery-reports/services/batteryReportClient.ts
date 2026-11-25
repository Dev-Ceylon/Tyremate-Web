import type {
  BatteryReportQueryParams,
  ExportBatteryReportParams,
  BatteryReportOverview,
  BatteryTransactionsReportResult,
} from "../models/batteryReport"
import type {
  ReportExportResult,
  SaveCsvResult,
} from "../../sales-reports/models/salesReport"

export const batteryReportClient = {
  getOverview(params?: BatteryReportQueryParams): Promise<BatteryReportOverview> {
    return window.api.reports.getBatteryOverview(params)
  },

  getTransactions(params?: BatteryReportQueryParams): Promise<BatteryTransactionsReportResult> {
    return window.api.reports.getBatteryTransactions(params)
  },

  exportToCsv(params?: ExportBatteryReportParams): Promise<ReportExportResult> {
    return window.api.reports.exportBatteryToCsv(params)
  },

  saveCsv(params?: ExportBatteryReportParams): Promise<SaveCsvResult> {
    return window.api.reports.saveBatteryCsv(params)
  },
}
