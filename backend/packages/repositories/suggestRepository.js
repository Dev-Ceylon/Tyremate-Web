const db = require("../database/connection")

const TABLE_FIELDS = {
  TyreM: new Set(["Brand", "Size", "Pattern", "LL_SR", "PR", "SideWall"]),
  BatteryM: new Set(["Brand", "Model", "Series", "Capacity", "Voltage", "Technology", "Application"]),
  SupplierM: new Set(["Name"]),
  SupplierTypeM: new Set(["TypeCode", "TypeName"]),
  CustomerM: new Set(["Name"]),
  ContractorM: new Set(["Name"]),
  BranchM: new Set(["BranchName"]),
  ConsumableM: new Set(["Name", "Unit"]),
  StorageLocationM: new Set(["LocationName"]),
  StorageLocationTypeM: new Set(["LocationTypeCode", "LocationTypeName"]),
  ConsumableLocationM: new Set(["LocationName"]),
  Bankdetails: new Set(["BankName", "AccountName", "Branch"]),
}

function escapeLike(value) {
  return value.replace(/%/g, "%%").replace(/_/g, "\\_")
}

exports.getDistinctValues = (table, field, query) => {
  const allowed = TABLE_FIELDS[table]
  if (!allowed) {
    throw new Error(`Invalid table: ${table}`)
  }
  if (!allowed.has(field)) {
    throw new Error(`Invalid field ${field} for table ${table}`)
  }

  return db
    .prepare(`SELECT DISTINCT ${field} AS Value FROM ${table} WHERE ${field} LIKE ? ESCAPE '\\' ORDER BY ${field} LIMIT 8`)
    .all(`%${escapeLike(query)}%`)
    .map((row) => row.Value)
}
