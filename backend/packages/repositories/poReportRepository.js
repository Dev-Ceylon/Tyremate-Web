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
 * 1. High-level aggregated procurement summary for the given date range.
 * Calculates total POs, tyre units, gross spend, discounts, net spend,
 * average PO value, and approval stats.
 */
exports.getPoSummary = ({ fromDate, toDate }) => {
  const range = sanitizeDateRange(fromDate, toDate)

  const summary = db
    .prepare(`
      SELECT
        COUNT(DISTINCT p.ID) AS totalPOs,
        COALESCE(SUM(pt.Qty), 0) AS totalTyresOrdered,
        COALESCE(SUM(pt.Price * pt.Qty), 0) AS grossSpend,
        COALESCE(SUM(pt.Price * pt.Qty * (COALESCE(pt.Discount, 0) / 100.0)), 0) AS totalDiscounts,
        COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS netSpend,
        COUNT(DISTINCT CASE WHEN p.IsAdminApproved = 1 THEN p.ID END) AS adminApprovedCount,
        COUNT(DISTINCT CASE WHEN p.IsSupplierApproved = 1 THEN p.ID END) AS supplierApprovedCount,
        COUNT(DISTINCT CASE WHEN p.IsAdminApproved = 0 THEN p.ID END) AS pendingAdminApprovalCount
      FROM PO p
      LEFT JOIN POTyres pt ON pt.POID = p.ID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
    `)
    .get(range.fromDate, range.toDate)

  const totalPOs = Number(summary?.totalPOs || 0)
  const totalTyresOrdered = Number(summary?.totalTyresOrdered || 0)
  const grossSpend = Number(summary?.grossSpend || 0)
  const totalDiscounts = Number(summary?.totalDiscounts || 0)
  const netSpend = Number(summary?.netSpend || 0)
  const averagePoValue = totalPOs > 0 ? netSpend / totalPOs : 0

  return {
    dateRange: range,
    totalPOs,
    totalTyresOrdered,
    grossSpend: Number(grossSpend.toFixed(2)),
    totalDiscounts: Number(totalDiscounts.toFixed(2)),
    netSpend: Number(netSpend.toFixed(2)),
    averagePoValue: Number(averagePoValue.toFixed(2)),
    approvalStats: {
      adminApprovedCount: Number(summary?.adminApprovedCount || 0),
      supplierApprovedCount: Number(summary?.supplierApprovedCount || 0),
      pendingAdminApprovalCount: Number(summary?.pendingAdminApprovalCount || 0),
    },
  }
}

/**
 * 2. Purchase Order status distribution pipeline.
 * Groups orders by status (DRAFT, PENDING, ARRIVING, ARRIVED, COMPLETED).
 */
exports.getPoStatusPipeline = ({ fromDate, toDate }) => {
  const range = sanitizeDateRange(fromDate, toDate)

  const rows = db
    .prepare(`
      SELECT
        COALESCE(s.StatusCode, 'UNKNOWN') AS statusCode,
        COALESCE(s.StatusName, 'Unknown') AS statusName,
        COUNT(DISTINCT p.ID) AS poCount,
        COALESCE(SUM(pt.Qty), 0) AS tyresCount,
        COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS netSpend
      FROM PO p
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      LEFT JOIN POTyres pt ON pt.POID = p.ID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
      GROUP BY s.StatusCode, s.StatusName
      ORDER BY p.StatusID ASC
    `)
    .all(range.fromDate, range.toDate)

  const totalNet = rows.reduce((sum, r) => sum + Number(r.netSpend || 0), 0)

  return rows.map((r) => {
    const net = Number(Number(r.netSpend || 0).toFixed(2))
    const pct = totalNet > 0 ? (net / totalNet) * 100 : 0
    return {
      statusCode: r.statusCode,
      statusName: r.statusName,
      poCount: Number(r.poCount || 0),
      tyresCount: Number(r.tyresCount || 0),
      netSpend: net,
      percentageOfSpend: Number(pct.toFixed(1)),
    }
  })
}

/**
 * 3. Procurement expenditure time-series for charts.
 * Supports intervals: 'day' | 'week' | 'month' | 'year'.
 * Daily grouping generates full continuous calendar zero-fill via SQLite recursive CTE.
 */
