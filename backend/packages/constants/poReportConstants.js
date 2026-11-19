/**
 * Constants and lookups for Purchase Order (PO) Reporting & Procurement Analytics
 */

const { STATUS_CODES, STATUS_NAMES } = require("./statusConstants")

const DATE_PRESETS = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  THIS_WEEK: "this_week",
  LAST_WEEK: "last_week",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  THIS_QUARTER: "this_quarter",
  THIS_YEAR: "this_year",
  LAST_YEAR: "last_year",
  LAST_7_DAYS: "last_7_days",
  LAST_30_DAYS: "last_30_days",
  CUSTOM: "custom",
}

const DATE_PRESET_LABELS = {
  [DATE_PRESETS.TODAY]: "Today",
  [DATE_PRESETS.YESTERDAY]: "Yesterday",
  [DATE_PRESETS.THIS_WEEK]: "This Week",
  [DATE_PRESETS.LAST_WEEK]: "Last Week",
  [DATE_PRESETS.THIS_MONTH]: "This Month (MTD)",
  [DATE_PRESETS.LAST_MONTH]: "Last Month",
  [DATE_PRESETS.THIS_QUARTER]: "This Quarter (QTD)",
  [DATE_PRESETS.THIS_YEAR]: "This Year (YTD)",
  [DATE_PRESETS.LAST_YEAR]: "Last Year",
  [DATE_PRESETS.LAST_7_DAYS]: "Last 7 Days",
  [DATE_PRESETS.LAST_30_DAYS]: "Last 30 Days",
  [DATE_PRESETS.CUSTOM]: "Custom Date Range",
}

const CHART_INTERVALS = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
}

const PO_STATUS_CODES = {
  ALL: "ALL",
  DRAFT: STATUS_CODES.DRAFT,         // 'dft'
  PENDING: STATUS_CODES.PENDING,     // 'pdn'
  ARRIVING: STATUS_CODES.ARRIVING,   // 'arr'
  ARRIVED: STATUS_CODES.ARRIVED,     // 'arv'
  COMPLETED: STATUS_CODES.COMPLETED, // 'cmp'
}

const PO_STATUS_LABELS = {
  [PO_STATUS_CODES.ALL]: "All Statuses",
  [PO_STATUS_CODES.DRAFT]: STATUS_NAMES[STATUS_CODES.DRAFT] || "Draft",
  [PO_STATUS_CODES.PENDING]: STATUS_NAMES[STATUS_CODES.PENDING] || "Pending Confirmation",
  [PO_STATUS_CODES.ARRIVING]: STATUS_NAMES[STATUS_CODES.ARRIVING] || "In Transit / Arriving",
  [PO_STATUS_CODES.ARRIVED]: STATUS_NAMES[STATUS_CODES.ARRIVED] || "Arrived at Warehouse",
  [PO_STATUS_CODES.COMPLETED]: STATUS_NAMES[STATUS_CODES.COMPLETED] || "Completed",
}

const PO_STATUS_BADGE_VARIANTS = {
  [PO_STATUS_CODES.DRAFT]: "secondary",
  [PO_STATUS_CODES.PENDING]: "warning",
  [PO_STATUS_CODES.ARRIVING]: "info",
  [PO_STATUS_CODES.ARRIVED]: "primary",
  [PO_STATUS_CODES.COMPLETED]: "success",
}

module.exports = {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  PO_STATUS_CODES,
  PO_STATUS_LABELS,
  PO_STATUS_BADGE_VARIANTS,
}
