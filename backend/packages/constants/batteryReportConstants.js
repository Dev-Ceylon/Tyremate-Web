/**
 * Constants and lookups for Battery Reporting & Analytics
 */

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
  [DATE_PRESETS.THIS_MONTH]: "This Month",
  [DATE_PRESETS.LAST_MONTH]: "Last Month",
  [DATE_PRESETS.THIS_QUARTER]: "This Quarter",
  [DATE_PRESETS.THIS_YEAR]: "This Year (YTD)",
  [DATE_PRESETS.LAST_YEAR]: "Last Year",
  [DATE_PRESETS.LAST_7_DAYS]: "Last 7 Days",
  [DATE_PRESETS.LAST_30_DAYS]: "Last 30 Days",
  [DATE_PRESETS.CUSTOM]: "Custom Range",
}

const CHART_INTERVALS = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
}

const BATTERY_TRANSACTION_TYPES = {
  ALL: "ALL",
  SALE: "SALE",
  PROCUREMENT: "PROCUREMENT",
  RETURN: "RETURN",
}

const BATTERY_TRANSACTION_TYPE_LABELS = {
  [BATTERY_TRANSACTION_TYPES.ALL]: "All Transactions",
  [BATTERY_TRANSACTION_TYPES.SALE]: "Sales Orders",
  [BATTERY_TRANSACTION_TYPES.PROCUREMENT]: "Purchase Orders",
  [BATTERY_TRANSACTION_TYPES.RETURN]: "Warranty Returns",
}

module.exports = {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  BATTERY_TRANSACTION_TYPES,
  BATTERY_TRANSACTION_TYPE_LABELS,
}
