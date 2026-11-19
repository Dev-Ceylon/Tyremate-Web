const tyreSupplierRepository = require("../repositories/tyreSupplierRepository")

/**
 * Normalizes and validates an ID field.
 */
const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

/**
 * Gets all suppliers associated with a specific tyre, including full details.
 */
exports.getSuppliersByTyreId = (tyreId) => {
  const normalizedTyreId = normalizeId(tyreId, "TyreID")
  
  try {
    const suppliers = tyreSupplierRepository.getSuppliersByTyreId(normalizedTyreId)
    
    // Return empty array if no suppliers found
    if (!suppliers || suppliers.length === 0) {
      return []
    }
    
    return suppliers
  } catch (error) {
    throw new Error(`Failed to fetch suppliers for tyre ID ${normalizedTyreId}: ${error.message}`)
  }
}

/**
 * Links a supplier to a tyre with a specific price.
 * Validates input types and values before calling the repository.
 */
exports.create = (payload) => {
  const tyreId = normalizeId(payload?.tyreId, "TyreID")
  const supplierId = normalizeId(payload?.supplierId, "SupplierID")
  
  const price = Number(payload?.price)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid non-negative number")
  }

  try {
    return tyreSupplierRepository.create({ tyreId, supplierId, price })
  } catch (error) {
    throw new Error(`Failed to link supplier to tyre: ${error.message}`)
  }
}