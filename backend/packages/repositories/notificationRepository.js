const db = require("../database/connection")

exports.getAllNotifications = () => {
  return db
    .prepare(`
      SELECT
        id,
        code,
        title,
        description,
        navigationPath
      FROM Notifications
      ORDER BY id DESC
    `)
    .all()
}

exports.getNotificationById = (id) => {
  return db
    .prepare(`
      SELECT
        id,
        code,
        title,
        description,
        navigationPath
      FROM Notifications
      WHERE id = ?
    `)
    .get(id)
}

exports.getNotificationByCode = (code) => {
  return db
    .prepare(`
      SELECT
        id,
        code,
        title,
        description,
        navigationPath
      FROM Notifications
      WHERE code = ?
    `)
    .get(code)
}

exports.createNotification = (notification) => {
  const result = db
    .prepare(`
      INSERT INTO Notifications (
        code,
        title,
        description,
        navigationPath
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(
      notification.code,
      notification.title,
      notification.description,
      notification.navigationPath
    )

  return exports.getNotificationById(result.lastInsertRowid)
}

exports.updateNotification = (id, notification) => {
  const result = db
    .prepare(`
      UPDATE Notifications
      SET
        code = ?,
        title = ?,
        description = ?,
        navigationPath = ?
      WHERE id = ?
    `)
    .run(
      notification.code,
      notification.title,
      notification.description,
      notification.navigationPath,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getNotificationById(id)
}

exports.deleteNotification = (id) => {
  return db
    .prepare("DELETE FROM Notifications WHERE id = ?")
    .run(id)
}

exports.deleteAllNotifications = () => {
  return db
    .prepare("DELETE FROM Notifications")
    .run()
}

exports.getAllNotificationCodes = () => {
  return db
    .prepare("SELECT code FROM Notifications")
    .all()
    .map((row) => row.code)
}

exports.createNotificationsBatch = (notifications) => {
  if (!notifications.length) return []

  const insert = db.prepare(`
    INSERT INTO Notifications (code, title, description, navigationPath)
    VALUES (?, ?, ?, ?)
  `)

  const inserted = []
  const insertMany = db.transaction((items) => {
    for (const notification of items) {
      const result = insert.run(
        notification.code,
        notification.title,
        notification.description,
        notification.navigationPath
      )
      inserted.push(exports.getNotificationById(result.lastInsertRowid))
    }
  })

  insertMany(notifications)
  return inserted
}
