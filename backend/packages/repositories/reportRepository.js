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
 * 1. Get high-level aggregated sales summary for the given date range.
 * Covers Tyre Sales Orders (SO), DAG Retreading (DAGSales), Bay Services (OtherService),
 * and Deductions (CreditNoteM).
 */
exports.getSalesSummary = ({ fromDate, toDate }) => {
  const range = sanitizeDateRange(fromDate, toDate)

  // 1a. Tyre Sales Orders
  const soSummary = db
    .prepare(`
      SELECT
        COUNT(DISTINCT s.SoID) AS orderCount,
        COALESCE(SUM(st.Price * st.Qty), 0) AS grossAmount,
        COALESCE(SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)), 0) AS discountAmount,
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS netAmount
      FROM SO s
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  // 1b. DAG Retreading Services
  const dagSummary = db
    .prepare(`
      SELECT
        COUNT(DISTINCT ds.ID) AS takeCount,
        COALESCE(SUM(dsl.Amount), 0) AS netAmount
      FROM DAGSales ds
      LEFT JOIN DAGSaleLines dsl ON dsl.DAGSaleID = ds.ID
      WHERE substr(ds.SoldDate, 1, 10) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  // 1c. Workshop Other Services
  const serviceSummary = db
    .prepare(`
      SELECT
        COUNT(DISTINCT os.OSID) AS serviceCount,
        COALESCE(SUM(osc.Price * osc.Qty), 0) AS netAmount
      FROM OtherService os
      LEFT JOIN OtherServiceConsumables osc ON osc.OSID = os.OSID
      WHERE os.Date BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  // 1d. Approved/Refunded/Credited Credit Notes (Deductions)
  // StatusId: 2=APPROVED, 3=REFUNDED, 4=CREDITED
  const creditNotesSummary = db
    .prepare(`
      SELECT
        COUNT(CreditNoteID) AS returnCount,
        COALESCE(SUM(TotalAmount), 0) AS returnAmount
      FROM CreditNoteM
      WHERE StatusId IN (2, 3, 4)
        AND substr(CreatedAt, 1, 10) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  const tyreGross = Number(soSummary?.grossAmount || 0)
  const tyreDiscounts = Number(soSummary?.discountAmount || 0)
  const tyreNet = Number(soSummary?.netAmount || 0)
  const tyreOrders = Number(soSummary?.orderCount || 0)

  const dagGross = Number(dagSummary?.netAmount || 0)
  const dagNet = dagGross
  const dagTakes = Number(dagSummary?.takeCount || 0)

  const serviceGross = Number(serviceSummary?.netAmount || 0)
  const serviceNet = serviceGross
  const serviceCount = Number(serviceSummary?.serviceCount || 0)

  const returnsDeduction = Number(creditNotesSummary?.returnAmount || 0)
  const returnsCount = Number(creditNotesSummary?.returnCount || 0)

  const grossRevenue = tyreGross + dagGross + serviceGross
  const totalDiscounts = tyreDiscounts
  const totalReturns = returnsDeduction
  const netRevenue = (tyreNet + dagNet + serviceNet) - totalReturns
  const totalTransactions = tyreOrders + dagTakes + serviceCount
  const averageOrderValue = totalTransactions > 0 ? (netRevenue / totalTransactions) : 0

  return {
    dateRange: range,
    grossRevenue: Number(grossRevenue.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    totalReturns: Number(totalReturns.toFixed(2)),
    netRevenue: Number(netRevenue.toFixed(2)),
    totalTransactions,
    averageOrderValue: Number(averageOrderValue.toFixed(2)),
    channels: {
      tyres: {
        orderCount: tyreOrders,
        grossAmount: Number(tyreGross.toFixed(2)),
        discountAmount: Number(tyreDiscounts.toFixed(2)),
        netAmount: Number(tyreNet.toFixed(2)),
      },
      dag: {
        takeCount: dagTakes,
        grossAmount: Number(dagGross.toFixed(2)),
        netAmount: Number(dagNet.toFixed(2)),
      },
      otherServices: {
        serviceCount,
        grossAmount: Number(serviceGross.toFixed(2)),
        netAmount: Number(serviceNet.toFixed(2)),
      },
      returns: {
        count: returnsCount,
        amount: Number(returnsDeduction.toFixed(2)),
      },
    },
  }
}

/**
 * 2. Get periodic time-series sales data for charts.
 * Supports grouping intervals: 'day' | 'week' | 'month' | 'year'.
 * For daily grouping, generates full calendar with zero-fill so there are no graph gaps.
 */
exports.getSalesTimeSeries = ({ fromDate, toDate, interval = "day" }) => {
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
      so_daily AS (
        SELECT
          COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) AS d,
          COUNT(DISTINCT s.SoID) AS cnt,
          COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS total
        FROM SO s
        LEFT JOIN SoTyres st ON st.SoID = s.SoID
        WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
        GROUP BY d
      ),
      dag_daily AS (
        SELECT
          substr(ds.SoldDate, 1, 10) AS d,
          COUNT(DISTINCT ds.ID) AS cnt,
          COALESCE(SUM(dsl.Amount), 0) AS total
        FROM DAGSales ds
        LEFT JOIN DAGSaleLines dsl ON dsl.DAGSaleID = ds.ID
        WHERE substr(ds.SoldDate, 1, 10) BETWEEN ? AND ?
        GROUP BY d
      ),
      os_daily AS (
        SELECT
          os.Date AS d,
          COUNT(DISTINCT os.OSID) AS cnt,
          COALESCE(SUM(osc.Price * osc.Qty), 0) AS total
        FROM OtherService os
        LEFT JOIN OtherServiceConsumables osc ON osc.OSID = os.OSID
        WHERE os.Date BETWEEN ? AND ?
        GROUP BY d
      )
      SELECT
        c.cal_date AS period,
        COALESCE(so.total, 0) AS tyreSales,
        COALESCE(dag.total, 0) AS dagSales,
        COALESCE(os.total, 0) AS serviceSales,
        (COALESCE(so.total, 0) + COALESCE(dag.total, 0) + COALESCE(os.total, 0)) AS totalSales,
        (COALESCE(so.cnt, 0) + COALESCE(dag.cnt, 0) + COALESCE(os.cnt, 0)) AS transactionCount
      FROM calendar c
      LEFT JOIN so_daily so ON so.d = c.cal_date
      LEFT JOIN dag_daily dag ON dag.d = c.cal_date
      LEFT JOIN os_daily os ON os.d = c.cal_date
      ORDER BY c.cal_date ASC
    `

    return db
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
      .map((row) => ({
        period: row.period,
        tyreSales: Number(Number(row.tyreSales).toFixed(2)),
        dagSales: Number(Number(row.dagSales).toFixed(2)),
        serviceSales: Number(Number(row.serviceSales).toFixed(2)),
        totalSales: Number(Number(row.totalSales).toFixed(2)),
        transactionCount: Number(row.transactionCount),
      }))
  }

  // Formatting pattern for week, month, or year
  let strftimePattern
  if (validInterval === "week") {
    strftimePattern = "%Y-W%W"
  } else if (validInterval === "month") {
    strftimePattern = "%Y-%m"
  } else {
    strftimePattern = "%Y"
  }

  const query = `
    WITH so_period AS (
      SELECT
        strftime('${strftimePattern}', COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10))) AS period,
        COUNT(DISTINCT s.SoID) AS cnt,
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS total
      FROM SO s
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      GROUP BY period
    ),
    dag_period AS (
      SELECT
        strftime('${strftimePattern}', substr(ds.SoldDate, 1, 10)) AS period,
        COUNT(DISTINCT ds.ID) AS cnt,
        COALESCE(SUM(dsl.Amount), 0) AS total
      FROM DAGSales ds
      LEFT JOIN DAGSaleLines dsl ON dsl.DAGSaleID = ds.ID
      WHERE substr(ds.SoldDate, 1, 10) BETWEEN ? AND ?
      GROUP BY period
    ),
    os_period AS (
      SELECT
        strftime('${strftimePattern}', os.Date) AS period,
        COUNT(DISTINCT os.OSID) AS cnt,
        COALESCE(SUM(osc.Price * osc.Qty), 0) AS total
      FROM OtherService os
      LEFT JOIN OtherServiceConsumables osc ON osc.OSID = os.OSID
      WHERE os.Date BETWEEN ? AND ?
      GROUP BY period
    ),
    all_periods AS (
      SELECT period FROM so_period
      UNION SELECT period FROM dag_period
      UNION SELECT period FROM os_period
    )
    SELECT
      p.period,
      COALESCE(so.total, 0) AS tyreSales,
      COALESCE(dag.total, 0) AS dagSales,
      COALESCE(os.total, 0) AS serviceSales,
      (COALESCE(so.total, 0) + COALESCE(dag.total, 0) + COALESCE(os.total, 0)) AS totalSales,
      (COALESCE(so.cnt, 0) + COALESCE(dag.cnt, 0) + COALESCE(os.cnt, 0)) AS transactionCount
    FROM all_periods p
    LEFT JOIN so_period so ON so.period = p.period
    LEFT JOIN dag_period dag ON dag.period = p.period
    LEFT JOIN os_period os ON os.period = p.period
    ORDER BY p.period ASC
  `

  return db
    .prepare(query)
    .all(
      range.fromDate,
      range.toDate,
      range.fromDate,
      range.toDate,
      range.fromDate,
      range.toDate
    )
    .map((row) => ({
      period: row.period,
      tyreSales: Number(Number(row.tyreSales).toFixed(2)),
      dagSales: Number(Number(row.dagSales).toFixed(2)),
      serviceSales: Number(Number(row.serviceSales).toFixed(2)),
      totalSales: Number(Number(row.totalSales).toFixed(2)),
      transactionCount: Number(row.transactionCount),
    }))
}

/**
 * 3. Get settlement breakdown by payment method.
 * Returns Cash, Bank Transfer, Cheque (split into Collected vs Pending),
 * along with total collected and pending volumes.
 */
exports.getPaymentMethodBreakdown = ({ fromDate, toDate }) => {
  const range = sanitizeDateRange(fromDate, toDate)

  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN cp.ID IS NOT NULL THEN (cp.AmountReceived - cp.BalanceToReturn) ELSE 0 END), 0) AS cashTotal,
      COALESCE(SUM(CASE WHEN btp.ID IS NOT NULL THEN btp.Amount ELSE 0 END), 0) AS bankTransferTotal,
      COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND chp.Collected = 1 THEN chp.Amount ELSE 0 END), 0) AS chequeCollectedTotal,
      COALESCE(SUM(CASE WHEN chp.ID IS NOT NULL AND (chp.Collected = 0 OR chp.Collected IS NULL) THEN chp.Amount ELSE 0 END), 0) AS chequePendingTotal,
      COUNT(DISTINCT cp.ID) AS cashCount,
      COUNT(DISTINCT btp.ID) AS bankTransferCount,
      COUNT(DISTINCT CASE WHEN chp.Collected = 1 THEN chp.ID END) AS chequeCollectedCount,
      COUNT(DISTINCT CASE WHEN chp.Collected = 0 OR chp.Collected IS NULL THEN chp.ID END) AS chequePendingCount
    FROM Payments p
    LEFT JOIN CashPayments cp ON cp.PaymentID = p.ID
    LEFT JOIN BankTransferPayments btp ON btp.PaymentID = p.ID
    LEFT JOIN ChequePayments chp ON chp.PaymentID = p.ID
    WHERE substr(p.CreatedDate, 1, 10) BETWEEN ? AND ?
  `

  const row = db.prepare(query).get(range.fromDate, range.toDate)

  const cash = Number(row?.cashTotal || 0)
  const bankTransfer = Number(row?.bankTransferTotal || 0)
  const chequeCollected = Number(row?.chequeCollectedTotal || 0)
  const chequePending = Number(row?.chequePendingTotal || 0)
  const totalSettled = cash + bankTransfer + chequeCollected

  return {
    dateRange: range,
    cash: {
      amount: Number(cash.toFixed(2)),
      count: Number(row?.cashCount || 0),
    },
    bankTransfer: {
      amount: Number(bankTransfer.toFixed(2)),
      count: Number(row?.bankTransferCount || 0),
    },
    cheque: {
      collectedAmount: Number(chequeCollected.toFixed(2)),
      collectedCount: Number(row?.chequeCollectedCount || 0),
      pendingAmount: Number(chequePending.toFixed(2)),
      pendingCount: Number(row?.chequePendingCount || 0),
      totalAmount: Number((chequeCollected + chequePending).toFixed(2)),
      totalCount: Number(row?.chequeCollectedCount || 0) + Number(row?.chequePendingCount || 0),
    },
    totalSettled: Number(totalSettled.toFixed(2)),
    totalPending: Number(chequePending.toFixed(2)),
    grandTotal: Number((totalSettled + chequePending).toFixed(2)),
  }
}

