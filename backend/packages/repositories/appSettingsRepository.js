const db = require("../database/connection")

exports.get = (key) => {
  const row = db.prepare("SELECT SettingValue FROM AppSettings WHERE SettingKey = ?").get(key)
  return row ? row.SettingValue : null
}

exports.getMany = (prefix) => {
  return db
    .prepare("SELECT SettingKey, SettingValue, UpdatedAt, UpdatedBy FROM AppSettings WHERE SettingKey LIKE ? ORDER BY SettingKey")
    .all(`${prefix}%`)
}

exports.set = (key, value, updatedBy = null) => {
  db.prepare(`
    INSERT INTO AppSettings (SettingKey, SettingValue, UpdatedAt, UpdatedBy)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(SettingKey) DO UPDATE SET
      SettingValue = excluded.SettingValue,
      UpdatedAt = CURRENT_TIMESTAMP,
      UpdatedBy = excluded.UpdatedBy
  `).run(key, value, updatedBy)
}

exports.insertIfMissing = (key, value) => {
  db.prepare("INSERT OR IGNORE INTO AppSettings (SettingKey, SettingValue) VALUES (?, ?)").run(key, value)
}
