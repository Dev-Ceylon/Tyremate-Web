import type { DatePreset, ChartInterval, PoStatusCode } from "../models/poReport"
import { STATUS_CODES, STATUS_METADATA } from "../../../../shared/constants/statusConstants"

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

export const PO_STATUS_CODES = {
  ALL: "ALL" as const,
  DRAFT: STATUS_CODES.DRAFT,         // 'dft'
  PENDING: STATUS_CODES.PENDING,     // 'pdn'
  ARRIVING: STATUS_CODES.ARRIVING,   // 'arr'
  ARRIVED: STATUS_CODES.ARRIVED,     // 'arv'
  COMPLETED: STATUS_CODES.COMPLETED, // 'cmp'
} as const

export const PO_STATUS_LABELS: Record<string, string> = {
  ALL: "All Statuses",
  [STATUS_CODES.DRAFT]: STATUS_METADATA[STATUS_CODES.DRAFT].name,
  [STATUS_CODES.PENDING]: STATUS_METADATA[STATUS_CODES.PENDING].name,
  [STATUS_CODES.ARRIVING]: STATUS_METADATA[STATUS_CODES.ARRIVING].name,
  [STATUS_CODES.ARRIVED]: STATUS_METADATA[STATUS_CODES.ARRIVED].name,
  [STATUS_CODES.COMPLETED]: STATUS_METADATA[STATUS_CODES.COMPLETED].name,
}

export const PO_STATUS_FILTER_TABS: { key: PoStatusCode; label: string }[] = [
  { key: "ALL", label: "All Statuses" },
  { key: STATUS_CODES.DRAFT, label: STATUS_METADATA[STATUS_CODES.DRAFT].name },
  { key: STATUS_CODES.PENDING, label: STATUS_METADATA[STATUS_CODES.PENDING].name },
  { key: STATUS_CODES.ARRIVING, label: STATUS_METADATA[STATUS_CODES.ARRIVING].name },
  { key: STATUS_CODES.ARRIVED, label: STATUS_METADATA[STATUS_CODES.ARRIVED].name },
  { key: STATUS_CODES.COMPLETED, label: STATUS_METADATA[STATUS_CODES.COMPLETED].name },
]
