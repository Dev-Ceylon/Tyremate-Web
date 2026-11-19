import type {
  CashFlowReportQueryParams,
  ExportCashFlowParams,
  CashFlowOverview,
  CashFlowLedgerResult,
  ReportExportResult,
  SaveCsvResult,
} from "../models/cashFlowReport"

export const cashFlowReportClient = {
  getOverview(params?: CashFlowReportQueryParams): Promise<CashFlowOverview> {
    return window.api.reports.getCashFlowOverview(params)
  },

  getLedger(params?: CashFlowReportQueryParams): Promise<CashFlowLedgerResult> {
    return window.api.reports.getCashFlowLedger(params)
  },

  exportToCsv(params?: ExportCashFlowParams): Promise<ReportExportResult> {
    return window.api.reports.exportCashFlowToCsv(params)
  },

  saveCsv(params?: ExportCashFlowParams): Promise<SaveCsvResult> {
    return window.api.reports.saveCashFlowCsv(params)
  },
}
