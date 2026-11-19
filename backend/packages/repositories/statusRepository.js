const db = require("../database/connection")

exports.getAllStatuses = () => {
  return db
    .prepare(`
      SELECT
        Id,
        StatusCode,
        StatusName
      FROM StatusM
      ORDER BY Id ASC
    `)
    .all()
}

exports.getStatusById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        StatusCode,
        StatusName
      FROM StatusM
      WHERE Id = ?
    `)
    .get(id)
}

exports.getStatusByCode = (statusCode) => {
  return db
    .prepare(`
      SELECT
        Id,
        StatusCode,
        StatusName
      FROM StatusM
      WHERE StatusCode = ?
    `)
    .get(statusCode)
}
