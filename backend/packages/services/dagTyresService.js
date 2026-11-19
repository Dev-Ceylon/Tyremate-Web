const dagTyresRepo = require("../repositories/dagTyresRepository")
const dagRepo = require("../repositories/dagRepository")
const tyreRepo = require("../repositories/tyreRepository")
const storageLocationRepo = require("../repositories/storageLocationRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeQty = (value) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Qty must be a valid positive integer")
  }

  return parsed
}

const assertDAGExists = (dagId) => {
  const dag = dagRepo.getDAGById(dagId)

  if (!dag) {
    throw new Error("DAG not found")
  }
}

const assertTyreExists = (tyreId) => {
  const tyre = tyreRepo.getTyreById(tyreId)

  if (!tyre) {
    throw new Error("Tyre not found")
  }
}

const assertStorageLocationExists = (storageLocationId) => {
  const storageLocation = storageLocationRepo.getStorageLocationById(storageLocationId)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }
}

const toDAGTyrePayload = (payload = {}) => {
  const dagId = normalizeId(payload.DAGID, "DAGID")
  const tyreId = normalizeId(payload.TyreID, "TyreID")
  const storageLocationId = normalizeId(payload.StorageLocationID, "StorageLocationID")
  const qty = normalizeQty(payload.Qty)

  assertDAGExists(dagId)
  assertTyreExists(tyreId)
  assertStorageLocationExists(storageLocationId)

  return {
    DAGID: dagId,
    TyreID: tyreId,
    StorageLocationID: storageLocationId,
    Qty: qty,
  }
}

exports.getDAGTyres = () => {
  return dagTyresRepo.getAllDAGTyres()
}

exports.getDAGTyresByDAGId = (dagId) => {
  const normalizedDAGId = normalizeId(dagId, "DAGID")
  assertDAGExists(normalizedDAGId)
  return dagTyresRepo.getDAGTyresByDAGId(normalizedDAGId)
}

exports.getDAGTyreById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const row = dagTyresRepo.getDAGTyreById(normalizedId)

  if (!row) {
    throw new Error("DAG-Tyre row not found")
  }

  return row
}

exports.createDAGTyre = (payload) => {
  const dagTyre = toDAGTyrePayload(payload)
  return dagTyresRepo.createDAGTyre(dagTyre)
}

exports.updateDAGTyre = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")
  const current = dagTyresRepo.getDAGTyreById(normalizedId)

  if (!current) {
    throw new Error("DAG-Tyre row not found")
  }

  const dagTyre = toDAGTyrePayload(payload)
  return dagTyresRepo.updateDAGTyre(normalizedId, dagTyre)
}

exports.deleteDAGTyre = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const result = dagTyresRepo.deleteDAGTyre(normalizedId)

  if (result.changes === 0) {
    throw new Error("DAG-Tyre row not found")
  }

  return { success: true }
}
