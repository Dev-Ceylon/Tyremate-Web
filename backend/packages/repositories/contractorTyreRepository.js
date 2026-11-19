const db = require("../database/connection")

exports.getTyresByContractorId = (contractorId) => {
  return db
    .prepare(`
      SELECT
        t.Id,
        t.Size,
        t.Pattern,
        t.LL_SR,
        t.PR,
        t.SideWall,
        t.DOT,
        t.PriceValidityFrom,
        t.PriceValidityTo,
        t.PurchasedPrice,
        t.DiscountOffered,
        t.DiscountAmount,
        t.MRP_WithoutVAT,
        t.MRP_WithVAT,
        t.ActualSellingPrice
      FROM ContractorTyre ct
      INNER JOIN TyreM t
        ON t.Id = ct.TyreID
      WHERE ct.ContractorID = ?
      ORDER BY t.Id DESC
    `)
    .all(contractorId)
}

exports.getTyreIdsByContractorId = (contractorId) => {
  const rows = db
    .prepare(`
      SELECT TyreID
      FROM ContractorTyre
      WHERE ContractorID = ?
      ORDER BY TyreID ASC
    `)
    .all(contractorId)

  return rows.map((row) => row.TyreID)
}

const verifyTyreIds = (tyreIds) => {
  if (tyreIds.length === 0) {
    return
  }

  const placeholders = tyreIds.map(() => "?").join(", ")
  const result = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM TyreM
      WHERE Id IN (${placeholders})
    `)
    .get(...tyreIds)

  if ((result?.count ?? 0) !== tyreIds.length) {
    throw new Error("One or more tyres were not found")
  }
}

exports.syncContractorTyres = (contractorId, tyreIds = []) => {
  const uniqueTyreIds = [...new Set(tyreIds)]

  verifyTyreIds(uniqueTyreIds)

  db
    .prepare(`
      DELETE FROM ContractorTyre
      WHERE ContractorID = ?
    `)
    .run(contractorId)

  const insertStmt = db.prepare(`
    INSERT INTO ContractorTyre (
      ContractorID,
      TyreID
    )
    VALUES (?, ?)
  `)

  uniqueTyreIds.forEach((tyreId) => {
    insertStmt.run(contractorId, tyreId)
  })
}
