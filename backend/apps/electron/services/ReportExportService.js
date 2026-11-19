const { getHost } = require("../../../platform/runtime")
const reportService = require("../../../packages/services/reportService")
const poReportService = require("../../../packages/services/poReportService")
const cashFlowReportService = require("../../../packages/services/cashFlowReportService")

class ReportExportService {
  /**
   * Exports sales report to CSV and prompts the user with the native Windows Save File dialog.
   *
   * @param {object} params Query and export parameters (type, preset, fromDate, toDate, category, searchTerm)
   * @param {Electron.WebContents} [senderWebContents] WebContents of the calling renderer to anchor the modal dialog
   * @returns {Promise<{ success: boolean, canceled?: boolean, filePath?: string, filename?: string }>}
   */
  async saveCsvDialog(params = {}, senderWebContents = null) {
    const result = await reportService.exportSalesReportToCsv(params)
    return this._saveCsv(result, "Export Sales Report to CSV", senderWebContents)
  }

  /**
   * Generates sales report CSV content and filename without prompting a file save dialog.
   *
   * @param {object} params
   * @returns {Promise<{ filename: string, csvContent: string, mimeType: string }>}
   */
  async exportToCsv(params = {}) {
    return reportService.exportSalesReportToCsv(params)
  }

  /**
   * Exports purchase order report to CSV and prompts the user with the native Windows Save File dialog.
   *
   * @param {object} params Query and export parameters (type, preset, fromDate, toDate, statusCode, supplierId, searchTerm)
   * @param {Electron.WebContents} [senderWebContents] WebContents of the calling renderer to anchor the modal dialog
   * @returns {Promise<{ success: boolean, canceled?: boolean, filePath?: string, filename?: string }>}
   */
  async savePoCsvDialog(params = {}, senderWebContents = null) {
    const result = await poReportService.exportPoReportToCsv(params)
    return this._saveCsv(result, "Export Purchase Order Report to CSV", senderWebContents)
  }

  /**
   * Generates PO report CSV content and filename without prompting a file save dialog.
   *
   * @param {object} params
   * @returns {Promise<{ filename: string, csvContent: string, mimeType: string }>}
   */
  async exportPoToCsv(params = {}) {
    return poReportService.exportPoReportToCsv(params)
  }

  /**
   * Exports cash flow report to CSV and prompts the user with the native Windows Save File dialog.
   *
   * @param {object} params Query and export parameters (type, preset, fromDate, toDate, flowType, paymentMethod, searchTerm)
   * @param {Electron.WebContents} [senderWebContents] WebContents of the calling renderer to anchor the modal dialog
   * @returns {Promise<{ success: boolean, canceled?: boolean, filePath?: string, filename?: string }>}
   */
  async saveCashFlowCsvDialog(params = {}, senderWebContents = null) {
    const result = await cashFlowReportService.exportCashFlowToCsv(params)
    return this._saveCsv(result, "Export Cash Flow Report to CSV", senderWebContents)
  }

  /**
   * Generates cash flow report CSV content and filename without prompting a file save dialog.
   *
   * @param {object} params
   * @returns {Promise<{ filename: string, csvContent: string, mimeType: string }>}
   */
  async exportCashFlowToCsv(params = {}) {
    return cashFlowReportService.exportCashFlowToCsv(params)
  }

  /**
   * Web edition: hands the CSV to the UI thread, which triggers a browser
   * download (the browser decides where the file is saved).
   */
  async _saveCsv(result) {
    // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 CSVs without character encoding defects
    const bom = "\uFEFF"
    await getHost().requestMain("download", {
      filename: result.filename,
      mimeType: "text/csv;charset=utf-8",
      content: bom + result.csvContent,
    })

    return {
      success: true,
      filePath: result.filename,
      filename: result.filename,
    }
  }
}

module.exports = new ReportExportService()
