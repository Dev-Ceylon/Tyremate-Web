const db = require("../database/connection")

/**
 * Validates date strings in YYYY-MM-DD format.
 */
function normalizeDate(dateStr, fallback) {
  if (!dateStr || typeof dateStr !== "string") return fallback
  const trimmed = dateStr.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : fallback
}

/**
 * Ensures fromDate is not after toDate.
 */
function sanitizeDateRange(fromDate, toDate) {
  const today = new Date().toISOString().slice(0, 10)
  let from = normalizeDate(fromDate, today)
  let to = normalizeDate(toDate, today)
  if (from > to) {
    const temp = from
    from = to
    to = temp
  }
  return { fromDate: from, toDate: to }
}

/**
 * 1. High-level aggregated cash flow summary for the given date range.
 * Calculates realized inflows (Cash, Bank Transfer, Cleared Cheques),
 * pending inflows (Uncleared Cheques), total outflows (PO Spend, Refunds),
 * and net liquid position.
 */
exports.getCashFlowSummary = ({ fromDate, toDate }) => {
  const range = sanitizeDateRange(fromDate, toDate)

  // 1a. Inflows from Payments table
  const inflowRow = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn) ELSE 0 END), 0) AS cashTotal,
        COALESCE(SUM(CASE WHEN btp.ID IS NOT NULL THEN btp.Amount ELSE 0 END), 0) AS bankTransferTotal,
        COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS chequeCollectedTotal,
        COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND (chp.Collected = 0 OR chp.Collected IS NULL) THEN chp.Amount ELSE 0 END), 0) AS chequePendingTotal,
        COUNT(DISTINCT cp.ID) AS cashCount,
        COUNT(DISTINCT btp.ID) AS bankTransferCount,
        COUNT(DISTINCT CASE WHEN chp.Collected = 1 THEN chp.ID END) AS chequeCollectedCount,
        COUNT(DISTINCT CASE WHEN chp.Collected = 0 OR chp.Collected IS NULL THEN chp.ID END) AS chequePendingCount,
        COUNT(DISTINCT p.ID) AS totalInflowCount
      FROM Payments p
      LEFT JOIN CashPayments cp ON cp.PaymentID = p.ID
      LEFT JOIN BankTransferPayments btp ON btp.PaymentID = p.ID
      LEFT JOIN ChequePayments chp ON chp.PaymentID = p.ID
      WHERE substr(p.CreatedDate, 1, 10) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  // 1b. Outflow from Purchase Orders
  const poRow = db
    .prepare(`
      SELECT
        COUNT(DISTINCT p.ID) AS poCount,
        COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS poSpend
      FROM PO p
      LEFT JOIN POTyres pt ON pt.POID = p.ID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  // 1c. Outflow from Customer Refunds
  const refundRow = db
    .prepare(`
      SELECT
        COUNT(r.RefundID) AS refundCount,
        COALESCE(SUM(r.Amount), 0) AS refundTotal
      FROM RefundM r
      WHERE substr(COALESCE(r.ProcessedDate, r.CreatedAt), 1, 10) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  // Inflow metrics
  const cashTotal = Number(Number(inflowRow?.cashTotal || 0).toFixed(2))
  const bankTransferTotal = Number(Number(inflowRow?.bankTransferTotal || 0).toFixed(2))
  const chequeCollectedTotal = Number(Number(inflowRow?.chequeCollectedTotal || 0).toFixed(2))
  const chequePendingTotal = Number(Number(inflowRow?.chequePendingTotal || 0).toFixed(2))

  const totalRealizedInflow = Number((cashTotal + bankTransferTotal + chequeCollectedTotal).toFixed(2))
  const totalExpectedInflow = Number((totalRealizedInflow + chequePendingTotal).toFixed(2))

  // Outflow metrics
  const poSpend = Number(Number(poRow?.poSpend || 0).toFixed(2))
  const refundTotal = Number(Number(refundRow?.refundTotal || 0).toFixed(2))
  const totalOutflow = Number((poSpend + refundTotal).toFixed(2))

  // Net Cash Position
  const netRealizedCashFlow = Number((totalRealizedInflow - totalOutflow).toFixed(2))
  const netProjectedCashFlow = Number((totalExpectedInflow - totalOutflow).toFixed(2))

  return {
    dateRange: range,
    // Realized liquid position
    totalRealizedInflow,
    totalOutflow,
    netRealizedCashFlow,
    netProjectedCashFlow,
    // Detailed Inflows
    inflow: {
      cash: cashTotal,
      bankTransfer: bankTransferTotal,
      chequeCollected: chequeCollectedTotal,
      chequePending: chequePendingTotal,
      totalRealized: totalRealizedInflow,
      totalExpected: totalExpectedInflow,
      cashCount: Number(inflowRow?.cashCount || 0),
      bankTransferCount: Number(inflowRow?.bankTransferCount || 0),
      chequeCollectedCount: Number(inflowRow?.chequeCollectedCount || 0),
      chequePendingCount: Number(inflowRow?.chequePendingCount || 0),
      totalCount: Number(inflowRow?.totalInflowCount || 0),
    },
    // Detailed Outflows
    outflow: {
      poSpend,
      refundTotal,
      totalOutflow,
      poCount: Number(poRow?.poCount || 0),
      refundCount: Number(refundRow?.refundCount || 0),
      totalCount: Number(poRow?.poCount || 0) + Number(refundRow?.refundCount || 0),
    },
    counts: {
      inflowTransactions: Number(inflowRow?.totalInflowCount || 0),
      outflowTransactions: Number(poRow?.poCount || 0) + Number(refundRow?.refundCount || 0),
      totalTransactions:
        Number(inflowRow?.totalInflowCount || 0) +
        Number(poRow?.poCount || 0) +
        Number(refundRow?.refundCount || 0),
    },
  }
}

