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
 * 1. High-level aggregated summary for the given date range.
 */
exports.getBatterySummary = ({ fromDate, toDate, brand } = {}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const brandFilter = brand ? " AND b.Brand = ?" : ""

  const salesParams = [range.fromDate, range.toDate]
  if (brand) salesParams.push(brand)

  const salesSummary = db
    .prepare(`
      SELECT
        COUNT(DISTINCT s.SoID) AS totalOrders,
        COALESCE(SUM(sb.Qty), 0) AS totalUnitsSold,
        COALESCE(SUM(sb.Price * sb.Qty), 0) AS grossRevenue,
        COALESCE(SUM(sb.Price * sb.Qty * (COALESCE(sb.Discount, 0) / 100.0)), 0) AS totalDiscounts,
        COALESCE(SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)), 0) AS netRevenue
      FROM SO s
      JOIN SoBatteries sb ON sb.SoID = s.SoID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      ${brandFilter}
    `)
    .get(...salesParams)

  // Procurement (PO)
  const poBrandFilter = brand ? " AND b.Brand = ?" : ""
  const poParams = [range.fromDate, range.toDate]
  if (brand) poParams.push(brand)

  const poSummary = db
    .prepare(`
      SELECT
        COUNT(DISTINCT p.ID) AS totalPOs,
        COALESCE(SUM(pb.Qty), 0) AS totalUnitsProcured,
        COALESCE(SUM(pb.Price * pb.Qty * (1 - COALESCE(pb.Discount, 0) / 100.0)), 0) AS procurementSpend
      FROM PO p
      JOIN POBatteries pb ON pb.POID = p.ID
      JOIN BatteryM b ON b.Id = pb.BatteryID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
      ${poBrandFilter}
    `)
    .get(...poParams)

  // Warranty Returns
  const returnParams = [range.fromDate, range.toDate]
  if (brand) returnParams.push(brand)

  const returnSummary = db
    .prepare(`
      SELECT
        COALESCE(SUM(srb.Qty), 0) AS totalUnitsReturned,
        COUNT(DISTINCT srb.ID) AS returnCount
      FROM SoReturnBatteries srb
      JOIN SoBatteries sb ON sb.ID = srb.SoBatteryID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE substr(srb.ReturnDate, 1, 10) BETWEEN ? AND ?
      ${poBrandFilter}
    `)
    .get(...returnParams)

  // On-hand current stock and catalog totals
  const stockBrandFilter = brand ? " WHERE b.Brand = ?" : ""
  const stockParams = brand ? [brand] : []

  const stockSummary = db
    .prepare(`
      SELECT
        COALESCE(SUM(bsm.Qty), 0) AS currentStockUnits,
        COUNT(DISTINCT b.Id) AS totalModels
      FROM BatteryM b
      LEFT JOIN BatteryStorageManager bsm ON bsm.BatteryId = b.Id
      ${stockBrandFilter}
    `)
    .get(...stockParams)

  // Batches expiring within 30 days
  const expiringSummary = db
    .prepare(`
      SELECT
        COALESCE(SUM(bsmb.Qty), 0) AS expiringStockUnits,
        COUNT(DISTINCT bsmb.Id) AS expiringBatchesCount
      FROM BatteryStorageManagerBatch bsmb
      JOIN BatteryStorageManager bsm ON bsm.Id = bsmb.BatteryStorageManagerID
      JOIN BatteryM b ON b.Id = bsm.BatteryId
      WHERE bsmb.Qty > 0
        AND bsmb.ExpiryDate IS NOT NULL
        AND bsmb.ExpiryDate != ''
        AND bsmb.ExpiryDate <= date('now', '+30 days')
      ${poBrandFilter}
    `)
    .get(...(brand ? [brand] : []))

  const totalOrders = Number(salesSummary?.totalOrders || 0)
  const totalUnitsSold = Number(salesSummary?.totalUnitsSold || 0)
  const grossRevenue = Number(salesSummary?.grossRevenue || 0)
  const totalDiscounts = Number(salesSummary?.totalDiscounts || 0)
  const netRevenue = Number(salesSummary?.netRevenue || 0)
  const averageOrderValue = totalOrders > 0 ? netRevenue / totalOrders : 0

  const totalPOs = Number(poSummary?.totalPOs || 0)
  const totalUnitsProcured = Number(poSummary?.totalUnitsProcured || 0)
  const procurementSpend = Number(poSummary?.procurementSpend || 0)

  const totalUnitsReturned = Number(returnSummary?.totalUnitsReturned || 0)
  const returnCount = Number(returnSummary?.returnCount || 0)

  const currentStockUnits = Number(stockSummary?.currentStockUnits || 0)
  const totalModels = Number(stockSummary?.totalModels || 0)

  const expiringStockUnits = Number(expiringSummary?.expiringStockUnits || 0)
  const expiringBatchesCount = Number(expiringSummary?.expiringBatchesCount || 0)

  return {
    dateRange: range,
    sales: {
      totalOrders,
      totalUnitsSold,
      grossRevenue,
      totalDiscounts,
      netRevenue,
      averageOrderValue,
    },
    procurement: {
      totalPOs,
      totalUnitsProcured,
      procurementSpend,
    },
    returns: {
      totalUnitsReturned,
      returnCount,
    },
    inventory: {
      currentStockUnits,
      totalModels,
      expiringStockUnits,
      expiringBatchesCount,
    },
  }
}

