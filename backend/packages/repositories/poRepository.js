const db = require("../database/connection")

const ensurePoCategoryColumn = () => {
  try {
    const columns = db.prepare("PRAGMA table_info(PO)").all()
    const hasCategory = columns.some((c) => c.name.toLowerCase() === "category")
    if (!hasCategory) {
      db.exec("ALTER TABLE PO ADD COLUMN Category TEXT DEFAULT 'tyre'")
    }
  } catch (err) {
    // ignore
  }
}

ensurePoCategoryColumn()

exports.getAllPOs = (category) => {
  if (category && (category === "tyre" || category === "battery")) {
    return db
      .prepare(`
        SELECT
          p.ID,
          p.SoID,
          p.StatusID,
          s.StatusCode,
          p.IsAdminApproved,
          p.IsSupplierApproved,
          p.Date,
          COALESCE(p.Category, 'tyre') AS Category
        FROM PO p
        LEFT JOIN StatusM s ON s.Id = p.StatusID
        WHERE COALESCE(p.Category, 'tyre') = ?
        ORDER BY p.ID DESC
      `)
      .all(category)
  }

  return db
    .prepare(`
      SELECT
        p.ID,
        p.SoID,
        p.StatusID,
        s.StatusCode,
        p.IsAdminApproved,
        p.IsSupplierApproved,
        p.Date,
        COALESCE(p.Category, 'tyre') AS Category
      FROM PO p
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      ORDER BY p.ID DESC
    `)
    .all()
}

exports.getPOById = (id) => {
  return db
    .prepare(`
      SELECT
        p.ID,
        p.SoID,
        p.StatusID,
        s.StatusCode,
        p.IsAdminApproved,
        p.IsSupplierApproved,
        p.Date,
        COALESCE(p.Category, 'tyre') AS Category
      FROM PO p
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      WHERE p.ID = ?
    `)
    .get(id)
}

exports.getPOBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        p.ID,
        p.SoID,
        p.StatusID,
        s.StatusCode,
        p.IsAdminApproved,
        p.IsSupplierApproved,
        p.Date,
        COALESCE(p.Category, 'tyre') AS Category
      FROM PO p
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      WHERE p.SoID = ?
    `)
    .get(soId)
}

exports.createPO = (po) => {
  const result = db
    .prepare(`
      INSERT INTO PO (
        SoID,
        StatusID,
        Category,
        IsAdminApproved,
        IsSupplierApproved,
        Date
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      po.SoID,
      po.StatusID,
      po.Category || "tyre",
      po.IsAdminApproved,
      po.IsSupplierApproved,
      po.Date
    )

  return exports.getPOById(result.lastInsertRowid)
}

exports.createStandalonePO = (po) => {
  const result = db
    .prepare(`
      INSERT INTO PO (
        StatusID,
        Category,
        IsAdminApproved,
        IsSupplierApproved,
        Date
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      po.StatusID,
      po.Category || "tyre",
      po.IsAdminApproved,
      po.IsSupplierApproved,
      po.Date
    )

  return exports.getPOById(result.lastInsertRowid)
}

exports.updatePO = (id, po) => {
  const result = db
    .prepare(`
      UPDATE PO
      SET
        SoID = ?,
        Category = COALESCE(?, Category, 'tyre'),
        IsAdminApproved = ?,
        IsSupplierApproved = ?,
        Date = ?
      WHERE ID = ?
    `)
    .run(
      po.SoID,
      po.Category || null,
      po.IsAdminApproved,
      po.IsSupplierApproved,
      po.Date,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getPOById(id)
}

exports.updateStandalonePO = (id, po) => {
  const result = db
    .prepare(`
      UPDATE PO
      SET
        Category = COALESCE(?, Category, 'tyre'),
        IsAdminApproved = ?,
        IsSupplierApproved = ?,
        Date = ?,
        StatusID = ?
      WHERE ID = ?
    `)
    .run(
      po.Category || null,
      po.IsAdminApproved,
      po.IsSupplierApproved,
      po.Date,
      po.StatusID,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getPOById(id)
}

exports.updateStatus = (id, statusId) => {
  const result = db
    .prepare(`
      UPDATE PO
      SET StatusID = ?
      WHERE ID = ?
    `)
    .run(statusId, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getPOById(id)
}

exports.getPendingPOCount = (category) => {
  if (category && (category === "tyre" || category === "battery")) {
    return db
      .prepare(`
        SELECT COUNT(*) AS Count
        FROM PO p
        LEFT JOIN StatusM s ON s.Id = p.StatusID
        WHERE s.StatusCode NOT IN ('arv', 'cmp') AND COALESCE(p.Category, 'tyre') = ?
      `)
      .get(category)
  }

  return db
    .prepare(`
      SELECT COUNT(*) AS Count
      FROM PO p
      LEFT JOIN StatusM s ON s.Id = p.StatusID
      WHERE s.StatusCode NOT IN ('arv', 'cmp')
    `)
    .get()
}

exports.deletePO = (id) => {
  return db
    .prepare("DELETE FROM PO WHERE ID = ?")
    .run(id)
}

exports.deletePOBySoId = (soId) => {
  return db
    .prepare("DELETE FROM PO WHERE SoID = ?")
    .run(soId)
}
