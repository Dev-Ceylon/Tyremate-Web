export type BatteryDatePreset =
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

export type BatteryChartInterval = "day" | "week" | "month" | "year"

export type BatteryTransactionType = "ALL" | "SALE" | "PROCUREMENT" | "RETURN"

export interface BatteryDateRangeMeta {
  preset: BatteryDatePreset
  label: string
  fromDate: string
  toDate: string
  interval: BatteryChartInterval
  priorFromDate?: string
  priorToDate?: string
}

export interface BatterySalesSummary {
  totalOrders: number
  totalUnitsSold: number
  grossRevenue: number
  totalDiscounts: number
  netRevenue: number
  averageOrderValue: number
}

export interface BatteryProcurementSummary {
  totalPOs: number
  totalUnitsProcured: number
  procurementSpend: number
}

export interface BatteryReturnsSummary {
  totalUnitsReturned: number
  returnCount: number
}

export interface BatteryInventorySummary {
  currentStockUnits: number
  totalModels: number
  expiringStockUnits: number
  expiringBatchesCount: number
}

export interface BatteryReportSummary {
  dateRange: {
    fromDate: string
    toDate: string
  }
  sales: BatterySalesSummary
  procurement: BatteryProcurementSummary
  returns: BatteryReturnsSummary
  inventory: BatteryInventorySummary
}

export interface BatteryPeriodGrowth {
  revenueGrowth: number
  unitsGrowth: number
  ordersGrowth: number
  procurementGrowth: number
}

export interface BatteryTimeSeriesPoint {
  period: string
  unitsSold: number
  salesRevenue: number
  orderCount: number
}

export interface BatteryBrandDistribution {
  brand: string
  unitsSold: number
  revenue: number
  orderCount: number
  sharePercent: number
}

export interface BatteryApplicationDistribution {
  application: string
  unitsSold: number
  revenue: number
  sharePercent: number
}

export interface TopBatteryModel {
  batteryId: number
  brand: string
  model: string
  specification: string
  technology: string | null
  application: string
  unitsSold: number
  revenue: number
  currentStock: number
}

export interface BatteryHealthAlert {
  batchId: number
  batchCode: string
  brand: string
  model: string
  specification: string
  locationName: string
  mfgDate: string | null
  expiryDate: string
  qty: number
  daysUntilExpiry: number
  status: "GOOD" | "WARNING" | "CRITICAL" | "EXPIRED"
}

export interface BatteryReportOverview {
  meta: BatteryDateRangeMeta
  summary: BatteryReportSummary
  priorSummary: BatteryReportSummary
  growth: BatteryPeriodGrowth
  timeSeries: BatteryTimeSeriesPoint[]
  brandBreakdown: BatteryBrandDistribution[]
  applicationBreakdown: BatteryApplicationDistribution[]
  topBatteries: TopBatteryModel[]
  healthAlerts: BatteryHealthAlert[]
}

export interface BatteryTransactionRecord {
  type: "SALE" | "PROCUREMENT" | "RETURN"
  orderId: number
  lineId: number
  refNo: string
  date: string
  timestamp: string
  batteryId: number
  brand: string
  model: string
  spec: string
  partnerName: string
  qty: number
  unitPrice: number
  discount: number
  netAmount: number
  status: string
}

export interface BatteryTransactionsReportResult {
  items: BatteryTransactionRecord[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  summary: {
    totalQty: number
    totalAmount: number
  }
}

export interface BatteryReportQueryParams {
  preset?: BatteryDatePreset
  fromDate?: string
  toDate?: string
  interval?: BatteryChartInterval
  type?: BatteryTransactionType
  branchId?: number
  brand?: string
  searchTerm?: string
  limitTop?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
}

export interface ExportBatteryReportParams {
  exportType?: "transactions" | "summary"
  preset?: BatteryDatePreset
  fromDate?: string
  toDate?: string
  type?: BatteryTransactionType
  branchId?: number
  brand?: string
  searchTerm?: string
}
