const db = require("../database/connection")

exports.getAllContractors = () => {
  return db
    .prepare(`
      SELECT
        c.ID,
        c.Name,
        c.Rating,
        (SELECT cc.PhoneNumber FROM ContractorContact cc WHERE cc.ContractorID = c.ID ORDER BY cc.ID ASC LIMIT 1) AS Contact,
        (SELECT ce.EmailAddress FROM ContractorEmail ce WHERE ce.ContractorID = c.ID ORDER BY ce.ID ASC LIMIT 1) AS Email,
        (SELECT ca.AddressLine1 FROM ContractorAddress ca WHERE ca.ContractorID = c.ID ORDER BY ca.ID ASC LIMIT 1) AS Address
      FROM ContractorM c
      ORDER BY c.ID DESC
    `)
    .all()
}

exports.getContractorById = (contractorId) => {
  const contractor = db
    .prepare(`
      SELECT
        ID,
        Name,
        Rating
      FROM ContractorM
      WHERE ID = ?
    `)
    .get(contractorId)

  if (!contractor) {
    return null
  }

  return contractor
}

exports.createContractor = (contractor) => {
  const result = db
    .prepare(`
      INSERT INTO ContractorM (
        Name,
        Rating
      )
      VALUES (?, ?)
    `)
    .run(
      contractor.Name,
      contractor.Rating
    )

  const contractorId = result.lastInsertRowid
  return exports.getContractorById(contractorId)
}

exports.updateContractor = (contractorId, contractor) => {
  const result = db
    .prepare(`
      UPDATE ContractorM
      SET
        Name = ?,
        Rating = ?
      WHERE ID = ?
    `)
    .run(
      contractor.Name,
      contractor.Rating,
      contractorId
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getContractorById(contractorId)
}

exports.deleteContractor = (contractorId) => {
  return db
    .prepare("DELETE FROM ContractorM WHERE ID = ?")
    .run(contractorId)
}

exports.createContractorContact = (contact) => {
  return db
    .prepare(`
      INSERT INTO ContractorContact (ContractorID, PhoneNumber, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(contact.ContractorID, contact.PhoneNumber, contact.IsPrimary)
}

exports.createContractorEmail = (email) => {
  return db
    .prepare(`
      INSERT INTO ContractorEmail (ContractorID, EmailAddress, IsPrimary)
      VALUES (?, ?, ?)
    `)
    .run(email.ContractorID, email.EmailAddress, email.IsPrimary)
}

exports.createContractorAddress = (address) => {
  return db
    .prepare(`
      INSERT INTO ContractorAddress (
        ContractorID,
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
      address.ContractorID,
      address.AddressType,
      address.AddressLine1,
      address.AddressLine2,
      address.City,
      address.State,
      address.PostalCode,
      address.IsPrimary
    )
}

exports.getContractorContactsByContractorId = (contractorId) => {
  return db
    .prepare(`
      SELECT PhoneNumber, IsPrimary
      FROM ContractorContact
      WHERE ContractorID = ?
    `)
    .all(contractorId)
}

exports.getContractorEmailsByContractorId = (contractorId) => {
  return db
    .prepare(`
      SELECT EmailAddress, IsPrimary
      FROM ContractorEmail
      WHERE ContractorID = ?
    `)
    .all(contractorId)
}

exports.getContractorAddressesByContractorId = (contractorId) => {
  return db
    .prepare(`
      SELECT AddressType, AddressLine1, AddressLine2, City, State, PostalCode, IsPrimary
      FROM ContractorAddress
      WHERE ContractorID = ?
    `)
    .all(contractorId)
}

exports.deleteContractorContactsByContractorId = (contractorId) => {
  return db
    .prepare("DELETE FROM ContractorContact WHERE ContractorID = ?")
    .run(contractorId)
}

exports.deleteContractorEmailsByContractorId = (contractorId) => {
  return db
    .prepare("DELETE FROM ContractorEmail WHERE ContractorID = ?")
    .run(contractorId)
}

exports.deleteContractorAddressesByContractorId = (contractorId) => {
  return db
    .prepare("DELETE FROM ContractorAddress WHERE ContractorID = ?")
    .run(contractorId)
}
