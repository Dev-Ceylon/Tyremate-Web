const soCustomerRepo = require("../repositories/soCustomerRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const toPair = (payload = {}) => {
  return {
    SoID: normalizeId(payload.SoID, "SoID"),
    CustomerID: normalizeId(payload.CustomerID, "CustomerID")
  }
}

exports.getSoCustomers = () => {
  return soCustomerRepo.getAllSoCustomers()
}

exports.getSoCustomer = (soId, customerId) => {
  const normalizedSoId = normalizeId(soId, "SoID")
  const normalizedCustomerId = normalizeId(customerId, "CustomerID")
  const link = soCustomerRepo.getSoCustomer(normalizedSoId, normalizedCustomerId)

  if (!link) {
    throw new Error("SO-Customer link not found")
  }

  return link
}

exports.createSoCustomer = (payload) => {
  const pair = toPair(payload)
  const existing = soCustomerRepo.getSoCustomer(pair.SoID, pair.CustomerID)

  if (existing) {
    throw new Error("SO-Customer link already exists")
  }

  return soCustomerRepo.createSoCustomer(pair.SoID, pair.CustomerID)
}

exports.updateSoCustomer = (currentSoId, currentCustomerId, payload) => {
  const normalizedCurrentSoId = normalizeId(currentSoId, "Current SoID")
  const normalizedCurrentCustomerId = normalizeId(currentCustomerId, "Current CustomerID")
  const pair = toPair(payload)
  const current = soCustomerRepo.getSoCustomer(normalizedCurrentSoId, normalizedCurrentCustomerId)

  if (!current) {
    throw new Error("SO-Customer link not found")
  }

  if (
    pair.SoID !== normalizedCurrentSoId ||
    pair.CustomerID !== normalizedCurrentCustomerId
  ) {
    const existingTarget = soCustomerRepo.getSoCustomer(pair.SoID, pair.CustomerID)

    if (existingTarget) {
      throw new Error("SO-Customer link already exists")
    }
  }

  return soCustomerRepo.updateSoCustomer(
    normalizedCurrentSoId,
    normalizedCurrentCustomerId,
    pair.SoID,
    pair.CustomerID
  )
}

exports.deleteSoCustomer = (soId, customerId) => {
  const normalizedSoId = normalizeId(soId, "SoID")
  const normalizedCustomerId = normalizeId(customerId, "CustomerID")
  const result = soCustomerRepo.deleteSoCustomer(normalizedSoId, normalizedCustomerId)

  if (result.changes === 0) {
    throw new Error("SO-Customer link not found")
  }

  return { success: true }
}
