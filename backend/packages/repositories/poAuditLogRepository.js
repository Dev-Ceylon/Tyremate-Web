const db = require("../database/connection")

const insertPOAuditLogStatement = db.prepare(`
  INSERT INTO POAuditLog (
    POID,
    Action,
    EventData,
    BeforeData,
    AfterData,
    ChangedBy
  )
  VALUES (?, ?, ?, ?, ?, ?)
`)

exports.insertPOAuditLog = ({
  poId,
  action,
  eventData,
  beforeData,
  afterData,
  changedBy,
}) => {
  const result = insertPOAuditLogStatement.run(
    poId,
    action,
    eventData,
    beforeData,
    afterData,
    changedBy
  )

  return { Id: result.lastInsertRowid }
}

exports.getPOAuditLogsByPoId = (poId) => {
  return db
    .prepare(`
      SELECT
        Id,
        POID,
        Action,
        EventData,
        BeforeData,
        AfterData,
        ChangedBy,
        CreatedDateTime
      FROM POAuditLog
      WHERE POID = ?
      ORDER BY Id DESC
    `)
    .all(poId)
}
