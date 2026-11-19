const db = require("../database/connection")

exports.getAllBranches = () => {
  return db
    .prepare(`
      SELECT
        b.Id,
        b.BranchCode,
        b.BranchName,
        (SELECT bc.PhoneNumber FROM BranchContact bc WHERE bc.BranchId = b.Id ORDER BY bc.ID ASC LIMIT 1) AS Contact,
        COALESCE(
          (SELECT ba.AddressLine1 FROM BranchBillingAddress ba WHERE ba.BranchId = b.Id LIMIT 1),
          (SELECT ba.AddressLine1 FROM BranchDeliveryAddress ba WHERE ba.BranchId = b.Id LIMIT 1)
        ) AS Address
      FROM BranchM b
      ORDER BY b.Id DESC
    `)
    .all()
}

exports.getBranchById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        BranchCode,
        BranchName
      FROM BranchM
      WHERE Id = ?
    `)
    .get(id)
}

exports.getBranchByCode = (branchCode) => {
  return db
    .prepare(`
      SELECT
        Id,
        BranchCode,
        BranchName
      FROM BranchM
      WHERE BranchCode = ?
    `)
    .get(branchCode)
}

exports.createBranch = (branch) => {
  const result = db
    .prepare(`
      INSERT INTO BranchM (
        BranchCode,
        BranchName
      )
      VALUES (?, ?)
    `)
    .run(branch.BranchCode, branch.BranchName)

  return exports.getBranchById(result.lastInsertRowid)
}

exports.updateBranch = (id, branch) => {
  const result = db
    .prepare(`
      UPDATE BranchM
      SET
        BranchCode = ?,
        BranchName = ?
      WHERE Id = ?
    `)
    .run(branch.BranchCode, branch.BranchName, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getBranchById(id)
}

exports.deleteBranch = (id) => {
  return db
    .prepare("DELETE FROM BranchM WHERE Id = ?")
    .run(id)
}

exports.createBranchContact = (contact) => {
  return db
    .prepare(`
      INSERT INTO BranchContact (BranchId, PhoneNumber, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(contact.BranchId, contact.PhoneNumber, contact.IsPrimary)
}

const makeAddressRepo = (table) => ({
  create: (address) => {
    return db
      .prepare(`
        INSERT INTO ${table} (
          BranchId,
          AddressLine1,
          AddressLine2,
          City,
          State,
          PostalCode
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        address.BranchId,
        address.AddressLine1,
        address.AddressLine2,
        address.City,
        address.State,
        address.PostalCode
      )
  },
  getByBranchId: (branchId) => {
    return db
      .prepare(`
        SELECT AddressLine1, AddressLine2, City, State, PostalCode
        FROM ${table}
        WHERE BranchId = ?
      `)
      .get(branchId)
  },
  deleteByBranchId: (branchId) => {
    return db
      .prepare(`DELETE FROM ${table} WHERE BranchId = ?`)
      .run(branchId)
  },
})

const billingAddressRepo = makeAddressRepo("BranchBillingAddress")
const deliveryAddressRepo = makeAddressRepo("BranchDeliveryAddress")

exports.createBranchBillingAddress = (address) => billingAddressRepo.create(address)
exports.getBranchBillingAddressByBranchId = (branchId) => billingAddressRepo.getByBranchId(branchId)
exports.deleteBranchBillingAddressByBranchId = (branchId) => billingAddressRepo.deleteByBranchId(branchId)

exports.createBranchDeliveryAddress = (address) => deliveryAddressRepo.create(address)
exports.getBranchDeliveryAddressByBranchId = (branchId) => deliveryAddressRepo.getByBranchId(branchId)
exports.deleteBranchDeliveryAddressByBranchId = (branchId) => deliveryAddressRepo.deleteByBranchId(branchId)

exports.getBranchContactsByBranchId = (branchId) => {
  return db
    .prepare(`
      SELECT PhoneNumber, IsPrimary
      FROM BranchContact
      WHERE BranchId = ?
    `)
    .all(branchId)
}

exports.deleteBranchContactsByBranchId = (branchId) => {
  return db
    .prepare("DELETE FROM BranchContact WHERE BranchId = ?")
    .run(branchId)
}
