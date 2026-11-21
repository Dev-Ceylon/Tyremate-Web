const db = require("../database/connection")
const poRepo = require("../repositories/poRepository")
const poTyresRepo = require("../repositories/poTyresRepository")
const poTyreBatchesRepo = require("../repositories/poTyreBatchesRepository")
const poBatteriesRepo = require("../repositories/poBatteriesRepository")
const poBatteryBatchesRepo = require("../repositories/poBatteryBatchesRepository")

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

    const batchCode =
      batch.BatchCode === undefined || batch.BatchCode === null
        ? dot
        : String(batch.BatchCode).trim() || dot || null

    return { DOT: dot, BatchCode: batchCode, Qty: qty }
  })
}

const resolveCreatedBy = (ctx) => {
  const { user, changedBy } = ctx ?? {}

  return user?.displayName || user?.username || changedBy || null
}

exports.getPoTyreBatches = (poLineId) => {
  const normalizedId = normalizeId(poLineId, "PoLineID")

  const tyreBatches = poTyreBatchesRepo.getBatchesByPoTyresId(normalizedId)
  if (tyreBatches.length > 0) return tyreBatches

  const batteryBatches = poBatteryBatchesRepo.getBatchesByPoBatteriesId(normalizedId)
  if (batteryBatches.length > 0) {
    return batteryBatches.map((b) => ({
      ...b,
      DOT: b.BatchCode,
    }))
  }

  return []
}

exports.getBatchStatusByPoId = (poId) => {
  const normalizedPoId = normalizeId(poId, "POID")
  const po = poRepo.getPOById(normalizedPoId)

  if (po && po.Category === "battery") {
    return poBatteryBatchesRepo.getBatchStatusByPoId(normalizedPoId).map((row) => ({
      PoTyresID: Number(row.PoBatteriesID),
      BatteryID: Number(row.BatteryID),
      Brand: row.Brand,
      Model: row.Model,
      Capacity: row.Capacity,
      Voltage: row.Voltage,
      Qty: Number(row.Qty),
      IsBatchManaged: Number(row.IsBatchManaged) === 1,
      BatchQty: Number(row.BatchQty ?? 0),
      BatchCount: Number(row.BatchCount ?? 0),
    }))
  }

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

exports.savePoTyreBatches = (poLineId, batches, ctx) => {
  const normalizedId = normalizeId(poLineId, "PoLineID")
  const normalizedBatches = normalizeBatches(batches)

  const poTyre = poTyresRepo.getPoTyreById(normalizedId)
  const poBattery = !poTyre ? poBatteriesRepo.getPoBatteryById(normalizedId) : null

  if (!poTyre && !poBattery) {
    throw new Error("PO line item not found")
  }

  const lineQty = Number((poTyre || poBattery).Qty ?? 0)
  const batchesTotal = normalizedBatches.reduce((sum, batch) => sum + batch.Qty, 0)
  if (normalizedBatches.length > 0 && batchesTotal !== lineQty) {
    throw new Error("Sum of batch quantities must equal the PO line quantity")
  }

  const createdBy = resolveCreatedBy(ctx)

  if (poBattery) {
    db.transaction(() => {
      poBatteryBatchesRepo.deleteBatchesByPoBatteriesId(normalizedId)
      for (const batch of normalizedBatches) {
        poBatteryBatchesRepo.createBatch({
          PoBatteriesID: normalizedId,
          BatchCode: batch.BatchCode || batch.DOT,
          Qty: batch.Qty,
        })
      }
    })()

    return poBatteryBatchesRepo.getBatchesByPoBatteriesId(normalizedId).map((b) => ({
      ...b,
      DOT: b.BatchCode,
    }))
  }

  db.transaction(() => {
    poTyreBatchesRepo.deleteBatchesByPoTyresId(normalizedId)
    for (const batch of normalizedBatches) {
      poTyreBatchesRepo.createBatch({
        PoTyresID: normalizedId,
        DOT: batch.DOT,
        Qty: batch.Qty,
        CreatedBy: createdBy,
      })
    }
  })()

  return poTyreBatchesRepo.getBatchesByPoTyresId(normalizedId)
}