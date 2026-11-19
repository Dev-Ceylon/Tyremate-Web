const db = require("../database/connection")

exports.getAllConsumables = () => {
  return db
    .prepare(`
      SELECT
        Id,
        Name,
        Category,
        Unit,
        CostPrice,
        ReorderLevel,
        IsActive,
        CreatedDate,
        ModifiedDate
      FROM ConsumableM
      ORDER BY Id DESC
    `)
    .all()
}

exports.getConsumableById = (id) => {
  return db
    .prepare(`
      SELECT
        Id,
        Name,
        Category,
        Unit,
        CostPrice,
        ReorderLevel,
        IsActive,
        CreatedDate,
        ModifiedDate
      FROM ConsumableM
      WHERE Id = ?
    `)
    .get(id)
}

exports.getConsumablesWithStock = () => {
  return db
    .prepare(`
      SELECT c.Id, c.Name, c.Category, c.Unit, c.CostPrice,
        c.ReorderLevel, c.IsActive, c.CreatedDate, c.ModifiedDate,
        COALESCE(SUM(csm.Qty), 0) AS AvailableQty
      FROM ConsumableM c
      INNER JOIN ConsumableStorageManager csm ON c.Id = csm.ConsumableID
      WHERE csm.Qty > 0
      GROUP BY c.Id
      ORDER BY c.Name ASC
    `)
    .all()
}

exports.getConsumablesByCategory = (category) => {
  return db
    .prepare(`
      SELECT
        Id,
        Name,
        Category,
        Unit,
        CostPrice,
        ReorderLevel,
        IsActive,
        CreatedDate,
        ModifiedDate
      FROM ConsumableM
      WHERE Category = ? AND IsActive = 1
      ORDER BY Name ASC
    `)
    .all(category)
}

exports.createConsumable = (consumable) => {
  const result = db
    .prepare(`
      INSERT INTO ConsumableM (
        Name,
        Category,
        Unit,
        CostPrice,
        ReorderLevel,
        IsActive
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      consumable.Name,
      consumable.Category,
      consumable.Unit,
      consumable.CostPrice,
      consumable.ReorderLevel,
      consumable.IsActive
    )

  return exports.getConsumableById(result.lastInsertRowid)
}

exports.updateConsumable = (id, consumable) => {
  const result = db
    .prepare(`
      UPDATE ConsumableM
      SET
        Name = ?,
        Category = ?,
        Unit = ?,
        CostPrice = ?,
        ReorderLevel = ?,
        IsActive = ?,
        ModifiedDate = CURRENT_TIMESTAMP
      WHERE Id = ?
    `)
    .run(
      consumable.Name,
      consumable.Category,
      consumable.Unit,
      consumable.CostPrice,
      consumable.ReorderLevel,
      consumable.IsActive,
      id
    )

  if (result.changes === 0) {
    return null
  }

  return exports.getConsumableById(id)
}

exports.getLowStockCount = () => {
  return db
    .prepare(`
      SELECT COUNT(*) AS Count
      FROM (
        SELECT c.Id, COALESCE(SUM(csm.Qty), 0) AS AvailableQty, COALESCE(c.ReorderLevel, 0) AS ReorderLevel
        FROM ConsumableM c
        LEFT JOIN ConsumableStorageManager csm ON csm.ConsumableID = c.Id
        WHERE c.IsActive = 1
        GROUP BY c.Id
      )
      WHERE AvailableQty <= ReorderLevel
    `)
    .get()
}

exports.deleteConsumable = (id) => {
  return db
    .prepare("DELETE FROM ConsumableM WHERE Id = ?")
    .run(id)
}
