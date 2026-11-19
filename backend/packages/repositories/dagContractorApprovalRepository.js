const db = require("../database/connection")

// ApprovalStatus is a nullable tri-state mirroring PoTyresSuppliers.IsApproved:
// NULL = pending (awaiting an approve/reject decision), 'approved', 'rejected'.
// The contractor name is joined rather than stored, so a contractor rename
// shows up in the history instead of freezing a stale copy.
const APPROVAL_SELECT = `
  SELECT
    a.ID,
    a.DAGID,
    a.ContractorID,
    ct.Name AS ContractorName,
    a.ApprovalStatus,
    a.ApprovedDateTime,
    a.CapturedBy
  FROM DAGContractorApprovals a
  LEFT JOIN ContractorM ct ON ct.ID = a.ContractorID
`

exports.getDAGContractorApprovalById = (id) => {
  return db
    .prepare(`
      ${APPROVAL_SELECT}
      WHERE a.ID = ?
    `)
    .get(id)
}

exports.getDAGContractorApprovalsByDAGId = (dagId) => {
  return db
    .prepare(`
      ${APPROVAL_SELECT}
      WHERE a.DAGID = ?
      ORDER BY a.ID DESC
    `)
    .all(dagId)
}

exports.getLatestDAGContractorApprovalByDAGId = (dagId) => {
  return db
    .prepare(`
      ${APPROVAL_SELECT}
      WHERE a.DAGID = ?
      ORDER BY a.ID DESC
      LIMIT 1
    `)
    .get(dagId)
}

exports.getLatestApprovedDAGContractorApprovalByDAGId = (dagId) => {
  return db
    .prepare(`
      ${APPROVAL_SELECT}
      WHERE a.DAGID = ? AND a.ApprovalStatus = 'approved'
      ORDER BY a.ID DESC
      LIMIT 1
    `)
    .get(dagId)
}

// Assignment is the first of two steps: the row is created pending and
// ApprovalStatus/ApprovedDateTime/CapturedBy are left NULL until an approver
// decides. Signature mirrors poTyresSuppliersRepository.createPoTyresSupplier,
// which likewise writes a NULL IsApproved at allocation time.
exports.createDAGContractorApproval = (approval) => {
  const result = db
    .prepare(`
      INSERT INTO DAGContractorApprovals (
        DAGID,
        ContractorID,
        ApprovalStatus,
        ApprovedDateTime,
        CapturedBy
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      approval.DAGID,
      approval.ContractorID,
      approval.ApprovalStatus ?? null,
      approval.ApprovedDateTime ?? null,
      approval.CapturedBy ?? null,
    )

  return exports.getDAGContractorApprovalById(result.lastInsertRowid)
}

// Second step of the same split as the create above: narrow, single-column
// update mirroring poTyresSuppliersRepository.updateApprovalStatus. Guarded on
// ApprovalStatus IS NULL so a decided approval cannot be silently re-decided
// and its history stays append-only.
exports.updateDAGContractorApprovalStatus = (id, approvalStatus, approvedDateTime, capturedBy) => {
  const result = db
    .prepare(`
      UPDATE DAGContractorApprovals
      SET
        ApprovalStatus = ?,
        ApprovedDateTime = ?,
        CapturedBy = ?
      WHERE ID = ? AND ApprovalStatus IS NULL
    `)
    .run(approvalStatus, approvedDateTime ?? null, capturedBy ?? null, id)

  return { changes: result.changes, approval: exports.getDAGContractorApprovalById(id) }
}

exports.deleteDAGContractorApprovalsByDAGId = (dagId) => {
  return db
    .prepare("DELETE FROM DAGContractorApprovals WHERE DAGID = ?")
    .run(dagId)
}