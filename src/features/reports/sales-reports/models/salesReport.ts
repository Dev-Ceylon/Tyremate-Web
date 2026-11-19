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

export type TransactionCategory =
  | "ALL"
  | "TYRE_SALE"
  | "DAG_RETREAD"
  | "OTHER_SERVICE"

export interface DateRangeMeta {
  preset: DatePreset
  label: string
  fromDate: string
  toDate: string
  interval: ChartInterval
  priorFromDate?: string
  priorToDate?: string
}

export interface ChannelSummary {
  orderCount?: number
  takeCount?: number
  serviceCount?: number
  grossAmount: number
  discountAmount?: number
  netAmount: number
}

export interface ReturnsSummary {
  count: number
  amount: number
}

export interface SalesSummary {
  dateRange: {
    fromDate: string
    toDate: string
  }
  grossRevenue: number
  totalDiscounts: number
  totalReturns: number
  netRevenue: number
  totalTransactions: number
  averageOrderValue: number
  channels: {
    tyres: ChannelSummary
    dag: ChannelSummary
    otherServices: ChannelSummary
    returns: ReturnsSummary
  }
}

export interface PeriodGrowth {
  netRevenueGrowth: number
  grossRevenueGrowth: number
  transactionsGrowth: number
  averageOrderValueGrowth: number
}

export interface TimeSeriesPoint {
  period: string
  tyreSales: number
  dagSales: number
  serviceSales: number
  totalSales: number
  transactionCount: number
}

export interface PaymentMethodBreakdown {
  dateRange: {
    fromDate: string
    toDate: string
  }
  cash: {
    amount: number
    count: number
  }
  bankTransfer: {
    amount: number
    count: number
  }
  cheque: {
    collectedAmount: number
    collectedCount: number
    pendingAmount: number
    pendingCount: number
    totalAmount: number
    totalCount: number
  }
  totalSettled: number
  totalPending: number
  grandTotal: number
}

export interface TopTyreItem {
  tyreId: number
  brand: string
  size: string
  pattern: string
  unitsSold: number
  grossRevenue: number
  netRevenue: number
}

export interface TopDagTyreItem {
  tyreId: number
  brand: string
  size: string
  pattern: string
  unitsRetreaded: number
  netRevenue: number
}

export interface TopConsumableItem {
  consumableId: number
  name: string
  category: string
  unit: string
  unitsUsed: number
  netRevenue: number
}

export interface TopProducts {
  tyres: TopTyreItem[]
  dagTyres: TopDagTyreItem[]
  consumables: TopConsumableItem[]
}

export interface CustomerLeaderboardItem {
  customerId: number
  customerName: string
  customerCode?: string
  totalRevenue: number
  totalOrders: number
}

export interface SalesReportOverview {
  dateRange: DateRangeMeta
  summary: SalesSummary
  growth: PeriodGrowth
  timeSeries: TimeSeriesPoint[]
  paymentBreakdown: PaymentMethodBreakdown
  topProducts: TopProducts
  topCustomers: CustomerLeaderboardItem[]
}

export interface SalesTransaction {
  id: string
  rawId: number
  category: TransactionCategory
  categoryLabel: string
  categoryBadgeVariant: "primary" | "warning" | "success" | "info"
  referenceNo: string
  transactionDate: string
  fullDateTime: string
  customerName: string
  customerCode?: string
  grossAmount: number
  discountAmount: number
  netAmount: number
  formattedGross: string
  formattedDiscount: string
  formattedNet: string
  isPaymentCompleted: boolean
  isCompleted: boolean
}

export interface SalesTransactionsReportResult {
  transactions: SalesTransaction[]
  totalCount: number
  pageSummary: {
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
  filterCategory: TransactionCategory
  searchTerm: string
}

export interface ReportQueryParams {
  preset?: DatePreset
  fromDate?: string
  toDate?: string
  interval?: ChartInterval
  category?: TransactionCategory
  searchTerm?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  limitTop?: number
}

export interface ExportReportParams extends ReportQueryParams {
  type?: "transactions" | "summary" | "top_products"
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
