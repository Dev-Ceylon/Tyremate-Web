export type DatePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "last_7_days"
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "this_quarter"
  | "this_year"
  | "last_year"
  | "custom"

export type ChartInterval = "day" | "week" | "month" | "year"

import type { StatusCode } from "../../../../shared/constants/statusConstants"

export type PoStatusCode = "ALL" | StatusCode

export interface PoDateRangeMeta {
  preset: DatePreset
  label: string
  fromDate: string
  toDate: string
  interval: ChartInterval
  priorFromDate?: string
  priorToDate?: string
}

export interface PoSummary {
  dateRange: {
    fromDate: string
    toDate: string
  }
  totalPOs: number
  totalTyresOrdered: number
  grossSpend: number
  totalDiscounts: number
  netSpend: number
  averagePoValue: number
  approvalStats: {
    adminApprovedCount: number
    supplierApprovedCount: number
    pendingAdminApprovalCount: number
  }
}

export interface PoPeriodGrowth {
  netSpendGrowth: number
  grossSpendGrowth: number
  poCountGrowth: number
  tyreCountGrowth: number
  averagePoValueGrowth: number
}

export interface PoTimeSeriesPoint {
  period: string
  poCount: number
  tyreCount: number
  grossSpend: number
  discountAmount: number
  totalSpend: number
}

export interface PoStatusPipelineItem {
  statusCode: string
  statusName: string
  poCount: number
  tyresCount: number
  netSpend: number
  percentageOfSpend: number
}

export interface TopSupplierItem {
  supplierId: number
  supplierName: string
  supplierCode: string
  totalPOs: number
  totalUnitsSupplied: number
  totalSpend: number
  onTimeDeliveries: number
  completedDeliveries: number
  onTimeDeliveryRate: number
}

export interface TopProcuredTyreItem {
  tyreId: number
  brand: string
  size: string
  pattern: string
  unitsOrdered: number
  grossSpend: number
  netSpend: number
  averageUnitPrice: number
}

export interface PoReportOverview {
  dateRange: PoDateRangeMeta
  summary: PoSummary
  growth: PoPeriodGrowth
  timeSeries: PoTimeSeriesPoint[]
  statusPipeline: PoStatusPipelineItem[]
  topSuppliers: TopSupplierItem[]
  topTyres: TopProcuredTyreItem[]
}

export interface PoTransaction {
  poId: number
  referenceNo: string
  soId: number | null
  soReferenceNo: string | null
  orderDate: string
  fullDateTime: string
  statusCode: string
  statusName: string
  statusLabel: string
  statusBadgeVariant: "secondary" | "warning" | "info" | "primary" | "success"
  isAdminApproved: boolean
  isSupplierApproved: boolean
  supplierNames: string
  lineCount: number
  totalQty: number
  grossAmount: number
  discountAmount: number
  netAmount: number
  formattedGross: string
  formattedDiscount: string
  formattedNet: string
}

export interface PoTransactionsReportResult {
  transactions: PoTransaction[]
  totalCount: number
  pageSummary: {
    totalQty: number
    totalGross: number
    totalDiscount: number
    totalNet: number
  }
  pagination: {
    limit: number
    offset: number
    page: number
    totalPages: number
  }
  dateRange: {
    preset: DatePreset
    label: string
    fromDate: string
    toDate: string
  }
  filterStatus: string
  searchTerm: string
}

export interface PoReportQueryParams {
  preset?: DatePreset
  fromDate?: string
  toDate?: string
  interval?: ChartInterval
  statusCode?: string
  supplierId?: number | null
  searchTerm?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  limitTop?: number
}

export interface ExportPoReportParams extends PoReportQueryParams {
  type?: "transactions" | "summary"
}

export interface ReportExportResult {
  filename: string
  csvContent: string
  mimeType: string
}

export interface SaveCsvResult {
  success: boolean
  canceled?: boolean
  filePath?: string
}
