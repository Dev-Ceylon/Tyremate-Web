const statusRepo = require("../repositories/statusRepository")

const normalizeStatusId = (id) => {
  const parsedId = Number(id)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid status id is required")
  }

  return parsedId
}

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()

  return normalized === "" ? null : normalized
}

exports.getStatuses = () => {
  return statusRepo.getAllStatuses()
}

exports.getStatusById = (id) => {
  const normalizedId = normalizeStatusId(id)
  const status = statusRepo.getStatusById(normalizedId)

  if (!status) {
    throw new Error("Status not found")
  }

  return status
}

exports.getStatusByCode = (statusCode) => {
  const normalizedCode = normalizeText(statusCode)

  if (!normalizedCode) {
    throw new Error("Status code is required")
  }

  const status = statusRepo.getStatusByCode(normalizedCode)

  if (!status) {
    throw new Error("Status not found")
  }

  return status
}
