/**
 * Constants and lookups for Sales Reporting & Analytics
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

const TRANSACTION_CATEGORIES = {
  ALL: "ALL",
  TYRE_SALE: "TYRE_SALE",
  DAG_RETREAD: "DAG_RETREAD",
  OTHER_SERVICE: "OTHER_SERVICE",
}

const TRANSACTION_CATEGORY_LABELS = {
  [TRANSACTION_CATEGORIES.ALL]: "All Channels",
  [TRANSACTION_CATEGORIES.TYRE_SALE]: "Tyre Sales Orders",
  [TRANSACTION_CATEGORIES.DAG_RETREAD]: "DAG Retreading",
  [TRANSACTION_CATEGORIES.OTHER_SERVICE]: "Workshop Bay Services",
}

module.exports = {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
}
