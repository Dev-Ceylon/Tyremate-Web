import type {
  PoReportQueryParams,
  ExportPoReportParams,
  PoReportOverview,
  PoTransactionsReportResult,
  ReportExportResult,
  SaveCsvResult,
} from "../models/poReport"

export const poReportClient = {
  getOverview(params?: PoReportQueryParams): Promise<PoReportOverview> {
    return window.api.reports.getPoOverview(params)
  },

  getTransactions(params?: PoReportQueryParams): Promise<PoTransactionsReportResult> {
    return window.api.reports.getPoTransactions(params)
  },

  exportToCsv(params?: ExportPoReportParams): Promise<ReportExportResult> {
    return window.api.reports.exportPoToCsv(params)
  },

  saveCsv(params?: ExportPoReportParams): Promise<SaveCsvResult> {
    return window.api.reports.savePoCsv(params)
  },
}
