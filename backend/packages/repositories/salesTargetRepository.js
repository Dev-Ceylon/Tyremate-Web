const db = require("../database/connection")

/**
 * Creates a new sales target.
 */
exports.createTarget = (data) => {
  const result = db
    .prepare(`
      INSERT INTO SalesTargets (
        SalesRepID,
        PeriodType,
        StartDate,
        EndDate,
        TargetAmount,
        TargetQty,
        Category,
        Notes,
        CreatedBy,
        CreatedAt,
        UpdatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `)
    .run(
      data.SalesRepID,
      data.PeriodType,
      data.StartDate,
      data.EndDate,
      data.TargetAmount || 0,
      data.TargetQty || 0,
      data.Category || "all",
      data.Notes || null,
      data.CreatedBy || null
    )

  return exports.getTargetById(result.lastInsertRowid)
}

/**
 * Updates an existing sales target.
 */
exports.updateTarget = (id, data) => {
  const result = db
    .prepare(`
      UPDATE SalesTargets
      SET
        TargetAmount = COALESCE(?, TargetAmount),
        TargetQty = COALESCE(?, TargetQty),
        Notes = COALESCE(?, Notes),
        UpdatedAt = datetime('now', 'localtime')
      WHERE TargetID = ?
    `)
    .run(
      data.TargetAmount !== undefined ? data.TargetAmount : null,
      data.TargetQty !== undefined ? data.TargetQty : null,
      data.Notes !== undefined ? data.Notes : null,
      id
    )

  if (result.changes === 0) return null
  return exports.getTargetById(id)
}

/**
 * Deletes a sales target.
 */
exports.deleteTarget = (id) => {
  return db.prepare("DELETE FROM SalesTargets WHERE TargetID = ?").run(id)
}

/**
 * Gets a sales target by ID with SalesRep and Creator metadata.
 */
exports.getTargetById = (id) => {
  return db
    .prepare(`
      SELECT
        t.*,
        u.displayName AS SalesRepName,
        u.username AS SalesRepUsername,
        creator.displayName AS CreatedByName
      FROM SalesTargets t
      JOIN users u ON u.id = t.SalesRepID
      LEFT JOIN users creator ON creator.id = t.CreatedBy
      WHERE t.TargetID = ?
    `)
    .get(id)
}

/**
 * Checks if a target with the same (SalesRepID, PeriodType, StartDate, Category) already exists.
 */
exports.findDuplicateTarget = (repId, periodType, startDate, category, excludeTargetId = null) => {
  let query = `
    SELECT TargetID
    FROM SalesTargets
    WHERE SalesRepID = ? AND PeriodType = ? AND StartDate = ? AND Category = ?
  `
  const params = [repId, periodType, startDate, category || "all"]
  if (excludeTargetId) {
    query += " AND TargetID != ?"
    params.push(excludeTargetId)
  }
  return db.prepare(query).get(...params)
}

/**
 * Retrieves all sales targets matching optional filters.
 */
exports.getAllTargets = ({ repId, periodType, category, fromDate, toDate } = {}) => {
  const conditions = ["1=1"]
  const params = []

  if (repId) {
    conditions.push("t.SalesRepID = ?")
    params.push(Number(repId))
  }

  if (periodType && periodType !== "all") {
    conditions.push("t.PeriodType = ?")
    params.push(periodType)
  }

  if (category && category !== "all") {
    conditions.push("t.Category = ?")
    params.push(category)
  }

  if (fromDate) {
    conditions.push("t.EndDate >= ?")
    params.push(fromDate)
  }

  if (toDate) {
    conditions.push("t.StartDate <= ?")
    params.push(toDate)
  }

  const query = `
    SELECT
      t.*,
      u.displayName AS SalesRepName,
      u.username AS SalesRepUsername,
      creator.displayName AS CreatedByName
    FROM SalesTargets t
    JOIN users u ON u.id = t.SalesRepID
    LEFT JOIN users creator ON creator.id = t.CreatedBy
    WHERE ${conditions.join(" AND ")}
    ORDER BY t.StartDate DESC, t.TargetID DESC
  `

  return db.prepare(query).all(...params)
}

