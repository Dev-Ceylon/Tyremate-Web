const db = require("../database/connection")
const poTyresRepo = require("../repositories/poTyresRepository")
const poTyreBatchesRepo = require("../repositories/poTyreBatchesRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }
  return parsed
}

const normalizeBatches = (batches) => {
  if (batches === undefined || batches === null) {
    return []
  }

  if (!Array.isArray(batches)) {
    throw new Error("Batches must be an array")
  }

  return batches.map((batch, index) => {
    const qty = Number(batch.Qty)

    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Batches[${index}].Qty must be a positive integer`)
    }

    const dot =
      batch.DOT === undefined || batch.DOT === null
        ? null
        : String(batch.DOT).trim() || null

    return { DOT: dot, Qty: qty }
  })
}

const resolveCreatedBy = (ctx) => {
  const { user, changedBy } = ctx ?? {}

  return user?.displayName || user?.username || changedBy || null
}

exports.getPoTyreBatches = (poTyresId) => {
  const normalizedPoTyresId = normalizeId(poTyresId, "PoTyresID")

  return poTyreBatchesRepo.getBatchesByPoTyresId(normalizedPoTyresId)
}

exports.getBatchStatusByPoId = (poId) => {
  const normalizedPoId = normalizeId(poId, "POID")

  return poTyreBatchesRepo.getBatchStatusByPoId(normalizedPoId).map((row) => ({
    PoTyresID: Number(row.PoTyresID),
    TyreID: Number(row.TyreID),
    Brand: row.Brand,
    Size: row.Size,
    Pattern: row.Pattern,
    Qty: Number(row.Qty),
    IsBatchManaged: Number(row.IsBatchManaged) === 1,
    BatchQty: Number(row.BatchQty ?? 0),
    BatchCount: Number(row.BatchCount ?? 0),
  }))
}

exports.savePoTyreBatches = (poTyresId, batches, ctx) => {
  const normalizedPoTyresId = normalizeId(poTyresId, "PoTyresID")
  const normalizedBatches = normalizeBatches(batches)
  const poTyre = poTyresRepo.getPoTyreById(normalizedPoTyresId)
  if (!poTyre) throw new Error("PO-Tyre line not found")

  const batchesTotal = normalizedBatches.reduce((sum, batch) => sum + batch.Qty, 0)
  if (normalizedBatches.length > 0 && batchesTotal !== Number(poTyre.Qty ?? 0)) {
    throw new Error("Sum of batch quantities must equal the PO tyre line quantity")
  }

  const createdBy = resolveCreatedBy(ctx)
  db.transaction(() => {
    poTyreBatchesRepo.deleteBatchesByPoTyresId(normalizedPoTyresId)
    for (const batch of normalizedBatches) {
      poTyreBatchesRepo.createBatch({
        PoTyresID: normalizedPoTyresId,
        DOT: batch.DOT,
        Qty: batch.Qty,
        CreatedBy: createdBy,
      })
    }
  })()

  return poTyreBatchesRepo.getBatchesByPoTyresId(normalizedPoTyresId)
}