exports.getPoTimeSeries = ({ fromDate, toDate, interval = "day" }) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const validInterval = ["day", "week", "month", "year"].includes(interval) ? interval : "day"

  if (validInterval === "day") {
    const query = `
      WITH RECURSIVE calendar(cal_date) AS (
        SELECT ?
        UNION ALL
        SELECT date(cal_date, '+1 day')
        FROM calendar
        WHERE cal_date < ?
      ),
      po_daily AS (
        SELECT
          substr(p.Date, 1, 10) AS d,
          COUNT(DISTINCT p.ID) AS cnt,
          COALESCE(SUM(pt.Qty), 0) AS tyres,
          COALESCE(SUM(pt.Price * pt.Qty), 0) AS gross,
          COALESCE(SUM(pt.Price * pt.Qty * (COALESCE(pt.Discount, 0) / 100.0)), 0) AS discount,
          COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS total
        FROM PO p
        LEFT JOIN POTyres pt ON pt.POID = p.ID
        WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
        GROUP BY d
      )
      SELECT
        c.cal_date AS period,
        COALESCE(po.cnt, 0) AS poCount,
        COALESCE(po.tyres, 0) AS tyreCount,
        COALESCE(po.gross, 0) AS grossSpend,
        COALESCE(po.discount, 0) AS discountAmount,
        COALESCE(po.total, 0) AS totalSpend
      FROM calendar c
      LEFT JOIN po_daily po ON po.d = c.cal_date
      ORDER BY c.cal_date ASC
    `

    return db
      .prepare(query)
      .all(range.fromDate, range.toDate, range.fromDate, range.toDate)
      .map((row) => ({
        period: row.period,
        poCount: Number(row.poCount),
        tyreCount: Number(row.tyreCount),
        grossSpend: Number(Number(row.grossSpend).toFixed(2)),
        discountAmount: Number(Number(row.discountAmount).toFixed(2)),
        totalSpend: Number(Number(row.totalSpend).toFixed(2)),
      }))
  }

  let strftimePattern
  if (validInterval === "week") {
    strftimePattern = "%Y-W%W"
  } else if (validInterval === "month") {
    strftimePattern = "%Y-%m"
  } else {
    strftimePattern = "%Y"
  }

  const query = `
    SELECT
      strftime('${strftimePattern}', substr(p.Date, 1, 10)) AS period,
      COUNT(DISTINCT p.ID) AS poCount,
      COALESCE(SUM(pt.Qty), 0) AS tyreCount,
      COALESCE(SUM(pt.Price * pt.Qty), 0) AS grossSpend,
      COALESCE(SUM(pt.Price * pt.Qty * (COALESCE(pt.Discount, 0) / 100.0)), 0) AS discountAmount,
      COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS totalSpend
    FROM PO p
    LEFT JOIN POTyres pt ON pt.POID = p.ID
    WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period ASC
  `

  return db
    .prepare(query)
    .all(range.fromDate, range.toDate)
    .map((row) => ({
      period: row.period,
      poCount: Number(row.poCount),
      tyreCount: Number(row.tyreCount),
      grossSpend: Number(Number(row.grossSpend).toFixed(2)),
      discountAmount: Number(Number(row.discountAmount).toFixed(2)),
      totalSpend: Number(Number(row.totalSpend).toFixed(2)),
    }))
}

/**
 * 4. Top suppliers leaderboard by procurement expenditure.
 * Evaluates supplier allocation, total spend, units supplied,
 * and delivery fulfillment track record.
 */
exports.getTopSuppliers = ({ fromDate, toDate, limit = 10 }) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50))

  const rows = db
    .prepare(`
      SELECT
        s.SupplierID AS supplierId,
        s.Name AS supplierName,
        s.SupplierCode AS supplierCode,
        COUNT(DISTINCT p.ID) AS totalPOs,
        COALESCE(SUM(pts.Qty), 0) AS totalUnitsSupplied,
        COALESCE(SUM(pt.Price * pts.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS totalSpend,
        COUNT(CASE WHEN pts.ActualDeliveryDate IS NOT NULL AND pts.ActualDeliveryDate <= pts.ExpectedDeliveryDate THEN 1 END) AS onTimeDeliveries,
        COUNT(CASE WHEN pts.ActualDeliveryDate IS NOT NULL THEN 1 END) AS completedDeliveries
      FROM PoTyresSuppliers pts
      INNER JOIN SupplierM s ON s.SupplierID = pts.SupplierID
      INNER JOIN POTyres pt ON pt.ID = pts.PoTyresID
      INNER JOIN PO p ON p.ID = pt.POID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
      GROUP BY s.SupplierID, s.Name, s.SupplierCode
      ORDER BY totalSpend DESC
      LIMIT ?
    `)
    .all(range.fromDate, range.toDate, safeLimit)

  return rows.map((r) => {
    const completed = Number(r.completedDeliveries || 0)
    const onTime = Number(r.onTimeDeliveries || 0)
    const onTimeRate = completed > 0 ? (onTime / completed) * 100 : 100

    return {
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      supplierCode: r.supplierCode,
      totalPOs: Number(r.totalPOs || 0),
      totalUnitsSupplied: Number(r.totalUnitsSupplied || 0),
      totalSpend: Number(Number(r.totalSpend || 0).toFixed(2)),
      onTimeDeliveries: onTime,
      completedDeliveries: completed,
      onTimeDeliveryRate: Number(onTimeRate.toFixed(1)),
    }
  })
}

