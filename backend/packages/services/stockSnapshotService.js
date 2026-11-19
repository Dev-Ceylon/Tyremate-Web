const stockSnapshotRepo = require("../repositories/stockSnapshotRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

exports.getStockSnapshots = () => {
  return stockSnapshotRepo.getAllStockSnapshots()
}

exports.getStockSnapshotByTyreId = (tyreId) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  const stockSnapshot = stockSnapshotRepo.getStockSnapshotByTyreId(normalizedTyreId)

  if (!stockSnapshot) {
    throw new Error("Stock snapshot not found")
  }

  return stockSnapshot
}
