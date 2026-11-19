const db = require("../database/connection")

const insertOtherServiceAuditLogStatement = db.prepare(`
  INSERT INTO OtherServiceAuditLog (
    OSID,
    Action,
    EventData,
    BeforeData,
    AfterData,
    ChangedBy
  )
  VALUES (?, ?, ?, ?, ?, ?)
`)

exports.insertOtherServiceAuditLog = ({
  osId,
  action,
  eventData,
  beforeData,
  afterData,
  changedBy,
}) => {
  const result = insertOtherServiceAuditLogStatement.run(
    osId,
    action,
    eventData,
    beforeData,
    afterData,
    changedBy
  )

  return { Id: result.lastInsertRowid }
}

exports.getOtherServiceAuditLogsByOsId = (osId) => {
  return db
    .prepare(`
      SELECT
        Id,
        OSID,
        Action,
        EventData,
        BeforeData,
        AfterData,
        ChangedBy,
        CreatedDateTime
      FROM OtherServiceAuditLog
      WHERE OSID = ?
      ORDER BY Id DESC
    `)
    .all(osId)
}