/**
 * 4. Get top-selling products / services.
 * category: 'all' | 'tyres' | 'dag' | 'consumables'
 */
exports.getTopSellingProducts = ({ fromDate, toDate, limit = 10, category = "all" }) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100))

  const results = {
    tyres: [],
    dagTyres: [],
    consumables: [],
  }

  // 4a. Top Tyres
  if (category === "all" || category === "tyres") {
    results.tyres = db
      .prepare(`
        SELECT
          t.Id AS tyreId,
          t.Brand AS brand,
          t.Size AS size,
          t.Pattern AS pattern,
          SUM(st.Qty) AS unitsSold,
          COALESCE(SUM(st.Price * st.Qty), 0) AS grossRevenue,
          COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS netRevenue
        FROM SoTyres st
        INNER JOIN SO s ON s.SoID = st.SoID
        INNER JOIN TyreM t ON t.Id = st.TyreID
        WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
        GROUP BY t.Id, t.Brand, t.Size, t.Pattern
        ORDER BY unitsSold DESC, netRevenue DESC
        LIMIT ?
      `)
      .all(range.fromDate, range.toDate, safeLimit)
      .map((r) => ({
        ...r,
        grossRevenue: Number(Number(r.grossRevenue).toFixed(2)),
        netRevenue: Number(Number(r.netRevenue).toFixed(2)),
      }))
  }

  // 4b. Top DAG Retread Patterns / Sizes
  if (category === "all" || category === "dag") {
    results.dagTyres = db
      .prepare(`
        SELECT
          t.Id AS tyreId,
          t.Brand AS brand,
          t.Size AS size,
          t.Pattern AS pattern,
          COUNT(dsl.ID) AS unitsRetreaded,
          COALESCE(SUM(dsl.Amount), 0) AS netRevenue
        FROM DAGSaleLines dsl
        INNER JOIN DAGSales ds ON ds.ID = dsl.DAGSaleID
        INNER JOIN DAGTyres dt ON dt.ID = dsl.DAGTyresID
        INNER JOIN TyreM t ON t.Id = dt.TyreID
        WHERE substr(ds.SoldDate, 1, 10) BETWEEN ? AND ?
        GROUP BY t.Id, t.Brand, t.Size, t.Pattern
        ORDER BY unitsRetreaded DESC, netRevenue DESC
        LIMIT ?
      `)
      .all(range.fromDate, range.toDate, safeLimit)
      .map((r) => ({
        ...r,
        netRevenue: Number(Number(r.netRevenue).toFixed(2)),
      }))
  }

  // 4c. Top Consumables
  if (category === "all" || category === "consumables") {
    results.consumables = db
      .prepare(`
        SELECT
          cm.Id AS consumableId,
          cm.Name AS name,
          cm.Category AS category,
          cm.Unit AS unit,
          SUM(osc.Qty) AS unitsUsed,
          COALESCE(SUM(osc.Price * osc.Qty), 0) AS netRevenue
        FROM OtherServiceConsumables osc
        INNER JOIN OtherService os ON os.OSID = osc.OSID
        INNER JOIN ConsumableM cm ON cm.Id = osc.ConsumableID
        WHERE os.Date BETWEEN ? AND ?
        GROUP BY cm.Id, cm.Name, cm.Category, cm.Unit
        ORDER BY unitsUsed DESC, netRevenue DESC
        LIMIT ?
      `)
      .all(range.fromDate, range.toDate, safeLimit)
      .map((r) => ({
        ...r,
        netRevenue: Number(Number(r.netRevenue).toFixed(2)),
      }))
  }

  return results
}

