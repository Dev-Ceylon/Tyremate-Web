const suggestRepo = require("../repositories/suggestRepository")

const MAX_QUERY_LENGTH = 100

exports.getDistinctValues = (table, field, query) => {
  if (!table || typeof table !== "string") {
    throw new Error("Table is required")
  }
  if (!field || typeof field !== "string") {
    throw new Error("Field is required")
  }
  if (!query || typeof query !== "string") {
    throw new Error("Query is required")
  }

  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return []
  }

  return suggestRepo.getDistinctValues(table, field, trimmed.slice(0, MAX_QUERY_LENGTH))
}
