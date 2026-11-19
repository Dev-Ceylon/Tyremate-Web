const db = require("../database/connection")
const supplierRepo = require("../repositories/supplierRepository")
const tyreRepo = require("../repositories/tyreRepository")
const tyreSupplierRepo = require("../repositories/tyreSupplierRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")
const {
  normalizeText,
  normalizeRequiredText,
  normalizeBooleanFlag,
  validatePhoneNumber,
  validateEmail,
} = require("../validation")

const ENTITY_TYPE = "Supplier"

const normalizeContacts = (contacts) => {
  if (!Array.isArray(contacts)) return []
  return contacts.map((c, i) => ({
    PhoneNumber: validatePhoneNumber(c.PhoneNumber, `Phone number on contact ${i + 1}`),
    IsPrimary: normalizeBooleanFlag(c.IsPrimary, `IsPrimary on contact ${i + 1}`)
  }))
}

const normalizeEmails = (emails) => {
  if (!Array.isArray(emails)) return []
  return emails.map((e, i) => ({
    EmailAddress: validateEmail(e.EmailAddress, `Email address on email ${i + 1}`),
    IsPrimary: normalizeBooleanFlag(e.IsPrimary, `IsPrimary on email ${i + 1}`)
  }))
}

const normalizeAddresses = (addresses) => {
  if (!Array.isArray(addresses)) return []
  return addresses.map((a, i) => ({
    AddressType: normalizeText(a.AddressType),
    AddressLine1: normalizeText(a.AddressLine1),
    AddressLine2: normalizeText(a.AddressLine2),
    City: normalizeText(a.City),
    State: normalizeText(a.State),
    PostalCode: normalizeText(a.PostalCode),
    IsPrimary: normalizeBooleanFlag(a.IsPrimary, `IsPrimary on address ${i + 1}`)
  }))
}

const toSupplierPayload = (payload = {}) => {
  return {
    SupplierCode: normalizeText(payload.SupplierCode),
    Name: normalizeRequiredText(payload.Name, "Supplier name"),
    TinNo: normalizeText(payload.TinNo),
    VatNo: normalizeText(payload.VatNo),
    Contacts: normalizeContacts(payload.Contacts),
    Emails: normalizeEmails(payload.Emails),
    Addresses: normalizeAddresses(payload.Addresses)
  }
}