/**
 * 5. Top customers by total revenue across all sales channels.
 */
exports.getCustomerLeaderboard = ({ fromDate, toDate, limit = 10 }) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100))

  const query = `
    WITH customer_sales AS (
      -- SO
      SELECT
        c.CustomerID AS custId,
        COALESCE(c.Name, swc.CustomerName, 'Walk-in Customer') AS custName,
        c.CustomerCode AS custCode,
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS netAmount,
        COUNT(DISTINCT s.SoID) AS orderCount
      FROM SO s
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      GROUP BY c.CustomerID, custName, c.CustomerCode

      UNION ALL

      -- DAG
      SELECT
        c.CustomerID AS custId,
        COALESCE(c.Name, 'Customer') AS custName,
        c.CustomerCode AS custCode,
        COALESCE(SUM(dsl.Amount), 0) AS netAmount,
        COUNT(DISTINCT ds.ID) AS orderCount
      FROM DAGSales ds
      INNER JOIN DAG d ON d.ID = ds.DAGID
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGSaleLines dsl ON dsl.DAGSaleID = ds.ID
      WHERE substr(ds.SoldDate, 1, 10) BETWEEN ? AND ?
      GROUP BY c.CustomerID, custName, c.CustomerCode

      UNION ALL

      -- Workshop Services
      SELECT
        c.CustomerID AS custId,
        COALESCE(c.Name, ostd.CustomerName, 'Walk-in Customer') AS custName,
        c.CustomerCode AS custCode,
        COALESCE(SUM(oscons.Price * oscons.Qty), 0) AS netAmount,
        COUNT(DISTINCT os.OSID) AS orderCount
      FROM OtherService os
      LEFT JOIN OtherServiceCustomer oscust ON oscust.OSID = os.OSID
      LEFT JOIN CustomerM c ON c.CustomerID = oscust.CustomerID
      LEFT JOIN OtherServiceCustomerDetail ostd ON ostd.OSID = os.OSID
      LEFT JOIN OtherServiceConsumables oscons ON oscons.OSID = os.OSID
      WHERE os.Date BETWEEN ? AND ?
      GROUP BY c.CustomerID, custName, c.CustomerCode
    )
    SELECT
      custId AS customerId,
      custName AS customerName,
      custCode AS customerCode,
      SUM(netAmount) AS totalRevenue,
      SUM(orderCount) AS totalOrders
    FROM customer_sales
    GROUP BY custId, custName, custCode
    ORDER BY totalRevenue DESC
    LIMIT ?
  `

  return db
    .prepare(query)
    .all(
      range.fromDate,
      range.toDate,
      range.fromDate,
      range.toDate,
      range.fromDate,
      range.toDate,
      safeLimit
    )
    .map((c) => ({
      ...c,
      totalRevenue: Number(Number(c.totalRevenue).toFixed(2)),
      totalOrders: Number(c.totalOrders),
    }))
}

