const db = require("../database/connection")

exports.getAllDAGs = () => {
  return db
    .prepare(`
      SELECT
        d.ID,
        d.CustomerID,
        d.TotalDAGCost,
        d.IsPaymentCompleted,
        c.CustomerCode,
        COALESCE(c.Name, wc.CustomerName) AS CustomerName,
        wc.CustomerPhone AS WalkinCustomerPhone,
        CASE WHEN dwl.WalkinCustomerID IS NOT NULL THEN 1 ELSE 0 END AS IsWalkinCustomer,
        d.ContractorID,
        ct.Name AS ContractorName,
        d.StatusID,
        s.StatusCode,
        s.StatusName,
        d.Comment,
        d.Date,
        d.DeliveryDate
      FROM DAG d
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGWalkinLink dwl ON dwl.DAGID = d.ID
      LEFT JOIN WalkinCustomer wc ON wc.ID = dwl.WalkinCustomerID
      LEFT JOIN ContractorM ct ON ct.ID = d.ContractorID
      LEFT JOIN StatusM s ON s.Id = d.StatusID
      ORDER BY d.ID DESC
    `)
    .all()
}

exports.getDAGById = (id) => {
  return db
    .prepare(`
      SELECT
        d.ID,
        d.CustomerID,
        d.TotalDAGCost,
        d.IsPaymentCompleted,
        c.CustomerCode,
        COALESCE(c.Name, wc.CustomerName) AS CustomerName,
        wc.CustomerPhone AS WalkinCustomerPhone,
        CASE WHEN dwl.WalkinCustomerID IS NOT NULL THEN 1 ELSE 0 END AS IsWalkinCustomer,
        d.ContractorID,
        ct.Name AS ContractorName,
        d.StatusID,
        s.StatusCode,
        s.StatusName,
        d.Comment,
        d.Date,
        d.DeliveryDate
      FROM DAG d
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGWalkinLink dwl ON dwl.DAGID = d.ID
      LEFT JOIN WalkinCustomer wc ON wc.ID = dwl.WalkinCustomerID
      LEFT JOIN ContractorM ct ON ct.ID = d.ContractorID
      LEFT JOIN StatusM s ON s.Id = d.StatusID
      WHERE d.ID = ?
    `)
    .get(id)
}

/**
 * Fetches a detailed DAG record by ID (including Customer and Contractor metadata).
 */
exports.getDetailedDAGById = (id) => {
  return exports.getDAGById(id)
}

exports.createDAG = (dag) => {
  const result = db
    .prepare(`
      INSERT INTO DAG (
        CustomerID,
        ContractorID,
        StatusID,
        Comment,
        Date,
        TotalDAGCost
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      dag.CustomerID === undefined || dag.CustomerID === null || dag.CustomerID === "" ? null : dag.CustomerID,
      null,
      dag.StatusID,
      dag.Comment,
      dag.Date,
      dag.TotalDAGCost === undefined ? null : dag.TotalDAGCost
    )

  return exports.getDAGById(result.lastInsertRowid)
}

exports.updateDAG = (id, dag) => {
  const result = db
    .prepare(`
      UPDATE DAG
      SET
        CustomerID = ?,
        ContractorID = ?,
        StatusID = ?,
        Comment = ?,
        Date = ?,
        TotalDAGCost = ?,
        IsPaymentCompleted = ?
      WHERE ID = ?
    `)
    .run(
      dag.CustomerID === undefined || dag.CustomerID === null || dag.CustomerID === "" ? null : dag.CustomerID,
      dag.ContractorID,
      dag.StatusID,
      dag.Comment,
      dag.Date,
      dag.TotalDAGCost === undefined ? null : dag.TotalDAGCost,
      dag.IsPaymentCompleted === undefined ? 0 : dag.IsPaymentCompleted,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGById(id)
}

exports.deleteDAG = (id) => {
  db.prepare("DELETE FROM DAGWalkinLink WHERE DAGID = ?").run(id)
  return db
    .prepare("DELETE FROM DAG WHERE ID = ?")
    .run(id)
}

/**
 * Narrow update for the delivery-date-to-arriving transition: only DeliveryDate
 * and StatusID change, so the rest of the row (costs, payment flag, contractor)
 * is left untouched by callers that must not go through the full updateDAG.
 */
exports.updateDAGDeliveryDate = (id, deliveryDate, statusId) => {
  const result = db
    .prepare("UPDATE DAG SET DeliveryDate = ?, StatusID = ? WHERE ID = ?")
    .run(deliveryDate, statusId, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGById(id)
}

exports.updateDAGStatus = (id, statusId) => {
  const result = db
    .prepare("UPDATE DAG SET StatusID = ? WHERE ID = ?")
    .run(statusId, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGById(id)
}