const normalizeTyreAssociations = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const row = index + 1
    const tyreIdRaw = item?.TyreID ?? item?.tyreId
    const priceRaw = item?.Price ?? item?.price
    const tyreId = Number(tyreIdRaw)
    const price =
      priceRaw === "" || priceRaw === null || priceRaw === undefined
        ? Number.NaN
        : Number(priceRaw)

    if (!Number.isInteger(tyreId) || tyreId <= 0) {
      throw new Error(`Valid TyreID is required on line ${row}`)
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Valid positive Price is required on line ${row}`)
    }

    return { TyreID: tyreId, Price: price }
  })
}

const normalizeSupplierId = (supplierId) => {
  const parsedId = Number(supplierId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid supplier id is required")
  }

  return parsedId
}

const toSupplierWithTyresPayload = (payload = {}) => {
  const supplier = toSupplierPayload(payload)
  const tyres = normalizeTyreAssociations(payload.Tyres)

  // Validate that all referenced tyres exist
  tyres.forEach((t) => {
    const tyre = tyreRepo.getTyreById(t.TyreID)
    if (!tyre) {
      throw new Error(`Tyre not found with ID: ${t.TyreID}`)
    }
  })

  return { ...supplier, Tyres: tyres }
}

exports.getSuppliers = () => {
  return supplierRepo.getAllSuppliers()
}

exports.getSupplierById = (supplierId) => {
  const normalizedId = normalizeSupplierId(supplierId)
  const supplier = supplierRepo.getSupplierById(normalizedId)

  if (!supplier) {
    throw new Error("Supplier not found")
  }

  return withSupplierDetails(supplier)
}

const getSupplierSnapshot = (supplierId) => {
  const supplier = supplierRepo.getSupplierById(supplierId)

  if (!supplier) {
    return null
  }

  return withSupplierDetails(supplier)
}

exports.createSupplier = (payload, ctx) => {
  const data = toSupplierWithTyresPayload(payload)
  data.SupplierCode = supplierRepo.getNextSupplierCode()

  const createTransaction = db.transaction(() => {
    const supplier = supplierRepo.createSupplier({
      SupplierCode: data.SupplierCode,
      Name: data.Name,
      TinNo: data.TinNo,
      VatNo: data.VatNo,
    })

    data.Contacts.forEach(c => supplierRepo.createSupplierContact({ ...c, SupplierID: supplier.SupplierID }))
    data.Emails.forEach(e => supplierRepo.createSupplierEmail({ ...e, SupplierID: supplier.SupplierID }))
    data.Addresses.forEach(a => supplierRepo.createSupplierAddress({ ...a, SupplierID: supplier.SupplierID }))

    tyreSupplierRepo.syncSupplierTyres(supplier.SupplierID, data.Tyres)

    return supplier
  })

  const createdSupplier = withSupplierDetails(createTransaction(), {
    Contacts: data.Contacts,
    Emails: data.Emails,
    Addresses: data.Addresses,
  })

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdSupplier),
    after: createdSupplier,
    ctx,
  })

  return createdSupplier
}

exports.updateSupplier = (supplierId, payload, ctx) => {
  const normalizedId = normalizeSupplierId(supplierId)
  const data = toSupplierWithTyresPayload(payload)
  const before = getSupplierSnapshot(normalizedId)
  const existingSupplier = supplierRepo.getSupplierByCode(data.SupplierCode)

  if (
    existingSupplier &&
    existingSupplier.SupplierID !== normalizedId
  ) {
    throw new Error("Supplier code already exists")
  }

  const updateTransaction = db.transaction(() => {
    const updatedSupplier = supplierRepo.updateSupplier(normalizedId, data)

    if (!updatedSupplier) {
      throw new Error("Supplier not found")
    }

    supplierRepo.deleteSupplierContactsBySupplierId(normalizedId)
    supplierRepo.deleteSupplierEmailsBySupplierId(normalizedId)
    supplierRepo.deleteSupplierAddressesBySupplierId(normalizedId)

    data.Contacts.forEach(c => supplierRepo.createSupplierContact({ ...c, SupplierID: normalizedId }))
    data.Emails.forEach(e => supplierRepo.createSupplierEmail({ ...e, SupplierID: normalizedId }))
    data.Addresses.forEach(a => supplierRepo.createSupplierAddress({ ...a, SupplierID: normalizedId }))

    tyreSupplierRepo.syncSupplierTyres(normalizedId, data.Tyres)

    return updatedSupplier
  })

  const updatedSupplier = withSupplierDetails(updateTransaction(), {
    Contacts: data.Contacts,
    Emails: data.Emails,
    Addresses: data.Addresses,
  })

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, updatedSupplier),
    before,
    after: updatedSupplier,
    ctx,
  })

  return updatedSupplier
}

exports.deleteSupplier = (supplierId, ctx) => {
  const normalizedId = normalizeSupplierId(supplierId)
  const before = getSupplierSnapshot(normalizedId)
  const result = supplierRepo.deleteSupplier(normalizedId)

  if (result.changes === 0) {
    throw new Error("Supplier not found")
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

const withSupplierDetails = (supplier, extras = {}) => ({
  ...supplier,
  Contacts: extras.Contacts ?? supplierRepo.getSupplierContactsBySupplierId(supplier.SupplierID),
  Emails: extras.Emails ?? supplierRepo.getSupplierEmailsBySupplierId(supplier.SupplierID),
  Addresses: extras.Addresses ?? supplierRepo.getSupplierAddressesBySupplierId(supplier.SupplierID),
  Tyres: tyreSupplierRepo.getTyresBySupplierId(supplier.SupplierID)
})
