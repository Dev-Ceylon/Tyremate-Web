const bcrypt = require("bcryptjs")
const db = require("./connection")
const { initializeStatusIds, STATUS_SEED_DATA } = require("../constants/statusConstants")
const { initializeSupplierTypeIds, SUPPLIER_TYPE_SEED_DATA } = require("../constants/supplierTypeConstants")
const { initializePaymentTypeIds, PAYMENT_TYPE_SEED_DATA } = require("../constants/paymentTypeConstants")
const { initializeReminderTypeIds, REMINDER_TYPE_SEED_DATA } = require("../constants/reminderTypeConstants")
const { initializePolicyViolationIds, POLICY_VIOLATION_SEED_DATA } = require("../constants/policyViolationConstants")
const { CONSUMABLE_SEED_DATA } = require("../constants/consumableConstants")
const { STORAGE_LOCATION_TYPE_SEED_DATA } = require("../constants/storageLocationTypeConstants")
const { initializeStorageSourceIds, STORAGE_SOURCE_SEED_DATA } = require("../constants/storageSourceConstants")
const {
  initializeInvoiceStatusIds,
  INVOICE_STATUS_SEED_DATA,
  initializeInvoiceSourceIds,
  INVOICE_SOURCE_SEED_DATA,
} = require("../constants/invoiceConstants")
const { ROLES_SEED, PERMISSIONS_SEED, ROLE_PERMISSIONS } = require("../constants/rolePermissionConstants")
const { 
  QUARANTINE_SOURCE_SEED_DATA,
  QUARANTINE_STATUS_SEED_DATA,
  QUARANTINE_MOVEMENT_ACTION_SEED_DATA,
  initializeQuarantineSourceIds,
  initializeQuarantineStatusIds,
  initializeQuarantineMovementActionIds
} = require("../constants/quarantineConstants")
const { 
  SALES_RETURN_TYPE_SEED_DATA,
  SALES_RETURN_CONDITION_SEED_DATA,
  SALES_RETURN_DISPOSITION_SEED_DATA,
  SALES_RETURN_STATUS_SEED_DATA,
  SALES_RETURN_WARRANTY_HANDLING_SEED_DATA,
  initializeSalesReturnTypeIds,
  initializeSalesReturnConditionIds,
  initializeSalesReturnDispositionIds,
  initializeSalesReturnStatusIds,
  initializeSalesReturnWarrantyHandlingIds
} = require("../constants/salesReturnConstants")
const { 
  initializeCreditNoteStatusIds,
  initializeCreditNoteReasonIds,
  initializeCreditNoteSourceIds,
  initializeRefundMethodIds,
  initializeCreditTransactionTypeIds,
  initializeRefundStatusIds,
  initializeAllCreditNoteLookups
} = require("../constants/creditNoteConstants")

/**
 * Bootstrap lookup/reference data together with the default admin and
 * super admin users.
 *
 * Seed data lives in the constants modules (single source of truth) and is
 * consumed here idempotently so it can run on every launch without duplicating
 * rows or corrupting existing data.
 */

const DEFAULT_USER_PASSWORD = "1234"

/**
 * Seeds roles, permissions and role->permission grants.
 * Runs inside the seed transaction.
 */
const seedRolesAndPermissions = (txDb) => {
  const insertRole = txDb.prepare(`
    INSERT OR IGNORE INTO roles (roleId, roleName, description, isSystem)
    VALUES (?, ?, ?, ?)
  `)
  ROLES_SEED.forEach(([roleId, roleName, description, isSystem]) => {
    insertRole.run(roleId, roleName, description, isSystem)
  })

  const insertPermission = txDb.prepare(`
    INSERT OR IGNORE INTO permissions (permissionKey, description)
    VALUES (?, ?)
  `)
  PERMISSIONS_SEED.forEach(([key, description]) => {
    insertPermission.run(key, description)
  })

  const permissionIdByKey = txDb
    .prepare("SELECT permissionId, permissionKey FROM permissions")
    .all()
    .reduce((map, row) => {
      map[row.permissionKey] = row.permissionId
      return map
    }, {})

  const insertRolePermission = txDb.prepare(`
    INSERT OR IGNORE INTO rolePermissions (roleId, permissionId)
    VALUES (?, ?)
  `)

  Object.entries(ROLE_PERMISSIONS).forEach(([roleId, keys]) => {
    const rolePermissionKeys = keys === '*' ? PERMISSIONS_SEED.map(([key]) => key) : keys
    rolePermissionKeys.forEach((key) => {
      const permissionId = permissionIdByKey[key]
      if (permissionId != null) {
        insertRolePermission.run(Number(roleId), permissionId)
      }
    })
  })
}

/**
 * Ensures the default admin (role 1), super admin (role 0), and salesrep (role 4) users exist.
 * Password hashing is async, so this runs outside the synchronous transaction.
 */