/**
 * 2. Get periodic time-series cash flow data for charts.
 * Supports intervals: 'day' | 'week' | 'month' | 'year'.
 * For daily grouping, generates full calendar with zero-fill so there are no graph gaps.
 */
exports.getCashFlowTimeSeries = ({ fromDate, toDate, interval = "day" }) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const validInterval = ["day", "week", "month", "year"].includes(interval) ? interval : "day"

  if (validInterval === "day") {
    // Continuous daily series via SQLite recursive CTE
    const query = `
      WITH RECURSIVE calendar(cal_date) AS (
        SELECT ?
        UNION ALL
        SELECT date(cal_date, '+1 day')
        FROM calendar
        WHERE cal_date < ?
      ),
      daily_inflows AS (
        SELECT
          substr(p.CreatedDate, 1, 10) AS d,
          COALESCE(SUM(CASE WHEN cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn) ELSE 0 END), 0) AS cash,
          COALESCE(SUM(CASE WHEN btp.ID IS NOT NULL THEN btp.Amount ELSE 0 END), 0) AS bank,
          COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS chequeCollected,
          COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND (chp.Collected = 0 OR chp.Collected IS NULL) THEN chp.Amount ELSE 0 END), 0) AS chequePending,
          COUNT(DISTINCT p.ID) AS txCount
        FROM Payments p
        LEFT JOIN CashPayments cp ON cp.PaymentID = p.ID
        LEFT JOIN BankTransferPayments btp ON btp.PaymentID = p.ID
        LEFT JOIN ChequePayments chp ON chp.PaymentID = p.ID
        WHERE substr(p.CreatedDate, 1, 10) BETWEEN ? AND ?
        GROUP BY d
      ),
      daily_po AS (
        SELECT
          substr(p.Date, 1, 10) AS d,
          COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS poOutflow,
          COUNT(DISTINCT p.ID) AS poCount
        FROM PO p
        LEFT JOIN POTyres pt ON pt.POID = p.ID
        WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
        GROUP BY d
      ),
      daily_refunds AS (
        SELECT
          substr(COALESCE(r.ProcessedDate, r.CreatedAt), 1, 10) AS d,
          COALESCE(SUM(r.Amount), 0) AS refundOutflow,
          COUNT(r.RefundID) AS refundCount
        FROM RefundM r
        WHERE substr(COALESCE(r.ProcessedDate, r.CreatedAt), 1, 10) BETWEEN ? AND ?
        GROUP BY d
      )
      SELECT
        c.cal_date AS period,
        COALESCE(di.cash, 0) AS inflowCash,
        COALESCE(di.bank, 0) AS inflowBank,
        COALESCE(di.chequeCollected, 0) AS inflowChequeCleared,
        COALESCE(di.chequePending, 0) AS inflowChequePending,
        (COALESCE(di.cash, 0) + COALESCE(di.bank, 0) + COALESCE(di.chequeCollected, 0)) AS totalInflow,
        COALESCE(dp.poOutflow, 0) AS outflowPO,
        COALESCE(dr.refundOutflow, 0) AS outflowRefund,
        (COALESCE(dp.poOutflow, 0) + COALESCE(dr.refundOutflow, 0)) AS totalOutflow,
        ((COALESCE(di.cash, 0) + COALESCE(di.bank, 0) + COALESCE(di.chequeCollected, 0)) - (COALESCE(dp.poOutflow, 0) + COALESCE(dr.refundOutflow, 0))) AS netCashFlow,
        COALESCE(di.txCount, 0) AS inflowCount,
        (COALESCE(dp.poCount, 0) + COALESCE(dr.refundCount, 0)) AS outflowCount
      FROM calendar c
      LEFT JOIN daily_inflows di ON di.d = c.cal_date
      LEFT JOIN daily_po dp ON dp.d = c.cal_date
      LEFT JOIN daily_refunds dr ON dr.d = c.cal_date
      ORDER BY c.cal_date ASC
    `

    const rows = db
      .prepare(query)
      .all(
        range.fromDate,
        range.toDate,
        range.fromDate,
        range.toDate,
        range.fromDate,
        range.toDate,
        range.fromDate,
        range.toDate
      )

    return rows.map((r) => ({
      period: r.period,
      inflowCash: Number(Number(r.inflowCash || 0).toFixed(2)),
      inflowBank: Number(Number(r.inflowBank || 0).toFixed(2)),
      inflowChequeCleared: Number(Number(r.inflowChequeCleared || 0).toFixed(2)),
      inflowChequePending: Number(Number(r.inflowChequePending || 0).toFixed(2)),
      totalInflow: Number(Number(r.totalInflow || 0).toFixed(2)),
      outflowPO: Number(Number(r.outflowPO || 0).toFixed(2)),
      outflowRefund: Number(Number(r.outflowRefund || 0).toFixed(2)),
      totalOutflow: Number(Number(r.totalOutflow || 0).toFixed(2)),
      netCashFlow: Number(Number(r.netCashFlow || 0).toFixed(2)),
      inflowCount: Number(r.inflowCount || 0),
      outflowCount: Number(r.outflowCount || 0),
    }))
  }

  // Non-daily intervals (week, month, year)
  let strftimePattern = "%Y-%m-%d"
  if (validInterval === "week") {
    strftimePattern = "%Y-W%W"
  } else if (validInterval === "month") {
    strftimePattern = "%Y-%m"
  } else {
    strftimePattern = "%Y"
  }

  const query = `
    WITH period_inflows AS (
      SELECT
        strftime('${strftimePattern}', p.CreatedDate) AS period,
        COALESCE(SUM(CASE WHEN cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn) ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN btp.ID IS NOT NULL THEN btp.Amount ELSE 0 END), 0) AS bank,
        COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS chequeCollected,
        COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND (chp.Collected = 0 OR chp.Collected IS NULL) THEN chp.Amount ELSE 0 END), 0) AS chequePending,
        COUNT(DISTINCT p.ID) AS txCount
      FROM Payments p
      LEFT JOIN CashPayments cp ON cp.PaymentID = p.ID
      LEFT JOIN BankTransferPayments btp ON btp.PaymentID = p.ID
      LEFT JOIN ChequePayments chp ON chp.PaymentID = p.ID
      WHERE substr(p.CreatedDate, 1, 10) BETWEEN ? AND ?
      GROUP BY period
    ),
    period_po AS (
      SELECT
        strftime('${strftimePattern}', p.Date) AS period,
        COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS poOutflow,
        COUNT(DISTINCT p.ID) AS poCount
      FROM PO p
      LEFT JOIN POTyres pt ON pt.POID = p.ID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
      GROUP BY period
    ),
    period_refunds AS (
      SELECT
        strftime('${strftimePattern}', COALESCE(r.ProcessedDate, r.CreatedAt)) AS period,
        COALESCE(SUM(r.Amount), 0) AS refundOutflow,
        COUNT(r.RefundID) AS refundCount
      FROM RefundM r
      WHERE substr(COALESCE(r.ProcessedDate, r.CreatedAt), 1, 10) BETWEEN ? AND ?
      GROUP BY period
    ),
    all_periods AS (
      SELECT period FROM period_inflows
      UNION SELECT period FROM period_po
      UNION SELECT period FROM period_refunds
    )
    SELECT
      ap.period,
      COALESCE(pi.cash, 0) AS inflowCash,
      COALESCE(pi.bank, 0) AS inflowBank,
      COALESCE(pi.chequeCollected, 0) AS inflowChequeCleared,
      COALESCE(pi.chequePending, 0) AS inflowChequePending,
      (COALESCE(pi.cash, 0) + COALESCE(pi.bank, 0) + COALESCE(pi.chequeCollected, 0)) AS totalInflow,
      COALESCE(po.poOutflow, 0) AS outflowPO,
      COALESCE(pr.refundOutflow, 0) AS outflowRefund,
      (COALESCE(po.poOutflow, 0) + COALESCE(pr.refundOutflow, 0)) AS totalOutflow,
      ((COALESCE(pi.cash, 0) + COALESCE(pi.bank, 0) + COALESCE(pi.chequeCollected, 0)) - (COALESCE(po.poOutflow, 0) + COALESCE(pr.refundOutflow, 0))) AS netCashFlow,
      COALESCE(pi.txCount, 0) AS inflowCount,
      (COALESCE(po.poCount, 0) + COALESCE(pr.refundCount, 0)) AS outflowCount
    FROM all_periods ap
    LEFT JOIN period_inflows pi ON pi.period = ap.period
    LEFT JOIN period_po po ON po.period = ap.period
    LEFT JOIN period_refunds pr ON pr.period = ap.period
    ORDER BY ap.period ASC
  `

  const rows = db
    .prepare(query)
    .all(range.fromDate, range.toDate, range.fromDate, range.toDate, range.fromDate, range.toDate)

  return rows.map((r) => ({
    period: r.period,
    inflowCash: Number(Number(r.inflowCash || 0).toFixed(2)),
    inflowBank: Number(Number(r.inflowBank || 0).toFixed(2)),
    inflowChequeCleared: Number(Number(r.inflowChequeCleared || 0).toFixed(2)),
    inflowChequePending: Number(Number(r.inflowChequePending || 0).toFixed(2)),
    totalInflow: Number(Number(r.totalInflow || 0).toFixed(2)),
    outflowPO: Number(Number(r.outflowPO || 0).toFixed(2)),
    outflowRefund: Number(Number(r.outflowRefund || 0).toFixed(2)),
    totalOutflow: Number(Number(r.totalOutflow || 0).toFixed(2)),
    netCashFlow: Number(Number(r.netCashFlow || 0).toFixed(2)),
    inflowCount: Number(r.inflowCount || 0),
    outflowCount: Number(r.outflowCount || 0),
  }))
}

