const poReportRepo = require("../repositories/poReportRepository")
const {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  PO_STATUS_CODES,
  PO_STATUS_LABELS,
  PO_STATUS_BADGE_VARIANTS,
} = require("../constants/poReportConstants")

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
 * Also determines recommended chart interval and prior period date range for growth comparison.
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
      // Monday as first day of week
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

      // Auto-derive interval based on day count if not provided
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

  // If client explicitly passed an interval override, respect it
  if (interval && Object.values(CHART_INTERVALS).includes(interval)) {
    resolvedInterval = interval
  }

  // Calculate prior period of equivalent duration for growth comparison
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
    durationDays,
    interval: resolvedInterval,
    priorPeriod: {
      fromDate: priorFromDate,
      toDate: priorToDate,
    },
  }
}

/**
 * Calculate percentage difference between current and prior period
 */
function calculateGrowth(current, previous) {
  const curr = Number(current || 0)
  const prev = Number(previous || 0)

  if (prev === 0) {
    return curr > 0 ? 100 : 0
  }

  const change = ((curr - prev) / prev) * 100
  return Number(change.toFixed(1))
}

/**
 * 1. Get comprehensive purchase order overview for procurement dashboard / analytics.
 * Combines summary metrics, period growth comparison, timeline charts,
 * status pipeline, top suppliers, and top procured tyres.
 */
exports.getPoReportOverview = async (params = {}) => {
  const range = resolveDateRange(params)

  // 1. Fetch current summary and prior summary in parallel
  const currentSummary = poReportRepo.getPoSummary({
    fromDate: range.fromDate,
    toDate: range.toDate,
  })

  const priorSummary = poReportRepo.getPoSummary({
    fromDate: range.priorPeriod.fromDate,
    toDate: range.priorPeriod.toDate,
  })

  // 2. Fetch TimeSeries data for charts
  const timeSeries = poReportRepo.getPoTimeSeries({
    fromDate: range.fromDate,
    toDate: range.toDate,
    interval: range.interval,
  })

  // 3. Fetch status pipeline distribution
  const statusPipeline = poReportRepo.getPoStatusPipeline({
    fromDate: range.fromDate,
    toDate: range.toDate,
  })

  // 4. Fetch top suppliers
  const topSuppliers = poReportRepo.getTopSuppliers({
    fromDate: range.fromDate,
    toDate: range.toDate,
    limit: Number(params.limitTop) || 10,
  })

  // 5. Fetch top procured tyres
  const topTyres = poReportRepo.getTopProcuredTyres({
    fromDate: range.fromDate,
    toDate: range.toDate,
    limit: Number(params.limitTop) || 10,
  })

  // 6. Calculate period-over-period growth rates
  const growth = {
    netSpendGrowth: calculateGrowth(currentSummary.netSpend, priorSummary.netSpend),
    grossSpendGrowth: calculateGrowth(currentSummary.grossSpend, priorSummary.grossSpend),
    poCountGrowth: calculateGrowth(currentSummary.totalPOs, priorSummary.totalPOs),
    tyreCountGrowth: calculateGrowth(currentSummary.totalTyresOrdered, priorSummary.totalTyresOrdered),
    averagePoValueGrowth: calculateGrowth(currentSummary.averagePoValue, priorSummary.averagePoValue),
  }

  return {
    dateRange: {
      preset: range.preset,
      label: range.label,
      fromDate: range.fromDate,
      toDate: range.toDate,
      interval: range.interval,
      priorFromDate: range.priorPeriod.fromDate,
      priorToDate: range.priorPeriod.toDate,
    },
    summary: currentSummary,
    growth,
    timeSeries,
    statusPipeline,
    topSuppliers,
    topTyres,
  }
}

/**
 * 2. Get paginated PO transaction ledger with enriched presentation fields.
 */
exports.getPoTransactionsReport = async (params = {}) => {
  const range = resolveDateRange(params)

  const result = poReportRepo.getPoTransactions({
    fromDate: range.fromDate,
    toDate: range.toDate,
    statusCode: params.statusCode || PO_STATUS_CODES.ALL,
    supplierId: params.supplierId || null,
    searchTerm: params.searchTerm || "",
    limit: params.limit || 25,
    offset: params.offset || 0,
    sortBy: params.sortBy || "Date",
    sortOrder: params.sortOrder || "DESC",
  })

  // Enrich transactions with presentation metadata
  const enrichedTransactions = result.transactions.map((tx) => {
    const statusLabel = PO_STATUS_LABELS[tx.statusCode] || tx.statusName || tx.statusCode
    const statusBadgeVariant = PO_STATUS_BADGE_VARIANTS[tx.statusCode] || "secondary"

    return {
      ...tx,
      statusLabel,
      statusBadgeVariant,
    }
  })

  return {
    ...result,
    transactions: enrichedTransactions,
    dateRange: {
      preset: range.preset,
      label: range.label,
      fromDate: range.fromDate,
      toDate: range.toDate,
    },
    filterStatus: params.statusCode || PO_STATUS_CODES.ALL,
    searchTerm: params.searchTerm || "",
  }
}

/**
 * 3. Helper to escape and format CSV cells adhering to RFC-4180
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""'
  const stringValue = String(value)
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n") || stringValue.includes("\r")) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * 4. Generate CSV export files for Purchase Order Reports.
 * Supports types: 'transactions' | 'summary'
 */
