const contractorTyreRepo = require("../repositories/contractorTyreRepository")

const normalizeContractorId = (contractorId) => {
  const parsedId = Number(contractorId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid contractor id is required")
  }

  return parsedId
}

exports.getTyresByContractorId = (contractorId) => {
  const normalizedContractorId = normalizeContractorId(contractorId)
  return contractorTyreRepo.getTyresByContractorId(normalizedContractorId)
}

exports.getTyreIdsByContractorId = (contractorId) => {
  const normalizedContractorId = normalizeContractorId(contractorId)
  return contractorTyreRepo.getTyreIdsByContractorId(normalizedContractorId)
}

const normalizeTyreIds = (tyreIds) => {
  if (!Array.isArray(tyreIds)) {
    return []
  }

  const normalized = tyreIds
    .map((tyreId) => Number(tyreId))
    .filter((tyreId) => Number.isInteger(tyreId) && tyreId > 0)

  return [...new Set(normalized)]
}

exports.syncContractorTyres = (contractorId, tyreIds = []) => {
  const normalizedContractorId = normalizeContractorId(contractorId)
  contractorTyreRepo.syncContractorTyres(
    normalizedContractorId,
    normalizeTyreIds(tyreIds)
  )
}
