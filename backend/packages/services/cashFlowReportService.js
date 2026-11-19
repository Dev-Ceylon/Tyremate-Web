const cashFlowRepo = require("../repositories/cashFlowReportRepository")
const {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  FLOW_TYPES,
  FLOW_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  CHEQUE_STATUSES,
} = require("../constants/cashFlowReportConstants")

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
 * Defaults to TODAY for the Daily Cash Flow & Treasury Report.
 */
function resolveDateRange({ preset = DATE_PRESETS.TODAY, fromDate, toDate, interval } = {}) {
  const now = new Date()
  const todayStr = formatLocalDate(now)

  let from = todayStr
  let to = todayStr
  let resolvedInterval = CHART_INTERVALS.DAY
  let activePreset = preset || DATE_PRESETS.TODAY

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

  // If client explicitly requested an interval, respect it
  if (interval && Object.values(CHART_INTERVALS).includes(interval)) {
    resolvedInterval = interval
  }

  // Calculate prior period of equivalent duration for comparison
  const fromObj = parseLocalDate(from)
  const toObj = parseLocalDate(to)
  const durationDays = Math.max(1, Math.round((toObj - fromObj) / (1000 * 60 * 60 * 24)) + 1)
  const priorToDate = formatLocalDate(addDays(fromObj, -1))
  const priorFromDate = formatLocalDate(addDays(fromObj, -durationDays))

  return {
    preset: activePreset,
    label: DATE_PRESET_LABELS[activePreset] || "Custom Range",
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
 * Calculate percentage growth between current and prior period
 */
function calculateGrowth(current, previous) {
  const curr = Number(current || 0)
  const prev = Number(previous || 0)

  if (prev === 0) {
    return curr > 0 ? 100 : curr < 0 ? -100 : 0
  }

  const change = ((curr - prev) / Math.abs(prev)) * 100
  return Number(change.toFixed(1))
}

/**
 * 1. Comprehensive Cash Flow Overview for the executive dashboard.
 * Returns summarized realized inflows, pending inflows, outflows, net positions,
 * period-over-period comparison deltas, time-series chart data, and instrument breakdowns.
 */
exports.getCashFlowOverview = async (params = {}) => {
  const range = resolveDateRange(params)

  // 1. Fetch current summary and prior period summary
  const currentSummary = cashFlowRepo.getCashFlowSummary({
    fromDate: range.fromDate,
    toDate: range.toDate,
  })

  const priorSummary = cashFlowRepo.getCashFlowSummary({
    fromDate: range.priorPeriod.fromDate,
    toDate: range.priorPeriod.toDate,
  })

  // 2. Fetch Time Series data for continuous trend charting
  const timeSeries = cashFlowRepo.getCashFlowTimeSeries({
    fromDate: range.fromDate,
    toDate: range.toDate,
    interval: range.interval,
  })

  // 3. Fetch payment instruments and categorical disbursements breakdown
  const methodBreakdown = cashFlowRepo.getCashFlowMethodBreakdown({
    fromDate: range.fromDate,
    toDate: range.toDate,
  })

  // 4. Construct growth comparison object
  const comparison = {
    priorPeriod: range.priorPeriod,
    inflowGrowth: calculateGrowth(currentSummary.totalRealizedInflow, priorSummary.totalRealizedInflow),
    outflowGrowth: calculateGrowth(currentSummary.totalOutflow, priorSummary.totalOutflow),
    netGrowth: calculateGrowth(currentSummary.netRealizedCashFlow, priorSummary.netRealizedCashFlow),
    expectedInflowGrowth: calculateGrowth(currentSummary.totalExpectedInflow, priorSummary.totalExpectedInflow),
    cashGrowth: calculateGrowth(currentSummary.inflow.cash, priorSummary.inflow.cash),
    bankTransferGrowth: calculateGrowth(currentSummary.inflow.bankTransfer, priorSummary.inflow.bankTransfer),
    chequeCollectedGrowth: calculateGrowth(currentSummary.inflow.chequeCollected, priorSummary.inflow.chequeCollected),
    chequePendingGrowth: calculateGrowth(currentSummary.inflow.chequePending, priorSummary.inflow.chequePending),
    poSpendGrowth: calculateGrowth(currentSummary.outflow.poSpend, priorSummary.outflow.poSpend),
    refundGrowth: calculateGrowth(currentSummary.outflow.refundTotal, priorSummary.outflow.refundTotal),
    priorTotalInflow: priorSummary.totalRealizedInflow,
    priorTotalOutflow: priorSummary.totalOutflow,
    priorNetCash: priorSummary.netRealizedCashFlow,
  }

  return {
    dateRange: {
      preset: range.preset,
      label: range.label,
      fromDate: range.fromDate,
      toDate: range.toDate,
      durationDays: range.durationDays,
      interval: range.interval,
      priorPeriod: range.priorPeriod,
    },
    summary: {
      ...currentSummary,
      comparison,
    },
    timeSeries,
    methodBreakdown,
  }
}

/**
 * 2. Get paginated and filterable Cash Flow Movement Ledger.
 */
exports.getCashFlowLedger = async (params = {}) => {
  const range = resolveDateRange({
    preset: params.preset || (params.fromDate && params.toDate ? DATE_PRESETS.CUSTOM : DATE_PRESETS.TODAY),
    fromDate: params.fromDate,
    toDate: params.toDate,
  })

  const result = cashFlowRepo.getCashFlowLedger({
    fromDate: range.fromDate,
    toDate: range.toDate,
    flowType: params.flowType || FLOW_TYPES.ALL,
    paymentMethod: params.paymentMethod || PAYMENT_METHODS.ALL,
    searchTerm: params.searchTerm || "",
    limit: Number(params.limit) || 25,
    offset: Number(params.offset) || 0,
    sortBy: params.sortBy || "date",
    sortOrder: params.sortOrder || "DESC",
  })

  return {
    ...result,
    dateRange: {
      preset: range.preset,
      label: range.label,
      fromDate: range.fromDate,
      toDate: range.toDate,
    },
    filterFlowType: params.flowType || FLOW_TYPES.ALL,
    filterPaymentMethod: params.paymentMethod || PAYMENT_METHODS.ALL,
    searchTerm: params.searchTerm || "",
  }
}

/**
 * 3. Helper to escape and format CSV cells adhering to RFC-4180
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '""'
  const stringValue = String(value)
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * 4. Generate CSV export files for Cash Flow Reports.
 * Supports types: 'ledger' | 'summary'
 */
exports.exportCashFlowToCsv = async ({
  type = "ledger",
  preset = DATE_PRESETS.TODAY,
  fromDate,
  toDate,
  flowType = FLOW_TYPES.ALL,
  paymentMethod = PAYMENT_METHODS.ALL,
  searchTerm = "",
} = {}) => {
  const range = resolveDateRange({ preset, fromDate, toDate })

  if (type === "ledger") {
    // Export up to 10,000 movements
    const data = cashFlowRepo.getCashFlowLedger({
      fromDate: range.fromDate,
      toDate: range.toDate,
      flowType,
      paymentMethod,
      searchTerm,
      limit: 10000,
      offset: 0,
      sortBy: "date",
      sortOrder: "DESC",
    })

    const headers = [
      "Tx ID",
      "Date",
      "Timestamp",
      "Flow Type",
      "Payment Instrument",
      "Category",
      "Reference No",
      "Counterparty",
      "Cheque / Instrument Ref",
      "Status",
      "Inflow (LKR)",
      "Outflow (LKR)",
      "Net Cash Impact (LKR)",
    ]

    const rows = data.items.map((item) => [
      item.id,
      item.txDate,
      item.fullDateTime,
      item.flowTypeLabel,
      item.paymentMethodLabel,
      item.category,
      item.referenceNo,
      item.partyName,
      item.instrumentReference,
      item.statusLabel,
      item.inflowAmount.toFixed(2),
      item.outflowAmount.toFixed(2),
      item.netAmount.toFixed(2),
    ])

    const csvLines = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ]

    const filename = `Cash_Flow_Ledger_${range.fromDate}_to_${range.toDate}.csv`

    return {
      filename,
      csvContent: csvLines.join("\r\n"),
      mimeType: "text/csv; charset=utf-8",
    }
  }

  // Executive summary export
  const overview = await exports.getCashFlowOverview({
    preset,
    fromDate,
    toDate,
  })

  const lines = []

  // 1. Report Header Section
  lines.push(`"DAILY CASH INCOMING & OUTGOING TREASURY REPORT"`)
  lines.push(`"Date Range:","${range.fromDate} to ${range.toDate} (${range.label})"`)
  lines.push(`"Generated At:","${new Date().toISOString()}"`)
  lines.push("")

  // 2. Financial Position Overview
  lines.push(`"--- TREASURY FINANCIAL OVERVIEW ---"`)
  lines.push(`"Financial Metric","Amount (LKR)","Transaction Count"`)
  lines.push(`"Realized Cash Inflow (Liquid)",${overview.summary.totalRealizedInflow},${overview.summary.inflow.cashCount + overview.summary.inflow.bankTransferCount + overview.summary.inflow.chequeCollectedCount}`)
  lines.push(`"Total Cash Outflow (Disbursements)",${overview.summary.totalOutflow},${overview.summary.outflow.totalCount}`)
  lines.push(`"Net Realized Cash Position",${overview.summary.netRealizedCashFlow},${overview.summary.counts.totalTransactions}`)
  lines.push(`"Pending Cheques In-Clearing",${overview.summary.inflow.chequePending},${overview.summary.inflow.chequePendingCount}`)
  lines.push(`"Projected Net Cash (Incl. Uncleared)",${overview.summary.netProjectedCashFlow},"-"`)
  lines.push("")

  // 3. Inflow Breakdown by Payment Instrument
  lines.push(`"--- INFLOW INSTRUMENT BREAKDOWN ---"`)
  lines.push(`"Payment Method","Amount (LKR)","Transactions","Share of Realized (%)","Clearance Status"`)
  overview.methodBreakdown.inflowMethods.forEach((m) => {
    lines.push([
      escapeCsvCell(m.methodLabel),
      m.amount,
      m.count,
      `${m.percentage}%`,
      m.isPending ? "Pending Clearance" : "Realized",
    ].join(","))
  })
  lines.push("")

  // 4. Outflow Breakdown by Disbursement Stream
  lines.push(`"--- OUTFLOW CATEGORY BREAKDOWN ---"`)
  lines.push(`"Outflow Category","Amount (LKR)","Orders/Refunds","Share of Outflow (%)"`)
  overview.methodBreakdown.outflowCategories.forEach((cat) => {
    lines.push([
      escapeCsvCell(cat.categoryLabel),
      cat.amount,
      cat.count,
      `${cat.percentage}%`,
    ].join(","))
  })
  lines.push("")

  // 5. Inflow Revenue Streams Breakdown
  lines.push(`"--- INFLOW REVENUE STREAMS ---"`)
  lines.push(`"Revenue Stream","Amount Realized (LKR)"`)
  lines.push(`"Tyre Sales (Sales Orders)",${overview.methodBreakdown.inflowStreams.tyreSales}`)
  lines.push(`"DAG Retreading Sales",${overview.methodBreakdown.inflowStreams.dagSales}`)
  lines.push(`"Workshop Services & Repairs",${overview.methodBreakdown.inflowStreams.serviceSales}`)
  lines.push("")

  // 6. Time Series Movement Breakdown
  lines.push(`"--- DAILY CASH MOVEMENT BREAKDOWN ---"`)
  lines.push(`"Period","Cash In (LKR)","Cash Out (LKR)","Net Movement (LKR)","Inflow Count","Outflow Count"`)
  overview.timeSeries.forEach((pt) => {
    lines.push([
      escapeCsvCell(pt.period),
      pt.totalInflow,
      pt.totalOutflow,
      pt.netCashFlow,
      pt.inflowCount,
      pt.outflowCount,
    ].join(","))
  })

  const filename = `Cash_Flow_Summary_${range.fromDate}_to_${range.toDate}.csv`

  return {
    filename,
    csvContent: lines.join("\r\n"),
    mimeType: "text/csv; charset=utf-8",
  }
}
