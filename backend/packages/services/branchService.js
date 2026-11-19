const db = require("../database/connection")
const branchRepo = require("../repositories/branchRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")
const {
  normalizeText,
  normalizeRequiredText,
  normalizeBooleanFlag,
  validatePhoneNumber,
} = require("../validation")

const ENTITY_TYPE = "Branch"

const normalizeContacts = (contacts) => {
  if (!Array.isArray(contacts)) return []
  return contacts.map((c, i) => ({
    PhoneNumber: validatePhoneNumber(c.PhoneNumber, `Phone number on contact ${i + 1}`),
    IsPrimary: normalizeBooleanFlag(c.IsPrimary, `IsPrimary on contact ${i + 1}`)
  }))
}

const normalizeAddressInput = (value, addressType) => {
  if (!value || typeof value !== "object") {
    return null
  }

  const addressLine1 = normalizeText(value.AddressLine1)
  const city = normalizeText(value.City)

  if (addressLine1 === null && city === null) {
    return null
  }

  if (addressLine1 === null) {
    throw new Error(`Address line 1 is required for the ${addressType} address`)
  }

  if (city === null) {
    throw new Error(`City is required for the ${addressType} address`)
  }

  return {
    AddressLine1: addressLine1,
    AddressLine2: normalizeText(value.AddressLine2),
    City: city,
    State: normalizeText(value.State),
    PostalCode: normalizeText(value.PostalCode),
  }
}

const normalizeBranchId = (id) => {
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid branch id is required")
  }

  return parsedId
}

const toBranchPayload = (payload = {}) => {
  return {
    BranchCode: normalizeRequiredText(payload.BranchCode, "Branch code"),
    BranchName: normalizeRequiredText(payload.BranchName, "Branch name"),
    Contacts: normalizeContacts(payload.Contacts),
    BillingAddress: normalizeAddressInput(payload.BillingAddress, "Billing"),
    DeliveryAddress: normalizeAddressInput(payload.DeliveryAddress, "Delivery"),
  }
}

exports.getBranches = () => {
  return branchRepo.getAllBranches()
}

exports.getBranchById = (id) => {
  const normalizedId = normalizeBranchId(id)
  const branch = branchRepo.getBranchById(normalizedId)

  if (!branch) {
    throw new Error("Branch not found")
  }

  return withBranchDetails(branch)
}

const getBranchSnapshot = (branchId) => {
  const branch = branchRepo.getBranchById(branchId)

  if (!branch) {
    return null
  }

  return withBranchDetails(branch)
}

exports.createBranch = (payload, ctx) => {
  const data = toBranchPayload(payload)
  const existingBranch = branchRepo.getBranchByCode(data.BranchCode)

  if (existingBranch) {
    throw new Error("Branch code already exists")
  }

  const createTransaction = db.transaction(() => {
    const branch = branchRepo.createBranch({
      BranchCode: data.BranchCode,
      BranchName: data.BranchName,
    })

    data.Contacts.forEach(c => branchRepo.createBranchContact({ ...c, BranchId: branch.Id }))

    if (data.BillingAddress) {
      branchRepo.createBranchBillingAddress({ ...data.BillingAddress, BranchId: branch.Id })
    }

    if (data.DeliveryAddress) {
      branchRepo.createBranchDeliveryAddress({ ...data.DeliveryAddress, BranchId: branch.Id })
    }

    return branch
  })

  const createdBranch = withBranchDetails(createTransaction(), {
    Contacts: data.Contacts,
    BillingAddress: data.BillingAddress,
    DeliveryAddress: data.DeliveryAddress,
  })

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdBranch),
    after: createdBranch,
    ctx,
  })

  return createdBranch
}

exports.updateBranch = (id, payload, ctx) => {
  const normalizedId = normalizeBranchId(id)
  const data = toBranchPayload(payload)
  const before = getBranchSnapshot(normalizedId)
  const existingBranch = branchRepo.getBranchByCode(data.BranchCode)

  if (existingBranch && existingBranch.Id !== normalizedId) {
    throw new Error("Branch code already exists")
  }

  const updateTransaction = db.transaction(() => {
    const updatedBranch = branchRepo.updateBranch(normalizedId, {
      BranchCode: data.BranchCode,
      BranchName: data.BranchName,
    })

    if (!updatedBranch) {
      throw new Error("Branch not found")
    }

    branchRepo.deleteBranchContactsByBranchId(normalizedId)
    branchRepo.deleteBranchBillingAddressByBranchId(normalizedId)
    branchRepo.deleteBranchDeliveryAddressByBranchId(normalizedId)

    data.Contacts.forEach(c => branchRepo.createBranchContact({ ...c, BranchId: normalizedId }))

    if (data.BillingAddress) {
      branchRepo.createBranchBillingAddress({ ...data.BillingAddress, BranchId: normalizedId })
    }

    if (data.DeliveryAddress) {
      branchRepo.createBranchDeliveryAddress({ ...data.DeliveryAddress, BranchId: normalizedId })
    }

    return updatedBranch
  })

  const updatedBranch = withBranchDetails(updateTransaction(), {
    Contacts: data.Contacts,
    BillingAddress: data.BillingAddress,
    DeliveryAddress: data.DeliveryAddress,
  })

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updatedBranch),
    before,
    after: updatedBranch,
    ctx,
  })

  return updatedBranch
}

exports.deleteBranch = (id, ctx) => {
  const normalizedId = normalizeBranchId(id)
  const before = getBranchSnapshot(normalizedId)

  const deleteBranchTx = db.transaction(() => {
    branchRepo.deleteBranchContactsByBranchId(normalizedId)
    branchRepo.deleteBranchBillingAddressByBranchId(normalizedId)
    branchRepo.deleteBranchDeliveryAddressByBranchId(normalizedId)
    return branchRepo.deleteBranch(normalizedId)
  })

  const result = deleteBranchTx()

  if (result.changes === 0) {
    throw new Error("Branch not found")
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, before),
    before,
    ctx,
  })

  return { success: true }
}

const withBranchDetails = (branch, extras = {}) => {
  return {
    ...branch,
    Contacts: extras.Contacts ?? branchRepo.getBranchContactsByBranchId(branch.Id),
    BillingAddress: extras.BillingAddress ?? branchRepo.getBranchBillingAddressByBranchId(branch.Id),
    DeliveryAddress: extras.DeliveryAddress ?? branchRepo.getBranchDeliveryAddressByBranchId(branch.Id),
  }
}
