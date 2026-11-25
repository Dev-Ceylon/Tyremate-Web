const reportService = require("../../../packages/services/reportService")
const poReportService = require("../../../packages/services/poReportService")
const cashFlowReportService = require("../../../packages/services/cashFlowReportService")
const batteryReportService = require("../../../packages/services/batteryReportService")
const reportExportService = require("../services/ReportExportService")
const { registerIpcHandler } = require("./errorMiddleware")

// ==========================================
// 1. Sales Reporting IPC Handlers
// ==========================================

// 1a. Get Sales Overview (Summary, Growth, Charts Time-Series, Payment Breakdown, Top Products/Customers)
registerIpcHandler("reports:getOverview", { permission: "reports.view" }, async (_event, params = {}) => {
  return reportService.getSalesReportOverview(params)
})

// 1b. Get Paginated Detailed Sales Transactions Ledger
registerIpcHandler("reports:getTransactions", { permission: "reports.view" }, async (_event, params = {}) => {
  return reportService.getSalesTransactionsReport(params)
})

// 1c. Export Sales Data to CSV (Returns Raw Content & Filename)
registerIpcHandler("reports:exportToCsv", { permission: "reports.view" }, async (_event, params = {}) => {
  return reportExportService.exportToCsv(params)
})

// 1d. Save Sales Report CSV to Disk via Native System File Dialog
registerIpcHandler("reports:saveCsv", { permission: "reports.view" }, async (event, params = {}) => {
  return reportExportService.saveCsvDialog(params, event.sender)
})

// ==========================================
// 2. Purchase Order (PO) Reporting IPC Handlers
// ==========================================

// 2a. Get PO Overview (Summary, Growth, Time-Series, Status Pipeline, Top Suppliers/Tyres)
registerIpcHandler("reports:getPoOverview", { permission: "reports.view" }, async (_event, params = {}) => {
  return poReportService.getPoReportOverview(params)
})

// 2b. Get Paginated Detailed PO Transactions Ledger
registerIpcHandler("reports:getPoTransactions", { permission: "reports.view" }, async (_event, params = {}) => {
  return poReportService.getPoTransactionsReport(params)
})

// 2c. Export PO Data to CSV (Returns Raw Content & Filename)
registerIpcHandler("reports:exportPoToCsv", { permission: "reports.view" }, async (_event, params = {}) => {
  return reportExportService.exportPoToCsv(params)
})

// 2d. Save PO Report CSV to Disk via Native System File Dialog
registerIpcHandler("reports:savePoCsv", { permission: "reports.view" }, async (event, params = {}) => {
  return reportExportService.savePoCsvDialog(params, event.sender)
})

// ==========================================
// 3. Cash Flow Reporting IPC Handlers
// ==========================================

// 3a. Get Cash Flow Overview (Summary, Growth Deltas, Time-Series Trend, Method Breakdown)
registerIpcHandler("reports:getCashFlowOverview", { permission: "reports.view" }, async (_event, params = {}) => {
  return cashFlowReportService.getCashFlowOverview(params)
})

// 3b. Get Paginated Cash Flow Movement Ledger
registerIpcHandler("reports:getCashFlowLedger", { permission: "reports.view" }, async (_event, params = {}) => {
  return cashFlowReportService.getCashFlowLedger(params)
})

// 3c. Export Cash Flow Data to CSV (Returns Raw Content & Filename)
registerIpcHandler("reports:exportCashFlowToCsv", { permission: "reports.view" }, async (_event, params = {}) => {
  return reportExportService.exportCashFlowToCsv(params)
})

// 3d. Save Cash Flow Report CSV to Disk via Native System File Dialog
registerIpcHandler("reports:saveCashFlowCsv", { permission: "reports.view" }, async (event, params = {}) => {
  return reportExportService.saveCashFlowCsvDialog(params, event.sender)
})

// ==========================================
// 4. Battery Reporting IPC Handlers
// ==========================================

// 4a. Get Battery Overview (Summary, Growth Deltas, Time-Series, Brand & Application Breakdown, Top Models, Health/Expiry)
registerIpcHandler("reports:getBatteryOverview", { permission: "reports.view" }, async (_event, params = {}) => {
  return batteryReportService.getBatteryReportOverview(params)
})

// 4b. Get Paginated Detailed Battery Movement & Transactions Ledger
registerIpcHandler("reports:getBatteryTransactions", { permission: "reports.view" }, async (_event, params = {}) => {
  return batteryReportService.getBatteryTransactionsReport(params)
})

// 4c. Export Battery Report to CSV (Returns Raw Content & Filename)
registerIpcHandler("reports:exportBatteryToCsv", { permission: "reports.view" }, async (_event, params = {}) => {
  return reportExportService.exportBatteryToCsv(params)
})

// 4d. Save Battery Report CSV via Native System File Dialog / Browser Download
registerIpcHandler("reports:saveBatteryCsv", { permission: "reports.view" }, async (event, params = {}) => {
  return reportExportService.saveBatteryCsvDialog(params, event.sender)
})