function formatLocalDate(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Retrieves active targets for a specific sales representative on a given date.
 */
exports.getActiveTargetsForRep = (repId, referenceDate) => {
  const date = referenceDate || formatLocalDate(new Date())
  return db
    .prepare(`
      SELECT
        t.*,
        u.displayName AS SalesRepName,
        u.username AS SalesRepUsername
      FROM SalesTargets t
      JOIN users u ON u.id = t.SalesRepID
      WHERE t.SalesRepID = ?
        AND t.StartDate <= ?
        AND t.EndDate >= ?
      ORDER BY
        CASE t.PeriodType
          WHEN 'daily' THEN 1
          WHEN 'weekly' THEN 2
          WHEN 'monthly' THEN 3
          WHEN 'annually' THEN 4
          ELSE 5
        END ASC,
        t.TargetID DESC
    `)
    .all(repId, date, date)
}

/**
 * Computes actual approved sales figures (revenue & unit quantity) achieved
 * by a sales rep within a date window.
 */
exports.getActualSalesForRep = ({ repId, startDate, endDate, category = "all" }) => {
  const categoryFilter = category && category !== "all"
    ? "AND COALESCE(s.Category, 'tyre') = ?"
    : ""
  const params = [repId, repId, startDate, endDate]
  if (categoryFilter) {
    params.push(category)
  }

  const query = `
    SELECT
      COUNT(DISTINCT s.SoID) AS orderCount,
      COALESCE(SUM(
        CASE
          WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
            (SELECT COALESCE(SUM(sb.Price * sb.Qty * (1 - COALESCE(sb.Discount, 0) / 100.0)), 0) FROM SoBatteries sb WHERE sb.SoID = s.SoID)
          ELSE
            (SELECT COALESCE(SUM(st.Price * st.Qty * (1 - COALESCE(st.Discount, 0) / 100.0)), 0) FROM SoTyres st WHERE st.SoID = s.SoID)
        END
      ), 0) AS actualAmount,
      COALESCE(SUM(
        CASE
          WHEN COALESCE(s.Category, 'tyre') = 'battery' THEN
            (SELECT COALESCE(SUM(sb.Qty), 0) FROM SoBatteries sb WHERE sb.SoID = s.SoID)
          ELSE
            (SELECT COALESCE(SUM(st.Qty), 0) FROM SoTyres st WHERE st.SoID = s.SoID)
        END
      ), 0) AS actualQty
    FROM SO s
    WHERE (
      s.SalesRepID = ?
      OR (s.SalesRepID IS NULL AND EXISTS (
        SELECT 1 FROM Inquiry i WHERE i.ConvertedSOID = s.SoID AND i.SalesRepID = ?
      ))
    )
    AND s.IsAdminApproved = 1
    AND substr(COALESCE(s.Date, s.CreatedDateTime), 1, 10) BETWEEN ? AND ?
    ${categoryFilter}
  `

  const result = db.prepare(query).get(...params)
  return {
    orderCount: result ? Number(result.orderCount) || 0 : 0,
    actualAmount: result ? Number(result.actualAmount) || 0 : 0,
    actualQty: result ? Number(result.actualQty) || 0 : 0,
  }
}

/**
 * Returns all active users eligible to receive sales targets (SalesRep role or view_own permission).
 */
exports.getEligibleSalesReps = () => {
  return db
    .prepare(`
      SELECT DISTINCT
        u.id,
        u.username,
        u.displayName,
        u.isActive
      FROM users u
      JOIN userRoles ur ON ur.userId = u.id
      JOIN rolePermissions rp ON rp.roleId = ur.roleId
      JOIN permissions p ON p.permissionId = rp.permissionId
      WHERE (p.permissionKey = 'targets.view_own' OR ur.roleId = 4)
        AND u.isActive = 1
      ORDER BY COALESCE(u.displayName, u.username) ASC
    `)
    .all()
}
