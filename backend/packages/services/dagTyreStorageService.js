const dagTyreStorageRepo = require("../repositories/dagTyreStorageRepository")
const dagTyresRepo = require("../repositories/dagTyresRepository")
const storageManagerRepo = require("../repositories/storageManagerRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const assertDagTyresExists = (dagTyresId) => {
  const dagTyre = dagTyresRepo.getDAGTyreById(dagTyresId)

  if (!dagTyre) {
    throw new Error("DAG tyre not found")
  }
}

const assertStorageManagerExists = (storageManagerId) => {
  const storageManager = storageManagerRepo.getStorageManagerById(storageManagerId)

  if (!storageManager) {
    throw new Error("Storage manager record not found")
  }
}

const toDagTyreStoragePayload = (payload = {}) => {
  const normalized = {
    DAGTyresID: normalizeId(payload.DAGTyresID, "DAGTyresID"),
    StorageManagerID: normalizeId(payload.StorageManagerID, "StorageManagerID"),
  }

  assertDagTyresExists(normalized.DAGTyresID)
  assertStorageManagerExists(normalized.StorageManagerID)

  return normalized
}

exports.getDagTyreStorages = () => {
  return dagTyreStorageRepo.getAllDagTyreStorages()
}

exports.getDagTyreStorageById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const dagTyreStorage = dagTyreStorageRepo.getDagTyreStorageById(normalizedId)

  if (!dagTyreStorage) {
    throw new Error("DAG tyre storage record not found")
  }

  return dagTyreStorage
}

exports.getDagTyreStoragesByDagTyresId = (dagTyresId) => {
  const normalizedDagTyresId = normalizeId(dagTyresId, "DAGTyresID")
  // Optionally, you could assert the DAGTyresID exists here if needed,
  // but the repository will return an empty array if not found, which might be acceptable.
  return dagTyreStorageRepo.getDagTyreStoragesByDagTyresId(normalizedDagTyresId)
}

exports.getDagTyreStoragesByStorageManagerId = (storageManagerId) => {
  const normalizedStorageManagerId = normalizeId(storageManagerId, "StorageManagerID")
  // Optionally, you could assert the StorageManagerID exists here if needed.
  return dagTyreStorageRepo.getDagTyreStoragesByStorageManagerId(normalizedStorageManagerId)
}

exports.createDagTyreStorage = (payload) => {
  const validatedPayload = toDagTyreStoragePayload(payload)
  return dagTyreStorageRepo.createDagTyreStorage(validatedPayload)
}

exports.updateDagTyreStorage = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")

  // Check if the record to update exists
  const existingRecord = dagTyreStorageRepo.getDagTyreStorageById(normalizedId)
  if (!existingRecord) {
    throw new Error("DAG tyre storage record not found")
  }

  const validatedPayload = toDagTyreStoragePayload(payload)
  const updatedRecord = dagTyreStorageRepo.updateDagTyreStorage(
    normalizedId,
    validatedPayload
  )

  // This check is mostly for consistency, as the above `existingRecord` check
  // already ensures the ID is valid. `updateDagTyreStorage` returns null
  // if no changes were made or if the ID didn't exist (which we've covered).
  if (!updatedRecord) {
    throw new Error("Failed to update DAG tyre storage record or record not found after update attempt")
  }

  return updatedRecord
}

exports.deleteDagTyreStorage = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const result = dagTyreStorageRepo.deleteDagTyreStorage(normalizedId)

  if (result.changes === 0) {
    throw new Error("DAG tyre storage record not found")
  }

  return { success: true }
}