/**
 * 2. Time-series data for trend visualization (daily, weekly, monthly).
 */
exports.getBatteryTimeSeries = ({ fromDate, toDate, interval = "day", brand } = {}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  let dateExpr = "substr(COALESCE(s.Date, s.CreatedDateTime), 1, 10)"

  if (interval === "month") {
    dateExpr = "substr(COALESCE(s.Date, s.CreatedDateTime), 1, 7)"
  } else if (interval === "week") {
    dateExpr = "strftime('%Y-W%W', COALESCE(s.Date, s.CreatedDateTime))"
  } else if (interval === "year") {
    dateExpr = "substr(COALESCE(s.Date, s.CreatedDateTime), 1, 4)"
  }

  const brandFilter = brand ? " AND b.Brand = ?" : ""
  const params = [range.fromDate, range.toDate]
  if (brand) params.push(brand)

  const points = db
    .prepare(`
      SELECT
        ${dateExpr} AS period,
        COALESCE(SUM(sb.Qty), 0) AS unitsSold,
        COALESCE(SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)), 0) AS salesRevenue,
        COUNT(DISTINCT s.SoID) AS orderCount
      FROM SO s
      JOIN SoBatteries sb ON sb.SoID = s.SoID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      ${brandFilter}
      GROUP BY period
      ORDER BY period ASC
    `)
    .all(...params)

  return points.map((p) => ({
    period: String(p.period),
    unitsSold: Number(p.unitsSold || 0),
    salesRevenue: Number(p.salesRevenue || 0),
    orderCount: Number(p.orderCount || 0),
  }))
}

/**
 * 3. Brand distribution breakdown.
 */
exports.getBatteryBrandBreakdown = ({ fromDate, toDate } = {}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const params = [range.fromDate, range.toDate]

  const rows = db
    .prepare(`
      SELECT
        b.Brand AS brand,
        COALESCE(SUM(sb.Qty), 0) AS unitsSold,
        COALESCE(SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)), 0) AS revenue,
        COUNT(DISTINCT s.SoID) AS orderCount
      FROM SO s
      JOIN SoBatteries sb ON sb.SoID = s.SoID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      GROUP BY b.Brand
      ORDER BY revenue DESC
    `)
    .all(...params)

  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0)

  return rows.map((r) => {
    const rev = Number(r.revenue || 0)
    return {
      brand: String(r.brand),
      unitsSold: Number(r.unitsSold || 0),
      revenue: rev,
      orderCount: Number(r.orderCount || 0),
      sharePercent: totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0,
    }
  })
}

/**
 * 4. Application distribution breakdown (Motorcycle, Automotive, etc.).
 */
exports.getBatteryApplicationBreakdown = ({ fromDate, toDate } = {}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const params = [range.fromDate, range.toDate]

  const rows = db
    .prepare(`
      SELECT
        COALESCE(NULLIF(b.Application, ''), 'Other') AS application,
        COALESCE(SUM(sb.Qty), 0) AS unitsSold,
        COALESCE(SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)), 0) AS revenue
      FROM SO s
      JOIN SoBatteries sb ON sb.SoID = s.SoID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      GROUP BY application
      ORDER BY revenue DESC
    `)
    .all(...params)

  const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue || 0), 0)

  return rows.map((r) => {
    const rev = Number(r.revenue || 0)
    return {
      application: String(r.application),
      unitsSold: Number(r.unitsSold || 0),
      revenue: rev,
      sharePercent: totalRevenue > 0 ? (rev / totalRevenue) * 100 : 0,
    }
  })
}

