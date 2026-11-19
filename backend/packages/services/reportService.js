const reportRepo = require("../repositories/reportRepository")
const {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  CHART_INTERVALS,
  TRANSACTION_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
} = require("../constants/reportConstants")

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
 * 1. Get comprehensive sales overview for dashboard / analytics.
 * Combines summary metrics, growth comparison, charts time-series,
 * payment breakdown, top products, and top customers.
 */
exports.getSalesReportOverview = async (params = {}) => {
  const range = resolveDateRange(params)

  // 1. Fetch current summary and prior summary in parallel
  const currentSummary = reportRepo.getSalesSummary({
    fromDate: range.fromDate,
    toDate: range.toDate,
  })

  const priorSummary = reportRepo.getSalesSummary({
    fromDate: range.priorPeriod.fromDate,
    toDate: range.priorPeriod.toDate,
  })

  // 2. Fetch TimeSeries data for charts
  const timeSeries = reportRepo.getSalesTimeSeries({
    fromDate: range.fromDate,
    toDate: range.toDate,
    interval: range.interval,
  })

  // 3. Fetch payment breakdown
  const paymentBreakdown = reportRepo.getPaymentMethodBreakdown({
    fromDate: range.fromDate,
    toDate: range.toDate,
  })

  // 4. Fetch top selling products
  const topProducts = reportRepo.getTopSellingProducts({
    fromDate: range.fromDate,
    toDate: range.toDate,
    limit: Number(params.limitTop) || 5,
    category: "all",
  })

  // 5. Fetch customer leaderboard
  const topCustomers = reportRepo.getCustomerLeaderboard({
    fromDate: range.fromDate,
    toDate: range.toDate,
    limit: Number(params.limitTop) || 5,
  })

  // 6. Calculate period-over-period growth rates
  const growth = {
    netRevenueGrowth: calculateGrowth(currentSummary.netRevenue, priorSummary.netRevenue),
    grossRevenueGrowth: calculateGrowth(currentSummary.grossRevenue, priorSummary.grossRevenue),
    transactionsGrowth: calculateGrowth(currentSummary.totalTransactions, priorSummary.totalTransactions),
    averageOrderValueGrowth: calculateGrowth(currentSummary.averageOrderValue, priorSummary.averageOrderValue),
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
    paymentBreakdown,
    topProducts,
    topCustomers,
  }
}

/**
 * 2. Get paginated transaction ledger with enriched display fields.
 */
