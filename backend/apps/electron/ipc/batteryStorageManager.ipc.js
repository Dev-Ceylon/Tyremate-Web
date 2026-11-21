const batteryStorageManagerService = require("../../../packages/services/batteryStorageManagerService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("batteryStorageManagers:getAll", {}, () =>
  batteryStorageManagerService.getBatteryStorageManagers()
)

registerIpcHandler("batteryStorageManagers:getByLocation", {}, (_event, locationId) =>
  batteryStorageManagerService.getBatteryStorageManagersByLocationId(locationId)
)

registerIpcHandler("batteryStorageManagers:getById", {}, (_event, id) =>
  batteryStorageManagerService.getBatteryStorageManagerById(id)
)

registerIpcHandler("batteryStorageManagers:getByBatteryId", {}, (_event, batteryId) =>
  batteryStorageManagerService.getBatteryStorageManagersByBatteryId(batteryId)
)

registerIpcHandler("batteryStorageManagers:getBatchesByBatteryId", {}, (_event, batteryId) =>
  batteryStorageManagerService.getBatchesByBatteryId(batteryId)
)

registerIpcHandler("batteryStorageManagers:getBatchesByStorageManagerId", {}, (_event, id) =>
  batteryStorageManagerService.getBatchesByStorageManagerId(id)
)

registerIpcHandler("batteryStorageManagers:getBatchesByLocation", {}, (_event, locationId) =>
  batteryStorageManagerService.getBatchesByLocationId(locationId)
)

registerIpcHandler("batteryStorageManagers:getLocationsByBranch", {}, (_event, branchId) =>
  batteryStorageManagerService.getStorageLocationsByBranch(branchId)
)

registerIpcHandler("batteryStorageManagers:getLocationById", {}, (_event, id) =>
  batteryStorageManagerService.getStorageLocationById(id)
)

registerServiceHandler(
  "batteryStorageManagers:create",
  {},
  batteryStorageManagerService,
  "createBatteryStorageManager"
)

registerServiceHandler(
  "batteryStorageManagers:update",
  {},
  batteryStorageManagerService,
  "updateBatteryStorageManager"
)

registerIpcHandler("batteryStorageManagers:delete", {}, (_event, id) =>
  batteryStorageManagerService.deleteBatteryStorageManager(id)
)

registerServiceHandler(
  "batteryStorageManagers:createBatch",
  {},
  batteryStorageManagerService,
  "createBatch"
)

registerIpcHandler("batteryStorageManagers:updateBatch", {}, (_event, id, payload) =>
  batteryStorageManagerService.updateBatch(id, payload)
)

registerIpcHandler("batteryStorageManagers:deleteBatch", {}, (_event, id) =>
  batteryStorageManagerService.deleteBatch(id)
)
