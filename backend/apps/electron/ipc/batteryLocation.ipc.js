const batteryLocationService = require("../../../packages/services/batteryLocationService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("batteryLocations:getAll", {}, () => batteryLocationService.getBatteryLocations())

registerIpcHandler("batteryLocations:getByBranch", {}, (_event, branchId) =>
  batteryLocationService.getBatteryLocationsByBranchId(branchId)
)

registerIpcHandler("batteryLocations:getById", {}, (_event, id) =>
  batteryLocationService.getBatteryLocationById(id)
)

registerServiceHandler("batteryLocations:create", {}, batteryLocationService, "createBatteryLocation")

registerServiceHandler("batteryLocations:update", {}, batteryLocationService, "updateBatteryLocation")

registerServiceHandler("batteryLocations:delete", {}, batteryLocationService, "deleteBatteryLocation")
