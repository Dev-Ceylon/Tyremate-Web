const db = require("../database/connection")

exports.getInquiryTyresByInquiryId = (inquiryId) => {
  return db
    .prepare(`
      SELECT
        it.ID,
        it.InquiryID,
        it.TyreID,
        it.Price,
        it.Discount,
        it.Qty,
        t.Size,
        t.Pattern
      FROM InquiryTyres it
      INNER JOIN TyreM t ON it.TyreID = t.Id
      WHERE it.InquiryID = ?
      ORDER BY it.ID DESC
    `)
    .all(inquiryId)
}

exports.getInquiryTyreById = (id) => {
  return db
    .prepare(`
      SELECT
        it.ID,
        it.InquiryID,
        it.TyreID,
        it.Price,
        it.Discount,
        it.Qty
      FROM InquiryTyres it
      WHERE it.ID = ?
    `)
    .get(id)
}

exports.createInquiryTyre = (data) => {
  const result = db
    .prepare(`
      INSERT INTO InquiryTyres (
        InquiryID,
        TyreID,
        Price,
        Discount,
        Qty
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(data.InquiryID, data.TyreID, data.Price, data.Discount, data.Qty)

  return exports.getInquiryTyreById(result.lastInsertRowid)
}

exports.updateInquiryTyre = (id, data) => {
  const result = db
    .prepare(`
      UPDATE InquiryTyres
      SET InquiryID = ?, TyreID = ?, Price = ?, Discount = ?, Qty = ?
      WHERE ID = ?
    `)
    .run(data.InquiryID, data.TyreID, data.Price, data.Discount, data.Qty, id)

  if (result.changes === 0) return null
  return exports.getInquiryTyreById(id)
}

exports.deleteInquiryTyre = (id) => db.prepare("DELETE FROM InquiryTyres WHERE ID = ?").run(id)

exports.deleteInquiryTyresByInquiryId = (inquiryId) =>
  db.prepare("DELETE FROM InquiryTyres WHERE InquiryID = ?").run(inquiryId)