exports.exportPoReportToCsv = async ({
  type = "transactions",
  preset,
  fromDate,
  toDate,
  statusCode = PO_STATUS_CODES.ALL,
  supplierId = null,
  searchTerm = "",
} = {}) => {
  const range = resolveDateRange({ preset, fromDate, toDate })

  if (type === "transactions") {
    // Retrieve up to 10,000 records for full export
    const data = poReportRepo.getPoTransactions({
      fromDate: range.fromDate,
      toDate: range.toDate,
      statusCode,
      supplierId,
      searchTerm,
      limit: 10000,
      offset: 0,
      sortBy: "Date",
      sortOrder: "DESC",
    })

    const headers = [
      "PO ID",
      "PO Reference",
      "Linked SO",
      "Order Date",
      "Full Timestamp",
      "Status",
      "Admin Approved",
      "Supplier Approved",
      "Suppliers",
      "Line Items Count",
      "Total Tyre Units",
      "Gross Spend (LKR)",
      "Discount (LKR)",
      "Net Spend (LKR)",
    ]

    const rows = data.transactions.map((t) => [
      t.poId,
      t.referenceNo,
      t.soReferenceNo || "STANDALONE",
      t.orderDate,
      t.fullDateTime,
      PO_STATUS_LABELS[t.statusCode] || t.statusName,
      t.isAdminApproved ? "YES" : "NO",
      t.isSupplierApproved ? "YES" : "NO",
      t.supplierNames,
      t.lineCount,
      t.totalQty,
      t.grossAmount.toFixed(2),
      t.discountAmount.toFixed(2),
      t.netAmount.toFixed(2),
    ])

    const csvLines = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ]

    const filename = `PO_Transactions_${range.fromDate}_to_${range.toDate}.csv`

    return {
      filename,
      csvContent: csvLines.join("\r\n"),
      mimeType: "text/csv; charset=utf-8",
    }
  }

  // Executive summary export
  const overview = await exports.getPoReportOverview({
    preset,
    fromDate,
    toDate,
    limitTop: 20,
  })

  const lines = []

  // Header section
  lines.push(`"PURCHASE ORDER & PROCUREMENT REPORT"`)
  lines.push(`"Date Range:","${range.fromDate} to ${range.toDate} (${range.label})"`)
  lines.push(`"Generated At:","${new Date().toISOString()}"`)
  lines.push("")

  // KPI Overview
  lines.push(`"--- PROCUREMENT FINANCIAL OVERVIEW ---"`)
  lines.push(`"Metric","Value"`)
  lines.push(`"Net Spend (LKR)",${overview.summary.netSpend}`)
  lines.push(`"Gross Spend (LKR)",${overview.summary.grossSpend}`)
  lines.push(`"Total Discounts (LKR)",${overview.summary.totalDiscounts}`)
  lines.push(`"Total Purchase Orders",${overview.summary.totalPOs}`)
  lines.push(`"Total Tyres Ordered",${overview.summary.totalTyresOrdered}`)
  lines.push(`"Average PO Value (LKR)",${overview.summary.averagePoValue}`)
  lines.push(`"Admin Approved Orders",${overview.summary.approvalStats.adminApprovedCount}`)
  lines.push(`"Supplier Approved Orders",${overview.summary.approvalStats.supplierApprovedCount}`)
  lines.push(`"Pending Admin Approval",${overview.summary.approvalStats.pendingAdminApprovalCount}`)
  lines.push("")

  // Status Pipeline Breakdown
  lines.push(`"--- STATUS PIPELINE BREAKDOWN ---"`)
  lines.push(`"Status Code","Status Name","PO Count","Tyres Ordered","Net Spend (LKR)","Share (%)"`)
  overview.statusPipeline.forEach((s) => {
    lines.push([
      escapeCsvCell(s.statusCode),
      escapeCsvCell(s.statusName),
      s.poCount,
      s.tyresCount,
      s.netSpend,
      `${s.percentageOfSpend}%`,
    ].join(","))
  })
  lines.push("")

  // Top Suppliers
  lines.push(`"--- TOP SUPPLIERS BY SPEND ---"`)
  lines.push(`"Supplier Code","Supplier Name","Total Orders","Units Supplied","Total Spend (LKR)","On-Time Delivery Rate (%)"`)
  overview.topSuppliers.forEach((sup) => {
    lines.push([
      escapeCsvCell(sup.supplierCode),
      escapeCsvCell(sup.supplierName),
      sup.totalPOs,
      sup.totalUnitsSupplied,
      sup.totalSpend,
      `${sup.onTimeDeliveryRate}%`,
    ].join(","))
  })
  lines.push("")

  // Top Procured Tyres
  lines.push(`"--- TOP PROCURED TYRES ---"`)
  lines.push(`"Brand","Size","Pattern","Units Ordered","Avg Unit Price (LKR)","Net Spend (LKR)"`)
  overview.topTyres.forEach((t) => {
    lines.push([
      escapeCsvCell(t.brand),
      escapeCsvCell(t.size),
      escapeCsvCell(t.pattern),
      t.unitsOrdered,
      t.averageUnitPrice,
      t.netSpend,
    ].join(","))
  })

  const filename = `PO_Procurement_Summary_${range.fromDate}_to_${range.toDate}.csv`

  return {
    filename,
    csvContent: lines.join("\r\n"),
    mimeType: "text/csv; charset=utf-8",
  }
}
