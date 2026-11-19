const db = require("../database/connection")

exports.findByUsername = (username) => {
  return db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username)
}

exports.createUser = (username, passwordHash) => {
  return db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash)
}

exports.getById = (id) => {
  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id)
}

exports.getRolesByUserId = (userId) => {
  return db
    .prepare(`
      SELECT r.roleId, r.roleName, r.description
      FROM roles r
      INNER JOIN userRoles ur ON ur.roleId = r.roleId
      WHERE ur.userId = ?
    `)
    .all(userId)
}

exports.getPermissionsByUserId = (userId) => {
  return db
    .prepare(`
      SELECT DISTINCT p.permissionKey
      FROM permissions p
      INNER JOIN rolePermissions rp ON rp.permissionId = p.permissionId
      INNER JOIN userRoles ur ON ur.roleId = rp.roleId
      WHERE ur.userId = ?
    `)
    .all(userId)
    .map((row) => row.permissionKey)
}

exports.assignRole = (userId, roleId) => {
  return db
    .prepare("INSERT OR IGNORE INTO userRoles (userId, roleId) VALUES (?, ?)")
    .run(userId, roleId)
}

exports.removeRole = (userId, roleId) => {
  return db
    .prepare("DELETE FROM userRoles WHERE userId = ? AND roleId = ?")
    .run(userId, roleId)
}
