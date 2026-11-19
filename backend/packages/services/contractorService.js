const db = require("../database/connection")
const contractorRepo = require("../repositories/contractorRepository")
const contractorTyreService = require("./contractorTyreService")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")
const {
  normalizeText,
  normalizeRequiredText,
  normalizeInteger,
  normalizeBooleanFlag,
  validatePhoneNumber,
  validateEmail,
} = require("../validation")

const ENTITY_TYPE = "Contractor"

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

const normalizeTyreIds = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized = value
    .map((entry) => {
      if (entry && typeof entry === "object") {
        return Number(entry.TyreID ?? entry.TyreId ?? entry.Id)
      }

      return Number(entry)
    })
    .filter((id) => Number.isInteger(id) && id > 0)

  return [...new Set(normalized)]
}

const toContractorPayload = (payload = {}) => {
  const tyreIdsInput = payload.TyreIDs ?? payload.ContractorTyres ?? payload.ContractorTyresIDs

  return {
    Name: normalizeRequiredText(payload.Name, "Contractor name"),
    Rating: normalizeInteger(payload.Rating, "Rating"),
    Contacts: normalizeContacts(payload.Contacts),
    Emails: normalizeEmails(payload.Emails),
    Addresses: normalizeAddresses(payload.Addresses),
    TyreIDs: normalizeTyreIds(tyreIdsInput)
  }
}

const normalizeContractorId = (contractorId) => {
  const parsedId = Number(contractorId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid contractor id is required")
  }

  return parsedId
}

exports.getContractors = () => {
  return contractorRepo
    .getAllContractors()
    .map((contractor) => withContractorDetails(contractor))
}

exports.getContractorById = (contractorId) => {
  const normalizedId = normalizeContractorId(contractorId)
  const contractor = contractorRepo.getContractorById(normalizedId)

  if (!contractor) {
    throw new Error("Contractor not found")
  }

  return withContractorDetails(contractor)
}

const getContractorSnapshot = (contractorId) => {
  const contractor = contractorRepo.getContractorById(contractorId)

  if (!contractor) {
    return null
  }

  return withContractorDetails(contractor)
}

exports.createContractor = (payload, ctx) => {
  const data = toContractorPayload(payload)

  const createContractorTx = db.transaction(() => {
    const createdContractor = contractorRepo.createContractor(data)

    data.Contacts.forEach(c => contractorRepo.createContractorContact({ ...c, ContractorID: createdContractor.ID }))
    data.Emails.forEach(e => contractorRepo.createContractorEmail({ ...e, ContractorID: createdContractor.ID }))
    data.Addresses.forEach(a => contractorRepo.createContractorAddress({ ...a, ContractorID: createdContractor.ID }))

    contractorTyreService.syncContractorTyres(createdContractor.ID, data.TyreIDs)
    return createdContractor
  })

  const createdContractor = withContractorDetails(createContractorTx(), {
    Contacts: data.Contacts,
    Emails: data.Emails,
    Addresses: data.Addresses,
  })

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdContractor),
    after: createdContractor,
    ctx,
  })

  return createdContractor
}

exports.updateContractor = (contractorId, payload, ctx) => {
  const normalizedId = normalizeContractorId(contractorId)
  const data = toContractorPayload(payload)
  const before = getContractorSnapshot(normalizedId)

  const updateContractorTx = db.transaction(() => {
    const updated = contractorRepo.updateContractor(normalizedId, data)

    if (!updated) {
      return null
    }

    contractorRepo.deleteContractorContactsByContractorId(normalizedId)
    contractorRepo.deleteContractorEmailsByContractorId(normalizedId)
    contractorRepo.deleteContractorAddressesByContractorId(normalizedId)

    data.Contacts.forEach(c => contractorRepo.createContractorContact({ ...c, ContractorID: normalizedId }))
    data.Emails.forEach(e => contractorRepo.createContractorEmail({ ...e, ContractorID: normalizedId }))
    data.Addresses.forEach(a => contractorRepo.createContractorAddress({ ...a, ContractorID: normalizedId }))

    contractorTyreService.syncContractorTyres(normalizedId, data.TyreIDs)
    return updated
  })

  const updatedContractor = updateContractorTx()

  if (!updatedContractor) {
    throw new Error("Contractor not found")
  }

  const after = withContractorDetails(updatedContractor, {
    Contacts: data.Contacts,
    Emails: data.Emails,
    Addresses: data.Addresses,
  })

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, after),
    before,
    after,
    ctx,
  })

  return after
}

exports.deleteContractor = (contractorId, ctx) => {
  const normalizedId = normalizeContractorId(contractorId)
  const before = getContractorSnapshot(normalizedId)

  const deleteContractorTx = db.transaction(() => {
    contractorTyreService.syncContractorTyres(normalizedId, [])
    contractorRepo.deleteContractorContactsByContractorId(normalizedId)
    contractorRepo.deleteContractorEmailsByContractorId(normalizedId)
    contractorRepo.deleteContractorAddressesByContractorId(normalizedId)
    return contractorRepo.deleteContractor(normalizedId)
  })

  const result = deleteContractorTx()

  if (result.changes === 0) {
    throw new Error("Contractor not found")
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

const withContractorDetails = (contractor, extras = {}) => ({
  ...contractor,
  Contacts: extras.Contacts ?? contractorRepo.getContractorContactsByContractorId(contractor.ID),
  Emails: extras.Emails ?? contractorRepo.getContractorEmailsByContractorId(contractor.ID),
  Addresses: extras.Addresses ?? contractorRepo.getContractorAddressesByContractorId(contractor.ID),
  TyreIDs: contractorTyreService.getTyreIdsByContractorId(contractor.ID),
  Tyres: contractorTyreService.getTyresByContractorId(contractor.ID)
})
