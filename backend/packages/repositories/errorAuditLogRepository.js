const db = require("../database/connection")

const insertErrorAuditLogStatement = db.prepare(`
  INSERT INTO ErrorAuditLog (
    Channel,
    Code,
    ErrorName,
    Message,
    StackTrace,
    Details,
    Source,
    ChangedBy
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

exports.insertErrorAuditLog = ({
  channel,
  code,
  errorName,
  message,
  stackTrace,
  details,
  source,
  changedBy,
}) => {
  const result = insertErrorAuditLogStatement.run(
    channel,
    code,
    errorName,
    message,
    stackTrace,
    details,
    source,
    changedBy
  )

  return { Id: result.lastInsertRowid }
}

exports.getErrorAuditLogs = (options = {}) => {
  const { channel, code, limit = 200 } = options
  const conditions = []
  const params = []

  if (channel) {
    conditions.push("Channel = ?")
    params.push(channel)
  }

  if (code) {
    conditions.push("Code = ?")
    params.push(code)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  params.push(limit)

  return db
    .prepare(`
      SELECT
        Id,
        Channel,
        Code,
        ErrorName,
        Message,
        StackTrace,
        Details,
        Source,
        ChangedBy,
        CreatedDateTime
      FROM ErrorAuditLog
      ${whereClause}
      ORDER BY Id DESC
      LIMIT ?
    `)
    .all(...params)
}
