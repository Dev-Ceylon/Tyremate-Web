const db = require("../database/connection")

exports.getAllCustomers = () => {
  return db
    .prepare(`
      SELECT
        CustomerID,
        CustomerCode,
        Name,
        TinNo,
        VatNo,
        NoOfInquiries,
        NoOfActualOrders,
        TotalPurchasedValue,
        Birthday
      FROM CustomerM
      ORDER BY CustomerID DESC
    `)
    .all()
}

exports.getCustomerById = (customerId) => {
  return db
    .prepare(`
      SELECT
        CustomerID,
        CustomerCode,
        Name,
        TinNo,
        VatNo,
        NoOfInquiries,
        NoOfActualOrders,
        TotalPurchasedValue,
        Birthday
      FROM CustomerM
      WHERE CustomerID = ?
    `)
    .get(customerId)
}

exports.getCustomerByCode = (customerCode) => {
  return db
    .prepare(`
      SELECT
        CustomerID,
        CustomerCode,
        Name,
        TinNo,
        VatNo,
        NoOfInquiries,
        NoOfActualOrders,
        TotalPurchasedValue,
        Birthday
      FROM CustomerM
      WHERE CustomerCode = ?
    `)
    .get(customerCode)
}

exports.createCustomer = (customer) => {
  const result = db
    .prepare(`
      INSERT INTO CustomerM (
        CustomerCode,
        Name,
        TinNo,
        VatNo,
        NoOfInquiries,
        NoOfActualOrders,
        TotalPurchasedValue,
        Birthday
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      customer.CustomerCode,
      customer.Name,
      customer.TinNo,
      customer.VatNo,
      customer.NoOfInquiries,
      customer.NoOfActualOrders,
      customer.TotalPurchasedValue,
      customer.Birthday
    )

  return exports.getCustomerById(result.lastInsertRowid)
}

exports.updateCustomer = (customerId, customer) => {
  const result = db
    .prepare(`
      UPDATE CustomerM
      SET
        CustomerCode = ?,
        Name = ?,
        TinNo = ?,
        VatNo = ?,
        Birthday = ?
      WHERE CustomerID = ?
    `)
    .run(
      customer.CustomerCode,
      customer.Name,
      customer.TinNo,
      customer.VatNo,
      customer.Birthday,
      customerId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getCustomerById(customerId)
}

exports.deleteCustomerContactsByCustomerId = (customerId) => {
  return db
    .prepare("DELETE FROM CustomerContact WHERE CustomerID = ?")
    .run(customerId)
}

exports.deleteCustomerEmailsByCustomerId = (customerId) => {
  return db
    .prepare("DELETE FROM CustomerEmail WHERE CustomerID = ?")
    .run(customerId)
}

exports.deleteCustomerAddressesByCustomerId = (customerId) => {
  return db
    .prepare("DELETE FROM CustomerAddress WHERE CustomerID = ?")
    .run(customerId)
}

exports.hasCustomerSalesOrders = (customerId) => {
  const row = db
    .prepare("SELECT 1 FROM SoCustomer WHERE CustomerID = ? LIMIT 1")
    .get(customerId)
  return !!row
}

exports.hasCustomerInquiries = (customerId) => {
  const row = db
    .prepare("SELECT 1 FROM Inquiry WHERE CustomerID = ? LIMIT 1")
    .get(customerId)
  return !!row
}

exports.hasCustomerDAGs = (customerId) => {
  const row = db
    .prepare("SELECT 1 FROM DAG WHERE CustomerID = ? LIMIT 1")
    .get(customerId)
  return !!row
}

exports.deleteCustomer = (customerId) => {
  return db
    .prepare("DELETE FROM CustomerM WHERE CustomerID = ?")
    .run(customerId)
}

exports.createCustomerContact = (contact) => {
  return db
    .prepare(`
      INSERT INTO CustomerContact (CustomerID, PhoneNumber, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(contact.CustomerID, contact.PhoneNumber, contact.IsPrimary)
}

exports.createCustomerEmail = (email) => {
  return db
    .prepare(`
      INSERT INTO CustomerEmail (CustomerID, EmailAddress, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(email.CustomerID, email.EmailAddress, email.IsPrimary)
}

exports.createCustomerAddress = (address) => {
  return db
    .prepare(`
      INSERT INTO CustomerAddress (
        CustomerID,
        AddressType,
        AddressLine1,
        AddressLine2,
        City,
        State,
        PostalCode,
        IsPrimary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      address.CustomerID,
      address.AddressType,
      address.AddressLine1,
      address.AddressLine2,
      address.City,
      address.State,
      address.PostalCode,
      address.IsPrimary
    )
}

exports.getCustomerContactsByCustomerId = (customerId) => {
  return db
    .prepare(`
      SELECT PhoneNumber, IsPrimary
      FROM CustomerContact
      WHERE CustomerID = ?
    `)
    .all(customerId)
}

exports.getCustomerEmailsByCustomerId = (customerId) => {
  return db
    .prepare(`
      SELECT EmailAddress, IsPrimary
      FROM CustomerEmail
      WHERE CustomerID = ?
    `)
    .all(customerId)
}

exports.getCustomerAddressesByCustomerId = (customerId) => {
  return db
    .prepare(`
      SELECT AddressType, AddressLine1, AddressLine2, City, State, PostalCode, IsPrimary
      FROM CustomerAddress
      WHERE CustomerID = ?
    `)
    .all(customerId)
}

exports.getNextCustomerCode = () => {
  const row = db
    .prepare("SELECT MAX(CustomerID) AS MaxId FROM CustomerM")
    .get()

  const nextNumber = (row?.MaxId ?? 0) + 1
  return `CUS${String(nextNumber).padStart(5, "0")}`
}