/**
 * 5. Top procured tyres leaderboard.
 * Evaluates brand, size, pattern, quantity ordered, average unit price, and total spend.
 */
exports.getTopProcuredTyres = ({ fromDate, toDate, limit = 10 }) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50))

  const rows = db
    .prepare(`
      SELECT
        t.Id AS tyreId,
        COALESCE(t.Brand, 'Unknown Brand') AS brand,
        COALESCE(t.Size, 'Unknown Size') AS size,
        COALESCE(t.Pattern, 'Unknown Pattern') AS pattern,
        SUM(pt.Qty) AS unitsOrdered,
        SUM(pt.Price * pt.Qty) AS grossSpend,
        SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)) AS netSpend,
        ROUND(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)) / NULLIF(SUM(pt.Qty), 0), 2) AS averageUnitPrice
      FROM POTyres pt
      INNER JOIN PO p ON p.ID = pt.POID
      INNER JOIN TyreM t ON t.Id = pt.TyreID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
      GROUP BY t.Id, t.Brand, t.Size, t.Pattern
      ORDER BY netSpend DESC
      LIMIT ?
    `)
    .all(range.fromDate, range.toDate, safeLimit)

  return rows.map((r) => ({
    tyreId: r.tyreId,
    brand: r.brand,
    size: r.size,
    pattern: r.pattern,
    unitsOrdered: Number(r.unitsOrdered || 0),
    grossSpend: Number(Number(r.grossSpend || 0).toFixed(2)),
    netSpend: Number(Number(r.netSpend || 0).toFixed(2)),
    averageUnitPrice: Number(Number(r.averageUnitPrice || 0).toFixed(2)),
  }))
}

/**
 * 6. Paginated, searchable, and filtered Purchase Orders transactions ledger.
 * Filters by date range, status code, supplier, and keyword search.
 */
