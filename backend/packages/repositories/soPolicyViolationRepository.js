const db = require("../database/connection")

const VIOLATION_COLUMNS = `
  v.Id,
  v.SoID,
  v.SoTyreID,
  v.TyreID,
  v.ViolationTypeCode,
  vt.ViolationTypeName,
  v.Qty,
  v.Price,
  v.MaxDiscountAllowed,
  v.AppliedDiscount,
  v.DiscountExcess,
  v.Details,
  v.IsApproved,
  v.ApproveNote,
  v.ApprovedBy,
  v.ApprovedDateTime,
  v.ResponsibleUser,
  v.CreatedDateTime,
  t.Size AS TyreSize,
  t.Pattern AS TyrePattern
`

const DOT_COLUMNS = `
  d.Id,
  d.PolicyViolationID,
  d.DOT,
  d.OldestAvailableDOT,
  d.StorageManagerID,
  d.StorageManagerBatchID,
  d.Qty,
  d.CreatedDateTime
`

const selectSOPolicyViolations = `
  SELECT ${VIOLATION_COLUMNS}
  FROM SOPolicyViolation v
  LEFT JOIN PolicyViolationTypeM vt ON vt.ViolationTypeCode = v.ViolationTypeCode
  LEFT JOIN TyreM t ON t.Id = v.TyreID
`

const getSOPolicyViolationDOTs = (policyViolationId) => {
  return db
    .prepare(`
      SELECT ${DOT_COLUMNS}
      FROM SOPolicyViolationDOT d
      WHERE d.PolicyViolationID = ?
      ORDER BY d.Id ASC
    `)
    .all(policyViolationId)
}

const withDots = (violations) => {
  const list = Array.isArray(violations) ? violations : violations ? [violations] : []

  return list.map((violation) => {
    if (!violation) return violation
    return { ...violation, DOTs: getSOPolicyViolationDOTs(violation.Id) }
  })
}

exports.insertSOPolicyViolation = (violation) => {
  const result = db
    .prepare(`
      INSERT INTO SOPolicyViolation (
        SoID,
        SoTyreID,
        TyreID,
        ViolationTypeCode,
        Qty,
        Price,
        MaxDiscountAllowed,
        AppliedDiscount,
        DiscountExcess,
        Details,
        ResponsibleUser
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      violation.SoID,
      violation.SoTyreID ?? null,
      violation.TyreID,
      violation.ViolationTypeCode,
      violation.Qty ?? 1,
      violation.Price ?? null,
      violation.MaxDiscountAllowed ?? null,
      violation.AppliedDiscount ?? null,
      violation.DiscountExcess ?? null,
      violation.Details ?? null,
      violation.ResponsibleUser ?? null
    )

  const parentId = result.lastInsertRowid
  const dots = Array.isArray(violation.DOTs) ? violation.DOTs : []

  if (dots.length > 0) {
    const insertDot = db.prepare(`
      INSERT INTO SOPolicyViolationDOT (
        PolicyViolationID,
        DOT,
        OldestAvailableDOT,
        StorageManagerID,
        StorageManagerBatchID,
        Qty
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const dot of dots) {
      insertDot.run(
        parentId,
        dot.DOT ?? null,
        dot.OldestAvailableDOT ?? null,
        dot.StorageManagerID ?? null,
        dot.StorageManagerBatchID ?? null,
        dot.Qty ?? 1
      )
    }
  }

  return withDots(exports.getSOPolicyViolationById(parentId))[0]
}

exports.getSOPolicyViolationById = (id) => {
  const violation = db
    .prepare(`
      ${selectSOPolicyViolations}
      WHERE v.Id = ?
    `)
    .get(id)

  return withDots(violation)[0]
}

exports.getSOPolicyViolations = () => {
  return withDots(
    db
      .prepare(`
        ${selectSOPolicyViolations}
        ORDER BY v.Id DESC
      `)
      .all()
  )
}

exports.getPendingSOPolicyViolations = () => {
  return withDots(
    db
      .prepare(`
        ${selectSOPolicyViolations}
        WHERE v.IsApproved = 0
        ORDER BY v.Id DESC
      `)
      .all()
  )
}

exports.getSOPolicyViolationsBySoId = (soId) => {
  return withDots(
    db
      .prepare(`
        ${selectSOPolicyViolations}
        WHERE v.SoID = ?
        ORDER BY v.Id DESC
      `)
      .all(soId)
  )
}

exports.getSOPolicyViolationsByTyreId = (tyreId) => {
  return withDots(
    db
      .prepare(`
        ${selectSOPolicyViolations}
        WHERE v.TyreID = ?
        ORDER BY v.Id DESC
      `)
      .all(tyreId)
  )
}

exports.getSOPolicyViolationDOTsBySoId = (soId) => {
  return db
    .prepare(`
      SELECT ${DOT_COLUMNS}
      FROM SOPolicyViolationDOT d
      JOIN SOPolicyViolation v ON v.Id = d.PolicyViolationID
      WHERE v.SoID = ?
      ORDER BY d.Id ASC
    `)
    .all(soId)
}

exports.updateSOPolicyViolationApproval = (id, { approveNote, approvedBy }) => {
  const result = db
    .prepare(`
      UPDATE SOPolicyViolation
      SET
        IsApproved = 1,
        ApproveNote = ?,
        ApprovedBy = ?,
        ApprovedDateTime = datetime('now', 'localtime')
      WHERE Id = ?
    `)
    .run(approveNote ?? null, approvedBy ?? null, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getSOPolicyViolationById(id)
}

exports.deleteSOPolicyViolation = (id) => {
  return db
    .prepare("DELETE FROM SOPolicyViolation WHERE Id = ?")
    .run(id)
}

exports.deleteSOPolicyViolationDOT = (id) => {
  return db
    .prepare("DELETE FROM SOPolicyViolationDOT WHERE Id = ?")
    .run(id)
}