/**
 * 6. Detailed Sales Transactions Ledger (UNION ALL across SO, DAG, and OtherService).
 * Supports search, category filter, sorting, and pagination.
 */
exports.getSalesTransactions = ({
  fromDate,
  toDate,
  category = "ALL", // 'ALL' | 'TYRE_SALE' | 'DAG_RETREAD' | 'OTHER_SERVICE'
  searchTerm = "",
  limit = 50,
  offset = 0,
  sortBy = "transactionDate",
  sortOrder = "DESC",
}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500))
  const safeOffset = Math.max(0, Number(offset) || 0)
  const safeSortOrder = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC"
  const safeSortCol = [
    "transactionDate",
    "referenceNo",
    "customerName",
    "netAmount",
    "grossAmount",
  ].includes(sortBy)
    ? sortBy
    : "transactionDate"

  const baseCTE = `
    WITH raw_transactions AS (
      -- Tyre Sales Orders
      SELECT
        'SO-' || s.SoID AS id,
        s.SoID AS rawId,
        'TYRE_SALE' AS category,
        'SO #' || s.SoID AS referenceNo,
        COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) AS transactionDate,
        s.CreatedDateTime AS fullDateTime,
        COALESCE(c.Name, swc.CustomerName, 'Walk-in Customer') AS customerName,
        c.CustomerCode AS customerCode,
        COALESCE(SUM(st.Price * st.Qty), 0) AS grossAmount,
        COALESCE(SUM(st.Price * st.Qty * (COALESCE(st.Discount, 0) / 100.0)), 0) AS discountAmount,
        COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) AS netAmount,
        s.IsPaymentCompleted AS isPaymentCompleted,
        s.IsCompleted AS isCompleted
      FROM SO s
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
      LEFT JOIN SoTyres st ON st.SoID = s.SoID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      GROUP BY s.SoID

      UNION ALL

      -- DAG Retreading Sales
      SELECT
        'DAG-' || ds.ID AS id,
        ds.ID AS rawId,
        'DAG_RETREAD' AS category,
        'DAG Take #' || ds.ID || ' (DAG #' || ds.DAGID || ')' AS referenceNo,
        substr(ds.SoldDate, 1, 10) AS transactionDate,
        ds.SoldDate AS fullDateTime,
        COALESCE(c.Name, 'Customer') AS customerName,
        c.CustomerCode AS customerCode,
        COALESCE(SUM(dsl.Amount), 0) AS grossAmount,
        0 AS discountAmount,
        COALESCE(SUM(dsl.Amount), 0) AS netAmount,
        1 AS isPaymentCompleted,
        1 AS isCompleted
      FROM DAGSales ds
      INNER JOIN DAG d ON d.ID = ds.DAGID
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGSaleLines dsl ON dsl.DAGSaleID = ds.ID
      WHERE substr(ds.SoldDate, 1, 10) BETWEEN ? AND ?
      GROUP BY ds.ID

      UNION ALL

      -- Workshop Other Services
      SELECT
        'OS-' || os.OSID AS id,
        os.OSID AS rawId,
        'OTHER_SERVICE' AS category,
        'Service #' || os.OSID AS referenceNo,
        os.Date AS transactionDate,
        os.Date AS fullDateTime,
        COALESCE(c.Name, ostd.CustomerName, 'Walk-in Customer') AS customerName,
        c.CustomerCode AS customerCode,
        COALESCE(SUM(oscons.Price * oscons.Qty), 0) AS grossAmount,
        0 AS discountAmount,
        COALESCE(SUM(oscons.Price * oscons.Qty), 0) AS netAmount,
        os.IsPaymentCompleted AS isPaymentCompleted,
        os.IsCompleted AS isCompleted
      FROM OtherService os
      LEFT JOIN OtherServiceCustomer oscust ON oscust.OSID = os.OSID
      LEFT JOIN CustomerM c ON c.CustomerID = oscust.CustomerID
      LEFT JOIN OtherServiceCustomerDetail ostd ON ostd.OSID = os.OSID
      LEFT JOIN OtherServiceConsumables oscons ON oscons.OSID = os.OSID
      WHERE os.Date BETWEEN ? AND ?
      GROUP BY os.OSID
    )
  `

  const dateParams = [
    range.fromDate,
    range.toDate,
    range.fromDate,
    range.toDate,
    range.fromDate,
    range.toDate,
  ]

  const filters = []
  const filterParams = []

  if (category && category !== "ALL") {
    filters.push("category = ?")
    filterParams.push(category)
  }

  if (searchTerm && typeof searchTerm === "string" && searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`
    filters.push("(referenceNo LIKE ? OR customerName LIKE ? OR customerCode LIKE ?)")
    filterParams.push(term, term, term)
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : ""

  // Count total matching records and sum matching page totals
  const totalStats = db
    .prepare(`
      ${baseCTE}
      SELECT
        COUNT(*) AS totalCount,
        COALESCE(SUM(grossAmount), 0) AS totalGross,
        COALESCE(SUM(discountAmount), 0) AS totalDiscount,
        COALESCE(SUM(netAmount), 0) AS totalNet
      FROM raw_transactions
      ${whereClause}
    `)
    .get(...dateParams, ...filterParams)

  // Retrieve paginated records
  const rows = db
    .prepare(`
      ${baseCTE}
      SELECT *
      FROM raw_transactions
      ${whereClause}
      ORDER BY ${safeSortCol} ${safeSortOrder}, fullDateTime ${safeSortOrder}, rawId ${safeSortOrder}, id ${safeSortOrder}
      LIMIT ? OFFSET ?
    `)
    .all(...dateParams, ...filterParams, safeLimit, safeOffset)
    .map((r) => ({
      ...r,
      grossAmount: Number(Number(r.grossAmount).toFixed(2)),
      discountAmount: Number(Number(r.discountAmount).toFixed(2)),
      netAmount: Number(Number(r.netAmount).toFixed(2)),
      isPaymentCompleted: Boolean(r.isPaymentCompleted),
      isCompleted: Boolean(r.isCompleted),
    }))

  return {
    transactions: rows,
    totalCount: Number(totalStats?.totalCount || 0),
    pageSummary: {
      totalGross: Number(Number(totalStats?.totalGross || 0).toFixed(2)),
      totalDiscount: Number(Number(totalStats?.totalDiscount || 0).toFixed(2)),
      totalNet: Number(Number(totalStats?.totalNet || 0).toFixed(2)),
    },
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      page: Math.floor(safeOffset / safeLimit) + 1,
      totalPages: Math.ceil((totalStats?.totalCount || 0) / safeLimit) || 1,
    },
  }
}
