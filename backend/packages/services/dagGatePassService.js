const db = require("../database/connection")
const dagGatePassRepo = require("../repositories/dagGatePassRepository")
const dagRepo = require("../repositories/dagRepository")
const dagTyresRepo = require("../repositories/dagTyresRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const assertDAGExists = (dagId) => {
  const dag = dagRepo.getDAGById(dagId)

  if (!dag) {
    throw new Error("DAG not found")
  }
}

const toDAGGatePassPayload = (payload = {}) => {
  const dagId = normalizeId(payload.DAGID, "DAGID")
  assertDAGExists(dagId)

  return {
    DAGID: dagId,
  }
}

exports.getDAGGatePasses = () => {
  const passes = dagGatePassRepo.getAllDAGGatePassesWithDetails()
  
  if (passes.length === 0) return []
  
  return passes.map((pass) => {
    return {
      ...pass,
      Tyres: dagTyresRepo.getDAGTyresByDAGIdWithDetails(pass.DAGID),
    }
  })
}

exports.getDAGGatePassById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const dagGatePass = dagGatePassRepo.getDAGGatePassById(normalizedId)

  if (!dagGatePass) {
    throw new Error("DAG Gate Pass not found")
  }

  return {
    ...dagGatePass,
    Tyres: dagTyresRepo.getDAGTyresByDAGIdWithDetails(dagGatePass.DAGID),
  }
}

exports.getDAGGatePassByDAGId = (dagId) => {
  const normalizedId = normalizeId(dagId, "DAGID")
  const dagGatePass = dagGatePassRepo.getDAGGatePassByDAGId(normalizedId)

  if (!dagGatePass) {
    throw new Error("DAG Gate Pass not found for this DAG")
  }

  return {
    ...dagGatePass,
    Tyres: dagTyresRepo.getDAGTyresByDAGIdWithDetails(dagGatePass.DAGID),
  }
}

exports.createDAGGatePass = (payload) => {
  const dagGatePass = toDAGGatePassPayload(payload)
  return dagGatePassRepo.createDAGGatePass(dagGatePass)
}

exports.updateDAGGatePass = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")
  const current = dagGatePassRepo.getDAGGatePassById(normalizedId)

  if (!current) {
    throw new Error("DAG Gate Pass not found")
  }

  const dagGatePass = toDAGGatePassPayload(payload)
  return dagGatePassRepo.updateDAGGatePass(normalizedId, dagGatePass)
}

exports.deleteDAGGatePass = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const result = dagGatePassRepo.deleteDAGGatePass(normalizedId)

  if (result.changes === 0) {
    throw new Error("DAG Gate Pass not found")
  }

  return { success: true }
}
