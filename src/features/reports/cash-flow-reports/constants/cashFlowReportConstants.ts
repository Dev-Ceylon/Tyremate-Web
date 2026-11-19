import type { DatePreset, ChartInterval, FlowType, PaymentFilter } from "../models/cashFlowReport"
import {
  PAYMENT_TYPE_CODES,
  PAYMENT_INSTRUMENT_CODES,
  PAYMENT_METHOD_FILTERS,
  PAYMENT_METHOD_FILTER_OPTIONS,
} from "../../../../shared/payment/constants/paymentTypeConstants"

export const DATE_PRESETS: Record<string, DatePreset> = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "this_week",
  LAST_WEEK: "last_week",
  LAST_7_DAYS: "last_7_days",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  LAST_30_DAYS: "last_30_days",
  THIS_QUARTER: "this_quarter",
  THIS_YEAR: "this_year",
  LAST_YEAR: "last_year",
  CUSTOM: "custom",
} as const

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today (Daily Treasury)" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week (Mon - Today)" },
  { value: "last_week", label: "Last Week (Mon - Sun)" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month (MTD)" },
  { value: "last_month", label: "Last Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_quarter", label: "This Quarter (QTD)" },
  { value: "this_year", label: "This Year (YTD)" },
  { value: "last_year", label: "Last Year" },
  { value: "custom", label: "Custom Date Range" },
]

export const CHART_INTERVALS: Record<string, ChartInterval> = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const

export const CHART_INTERVAL_OPTIONS: { value: ChartInterval; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
]

export const FLOW_TYPES: Record<string, FlowType> = {
  ALL: "ALL",
  INFLOW: "INFLOW",
  OUTFLOW: "OUTFLOW",
} as const

export const FLOW_TYPE_TABS: { key: FlowType; label: string; badgeVariant?: string }[] = [
  { key: "ALL", label: "All Movements" },
  { key: "INFLOW", label: "Cash In (Inflows)" },
  { key: "OUTFLOW", label: "Cash Out (Outflows)" },
]

// Re-export payment codes and filters from shared payment constants
export {
  PAYMENT_TYPE_CODES,
  PAYMENT_INSTRUMENT_CODES,
  PAYMENT_METHOD_FILTERS,
  PAYMENT_METHOD_FILTER_OPTIONS,
}

export const PAYMENT_METHODS: Record<string, PaymentFilter> = {
  ALL: PAYMENT_METHOD_FILTERS.ALL,
  CASH: PAYMENT_TYPE_CODES.CASH,
  BANK_TRANSFER: PAYMENT_TYPE_CODES.BANK_TRANSFER,
  CHEQUE: PAYMENT_TYPE_CODES.CHEQUE,
} as const

export const PAYMENT_METHOD_OPTIONS: { value: PaymentFilter; label: string }[] =
  PAYMENT_METHOD_FILTER_OPTIONS
