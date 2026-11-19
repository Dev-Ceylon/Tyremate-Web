const db = require("../database/connection")
const customerRepo = require("../repositories/customerRepository")
const masterDataAuditLogService = require("./masterDataAuditLogService")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")
const {
  normalizeText,
  normalizeRequiredText,
  normalizeInteger,
  normalizeReal,
  normalizeDate,
  normalizeBooleanFlag,
  validatePhoneNumber,
  validateEmail,
} = require("../validation")

const ENTITY_TYPE = "Customer"

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

const toCustomerPayload = (payload = {}) => {
  return {
    CustomerCode: normalizeText(payload.CustomerCode),
    Name: normalizeRequiredText(payload.Name, "Customer name"),
    TinNo: normalizeText(payload.TinNo),
    VatNo: normalizeText(payload.VatNo),
    NoOfInquiries: normalizeInteger(payload.NoOfInquiries, "Number of inquiries"),
    NoOfActualOrders: normalizeInteger(payload.NoOfActualOrders, "Number of actual orders"),
    TotalPurchasedValue: normalizeReal(payload.TotalPurchasedValue, "Total purchased value"),
    Birthday: normalizeDate(payload.Birthday, "Birthday"),
    Contacts: normalizeContacts(payload.Contacts),
    Emails: normalizeEmails(payload.Emails),
    Addresses: normalizeAddresses(payload.Addresses)
  }
}

const toCustomerUpdatePayload = (payload = {}) => {
  return {
    CustomerCode: normalizeText(payload.CustomerCode),
    Name: normalizeRequiredText(payload.Name, "Customer name"),
    TinNo: normalizeText(payload.TinNo),
    VatNo: normalizeText(payload.VatNo),
    Birthday: normalizeDate(payload.Birthday, "Birthday"),
    Contacts: normalizeContacts(payload.Contacts),
    Emails: normalizeEmails(payload.Emails),
    Addresses: normalizeAddresses(payload.Addresses)
  }
}

const normalizeCustomerId = (customerId) => {
  const parsedId = Number(customerId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid customer id is required")
  }

  return parsedId
}

exports.getCustomers = () => {
  return customerRepo.getAllCustomers()
}

exports.getCustomerById = (customerId) => {
  const normalizedId = normalizeCustomerId(customerId)
  const customer = customerRepo.getCustomerById(normalizedId)

  if (!customer) {
    throw new Error("Customer not found")
  }

  customer.Contacts = customerRepo.getCustomerContactsByCustomerId(normalizedId)
  customer.Emails = customerRepo.getCustomerEmailsByCustomerId(normalizedId)
  customer.Addresses = customerRepo.getCustomerAddressesByCustomerId(normalizedId)

  return customer
}

const getCustomerSnapshot = (customerId) => {
  const customer = customerRepo.getCustomerById(customerId)

  if (!customer) {
    return null
  }

  customer.Contacts = customerRepo.getCustomerContactsByCustomerId(customerId)
  customer.Emails = customerRepo.getCustomerEmailsByCustomerId(customerId)
  customer.Addresses = customerRepo.getCustomerAddressesByCustomerId(customerId)

  return customer
}

exports.createCustomer = (payload, ctx) => {

  //console.log(payload)

  const data = toCustomerPayload(payload)
  data.CustomerCode = customerRepo.getNextCustomerCode()

  const createTx = db.transaction(() => {
    const customer = customerRepo.createCustomer({
      CustomerCode: data.CustomerCode,
      Name: data.Name,
      TinNo: data.TinNo,
      VatNo: data.VatNo,
      NoOfInquiries: data.NoOfInquiries,
      NoOfActualOrders: data.NoOfActualOrders,
      TotalPurchasedValue: data.TotalPurchasedValue,
      Birthday: data.Birthday
    })

    const customerId = customer.CustomerID || customer.ID

    data.Contacts.forEach(c => customerRepo.createCustomerContact({ ...c, CustomerID: customerId }))
    data.Emails.forEach(e => customerRepo.createCustomerEmail({ ...e, CustomerID: customerId }))
    data.Addresses.forEach(a => customerRepo.createCustomerAddress({ ...a, CustomerID: customerId }))

    return customer
  })

  const customer = createTx()
  const createdCustomer = {
    ...customer,
    Contacts: data.Contacts,
    Emails: data.Emails,
    Addresses: data.Addresses,
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, createdCustomer),
    after: createdCustomer,
    ctx,
  })

  return customer
}

exports.updateCustomer = (customerId, payload, ctx) => {
  const normalizedId = normalizeCustomerId(customerId)
  const customer = toCustomerUpdatePayload(payload)
  const before = getCustomerSnapshot(normalizedId)
  const existingCustomer = customerRepo.getCustomerByCode(customer.CustomerCode)

  if (
    existingCustomer &&
    existingCustomer.CustomerID !== normalizedId
  ) {
    throw new Error("Customer code already exists")
  }

  const updateTx = db.transaction(() => {
    const updatedCustomer = customerRepo.updateCustomer(normalizedId, customer)

    if (!updatedCustomer) {
      throw new Error("Customer not found")
    }

    customerRepo.deleteCustomerContactsByCustomerId(normalizedId)
    customerRepo.deleteCustomerEmailsByCustomerId(normalizedId)
    customerRepo.deleteCustomerAddressesByCustomerId(normalizedId)

    customer.Contacts.forEach(c => customerRepo.createCustomerContact({ ...c, CustomerID: normalizedId }))
    customer.Emails.forEach(e => customerRepo.createCustomerEmail({ ...e, CustomerID: normalizedId }))
    customer.Addresses.forEach(a => customerRepo.createCustomerAddress({ ...a, CustomerID: normalizedId }))

    return updatedCustomer
  })

  const updatedCustomer = updateTx()
  const after = {
    ...updatedCustomer,
    Contacts: customer.Contacts,
    Emails: customer.Emails,
    Addresses: customer.Addresses,
  }

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, after),
    before,
    after,
    ctx,
  })

  return updatedCustomer
}

exports.deleteCustomer = (customerId, ctx) => {
  const normalizedId = normalizeCustomerId(customerId)
  const before = getCustomerSnapshot(normalizedId)

  if (customerRepo.hasCustomerSalesOrders(normalizedId)) {
    throw new Error("Cannot delete customer with existing sales orders")
  }

  if (customerRepo.hasCustomerInquiries(normalizedId)) {
    throw new Error("Cannot delete customer with existing inquiries")
  }

  if (customerRepo.hasCustomerDAGs(normalizedId)) {
    throw new Error("Cannot delete customer with existing DAGs")
  }

  const deleteTx = db.transaction(() => {
    customerRepo.deleteCustomerContactsByCustomerId(normalizedId)
    customerRepo.deleteCustomerEmailsByCustomerId(normalizedId)
    customerRepo.deleteCustomerAddressesByCustomerId(normalizedId)
    const result = customerRepo.deleteCustomer(normalizedId)

    if (result.changes === 0) {
      throw new Error("Customer not found")
    }

    return { success: true }
  })

  const result = deleteTx()

  masterDataAuditLogService.recordAction({
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPE,
    entityName: masterDataAuditLogService.describeEntity(ENTITY_TYPE, before),
    before,
    ctx,
  })

  return result
}
