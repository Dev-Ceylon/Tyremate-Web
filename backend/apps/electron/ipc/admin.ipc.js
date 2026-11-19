// Web edition: admin-panel channels (application settings, users, seeding,
// schema status). Low-level database operations (driver selection, backup,
// restore, copy between databases) run in the worker host itself.
const appSettingsService = require("../../../packages/services/appSettingsService")
const userAdminService = require("../../../packages/services/userAdminService")
const { runMasterDataSeed, runDevMasterDataFeed } = require("../../../packages/database/masterDataSeeder")
const { getMigrationStatus } = require("../../../packages/database/migrationRunner")
const { MIGRATIONS } = require("../../../platform/migrations.generated")
const { getMigrationReport } = require("../../../platform/runtime")
const db = require("../../../packages/database/connection")
const { sessionStore } = require("../auth/sessionStore")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

const ctx = () => {
  const user = sessionStore.getUser()
  return { user, changedBy: user ? String(user.id) : null, requestedAt: new Date().toISOString() }
}

// Cloudinary configuration is needed by every user that uploads receipts, but
// only settings managers may change it.
registerIpcHandler("admin:getCloudinaryConfig", {}, () => appSettingsService.getCloudinaryConfig())
registerServiceHandler("admin:setCloudinaryConfig", { permission: "settings.manage" }, appSettingsService, "setCloudinaryConfig")

registerServiceHandler("admin:listUsers", { permission: "user.manage" }, userAdminService, "listUsers")
registerServiceHandler("admin:listRoles", { permission: "user.manage" }, userAdminService, "listRoles")
registerServiceHandler("admin:createUser", { permission: "user.manage" }, userAdminService, "createUser")
registerServiceHandler("admin:updateUser", { permission: "user.manage" }, userAdminService, "updateUser")
registerServiceHandler("admin:resetPassword", { permission: "user.manage" }, userAdminService, "resetPassword")

registerIpcHandler("auth:changePassword", {}, async (_event, currentPassword, newPassword) => {
  const result = await userAdminService.changeOwnPassword(currentPassword, newPassword, ctx())
  const user = sessionStore.getUser()
  if (user && user.usingDefaultPassword) sessionStore.setUser({ ...user, usingDefaultPassword: false })
  return result
})

registerIpcHandler("admin:getSchemaStatus", { permission: "settings.manage" }, () => {
  const migrations = getMigrationStatus(db, MIGRATIONS)
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((row) => row.name)
  const report = getMigrationReport()
  return {
    migrations,
    pending: migrations.filter((m) => !m.applied).length,
    tables,
    lastRun: { applied: report.applied || [], failed: report.failed || [] },
  }
})

registerIpcHandler("admin:getTableCounts", { permission: "settings.manage" }, () => {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((row) => row.name)
  return tables.map((name) => ({
    name,
    rows: db.prepare(`SELECT COUNT(*) AS c FROM "${name.replace(/"/g, '""')}"`).get().c,
  }))
})

registerIpcHandler("admin:seedSampleData", { permission: "settings.manage" }, async (_event, options = {}) => {
  const master = await runMasterDataSeed({ force: true })
  const stock = options.includeStock ? await runDevMasterDataFeed({ force: true }) : null
  return { master, stock }
})