exports.getPoTransactions = ({
  fromDate,
  toDate,
  statusCode = "ALL",
  supplierId = null,
  searchTerm = "",
  limit = 25,
  offset = 0,
  sortBy = "Date",
  sortOrder = "DESC",
}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100))
  const safeOffset = Math.max(0, Number(offset) || 0)

  const whereClauses = ["substr(p.Date, 1, 10) BETWEEN ? AND ?"]
  const params = [range.fromDate, range.toDate]

  if (statusCode && statusCode !== "ALL") {
    whereClauses.append ? null : null
    whereClauses.push("s.StatusCode = ?")
    params.push(statusCode)
  }

  if (supplierId) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM PoTyresSuppliers ptsSub
      INNER JOIN POTyres ptSub ON ptSub.ID = ptsSub.PoTyresID
      WHERE ptSub.POID = p.ID AND ptsSub.SupplierID = ?
    )`)
    params.push(Number(supplierId))
  }

  if (searchTerm && typeof searchTerm === "string" && searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`
    whereClauses.push(`(
      CAST(p.ID AS TEXT) LIKE ? OR
      EXISTS (
        SELECT 1 FROM PoTyresSuppliers ptsSearch
        INNER JOIN POTyres ptSearch ON ptSearch.ID = ptsSearch.PoTyresID
        INNER JOIN SupplierM supSearch ON supSearch.SupplierID = ptsSearch.SupplierID
        WHERE ptSearch.POID = p.ID AND (supSearch.Name LIKE ? OR supSearch.SupplierCode LIKE ?)
      ) OR
      EXISTS (
        SELECT 1 FROM POTyres ptSearch2
        INNER JOIN TyreM tSearch ON tSearch.Id = ptSearch2.TyreID
        WHERE ptSearch2.POID = p.ID AND (tSearch.Brand LIKE ? OR tSearch.Size LIKE ?)
      )
    )`)
    params.push(term, term, term, term, term)
  }

  const whereSql = whereClauses.join(" AND ")

  // 1. Total matching count
  const countSql = `
    SELECT COUNT(DISTINCT p.ID) AS totalCount
    FROM PO p
    LEFT JOIN StatusM s ON s.Id = p.StatusID
    WHERE ${whereSql}
  `
  const countResult = db.prepare(countSql).get(...params)
  const totalCount = Number(countResult?.totalCount || 0)

  // 2. Financial totals across all matching rows
  const summarySql = `
    WITH matched_pos AS (
      SELECT p.ID
      FROM PO p
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      WHERE ${whereSql}
    )
    SELECT
      COALESCE(SUM(pt.Qty), 0) AS totalQty,
      COALESCE(SUM(pt.Price * pt.Qty), 0) AS totalGross,
      COALESCE(SUM(pt.Price * pt.Qty * (COALESCE(pt.Discount, 0) / 100.0)), 0) AS totalDiscount,
      COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS totalNet
    FROM POTyres pt
    WHERE pt.POID IN (SELECT ID FROM matched_pos)
  `
  const summaryResult = db.prepare(summarySql).get(...params)

  // 3. Paginated rows query
  const sortColumnMap = {
    Date: "p.Date",
    ID: "p.ID",
    grossAmount: "grossAmount",
    netAmount: "netAmount",
    totalQty: "totalQty",
  }
  const safeSortBy = sortColumnMap[sortBy] || "p.Date"
  const safeOrder = sortOrder === "ASC" ? "ASC" : "DESC"

  const dataSql = `
    SELECT
      p.ID AS poId,
      p.SoID AS soId,
      substr(p.Date, 1, 10) AS orderDate,
      p.Date AS fullDateTime,
      COALESCE(s.StatusCode, 'UNKNOWN') AS statusCode,
      COALESCE(s.StatusName, 'Unknown') AS statusName,
      p.IsAdminApproved AS isAdminApproved,
      p.IsSupplierApproved AS isSupplierApproved,
      COUNT(pt.ID) AS lineCount,
      COALESCE(SUM(pt.Qty), 0) AS totalQty,
      COALESCE(SUM(pt.Price * pt.Qty), 0) AS grossAmount,
      COALESCE(SUM(pt.Price * pt.Qty * (COALESCE(pt.Discount, 0) / 100.0)), 0) AS discountAmount,
      COALESCE(SUM(pt.Price * pt.Qty * (1 - COALESCE(pt.Discount, 0) / 100.0)), 0) AS netAmount,
      (
        SELECT GROUP_CONCAT(DISTINCT sup.Name)
        FROM PoTyresSuppliers pts2
        INNER JOIN POTyres pt2 ON pt2.ID = pts2.PoTyresID
        INNER JOIN SupplierM sup ON sup.SupplierID = pts2.SupplierID
        WHERE pt2.POID = p.ID
      ) AS supplierNames
    FROM PO p
    LEFT JOIN StatusM s ON s.Id = p.StatusID
    LEFT JOIN POTyres pt ON pt.POID = p.ID
    WHERE ${whereSql}
    GROUP BY p.ID
    ORDER BY ${safeSortBy} ${safeOrder}
    LIMIT ? OFFSET ?
  `

  const rows = db.prepare(dataSql).all(...params, safeLimit, safeOffset)

  const transactions = rows.map((r) => {
    const gross = Number(Number(r.grossAmount || 0).toFixed(2))
    const discount = Number(Number(r.discountAmount || 0).toFixed(2))
    const net = Number(Number(r.netAmount || 0).toFixed(2))

    return {
      poId: r.poId,
      referenceNo: `PO-${String(r.poId).padStart(4, "0")}`,
      soId: r.soId || null,
      soReferenceNo: r.soId ? `SO-${String(r.soId).padStart(4, "0")}` : null,
      orderDate: r.orderDate,
      fullDateTime: r.fullDateTime,
      statusCode: r.statusCode,
      statusName: r.statusName,
      isAdminApproved: Boolean(r.isAdminApproved),
      isSupplierApproved: Boolean(r.isSupplierApproved),
      supplierNames: r.supplierNames || "Unassigned",
      lineCount: Number(r.lineCount || 0),
      totalQty: Number(r.totalQty || 0),
      grossAmount: gross,
      discountAmount: discount,
      netAmount: net,
      formattedGross: `Rs. ${gross.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedDiscount: `Rs. ${discount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedNet: `Rs. ${net.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }
  })

  const totalPages = Math.ceil(totalCount / safeLimit) || 1
  const currentPage = Math.floor(safeOffset / safeLimit) + 1

  return {
    transactions,
    totalCount,
    pageSummary: {
      totalQty: Number(summaryResult?.totalQty || 0),
      totalGross: Number(Number(summaryResult?.totalGross || 0).toFixed(2)),
      totalDiscount: Number(Number(summaryResult?.totalDiscount || 0).toFixed(2)),
      totalNet: Number(Number(summaryResult?.totalNet || 0).toFixed(2)),
    },
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      page: currentPage,
      totalPages,
    },
    dateRange: range,
    filterStatus: statusCode,
    searchTerm: searchTerm || "",
  }
}
