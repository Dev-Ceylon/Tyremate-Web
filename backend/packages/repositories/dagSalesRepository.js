const db = require("../database/connection")

// One "take": a header row plus a line per serial that left in that take.
exports.createDAGSale = ({ DAGID, PaymentID = null, SoldDate, SoldBy = null }) => {
  const result = db
    .prepare(`
      INSERT INTO DAGSales (
        DAGID,
        PaymentID,
        SoldDate,
        SoldBy
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(DAGID, PaymentID, SoldDate, SoldBy)

  return exports.getDAGSaleById(result.lastInsertRowid)
}

exports.getDAGSaleById = (id) => {
  return db
    .prepare(`
      SELECT
        ds.ID,
        ds.DAGID,
        ds.PaymentID,
        ds.SoldDate,
        ds.SoldBy
      FROM DAGSales ds
      WHERE ds.ID = ?
    `)
    .get(id)
}

exports.getDAGSalesByDAGId = (dagId) => {
  return db
    .prepare(`
      SELECT
        ds.ID,
        ds.DAGID,
        ds.PaymentID,
        ds.SoldDate,
        ds.SoldBy
      FROM DAGSales ds
      WHERE ds.DAGID = ?
      ORDER BY ds.ID DESC
    `)
    .all(dagId)
}

exports.createDAGSaleLine = ({ DAGSaleID, DAGTyresID, DAGTyresSerialID, Amount = 0 }) => {
  const result = db
    .prepare(`
      INSERT INTO DAGSaleLines (
        DAGSaleID,
        DAGTyresID,
        DAGTyresSerialID,
        Amount
      )
      VALUES (?, ?, ?, ?)
    `)
    .run(DAGSaleID, DAGTyresID, DAGTyresSerialID, Amount)

  return result.lastInsertRowid
}

exports.getDAGSaleLinesBySaleId = (saleId) => {
  return db
    .prepare(`
      SELECT
        dsl.ID,
        dsl.DAGSaleID,
        dsl.DAGTyresID,
        dsl.DAGTyresSerialID,
        dsl.Amount
      FROM DAGSaleLines dsl
      WHERE dsl.DAGSaleID = ?
      ORDER BY dsl.ID ASC
    `)
    .all(saleId)
}

exports.deleteDAGSalesByDAGId = (dagId) => {
  db
    .prepare(`
      DELETE FROM DAGSaleLines
      WHERE DAGSaleID IN (SELECT ID FROM DAGSales WHERE DAGID = ?)
    `)
    .run(dagId)

  return db.prepare("DELETE FROM DAGSales WHERE DAGID = ?").run(dagId)
}

// Serials released against a specific payment, with the tyre identity attached
// so the UI can label each line. TyreM exposes no code/name columns of its own;
// Size is the code and Pattern is the name (same convention as
// dagTyresRepository.getDAGTyresByDAGIdWithDetails).
const SALE_LINE_DETAIL_SELECT = `
  SELECT
    dsl.ID,
    dsl.DAGSaleID,
    dsl.DAGTyresID,
    dsl.DAGTyresSerialID,
    dsl.Amount,
    dts.SerialNumber,
    dt.TyreID,
    t.Size AS TyreCode,
    t.Pattern AS TyreName
  FROM DAGSaleLines dsl
  INNER JOIN DAGSales ds ON ds.ID = dsl.DAGSaleID
  INNER JOIN DAGTyresSerials dts ON dts.ID = dsl.DAGTyresSerialID
  INNER JOIN DAGTyres dt ON dt.ID = dsl.DAGTyresID
  INNER JOIN TyreM t ON t.Id = dt.TyreID
`

exports.getDAGSaleLinesWithDetailsByPaymentId = (paymentId, dagId = null) => {
  const conditions = ["ds.PaymentID = ?"]
  const params = [paymentId]

  if (dagId) {
    conditions.push("ds.DAGID = ?")
    params.push(dagId)
  }

  return db
    .prepare(`
      ${SALE_LINE_DETAIL_SELECT}
      WHERE ${conditions.join(" AND ")}
      ORDER BY dsl.ID ASC
    `)
    .all(...params)
}
