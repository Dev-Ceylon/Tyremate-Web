import type {
  PaymentInstrumentCode,
  PaymentMethodFilter,
} from "../../../../shared/payment/constants/paymentTypeConstants"

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

export type FlowType = "ALL" | "INFLOW" | "OUTFLOW"

// Core liquid payment instrument ('csh' | 'chq' | 'btr' or uppercase keys)
export type PaymentMethod = PaymentInstrumentCode | "CASH" | "BANK_TRANSFER" | "CHEQUE"

// Query filter including 'ALL'
export type PaymentFilter = PaymentMethodFilter | "ALL" | "CASH" | "BANK_TRANSFER" | "CHEQUE"

export type ChequeStatus = "ALL" | "COLLECTED" | "PENDING"

export interface CashFlowDateRangeMeta {
  preset: DatePreset
  label: string
  fromDate: string
  toDate: string
  durationDays: number
  interval: ChartInterval
  priorPeriod?: {
    fromDate: string
    toDate: string
  }
}

export interface CashFlowPeriodGrowth {
  priorPeriod: {
    fromDate: string
    toDate: string
  }
  inflowGrowth: number
  outflowGrowth: number
  netGrowth: number
  expectedInflowGrowth: number
  cashGrowth: number
  bankTransferGrowth: number
  chequeCollectedGrowth: number
  chequePendingGrowth: number
  poSpendGrowth: number
  refundGrowth: number
  priorTotalInflow: number
  priorTotalOutflow: number
  priorNetCash: number
}

export interface CashFlowSummary {
  dateRange: {
    fromDate: string
    toDate: string
  }
  totalRealizedInflow: number
  totalOutflow: number
  netRealizedCashFlow: number
  netProjectedCashFlow: number
  inflow: {
    cash: number
    bankTransfer: number
    chequeCollected: number
    chequePending: number
    totalRealized: number
    totalExpected: number
    cashCount: number
    bankTransferCount: number
    chequeCollectedCount: number
    chequePendingCount: number
    totalCount: number
  }
  outflow: {
    poSpend: number
    refundTotal: number
    totalOutflow: number
    poCount: number
    refundCount: number
    totalCount: number
  }
  counts: {
    inflowTransactions: number
    outflowTransactions: number
    totalTransactions: number
  }
  comparison: CashFlowPeriodGrowth
}

export interface CashFlowTimeSeriesPoint {
  period: string
  inflowCash: number
  inflowBank: number
  inflowChequeCleared: number
  inflowChequePending: number
  totalInflow: number
  outflowPO: number
  outflowRefund: number
  totalOutflow: number
  netCashFlow: number
  inflowCount: number
  outflowCount: number
}

export interface CashFlowInflowMethodItem {
  method: string
  methodLabel: string
  amount: number
  count: number
  percentage: number
  isPending?: boolean
}

export interface CashFlowOutflowCategoryItem {
  category: string
  categoryLabel: string
  amount: number
  count: number
  percentage: number
}

export interface CashFlowMethodBreakdown {
  dateRange: {
    fromDate: string
    toDate: string
  }
  inflowMethods: CashFlowInflowMethodItem[]
  outflowCategories: CashFlowOutflowCategoryItem[]
  inflowStreams: {
    tyreSales: number
    dagSales: number
    serviceSales: number
  }
}

export interface CashFlowOverview {
  dateRange: CashFlowDateRangeMeta
  summary: CashFlowSummary
  timeSeries: CashFlowTimeSeriesPoint[]
  methodBreakdown: CashFlowMethodBreakdown
}

export interface CashFlowLedgerItem {
  id: string
  txDate: string
  fullDateTime: string
  flowType: "INFLOW" | "OUTFLOW"
  flowTypeLabel: string
  paymentMethod: PaymentMethod | string
  paymentMethodCode?: string
  paymentMethodLabel: string
  amount: number
  inflowAmount: number
  outflowAmount: number
  netAmount: number
  category: string
  referenceNo: string
  partyName: string
  status: string
  statusLabel: string
  instrumentReference: string
  formattedAmount: string
  formattedNet: string
}

export interface CashFlowLedgerResult {
  items: CashFlowLedgerItem[]
  totalCount: number
  pageSummary: {
    totalInflow: number
    totalOutflow: number
    netAmount: number
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
  filterFlowType: FlowType
  filterPaymentMethod: PaymentFilter
  searchTerm: string
}

export interface CashFlowReportQueryParams {
  preset?: DatePreset
  fromDate?: string
  toDate?: string
  interval?: ChartInterval
  flowType?: FlowType
  paymentMethod?: PaymentFilter
  searchTerm?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
}

export interface ExportCashFlowParams extends CashFlowReportQueryParams {
  type?: "ledger" | "summary"
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
  filename?: string
}
