import type { BatteryDatePreset, BatteryChartInterval, BatteryTransactionType } from "../models/batteryReport"

export const DATE_PRESETS: Record<string, BatteryDatePreset> = {
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

export const DATE_PRESET_OPTIONS: { value: BatteryDatePreset; label: string }[] = [
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

export const CHART_INTERVALS: Record<string, BatteryChartInterval> = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const

export const TRANSACTION_TYPES: Record<string, BatteryTransactionType> = {
  ALL: "ALL",
  SALE: "SALE",
  PROCUREMENT: "PROCUREMENT",
  RETURN: "RETURN",
} as const

export const TRANSACTION_TYPE_TABS: { key: BatteryTransactionType; label: string }[] = [
  { key: "ALL", label: "All Movements" },
  { key: "SALE", label: "Sales Orders" },
  { key: "PROCUREMENT", label: "Purchase Orders" },
  { key: "RETURN", label: "Warranty Returns" },
]
