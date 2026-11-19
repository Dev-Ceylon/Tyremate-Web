const manufactureOrderRepo = require("../repositories/manufactureOrderRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const toPayload = (payload = {}) => {
  return {
    SoID: normalizeId(payload.SoID, "SoID")
  }
}

exports.getManufactureOrders = () => {
  return manufactureOrderRepo.getAllManufactureOrders()
}

exports.getManufactureOrderById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const order = manufactureOrderRepo.getManufactureOrderById(normalizedId)

  if (!order) {
    throw new Error("Manufacture order not found")
  }

  return order
}

exports.createManufactureOrder = (payload) => {
  const manufactureOrder = toPayload(payload)
  return manufactureOrderRepo.createManufactureOrder(manufactureOrder.SoID)
}

exports.updateManufactureOrder = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")
  const manufactureOrder = toPayload(payload)
  const updated = manufactureOrderRepo.updateManufactureOrder(
    normalizedId,
    manufactureOrder.SoID
  )

  if (!updated) {
    throw new Error("Manufacture order not found")
  }

  return updated
}

exports.deleteManufactureOrder = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const result = manufactureOrderRepo.deleteManufactureOrder(normalizedId)

  if (result.changes === 0) {
    throw new Error("Manufacture order not found")
  }

  return { success: true }
}