/**
 * 5. Top selling battery models.
 */
exports.getTopSellingBatteries = ({ fromDate, toDate, brand, limit = 5 } = {}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const brandFilter = brand ? " AND b.Brand = ?" : ""
  const params = [range.fromDate, range.toDate]
  if (brand) params.push(brand)
  params.push(Math.max(1, Math.min(Number(limit) || 5, 50)))

  const rows = db
    .prepare(`
      SELECT
        b.Id AS batteryId,
        b.Brand AS brand,
        b.Model AS model,
        b.Voltage AS voltage,
        b.Capacity AS capacity,
        b.Technology AS technology,
        b.Application AS application,
        COALESCE(SUM(sb.Qty), 0) AS unitsSold,
        COALESCE(SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)), 0) AS revenue,
        (
          SELECT COALESCE(SUM(bsm.Qty), 0)
          FROM BatteryStorageManager bsm
          WHERE bsm.BatteryId = b.Id
        ) AS currentStock
      FROM SO s
      JOIN SoBatteries sb ON sb.SoID = s.SoID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      ${brandFilter}
      GROUP BY b.Id
      ORDER BY unitsSold DESC, revenue DESC
      LIMIT ?
    `)
    .all(...params)

  return rows.map((r) => ({
    batteryId: Number(r.batteryId),
    brand: String(r.brand),
    model: String(r.model),
    specification: `${r.voltage || "12V"} ${r.capacity || ""}`.trim(),
    technology: r.technology ? String(r.technology) : null,
    application: String(r.application || "Motorcycle"),
    unitsSold: Number(r.unitsSold || 0),
    revenue: Number(r.revenue || 0),
    currentStock: Number(r.currentStock || 0),
  }))
}

/**
 * 6. Battery batches nearing expiry / requiring recharge maintenance.
 */
exports.getBatteryHealthAndExpiry = ({ limit = 10 } = {}) => {
  const rows = db
    .prepare(`
      SELECT
        bsmb.Id AS batchId,
        bsmb.BatchCode AS batchCode,
        bsmb.MfgDate AS mfgDate,
        bsmb.ExpiryDate AS expiryDate,
        bsmb.Qty AS qty,
        b.Brand AS brand,
        b.Model AS model,
        b.Capacity AS capacity,
        b.Voltage AS voltage,
        bl.LocationName AS locationName,
        CAST((julianday(bsmb.ExpiryDate) - julianday('now')) AS INTEGER) AS daysUntilExpiry
      FROM BatteryStorageManagerBatch bsmb
      JOIN BatteryStorageManager bsm ON bsm.Id = bsmb.BatteryStorageManagerID
      JOIN BatteryM b ON b.Id = bsm.BatteryId
      LEFT JOIN BatteryLocationM bl ON bl.Id = bsm.LocationID
      WHERE bsmb.Qty > 0
        AND bsmb.ExpiryDate IS NOT NULL
        AND bsmb.ExpiryDate != ''
      ORDER BY bsmb.ExpiryDate ASC
      LIMIT ?
    `)
    .all(Math.max(1, Math.min(Number(limit) || 10, 50)))

  return rows.map((r) => {
    const days = typeof r.daysUntilExpiry === "number" ? r.daysUntilExpiry : 999
    let status = "GOOD"
    if (days < 0) status = "EXPIRED"
    else if (days <= 15) status = "CRITICAL"
    else if (days <= 30) status = "WARNING"

    return {
      batchId: Number(r.batchId),
      batchCode: String(r.batchCode || "-"),
      brand: String(r.brand),
      model: String(r.model),
      specification: `${r.voltage || "12V"} ${r.capacity || ""}`.trim(),
      locationName: String(r.locationName || "Default Store"),
      mfgDate: r.mfgDate ? String(r.mfgDate) : null,
      expiryDate: String(r.expiryDate),
      qty: Number(r.qty || 0),
      daysUntilExpiry: days,
      status,
    }
  })
}

/**
 * 7. Paginated detailed battery transactions ledger.
 */
