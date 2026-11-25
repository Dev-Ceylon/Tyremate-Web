const batteryReportRepo = require("../repositories/batteryReportRepository")
const {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  BATTERY_TRANSACTION_TYPES,
  BATTERY_TRANSACTION_TYPE_LABELS,
} = require("../constants/batteryReportConstants")

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
function formatLocalDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string into a local Date object
 */
function parseLocalDate(str) {
  if (!str || typeof str !== "string") return new Date()
  const [y, m, d] = str.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Add or subtract days from a Date object
 */
function addDays(d, days) {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Resolves standard date presets into concrete fromDate and toDate strings.
 */
function resolveDateRange({ preset = DATE_PRESETS.THIS_MONTH, fromDate, toDate, interval } = {}) {
  const now = new Date()
  const todayStr = formatLocalDate(now)

  let from = todayStr
  let to = todayStr
  let resolvedInterval = CHART_INTERVALS.DAY
  let activePreset = preset || DATE_PRESETS.THIS_MONTH

  switch (activePreset) {
    case DATE_PRESETS.TODAY: {
      from = todayStr
      to = todayStr
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.YESTERDAY: {
      const yesterday = addDays(now, -1)
      from = formatLocalDate(yesterday)
      to = from
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.THIS_WEEK: {
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = addDays(now, diffToMonday)
      from = formatLocalDate(monday)
      to = todayStr
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.LAST_WEEK: {
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const lastMonday = addDays(now, diffToMonday - 7)
      const lastSunday = addDays(lastMonday, 6)
      from = formatLocalDate(lastMonday)
      to = formatLocalDate(lastSunday)
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.LAST_7_DAYS: {
      from = formatLocalDate(addDays(now, -6))
      to = todayStr
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.THIS_MONTH: {
      from = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1))
      to = todayStr
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.LAST_MONTH: {
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      from = formatLocalDate(firstOfLastMonth)
      to = formatLocalDate(lastOfLastMonth)
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.LAST_30_DAYS: {
      from = formatLocalDate(addDays(now, -29))
      to = todayStr
      resolvedInterval = CHART_INTERVALS.DAY
      break
    }

    case DATE_PRESETS.THIS_QUARTER: {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
      from = formatLocalDate(new Date(now.getFullYear(), quarterStartMonth, 1))
      to = todayStr
      resolvedInterval = CHART_INTERVALS.WEEK
      break
    }

    case DATE_PRESETS.THIS_YEAR: {
      from = formatLocalDate(new Date(now.getFullYear(), 0, 1))
      to = todayStr
      resolvedInterval = CHART_INTERVALS.MONTH
      break
    }

    case DATE_PRESETS.LAST_YEAR: {
      from = formatLocalDate(new Date(now.getFullYear() - 1, 0, 1))
      to = formatLocalDate(new Date(now.getFullYear() - 1, 11, 31))
      resolvedInterval = CHART_INTERVALS.MONTH
      break
    }

    case DATE_PRESETS.CUSTOM:
    default: {
      activePreset = DATE_PRESETS.CUSTOM
      from = fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate) ? fromDate : todayStr
      to = toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate) ? toDate : todayStr
      if (from > to) {
        const temp = from
        from = to
        to = temp
      }

      const daySpan = Math.round((parseLocalDate(to) - parseLocalDate(from)) / (1000 * 60 * 60 * 24)) + 1
      if (daySpan <= 31) {
        resolvedInterval = CHART_INTERVALS.DAY
      } else if (daySpan <= 120) {
        resolvedInterval = CHART_INTERVALS.WEEK
      } else {
        resolvedInterval = CHART_INTERVALS.MONTH
      }
      break
    }
  }

  if (interval && Object.values(CHART_INTERVALS).includes(interval)) {
    resolvedInterval = interval
  }

  const fromObj = parseLocalDate(from)
  const toObj = parseLocalDate(to)
  const durationDays = Math.max(1, Math.round((toObj - fromObj) / (1000 * 60 * 60 * 24)) + 1)
  const priorToDate = formatLocalDate(addDays(fromObj, -1))
  const priorFromDate = formatLocalDate(addDays(fromObj, -durationDays))

  return {
    preset: activePreset,
    label: DATE_PRESET_LABELS[activePreset] || "Custom",
    fromDate: from,
    toDate: to,
    interval: resolvedInterval,
    priorFromDate,
    priorToDate,
  }
}

/**
 * Calculate percentage delta growth safely
 */
function calculateGrowth(current, prior) {
  if (!prior || prior === 0) {
    return current > 0 ? 100 : 0
  }
  return Number((((current - prior) / prior) * 100).toFixed(1))
}

/**
 * 1. Comprehensive Battery Report Overview
 */
exports.getBatteryReportOverview = async (params = {}) => {
  const range = resolveDateRange(params)
  const branchId = params.branchId ? Number(params.branchId) : undefined
  const brand = params.brand ? String(params.brand) : undefined

  // Current period summary
  const currentSummary = batteryReportRepo.getBatterySummary({
    fromDate: range.fromDate,
    toDate: range.toDate,
    branchId,
    brand,
  })

  // Prior period summary for growth indicators
  const priorSummary = batteryReportRepo.getBatterySummary({
    fromDate: range.priorFromDate,
    toDate: range.priorToDate,
    branchId,
    brand,
  })

  // Growth calculations
  const growth = {
    revenueGrowth: calculateGrowth(
      currentSummary.sales.netRevenue,
      priorSummary.sales.netRevenue
    ),
    unitsGrowth: calculateGrowth(
      currentSummary.sales.totalUnitsSold,
      priorSummary.sales.totalUnitsSold
    ),
    ordersGrowth: calculateGrowth(
      currentSummary.sales.totalOrders,
      priorSummary.sales.totalOrders
    ),
    procurementGrowth: calculateGrowth(
      currentSummary.procurement.procurementSpend,
      priorSummary.procurement.procurementSpend
    ),
  }

  // Time-series trend chart data
  const timeSeries = batteryReportRepo.getBatteryTimeSeries({
    fromDate: range.fromDate,
    toDate: range.toDate,
    interval: range.interval,
    branchId,
    brand,
  })

  // Brand distribution
  const brandBreakdown = batteryReportRepo.getBatteryBrandBreakdown({
    fromDate: range.fromDate,
    toDate: range.toDate,
    branchId,
  })

  // Application distribution
  const applicationBreakdown = batteryReportRepo.getBatteryApplicationBreakdown({
    fromDate: range.fromDate,
    toDate: range.toDate,
    branchId,
  })

  // Top selling batteries
  const topBatteries = batteryReportRepo.getTopSellingBatteries({
    fromDate: range.fromDate,
    toDate: range.toDate,
    branchId,
    brand,
    limit: params.limitTop || 5,
  })

  // Battery health, expiry & warranty alerts
  const healthAlerts = batteryReportRepo.getBatteryHealthAndExpiry({
    limit: 10,
  })

  return {
    meta: range,
    summary: currentSummary,
    priorSummary,
    growth,
    timeSeries,
    brandBreakdown,
    applicationBreakdown,
    topBatteries,
    healthAlerts,
  }
}

/**
 * 2. Paginated detailed battery transactions report
 */
exports.getBatteryTransactionsReport = async (params = {}) => {
  const range = resolveDateRange(params)

  return batteryReportRepo.getBatteryTransactions({
    fromDate: range.fromDate,
    toDate: range.toDate,
    type: params.type || "ALL",
    branchId: params.branchId ? Number(params.branchId) : undefined,
    brand: params.brand ? String(params.brand) : undefined,
    searchTerm: params.searchTerm,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  })
}

/**
 * Helper to escape CSV cell values
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

/**
 * 3. Export Battery Report to CSV
 */
exports.exportBatteryReportToCsv = async (params = {}) => {
  const range = resolveDateRange(params)
  const exportType = params.exportType || "transactions"

  if (exportType === "transactions") {
    // Export full transactions ledger
    const ledger = await exports.getBatteryTransactionsReport({
      ...params,
      limit: 10000,
      page: 1,
    })

    const headers = [
      "Type",
      "Reference No",
      "Date",
      "Brand",
      "Model",
      "Specification",
      "Customer / Supplier",
      "Quantity",
      "Unit Price (LKR)",
      "Discount (%)",
      "Net Amount (LKR)",
      "Status",
    ]

    const rows = ledger.items.map((item) => [
      escapeCsv(item.type),
      escapeCsv(item.refNo),
      escapeCsv(item.date),
      escapeCsv(item.brand),
      escapeCsv(item.model),
      escapeCsv(item.spec),
      escapeCsv(item.partnerName),
      item.qty,
      item.unitPrice.toFixed(2),
      item.discount,
      item.netAmount.toFixed(2),
      escapeCsv(item.status),
    ])

    const csvContent = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const filename = `Battery_Transactions_${range.fromDate}_to_${range.toDate}.csv`

    return {
      filename,
      csvContent,
      mimeType: "text/csv; charset=utf-8",
    }
  }

  // Executive summary export
  const overview = await exports.getBatteryReportOverview(params)

  const lines = []
  lines.push(`"BATTERY PERFORMANCE & INVENTORY REPORT"`)
  lines.push(`"Date Range:","${range.fromDate} to ${range.toDate} (${range.label})"`)
  lines.push(`"Generated At:","${new Date().toISOString()}"`)
  lines.push("")

  lines.push(`"--- FINANCIAL & INVENTORY OVERVIEW ---"`)
  lines.push(`"Metric","Value"`)
  lines.push(`"Total Net Revenue (LKR)",${overview.summary.sales.netRevenue.toFixed(2)}`)
  lines.push(`"Total Battery Units Sold",${overview.summary.sales.totalUnitsSold}`)
  lines.push(`"Total Gross Revenue (LKR)",${overview.summary.sales.grossRevenue.toFixed(2)}`)
  lines.push(`"Total Discounts Given (LKR)",${overview.summary.sales.totalDiscounts.toFixed(2)}`)
  lines.push(`"Total Sales Orders",${overview.summary.sales.totalOrders}`)
  lines.push(`"Average Order Value (LKR)",${overview.summary.sales.averageOrderValue.toFixed(2)}`)
  lines.push(`"Total Procurement Spend (LKR)",${overview.summary.procurement.procurementSpend.toFixed(2)}`)
  lines.push(`"Total Units Procured",${overview.summary.procurement.totalUnitsProcured}`)
  lines.push(`"Total Units Returned",${overview.summary.returns.totalUnitsReturned}`)
  lines.push(`"Current Stock on Hand (Units)",${overview.summary.inventory.currentStockUnits}`)
  lines.push(`"Total Models in Catalog",${overview.summary.inventory.totalModels}`)
  lines.push("")

  lines.push(`"--- BRAND MARKET SHARE ---"`)
  lines.push(`"Brand","Units Sold","Revenue (LKR)","Share (%)"`)
  overview.brandBreakdown.forEach((b) => {
    lines.push([
      escapeCsv(b.brand),
      b.unitsSold,
      b.revenue.toFixed(2),
      `${b.sharePercent.toFixed(1)}%`,
    ].join(","))
  })
  lines.push("")

  lines.push(`"--- TOP SELLING BATTERY MODELS ---"`)
  lines.push(`"Brand","Model","Specification","Units Sold","Revenue (LKR)","Current Stock"`)
  overview.topBatteries.forEach((t) => {
    lines.push([
      escapeCsv(t.brand),
      escapeCsv(t.model),
      escapeCsv(t.specification),
      t.unitsSold,
      t.revenue.toFixed(2),
      t.currentStock,
    ].join(","))
  })

  const filename = `Battery_Overview_${range.fromDate}_to_${range.toDate}.csv`

  return {
    filename,
    csvContent: lines.join("\r\n"),
    mimeType: "text/csv; charset=utf-8",
  }
}
