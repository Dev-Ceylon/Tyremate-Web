import type { DatePreset, ChartInterval, TransactionCategory } from "../models/salesReport"

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
  { value: "today", label: "Today" },
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

export const TRANSACTION_CATEGORIES: Record<string, TransactionCategory> = {
  ALL: "ALL",
  TYRE_SALE: "TYRE_SALE",
  DAG_RETREAD: "DAG_RETREAD",
  OTHER_SERVICE: "OTHER_SERVICE",
} as const

export const TRANSACTION_CATEGORY_TABS: { key: TransactionCategory; label: string }[] = [
  { key: "ALL", label: "All Channels" },
  { key: "TYRE_SALE", label: "Tyre Sales Orders" },
  { key: "DAG_RETREAD", label: "DAG Retreading" },
  { key: "OTHER_SERVICE", label: "Workshop Bay Services" },
]