/**
 * 3. Categorical breakdown of payment instruments and revenue/disbursement streams.
 */
exports.getCashFlowMethodBreakdown = ({ fromDate, toDate }) => {
  const summary = exports.getCashFlowSummary({ fromDate, toDate })
  const totalInflow = summary.totalRealizedInflow
  const totalOutflow = summary.totalOutflow

  const calcPct = (amount, total) => (total > 0 ? Number(((amount / total) * 100).toFixed(1)) : 0)

  // Inflow by channel/source
  const channelInflows = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN sop.ID IS NOT NULL AND cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn)
                          WHEN sop.ID IS NOT NULL AND btp.ID IS NOT NULL THEN btp.Amount
                          WHEN sop.ID IS NOT NULL AND chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS tyreSalesRealized,
        COALESCE(SUM(CASE WHEN dagp.ID IS NOT NULL AND cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn)
                          WHEN dagp.ID IS NOT NULL AND btp.ID IS NOT NULL THEN btp.Amount
                          WHEN dagp.ID IS NOT NULL AND chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS dagSalesRealized,
        COALESCE(SUM(CASE WHEN osp.ID IS NOT NULL AND cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn)
                          WHEN osp.ID IS NOT NULL AND btp.ID IS NOT NULL THEN btp.Amount
                          WHEN osp.ID IS NOT NULL AND chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS serviceSalesRealized
      FROM Payments p
      LEFT JOIN CashPayments cp ON cp.PaymentID = p.ID
      LEFT JOIN BankTransferPayments btp ON btp.PaymentID = p.ID
      LEFT JOIN ChequePayments chp ON chp.PaymentID = p.ID
      LEFT JOIN SOPayments sop ON sop.PaymentID = p.ID
      LEFT JOIN DAGPayments dagp ON dagp.PaymentID = p.ID
      LEFT JOIN OtherServicePayments osp ON osp.PaymentID = p.ID
      WHERE substr(p.CreatedDate, 1, 10) BETWEEN ? AND ?
    `)
    .get(summary.dateRange.fromDate, summary.dateRange.toDate)

  const tyreSales = Number(Number(channelInflows?.tyreSalesRealized || 0).toFixed(2))
  const dagSales = Number(Number(channelInflows?.dagSalesRealized || 0).toFixed(2))
  const serviceSales = Number(Number(channelInflows?.serviceSalesRealized || 0).toFixed(2))

  return {
    dateRange: summary.dateRange,
    inflowMethods: [
      {
        method: "CASH",
        methodLabel: "Cash in Register",
        amount: summary.inflow.cash,
        count: summary.inflow.cashCount,
        percentage: calcPct(summary.inflow.cash, totalInflow),
      },
      {
        method: "BANK_TRANSFER",
        methodLabel: "Direct Bank Transfer",
        amount: summary.inflow.bankTransfer,
        count: summary.inflow.bankTransferCount,
        percentage: calcPct(summary.inflow.bankTransfer, totalInflow),
      },
      {
        method: "CHEQUE_CLEARED",
        methodLabel: "Cheques (Cleared)",
        amount: summary.inflow.chequeCollected,
        count: summary.inflow.chequeCollectedCount,
        percentage: calcPct(summary.inflow.chequeCollected, totalInflow),
      },
      {
        method: "CHEQUE_PENDING",
        methodLabel: "Cheques (In-Clearing)",
        amount: summary.inflow.chequePending,
        count: summary.inflow.chequePendingCount,
        percentage: 0, // Not part of realized total
        isPending: true,
      },
    ],
    outflowCategories: [
      {
        category: "PO_PROCUREMENT",
        categoryLabel: "Supplier PO Restocking",
        amount: summary.outflow.poSpend,
        count: summary.outflow.poCount,
        percentage: calcPct(summary.outflow.poSpend, totalOutflow),
      },
      {
        category: "REFUNDS",
        categoryLabel: "Customer Refunds & Returns",
        amount: summary.outflow.refundTotal,
        count: summary.outflow.refundCount,
        percentage: calcPct(summary.outflow.refundTotal, totalOutflow),
      },
    ],
    inflowStreams: {
      tyreSales,
      dagSales,
      serviceSales,
    },
  }
}

/**
 * 4. Paginated, filterable, and searchable Cash Movement Ledger.
 * Combines Customer Inflows, Supplier Outflows, and Customer Refunds in a unified audit view.
 */
exports.getCashFlowLedger = ({
  fromDate,
  toDate,
  flowType = "ALL", // 'ALL' | 'INFLOW' | 'OUTFLOW'
  paymentMethod = "ALL", // 'ALL' | 'CASH' | 'BANK_TRANSFER' | 'CHEQUE'
  searchTerm = "",
  limit = 25,
  offset = 0,
  sortBy = "date",
  sortOrder = "DESC",
}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100))
  const safeOffset = Math.max(0, Number(offset) || 0)

  // Build the unified CTE
  const unifiedCte = `
    WITH cash_movements AS (
      -- 1. Inflows from Payments
      SELECT
        ('IN-' || p.ID) AS id,
        substr(p.CreatedDate, 1, 10) AS txDate,
        p.CreatedDate AS fullDateTime,
        'INFLOW' AS flowType,
        CASE
          WHEN cp.ID IS NOT NULL THEN 'csh'
          WHEN btp.ID IS NOT NULL THEN 'btr'
          WHEN chp.ID IS NOT NULL THEN 'chq'
          ELSE 'csh'
        END AS paymentMethod,
        CASE
          WHEN cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn)
          WHEN btp.ID IS NOT NULL THEN btp.Amount
          WHEN chp.ID IS NOT NULL THEN chp.Amount
          ELSE 0
        END AS amount,
        CASE
          WHEN sop.SoID IS NOT NULL THEN 'Sales Order'
          WHEN dagp.DAGID IS NOT NULL THEN 'DAG Retreading'
          WHEN osp.OSID IS NOT NULL THEN 'Workshop Service'
          WHEN ipl.InvoiceID IS NOT NULL THEN 'Direct Invoice'
          ELSE 'Direct Payment'
        END AS category,
        CASE
          WHEN sop.SoID IS NOT NULL THEN ('SO-' || printf('%04d', sop.SoID))
          WHEN dagp.DAGID IS NOT NULL THEN ('DAG-' || printf('%04d', dagp.DAGID))
          WHEN osp.OSID IS NOT NULL THEN ('SVC-' || printf('%04d', osp.OSID))
          WHEN ipl.InvoiceID IS NOT NULL THEN COALESCE(inv.InvoiceNumber, 'INV-' || printf('%04d', ipl.InvoiceID))
          ELSE ('PAY-' || printf('%04d', p.ID))
        END AS referenceNo,
        COALESCE(
          socust.Name,
          swc.CustomerName,
          dagcust.Name,
          oscust.Name,
          ostd.CustomerName,
          inv.CustomerName,
          'Walk-in Customer'
        ) AS partyName,
        CASE
          WHEN chp.ID IS NOT NULL AND (chp.Collected = 0 OR chp.Collected IS NULL) THEN 'PENDING_CLEARANCE'
          ELSE 'REALIZED'
        END AS status,
        COALESCE(chp.ChequeNumber, '') AS instrumentReference
      FROM Payments p
      LEFT JOIN CashPayments cp ON cp.PaymentID = p.ID
      LEFT JOIN BankTransferPayments btp ON btp.PaymentID = p.ID
      LEFT JOIN ChequePayments chp ON chp.PaymentID = p.ID
      LEFT JOIN SOPayments sop ON sop.PaymentID = p.ID
      LEFT JOIN SoCustomer sc ON sc.SoID = sop.SoID
      LEFT JOIN CustomerM socust ON socust.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = sop.SoID
      LEFT JOIN DAGPayments dagp ON dagp.PaymentID = p.ID
      LEFT JOIN DAG d ON d.ID = dagp.DAGID
      LEFT JOIN CustomerM dagcust ON dagcust.CustomerID = d.CustomerID
      LEFT JOIN OtherServicePayments osp ON osp.PaymentID = p.ID
      LEFT JOIN OtherServiceCustomer osc ON osc.OSID = osp.OSID
      LEFT JOIN CustomerM oscust ON oscust.CustomerID = osc.CustomerID
      LEFT JOIN OtherServiceCustomerDetail ostd ON ostd.OSID = osp.OSID
      LEFT JOIN InvoicePaymentLink ipl ON ipl.PaymentID = p.ID
      LEFT JOIN Invoice inv ON inv.InvoiceID = ipl.InvoiceID
      WHERE (cp.ID IS NOT NULL OR btp.ID IS NOT NULL OR chp.ID IS NOT NULL)

      UNION ALL

      -- 2. Outflows from Purchase Orders
      SELECT
        ('OUT-PO-' || p.ID) AS id,
        substr(p.Date, 1, 10) AS txDate,
        p.Date AS fullDateTime,
        'OUTFLOW' AS flowType,
        'btr' AS paymentMethod,
        COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS amount,
        'Supplier Procurement' AS category,
        ('PO-' || printf('%04d', p.ID)) AS referenceNo,
        COALESCE((
          SELECT sup.Name FROM PoTyresSuppliers pts
          INNER JOIN POTyres pt2 ON pt2.ID = pts.PoTyresID
          INNER JOIN SupplierM sup ON sup.SupplierID = pts.SupplierID
          WHERE pt2.POID = p.ID LIMIT 1
        ), 'Supplier') AS partyName,
        'SETTLED' AS status,
        '' AS instrumentReference
      FROM PO p
      LEFT JOIN POTyres pt ON pt.POID = p.ID
      GROUP BY p.ID

      UNION ALL

      -- 3. Outflows from Customer Refunds
      SELECT
        ('OUT-REF-' || r.RefundID) AS id,
        substr(COALESCE(r.ProcessedDate, r.CreatedAt), 1, 10) AS txDate,
        COALESCE(r.ProcessedDate, r.CreatedAt) AS fullDateTime,
        'OUTFLOW' AS flowType,
        CASE
          WHEN LOWER(COALESCE(rm.MethodCode, '')) = 'csh' OR UPPER(COALESCE(rm.MethodCode, '')) = 'CASH' THEN 'csh'
          WHEN LOWER(COALESCE(rm.MethodCode, '')) = 'chq' OR UPPER(COALESCE(rm.MethodCode, '')) = 'CHEQUE' THEN 'chq'
          ELSE 'btr'
        END AS paymentMethod,
        r.Amount AS amount,
        'Customer Refund' AS category,
        r.RefundNo AS referenceNo,
        COALESCE(c.Name, 'Customer') AS partyName,
        'PROCESSED' AS status,
        COALESCE(r.ChequeNo, r.ReferenceNo, '') AS instrumentReference
      FROM RefundM r
      LEFT JOIN RefundMethodM rm ON rm.Id = r.MethodId
      LEFT JOIN CustomerM c ON c.CustomerID = r.CustomerID
    )
  `

  const whereClauses = ["txDate BETWEEN ? AND ?"]
  const params = [range.fromDate, range.toDate]

  // Filter by flow type (INFLOW | OUTFLOW)
  if (flowType && flowType !== "ALL") {
    whereClauses.push("flowType = ?")
    params.push(flowType.toUpperCase())
  }

  // Filter by payment method (supports codes 'csh' | 'btr' | 'chq' and keys 'CASH' | 'BANK_TRANSFER' | 'CHEQUE')
  if (paymentMethod && paymentMethod !== "ALL") {
    const methodNormMap = {
      CASH: "csh",
      CSH: "csh",
      csh: "csh",
      BANK_TRANSFER: "btr",
      BTR: "btr",
      btr: "btr",
      CHEQUE: "chq",
      CHQ: "chq",
      chq: "chq",
    }
    const targetCode = methodNormMap[paymentMethod] || paymentMethod.toLowerCase()
    whereClauses.push("paymentMethod = ?")
    params.push(targetCode)
  }

  // Search keyword across referenceNo, partyName, category, instrumentReference
  if (searchTerm && typeof searchTerm === "string" && searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`
    whereClauses.push(`(
      referenceNo LIKE ? OR
      partyName LIKE ? OR
      category LIKE ? OR
      instrumentReference LIKE ?
    )`)
    params.push(term, term, term, term)
  }

  const whereSql = whereClauses.join(" AND ")

  // 1. Total matching count and financial summary
  const summarySql = `
    ${unifiedCte}
    SELECT
      COUNT(*) AS totalCount,
      COALESCE(SUM(CASE WHEN flowType = 'INFLOW' THEN amount ELSE 0 END), 0) AS totalInflow,
      COALESCE(SUM(CASE WHEN flowType = 'OUTFLOW' THEN amount ELSE 0 END), 0) AS totalOutflow,
      COALESCE(SUM(CASE WHEN flowType = 'INFLOW' THEN amount ELSE -amount END), 0) AS netAmount
    FROM cash_movements
    WHERE ${whereSql}
  `

  const summaryResult = db.prepare(summarySql).get(...params)
  const totalCount = Number(summaryResult?.totalCount || 0)

  // 2. Sorting & pagination
  const sortMap = {
    date: "fullDateTime",
    amount: "amount",
    referenceNo: "referenceNo",
    partyName: "partyName",
    category: "category",
    paymentMethod: "paymentMethod",
  }
  const safeSortBy = sortMap[sortBy] || "fullDateTime"
  const safeSortOrder = sortOrder === "ASC" ? "ASC" : "DESC"

  const dataSql = `
    ${unifiedCte}
    SELECT *
    FROM cash_movements
    WHERE ${whereSql}
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `

  const rows = db.prepare(dataSql).all(...params, safeLimit, safeOffset)

  const items = rows.map((r) => {
    const amt = Number(Number(r.amount || 0).toFixed(2))
    const isInflow = r.flowType === "INFLOW"

    return {
      id: r.id,
      txDate: r.txDate,
      fullDateTime: r.fullDateTime,
      flowType: r.flowType,
      flowTypeLabel: isInflow ? "Cash In" : "Cash Out",
      paymentMethod: r.paymentMethod,
      paymentMethodCode: r.paymentMethod,
      paymentMethodLabel:
        r.paymentMethod === "csh" || r.paymentMethod === "CASH"
          ? "Cash"
          : r.paymentMethod === "btr" || r.paymentMethod === "BANK_TRANSFER"
          ? "Bank Transfer"
          : "Cheque",
      amount: amt,
      inflowAmount: isInflow ? amt : 0,
      outflowAmount: !isInflow ? amt : 0,
      netAmount: isInflow ? amt : -amt,
      category: r.category,
      referenceNo: r.referenceNo,
      partyName: r.partyName,
      status: r.status,
      statusLabel:
        r.status === "PENDING_CLEARANCE"
          ? "Cheque Pending"
          : r.status === "REALIZED"
          ? "Realized"
          : r.status === "SETTLED"
          ? "Settled"
          : "Processed",
      instrumentReference: r.instrumentReference || "—",
      formattedAmount: `Rs. ${amt.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedNet: `${isInflow ? "+" : "-"}Rs. ${amt.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }
  })

  const totalPages = Math.ceil(totalCount / safeLimit) || 1
  const currentPage = Math.floor(safeOffset / safeLimit) + 1

  return {
    items,
    totalCount,
    pageSummary: {
      totalInflow: Number(Number(summaryResult?.totalInflow || 0).toFixed(2)),
      totalOutflow: Number(Number(summaryResult?.totalOutflow || 0).toFixed(2)),
      netAmount: Number(Number(summaryResult?.netAmount || 0).toFixed(2)),
    },
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      page: currentPage,
      totalPages,
    },
    dateRange: range,
  }
}