exports.getSalesTransactionsReport = async (params = {}) => {
  const range = resolveDateRange(params)

  const result = reportRepo.getSalesTransactions({
    fromDate: range.fromDate,
    toDate: range.toDate,
    category: params.category || TRANSACTION_CATEGORIES.ALL,
    searchTerm: params.searchTerm || "",
    limit: params.limit || 50,
    offset: params.offset || 0,
    sortBy: params.sortBy || "transactionDate",
    sortOrder: params.sortOrder || "DESC",
  })

  // Enrich transactions with presentation metadata
  const enrichedTransactions = result.transactions.map((tx) => {
    let categoryLabel = TRANSACTION_CATEGORY_LABELS[tx.category] || tx.category
    let categoryBadgeVariant = "info"

    if (tx.category === TRANSACTION_CATEGORIES.TYRE_SALE) {
      categoryBadgeVariant = "primary"
    } else if (tx.category === TRANSACTION_CATEGORIES.DAG_RETREAD) {
      categoryBadgeVariant = "warning"
    } else if (tx.category === TRANSACTION_CATEGORIES.OTHER_SERVICE) {
      categoryBadgeVariant = "success"
    }

    return {
      ...tx,
      categoryLabel,
      categoryBadgeVariant,
      formattedGross: `Rs. ${tx.grossAmount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedDiscount: `Rs. ${tx.discountAmount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedNet: `Rs. ${tx.netAmount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
    filterCategory: params.category || TRANSACTION_CATEGORIES.ALL,
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
 * 4. Generate CSV export files for Sales Reports.
 * Supports types: 'transactions' | 'summary' | 'top_products'
 */
exports.exportSalesReportToCsv = async ({
  type = "transactions",
  preset,
  fromDate,
  toDate,
  category = TRANSACTION_CATEGORIES.ALL,
  searchTerm = "",
} = {}) => {
  const range = resolveDateRange({ preset, fromDate, toDate })

  if (type === "transactions") {
    // Retrieve up to 10,000 records for full export
    const data = reportRepo.getSalesTransactions({
      fromDate: range.fromDate,
      toDate: range.toDate,
      category,
      searchTerm,
      limit: 10000,
      offset: 0,
      sortBy: "transactionDate",
      sortOrder: "DESC",
    })

    const headers = [
      "Transaction ID",
      "Reference No",
      "Date",
      "Full Timestamp",
      "Channel",
      "Customer Name",
      "Customer Code",
      "Gross Amount (LKR)",
      "Discount Amount (LKR)",
      "Net Amount (LKR)",
      "Payment Completed",
      "Order Completed",
    ]

    const rows = data.transactions.map((t) => [
      t.id,
      t.referenceNo,
      t.transactionDate,
      t.fullDateTime,
      TRANSACTION_CATEGORY_LABELS[t.category] || t.category,
      t.customerName,
      t.customerCode || "",
      t.grossAmount.toFixed(2),
      t.discountAmount.toFixed(2),
      t.netAmount.toFixed(2),
      t.isPaymentCompleted ? "YES" : "NO",
      t.isCompleted ? "YES" : "NO",
    ])

    const csvLines = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ]

    return {
      filename: `Sales_Transactions_${range.fromDate}_to_${range.toDate}.csv`,
      csvContent: csvLines.join("\r\n"),
      mimeType: "text/csv",
    }
  }

  if (type === "summary") {
    const summary = reportRepo.getSalesSummary({ fromDate: range.fromDate, toDate: range.toDate })
    const payments = reportRepo.getPaymentMethodBreakdown({ fromDate: range.fromDate, toDate: range.toDate })

    const lines = [
      ["TYREMATE - SALES EXECUTIVE SUMMARY REPORT"],
      [`Date Range: ${range.fromDate} to ${range.toDate} (${range.label})`],
      [`Generated At: ${new Date().toLocaleString()}`],
      [],
      ["EXECUTIVE KPIS", "VALUE (LKR)"],
      ["Gross Revenue", summary.grossRevenue.toFixed(2)],
      ["Total Discounts", summary.totalDiscounts.toFixed(2)],
      ["Returns / Credit Notes", summary.totalReturns.toFixed(2)],
      ["Net Revenue", summary.netRevenue.toFixed(2)],
      ["Total Transactions Count", summary.totalTransactions],
      ["Average Order Value", summary.averageOrderValue.toFixed(2)],
      [],
      ["REVENUE BY CHANNEL", "TRANSACTIONS", "GROSS (LKR)", "DISCOUNT (LKR)", "NET (LKR)"],
      [
        "Tyre Sales Orders",
        summary.channels.tyres.orderCount,
        summary.channels.tyres.grossAmount.toFixed(2),
        summary.channels.tyres.discountAmount.toFixed(2),
        summary.channels.tyres.netAmount.toFixed(2),
      ],
      [
        "DAG Retreading Services",
        summary.channels.dag.takeCount,
        summary.channels.dag.grossAmount.toFixed(2),
        "0.00",
        summary.channels.dag.netAmount.toFixed(2),
      ],
      [
        "Workshop Bay Services",
        summary.channels.otherServices.serviceCount,
        summary.channels.otherServices.grossAmount.toFixed(2),
        "0.00",
        summary.channels.otherServices.netAmount.toFixed(2),
      ],
      [],
      ["PAYMENT SETTLEMENTS", "AMOUNT (LKR)", "TRANSACTIONS COUNT"],
      ["Cash Collected", payments.cash.amount.toFixed(2), payments.cash.count],
      ["Cheque Collected", payments.cheque.collectedAmount.toFixed(2), payments.cheque.collectedCount],
      ["Cheque Pending", payments.cheque.pendingAmount.toFixed(2), payments.cheque.pendingCount],
      ["Bank Transfer", payments.bankTransfer.amount.toFixed(2), payments.bankTransfer.count],
      ["Total Settled Funds", payments.totalSettled.toFixed(2), ""],
      ["Total Pending Funds", payments.totalPending.toFixed(2), ""],
    ]

    return {
      filename: `Sales_Summary_${range.fromDate}_to_${range.toDate}.csv`,
      csvContent: lines.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n"),
      mimeType: "text/csv",
    }
  }

  if (type === "top_products") {
    const products = reportRepo.getTopSellingProducts({
      fromDate: range.fromDate,
      toDate: range.toDate,
      limit: 50,
      category: "all",
    })

    const lines = [
      ["TYREMATE - TOP SELLING PRODUCTS & SERVICES"],
      [`Date Range: ${range.fromDate} to ${range.toDate} (${range.label})`],
      [],
      ["1. TOP TYRE SALES"],
      ["Brand", "Size", "Pattern", "Units Sold", "Gross Revenue (LKR)", "Net Revenue (LKR)"],
      ...products.tyres.map((t) => [
        t.brand,
        t.size,
        t.pattern,
        t.unitsSold,
        t.grossRevenue.toFixed(2),
        t.netRevenue.toFixed(2),
      ]),
      [],
      ["2. TOP DAG RETREADING PATTERNS"],
      ["Brand", "Size", "Pattern", "Units Retreaded", "Net Revenue (LKR)"],
      ...products.dagTyres.map((d) => [
        d.brand,
        d.size,
        d.pattern,
        d.unitsRetreaded,
        d.netRevenue.toFixed(2),
      ]),
      [],
      ["3. TOP WORKSHOP CONSUMABLES"],
      ["Name", "Category", "Unit", "Units Used", "Net Revenue (LKR)"],
      ...products.consumables.map((c) => [
        c.name,
        c.category,
        c.unit,
        c.unitsUsed,
        c.netRevenue.toFixed(2),
      ]),
    ]

    return {
      filename: `Top_Products_${range.fromDate}_to_${range.toDate}.csv`,
      csvContent: lines.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n"),
      mimeType: "text/csv",
    }
  }

  throw new Error(`Unsupported export type: ${type}`)
}

module.exports = {
  resolveDateRange,
  getSalesReportOverview: exports.getSalesReportOverview,
  getSalesTransactionsReport: exports.getSalesTransactionsReport,
  exportSalesReportToCsv: exports.exportSalesReportToCsv,
}
