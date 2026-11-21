const batteryService = require("../../../packages/services/batteryService")
const batterySupplierRepo = require("../../../packages/repositories/batterySupplierRepository")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("batteries:getAll", {}, () => batteryService.getBatteries())

registerIpcHandler("batteries:getById", {}, (_event, batteryId) =>
  batteryService.getBatteryById(batteryId)
)

registerIpcHandler("batteries:getByIdWithAvailableQuantity", {}, (_event, batteryId) =>
  batteryService.getBatteryByIdWithAvailableQuantity(batteryId)
)

registerIpcHandler("batteries:getAllWithAvailableQuantity", {}, () =>
  batteryService.getBatteriesWithAvailableQuantity()
)

registerIpcHandler("batteries:getLowStockCount", {}, () =>
  batteryService.getLowStockCount()
)

registerServiceHandler("batteries:create", {}, batteryService, "createBattery")

registerServiceHandler("batteries:update", {}, batteryService, "updateBattery")

registerServiceHandler("batteries:delete", {}, batteryService, "deleteBattery")

registerIpcHandler("batterySuppliers:getSuppliersByBatteryId", {}, (_event, batteryId) =>
  batterySupplierRepo.getSuppliersByBatteryId(batteryId)
)

registerIpcHandler("batterySuppliers:getBatteriesBySupplierId", {}, (_event, supplierId) =>
  batterySupplierRepo.getBatteriesBySupplierId(supplierId)
)

registerIpcHandler("batterySuppliers:getSupplierIdsByBatteryId", {}, (_event, batteryId) =>
  batterySupplierRepo.getSupplierIdsByBatteryId(batteryId)
)

registerIpcHandler("batterySuppliers:syncBatterySuppliers", {}, (_event, batteryId, supplierIds) =>
  batterySupplierRepo.syncBatterySuppliers(batteryId, supplierIds)
)