exports.getBatteryTransactions = ({
  fromDate,
  toDate,
  type = "ALL",
  branchId,
  brand,
  searchTerm = "",
  page = 1,
  limit = 20,
  sortBy = "date",
  sortOrder = "DESC",
} = {}) => {
  const range = sanitizeDateRange(fromDate, toDate)
  const p = Math.max(1, Number(page) || 1)
  const l = Math.max(1, Math.min(Number(limit) || 20, 100))
  const offset = (p - 1) * l

  const term = searchTerm ? `%${searchTerm.trim()}%` : null
  const brandVal = brand ? brand.trim() : null

  // Build UNION query across Sales, Procurement, and Returns
  // Column schema:
  // type, id, refNo, date, batteryId, brand, model, spec, partnerName, qty, unitPrice, discount, netAmount, status
  const unions = []
  const unionParams = []

  if (type === "ALL" || type === "SALE") {
    unions.push(`
      SELECT
        'SALE' AS type,
        s.SoID AS orderId,
        sb.ID AS lineId,
        'SO-' || s.SoID AS refNo,
        COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) AS date,
        COALESCE(s.CreatedDateTime, s.Date) AS timestamp,
        b.Id AS batteryId,
        b.Brand AS brand,
        b.Model AS model,
        (b.Voltage || ' ' || b.Capacity) AS spec,
        COALESCE(c.Name, swc.CustomerName, 'Walk-in Customer') AS partnerName,
        sb.Qty AS qty,
        sb.Price AS unitPrice,
        COALESCE(sb.Discount, 0) AS discount,
        (sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)) AS netAmount,
        CASE
          WHEN s.IsCompleted = 1 THEN 'Completed'
          WHEN s.IsPaymentCompleted = 1 THEN 'Paid'
          WHEN s.IsAdminApproved = 1 THEN 'Approved'
          ELSE 'Pending'
        END AS status
      FROM SO s
      JOIN SoBatteries sb ON sb.SoID = s.SoID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SoWalkinCustomer swc ON swc.SoID = s.SoID
      WHERE COALESCE(s.Date, substr(s.CreatedDateTime, 1, 10)) BETWEEN ? AND ?
      ${brandVal ? " AND b.Brand = ?" : ""}
      ${term ? " AND ('SO-' || s.SoID LIKE ? OR b.Brand LIKE ? OR b.Model LIKE ? OR COALESCE(c.Name, swc.CustomerName, '') LIKE ?)" : ""}
    `)
    unionParams.push(range.fromDate, range.toDate)
    if (brandVal) unionParams.push(brandVal)
    if (term) unionParams.push(term, term, term, term)
  }

  if (type === "ALL" || type === "PROCUREMENT") {
    unions.push(`
      SELECT
        'PROCUREMENT' AS type,
        p.ID AS orderId,
        pb.ID AS lineId,
        'PO-' || p.ID AS refNo,
        substr(p.Date, 1, 10) AS date,
        COALESCE(p.Date, datetime('now')) AS timestamp,
        b.Id AS batteryId,
        b.Brand AS brand,
        b.Model AS model,
        (b.Voltage || ' ' || b.Capacity) AS spec,
        COALESCE(sup.Name, 'Direct Supplier') AS partnerName,
        pb.Qty AS qty,
        pb.Price AS unitPrice,
        COALESCE(pb.Discount, 0) AS discount,
        (pb.Price * pb.Qty * (1 - COALESCE(pb.Discount, 0) / 100.0)) AS netAmount,
        COALESCE(st.StatusName, CASE WHEN p.IsAdminApproved = 1 THEN 'Approved' ELSE 'Pending' END) AS status
      FROM PO p
      JOIN POBatteries pb ON pb.POID = p.ID
      JOIN BatteryM b ON b.Id = pb.BatteryID
      LEFT JOIN PoBatterySuppliers pbs ON pbs.PoBatteriesID = pb.ID
      LEFT JOIN SupplierM sup ON sup.SupplierID = pbs.SupplierID
      LEFT JOIN StatusM st ON st.Id = pb.StatusID
      WHERE substr(p.Date, 1, 10) BETWEEN ? AND ?
      ${brandVal ? " AND b.Brand = ?" : ""}
      ${term ? " AND ('PO-' || p.ID LIKE ? OR b.Brand LIKE ? OR b.Model LIKE ? OR COALESCE(sup.Name, '') LIKE ?)" : ""}
    `)
    unionParams.push(range.fromDate, range.toDate)
    if (brandVal) unionParams.push(brandVal)
    if (term) unionParams.push(term, term, term, term)
  }

  if (type === "ALL" || type === "RETURN") {
    unions.push(`
      SELECT
        'RETURN' AS type,
        srb.SalesReturnID AS orderId,
        srb.ID AS lineId,
        COALESCE('SR-' || sr.ReturnNo, 'SR-' || srb.ID) AS refNo,
        substr(srb.ReturnDate, 1, 10) AS date,
        COALESCE(srb.ReturnDate, datetime('now')) AS timestamp,
        b.Id AS batteryId,
        b.Brand AS brand,
        b.Model AS model,
        (b.Voltage || ' ' || b.Capacity) AS spec,
        COALESCE(c.Name, 'Warranty Claim') AS partnerName,
        srb.Qty AS qty,
        sb.Price AS unitPrice,
        0 AS discount,
        -(sb.Price * srb.Qty) AS netAmount,
        COALESCE(srs.StatusName, 'Returned') AS status
      FROM SoReturnBatteries srb
      JOIN SoBatteries sb ON sb.ID = srb.SoBatteryID
      JOIN BatteryM b ON b.Id = sb.BatteryID
      LEFT JOIN SalesReturn sr ON sr.SalesReturnID = srb.SalesReturnID
      LEFT JOIN SO s ON s.SoID = sb.SoID
      LEFT JOIN SoCustomer sc ON sc.SoID = s.SoID
      LEFT JOIN CustomerM c ON c.CustomerID = sc.CustomerID
      LEFT JOIN SalesReturnStatusM srs ON srs.Id = srb.StatusId
      WHERE substr(srb.ReturnDate, 1, 10) BETWEEN ? AND ?
      ${brandVal ? " AND b.Brand = ?" : ""}
      ${term ? " AND (COALESCE(sr.ReturnNo, '') LIKE ? OR b.Brand LIKE ? OR b.Model LIKE ? OR COALESCE(c.Name, '') LIKE ?)" : ""}
    `)
    unionParams.push(range.fromDate, range.toDate)
    if (brandVal) unionParams.push(brandVal)
    if (term) unionParams.push(term, term, term, term)
  }

  const combinedSql = unions.join(" UNION ALL ")

  // Total count & financial sums
  const countRow = db
    .prepare(`
      SELECT
        COUNT(*) AS totalCount,
        COALESCE(SUM(qty), 0) AS totalQty,
        COALESCE(SUM(netAmount), 0) AS totalAmount
      FROM (${combinedSql})
    `)
    .get(...unionParams)

  const totalCount = Number(countRow?.totalCount || 0)
  const totalQty = Number(countRow?.totalQty || 0)
  const totalAmount = Number(countRow?.totalAmount || 0)
  const totalPages = Math.ceil(totalCount / l) || 1

  // Sorting
  const orderCol = sortBy === "amount" ? "netAmount" : sortBy === "qty" ? "qty" : "date"
  const orderDir = String(sortOrder).toUpperCase() === "ASC" ? "ASC" : "DESC"

  const items = db
    .prepare(`
      SELECT *
      FROM (${combinedSql})
      ORDER BY ${orderCol} ${orderDir}, timestamp ${orderDir}, lineId ${orderDir}
      LIMIT ? OFFSET ?
    `)
    .all(...unionParams, l, offset)

  return {
    items: items.map((r) => ({
      type: String(r.type),
      orderId: Number(r.orderId),
      lineId: Number(r.lineId),
      refNo: String(r.refNo),
      date: String(r.date),
      timestamp: String(r.timestamp),
      batteryId: Number(r.batteryId),
      brand: String(r.brand),
      model: String(r.model),
      spec: String(r.spec || ""),
      partnerName: String(r.partnerName || "-"),
      qty: Number(r.qty || 0),
      unitPrice: Number(r.unitPrice || 0),
      discount: Number(r.discount || 0),
      netAmount: Number(r.netAmount || 0),
      status: String(r.status || "Completed"),
    })),
    pagination: {
      page: p,
      limit: l,
      totalCount,
      totalPages,
    },
    summary: {
      totalQty,
      totalAmount,
    },
  }
}
