const db = require("../database/connection")

const insertSOAuditLogStatement = db.prepare(`
  INSERT INTO SOAuditLog (
    SoID,
    Action,
    EventData,
    BeforeData,
    AfterData,
    ChangedBy
  )
  VALUES (?, ?, ?, ?, ?, ?)
`)

exports.insertSOAuditLog = ({
  soId,
  action,
  eventData,
  beforeData,
  afterData,
  changedBy,
}) => {
  const result = insertSOAuditLogStatement.run(
    soId,
    action,
    eventData,
    beforeData,
    afterData,
    changedBy
  )

  return { Id: result.lastInsertRowid }
}

exports.getSOAuditLogsBySoId = (soId) => {
  return db
    .prepare(`
      SELECT
        Id,
        SoID,
        Action,
        EventData,
        BeforeData,
        AfterData,
        ChangedBy,
        CreatedDateTime
      FROM SOAuditLog
      WHERE SoID = ?
      ORDER BY Id DESC
    `)
    .all(soId)
}
