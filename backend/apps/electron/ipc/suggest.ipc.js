const suggestService = require("../../../packages/services/suggestService")
const { registerIpcHandler } = require("./errorMiddleware")

const ENTITY_TABLE_MAP = {
  tyres: "TyreM",
  suppliers: "SupplierM",
  customers: "CustomerM",
  contractors: "ContractorM",
  branches: "BranchM",
  consumables: "ConsumableM",
  storageLocations: "StorageLocationM",
  storageLocationTypes: "StorageLocationTypeM",
  consumableLocations: "ConsumableLocationM",
  bankDetails: "Bankdetails",
}

for (const [entity, table] of Object.entries(ENTITY_TABLE_MAP)) {
  registerIpcHandler(`${entity}:suggest`, {}, (_event, field, query) =>
    suggestService.getDistinctValues(table, field, query),
  )
}
