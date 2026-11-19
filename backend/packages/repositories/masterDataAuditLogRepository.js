const db = require("../database/connection")

const insertMasterDataAuditLogStatement = db.prepare(`
  INSERT INTO MasterDataAuditLog (
    Action,
    EntityType,
    EntityId,
    EntityName,
    BeforeData,
    AfterData,
    ChangedBy
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

exports.insertMasterDataAuditLog = ({
  action,
  entityType,
  entityId,
  entityName,
  beforeData,
  afterData,
  changedBy,
}) => {
  const result = insertMasterDataAuditLogStatement.run(
    action,
    entityType,
    entityId,
    entityName,
    beforeData,
    afterData,
    changedBy
  )

  return { Id: result.lastInsertRowid }
}

exports.getMasterDataAuditLogs = (options = {}) => {
  const { entityType, entityId, limit } = options
  const conditions = []
  const params = []

  if (entityType) {
    conditions.push("EntityType = ?")
    params.push(entityType)
  }

  if (entityId) {
    conditions.push("EntityId = ?")
    params.push(entityId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limitClause = limit ? "LIMIT ?" : ""

  if (limit) {
    params.push(limit)
  }

  return db
    .prepare(`
      SELECT
        Id,
        Action,
        EntityType,
        EntityId,
        EntityName,
        BeforeData,
        AfterData,
        ChangedBy,
        CreatedDateTime
      FROM MasterDataAuditLog
      ${whereClause}
      ORDER BY Id DESC
      ${limitClause}
    `)
    .all(...params)
}