const seedUsers = async () => {
  const ensureUser = async (username, displayName) => {
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username)

    if (existing) {
      console.log(`${displayName || username} already exists`)
      return existing.id
    }

    const hash = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10)

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, displayName)
      VALUES (?, ?, ?)
    `).run(username, hash, displayName)

    console.log(`${displayName || username} user created`)
    return result.lastInsertRowid
  }

  const adminUserId = await ensureUser("admin", null)
  const superAdminUserId = await ensureUser("superadmin", "Super Admin")
  const salesRepUserId = await ensureUser("salesrep", "Sales Representative")

  const insertUserRole = db.prepare(`
    INSERT OR IGNORE INTO userRoles (userId, roleId)
    VALUES (?, ?)
  `)
  insertUserRole.run(adminUserId, 1)
  insertUserRole.run(superAdminUserId, 0)
  insertUserRole.run(salesRepUserId, 4)
}

const runSeed = async () => {
  try {
    const seedTransaction = db.transaction(() => {
      const insertStatus = db.prepare(`
        INSERT OR IGNORE INTO StatusM (StatusCode, StatusName)
        VALUES (?, ?)
      `)

      STATUS_SEED_DATA.forEach(([statusCode, statusName]) => {
        insertStatus.run(statusCode, statusName)
      })

      initializeStatusIds(db)

      const insertSupplierType = db.prepare(`
        INSERT OR IGNORE INTO SupplierTypeM (TypeCode, TypeName, Description)
        VALUES (?, ?, ?)
      `)

      SUPPLIER_TYPE_SEED_DATA.forEach(([code, name, description]) => {
        insertSupplierType.run(code, name, description)
      })

      initializeSupplierTypeIds(db)

      const insertPaymentType = db.prepare(`
        INSERT OR IGNORE INTO PaymentTypeM (PaymentTypeCode, PaymentTypeName)
        VALUES (?, ?)
      `)

      PAYMENT_TYPE_SEED_DATA.forEach(([code, name]) => {
        insertPaymentType.run(code, name)
      })

      initializePaymentTypeIds(db)

      const insertReminderType = db.prepare(`
        INSERT OR IGNORE INTO ReminderTypes (ReminderTypeCode, ReminderTypeName)
        VALUES (?, ?)
      `)

      REMINDER_TYPE_SEED_DATA.forEach(([code, name]) => {
        insertReminderType.run(code, name)
      })

      initializeReminderTypeIds(db)

      const insertStorageLocationType = db.prepare(`
        INSERT OR IGNORE INTO StorageLocationTypeM (LocationTypeCode, LocationTypeName)
        VALUES (?, ?)
      `)

      STORAGE_LOCATION_TYPE_SEED_DATA.forEach(([code, name]) => {
        insertStorageLocationType.run(code, name)
      })

      const insertStorageSource = db.prepare(`
        INSERT OR IGNORE INTO StorageSourceM (SourceCode, SourceName)
        VALUES (?, ?)
      `)

      STORAGE_SOURCE_SEED_DATA.forEach(([code, name]) => {
        insertStorageSource.run(code, name)
      })

      initializeStorageSourceIds(db)

      const insertInvoiceStatus = db.prepare(`
        INSERT OR IGNORE INTO InvoiceStatusM (StatusCode, StatusName)
        VALUES (?, ?)
      `)

      INVOICE_STATUS_SEED_DATA.forEach(([code, name]) => {
        insertInvoiceStatus.run(code, name)
      })

      initializeInvoiceStatusIds(db)

      const insertInvoiceSource = db.prepare(`
        INSERT OR IGNORE INTO InvoiceSourceM (SourceCode, SourceName)
        VALUES (?, ?)
      `)

      INVOICE_SOURCE_SEED_DATA.forEach(([code, name]) => {
        insertInvoiceSource.run(code, name)
      })

      initializeInvoiceSourceIds(db)

      const insertPolicyViolationType = db.prepare(`
        INSERT OR IGNORE INTO PolicyViolationTypeM (ViolationTypeCode, ViolationTypeName)
        VALUES (?, ?)
      `)

      POLICY_VIOLATION_SEED_DATA.forEach(([code, name]) => {
        insertPolicyViolationType.run(code, name)
      })

      initializePolicyViolationIds(db)

      try {
        const insertQuarantineSource = db.prepare(`
          INSERT OR IGNORE INTO QuarantineSourceM (SourceCode, SourceName)
          VALUES (?, ?)
        `)
        QUARANTINE_SOURCE_SEED_DATA.forEach(([code, name]) => insertQuarantineSource.run(code, name))

        const insertQuarantineStatus = db.prepare(`
          INSERT OR IGNORE INTO QuarantineStatusM (StatusCode, StatusName)
          VALUES (?, ?)
        `)
        QUARANTINE_STATUS_SEED_DATA.forEach(([code, name]) => insertQuarantineStatus.run(code, name))

        const insertQuarantineMovementAction = db.prepare(`
          INSERT OR IGNORE INTO QuarantineMovementActionM (ActionCode, ActionName)
          VALUES (?, ?)
        `)
        QUARANTINE_MOVEMENT_ACTION_SEED_DATA.forEach(([code, name]) => insertQuarantineMovementAction.run(code, name))

        initializeQuarantineSourceIds(db)
        initializeQuarantineStatusIds(db)
        initializeQuarantineMovementActionIds(db)
      } catch (e) {
        console.error("Quarantine seed init failed", e)
      }

      try {
        const insertSalesReturnType = db.prepare(`
          INSERT OR IGNORE INTO SalesReturnTypeM (TypeCode, TypeName)
          VALUES (?, ?)
        `)
        SALES_RETURN_TYPE_SEED_DATA.forEach(([code, name]) => insertSalesReturnType.run(code, name))

        const insertSalesReturnCondition = db.prepare(`
          INSERT OR IGNORE INTO SalesReturnConditionM (ConditionCode, ConditionName)
          VALUES (?, ?)
        `)
        SALES_RETURN_CONDITION_SEED_DATA.forEach(([code, name]) => insertSalesReturnCondition.run(code, name))

        const insertSalesReturnDisposition = db.prepare(`
          INSERT OR IGNORE INTO SalesReturnDispositionM (DispositionCode, DispositionName)
          VALUES (?, ?)
        `)
        SALES_RETURN_DISPOSITION_SEED_DATA.forEach(([code, name]) => insertSalesReturnDisposition.run(code, name))

        const insertSalesReturnStatus = db.prepare(`
          INSERT OR IGNORE INTO SalesReturnStatusM (StatusCode, StatusName)
          VALUES (?, ?)
        `)
        SALES_RETURN_STATUS_SEED_DATA.forEach(([code, name]) => insertSalesReturnStatus.run(code, name))

        const insertSalesReturnWarrantyHandling = db.prepare(`
          INSERT OR IGNORE INTO SalesReturnWarrantyHandlingM (HandlingCode, HandlingName)
          VALUES (?, ?)
        `)
        SALES_RETURN_WARRANTY_HANDLING_SEED_DATA.forEach(([code, name]) => insertSalesReturnWarrantyHandling.run(code, name))

        initializeSalesReturnTypeIds(db)
        initializeSalesReturnConditionIds(db)
        initializeSalesReturnDispositionIds(db)
        initializeSalesReturnStatusIds(db)
        initializeSalesReturnWarrantyHandlingIds(db)
      } catch (e) {
        console.error("SalesReturn seed init failed", e)
      }

      try {
        initializeCreditNoteStatusIds(db)
        initializeCreditNoteReasonIds(db)
        initializeCreditNoteSourceIds(db)
        initializeRefundMethodIds(db)
        initializeCreditTransactionTypeIds(db)
        initializeRefundStatusIds(db)
      } catch (e) {
        console.error("CreditNote seed init failed", e)
      }

      const existingConsumableCount = db.prepare("SELECT COUNT(*) AS count FROM ConsumableM").get()

      if (existingConsumableCount.count === 0) {
        const insertConsumable = db.prepare(`
          INSERT INTO ConsumableM (Name, Category, Unit, CostPrice, ReorderLevel)
          VALUES (?, ?, ?, ?, ?)
        `)

        CONSUMABLE_SEED_DATA.forEach(([name, category, unit, costPrice, reorderLevel]) => {
          insertConsumable.run(name, category, unit, costPrice, reorderLevel)
        })
      }

      seedRolesAndPermissions(db)
    })

    seedTransaction()

    await seedUsers()
  } catch (error) {
    console.error("Seed failed", error)
  }
}

/**
 * Web edition: loads the lookup-id caches (StatusM, PaymentTypeM, ...) without
 * re-running the idempotent inserts. Used on start-up when the seed for the
 * current seed data version has already been applied, which saves hundreds of
 * round trips against a remote database.
 */
const initializeLookupIds = (targetDb = db) => {
  initializeStatusIds(targetDb)
  initializePaymentTypeIds(targetDb)
  initializeReminderTypeIds(targetDb)
  initializeStorageSourceIds(targetDb)
  initializeInvoiceStatusIds(targetDb)
  initializeInvoiceSourceIds(targetDb)
  initializePolicyViolationIds(targetDb)
  try {
    initializeQuarantineSourceIds(targetDb)
    initializeQuarantineStatusIds(targetDb)
    initializeQuarantineMovementActionIds(targetDb)
  } catch (e) {
    console.error("Quarantine id init failed", e)
  }
  try {
    initializeSalesReturnTypeIds(targetDb)
    initializeSalesReturnConditionIds(targetDb)
    initializeSalesReturnDispositionIds(targetDb)
    initializeSalesReturnStatusIds(targetDb)
    initializeSalesReturnWarrantyHandlingIds(targetDb)
  } catch (e) {
    console.error("SalesReturn id init failed", e)
  }
  try {
    initializeCreditNoteStatusIds(targetDb)
    initializeCreditNoteReasonIds(targetDb)
    initializeCreditNoteSourceIds(targetDb)
    initializeRefundMethodIds(targetDb)
    initializeCreditTransactionTypeIds(targetDb)
    initializeRefundStatusIds(targetDb)
  } catch (e) {
    console.error("CreditNote id init failed", e)
  }
}

module.exports = { runSeed, initializeLookupIds, DEFAULT_USER_PASSWORD }
