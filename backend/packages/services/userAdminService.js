// Web edition: user & role administration for the admin panel.
// The desktop app only shipped seeded users; on the web the default
// passwords must be changeable, so this service adds basic user management.
const bcrypt = require("bcryptjs")
const db = require("../database/connection")
const authRepo = require("../repositories/authRepository")

const MIN_PASSWORD_LENGTH = 6

function assertPassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  }
}

function normalizeRoleIds(roleIds) {
  if (!Array.isArray(roleIds)) return []
  return [...new Set(roleIds.map(Number).filter((id) => Number.isInteger(id)))]
}

function isSuperAdmin(user) {
  return Boolean(user && Array.isArray(user.roles) && user.roles.some((r) => Number(r.roleId) === 0))
}

function assertCanGrant(roleIds, ctx) {
  if (roleIds.includes(0) && !isSuperAdmin(ctx && ctx.user)) {
    throw new Error("Only a Super Admin can grant the Super Admin role")
  }
}

exports.listRoles = () => {
  return db.prepare("SELECT roleId, roleName, description, isSystem FROM roles ORDER BY roleId").all()
}

exports.listUsers = () => {
  const users = db
    .prepare("SELECT id, username, displayName, isActive, createdAt, updatedAt FROM users ORDER BY username")
    .all()
  return users.map((user) => ({ ...user, roles: authRepo.getRolesByUserId(user.id) }))
}

exports.createUser = async (payload = {}, ctx = {}) => {
  const username = String(payload.username || "").trim()
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    throw new Error("Username must be 3-40 characters (letters, numbers, '.', '_' or '-')")
  }
  assertPassword(payload.password)
  const roleIds = normalizeRoleIds(payload.roleIds)
  if (roleIds.length === 0) throw new Error("Select at least one role")
  assertCanGrant(roleIds, ctx)
  if (authRepo.findByUsername(username)) throw new Error("Username already exists")

  const hash = await bcrypt.hash(payload.password, 10)
  const create = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO users (username, password_hash, displayName, isActive) VALUES (?, ?, ?, 1)")
      .run(username, hash, String(payload.displayName || "").trim() || null)
    const userId = Number(result.lastInsertRowid)
    roleIds.forEach((roleId) => authRepo.assignRole(userId, roleId))
    return userId
  })
  return { id: create() }
}

exports.updateUser = (userId, payload = {}, ctx = {}) => {
  const id = Number(userId)
  const existing = authRepo.getById(id)
  if (!existing) throw new Error("User not found")

  const roleIds = payload.roleIds === undefined ? null : normalizeRoleIds(payload.roleIds)
  if (roleIds) {
    if (roleIds.length === 0) throw new Error("Select at least one role")
    assertCanGrant(roleIds, ctx)
    const current = authRepo.getRolesByUserId(id).map((r) => Number(r.roleId))
    if (current.includes(0) && !roleIds.includes(0) && !isSuperAdmin(ctx && ctx.user)) {
      throw new Error("Only a Super Admin can remove the Super Admin role")
    }
  }
  if (payload.isActive !== undefined && ctx && ctx.user && Number(ctx.user.id) === id && !payload.isActive) {
    throw new Error("You cannot deactivate your own account")
  }

  const update = db.transaction(() => {
    if (payload.displayName !== undefined || payload.isActive !== undefined) {
      db.prepare(`
        UPDATE users
        SET displayName = COALESCE(?, displayName),
            isActive = COALESCE(?, isActive),
            updatedAt = datetime('now')
        WHERE id = ?
      `).run(
        payload.displayName === undefined ? null : String(payload.displayName).trim(),
        payload.isActive === undefined ? null : payload.isActive ? 1 : 0,
        id,
      )
    }
    if (roleIds) {
      db.prepare("DELETE FROM userRoles WHERE userId = ?").run(id)
      roleIds.forEach((roleId) => authRepo.assignRole(id, roleId))
    }
  })
  update()
  return { success: true }
}

exports.resetPassword = async (userId, newPassword, ctx = {}) => {
  const id = Number(userId)
  const target = authRepo.getById(id)
  if (!target) throw new Error("User not found")
  const targetRoles = authRepo.getRolesByUserId(id).map((r) => Number(r.roleId))
  if (targetRoles.includes(0) && !isSuperAdmin(ctx && ctx.user)) {
    throw new Error("Only a Super Admin can reset a Super Admin password")
  }
  assertPassword(newPassword)
  const hash = await bcrypt.hash(newPassword, 10)
  db.prepare("UPDATE users SET password_hash = ?, updatedAt = datetime('now') WHERE id = ?").run(hash, id)
  return { success: true }
}

exports.changeOwnPassword = async (currentPassword, newPassword, ctx = {}) => {
  const sessionUser = ctx && ctx.user
  if (!sessionUser) throw new Error("Unauthorized")
  const user = authRepo.getById(Number(sessionUser.id))
  if (!user) throw new Error("User not found")
  const valid = await bcrypt.compare(String(currentPassword || ""), user.password_hash)
  if (!valid) throw new Error("Current password is incorrect")
  assertPassword(newPassword)
  if (newPassword === currentPassword) throw new Error("The new password must be different")
  const hash = await bcrypt.hash(newPassword, 10)
  db.prepare("UPDATE users SET password_hash = ?, updatedAt = datetime('now') WHERE id = ?").run(hash, user.id)
  return { success: true }
}
