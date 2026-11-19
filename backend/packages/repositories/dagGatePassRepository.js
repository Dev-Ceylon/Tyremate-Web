const db = require("../database/connection")

exports.getAllDAGGatePasses = () => {
  return db
    .prepare(`
      SELECT
        dgp.ID,
        dgp.DAGID
      FROM DAGGatePass dgp
      ORDER BY dgp.ID DESC
    `)
    .all()
}

exports.getAllDAGGatePassesWithDetails = () => {
  return db
    .prepare(`
      SELECT
        dgp.ID,
        dgp.DAGID,
        d.CustomerID,
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
      FROM DAGGatePass dgp
      JOIN DAG d ON d.ID = dgp.DAGID
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGWalkinLink dwl ON dwl.DAGID = d.ID
      LEFT JOIN WalkinCustomer wc ON wc.ID = dwl.WalkinCustomerID
      LEFT JOIN ContractorM ct ON ct.ID = d.ContractorID
      LEFT JOIN StatusM s ON s.Id = d.StatusID
      ORDER BY dgp.ID DESC
    `)
    .all()
}

exports.getDAGGatePassById = (id) => {
  return db
    .prepare(`
      SELECT
        dgp.ID,
        dgp.DAGID,
        d.CustomerID,
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
      FROM DAGGatePass dgp
      JOIN DAG d ON d.ID = dgp.DAGID
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGWalkinLink dwl ON dwl.DAGID = d.ID
      LEFT JOIN WalkinCustomer wc ON wc.ID = dwl.WalkinCustomerID
      LEFT JOIN ContractorM ct ON ct.ID = d.ContractorID
      LEFT JOIN StatusM s ON s.Id = d.StatusID
      WHERE dgp.ID = ?
    `)
    .get(id)
}

exports.getDAGGatePassByDAGId = (dagId) => {
  return db
    .prepare(`
      SELECT
        dgp.ID,
        dgp.DAGID,
        d.CustomerID,
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
      FROM DAGGatePass dgp
      JOIN DAG d ON d.ID = dgp.DAGID
      LEFT JOIN CustomerM c ON c.CustomerID = d.CustomerID
      LEFT JOIN DAGWalkinLink dwl ON dwl.DAGID = d.ID
      LEFT JOIN WalkinCustomer wc ON wc.ID = dwl.WalkinCustomerID
      LEFT JOIN ContractorM ct ON ct.ID = d.ContractorID
      LEFT JOIN StatusM s ON s.Id = d.StatusID
      WHERE dgp.DAGID = ?
    `)
    .get(dagId)
}

exports.createDAGGatePass = (dagGatePass) => {
  const result = db
    .prepare(`
      INSERT INTO DAGGatePass (DAGID)
      VALUES (?)
    `)
    .run(dagGatePass.DAGID)

  return exports.getDAGGatePassById(result.lastInsertRowid)
}

exports.updateDAGGatePass = (id, dagGatePass) => {
  const result = db
    .prepare(`
      UPDATE DAGGatePass
      SET DAGID = ?
      WHERE ID = ?
    `)
    .run(dagGatePass.DAGID, id)

  if (result.changes === 0) {
    return null
  }

  return exports.getDAGGatePassById(id)
}

exports.deleteDAGGatePass = (id) => {
  return db
    .prepare("DELETE FROM DAGGatePass WHERE ID = ?")
    .run(id)
}

exports.deleteDAGGatePassByDAGId = (dagId) => {
  return db
    .prepare("DELETE FROM DAGGatePass WHERE DAGID = ?")
    .run(dagId)
}
