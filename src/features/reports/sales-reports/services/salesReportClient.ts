import type {
  ReportQueryParams,
  ExportReportParams,
  SalesReportOverview,
  SalesTransactionsReportResult,
  ReportExportResult,
  SaveCsvResult,
} from "../models/salesReport"

export const reportClient = {
  getOverview(params?: ReportQueryParams): Promise<SalesReportOverview> {
    return window.api.reports.getOverview(params)
  },

  getTransactions(params?: ReportQueryParams): Promise<SalesTransactionsReportResult> {
    return window.api.reports.getTransactions(params)
  },

  exportToCsv(params?: ExportReportParams): Promise<ReportExportResult> {
    return window.api.reports.exportToCsv(params)
  },

  saveCsv(params?: ExportReportParams): Promise<SaveCsvResult> {
    return window.api.reports.saveCsv(params)
  },
}
