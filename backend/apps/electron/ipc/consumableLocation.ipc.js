const consumableLocationService = require("../../../packages/services/consumableLocationService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("consumableLocations:getAll", {}, () => consumableLocationService.getConsumableLocations())

registerIpcHandler("consumableLocations:getByBranch", {}, (_event, branchId) => consumableLocationService.getConsumableLocationsByBranchId(branchId))

registerIpcHandler("consumableLocations:getById", {}, (_event, id) => consumableLocationService.getConsumableLocationById(id))

registerServiceHandler("consumableLocations:create", {}, consumableLocationService, "createConsumableLocation")

registerServiceHandler("consumableLocations:update", {}, consumableLocationService, "updateConsumableLocation")

registerServiceHandler("consumableLocations:delete", {}, consumableLocationService, "deleteConsumableLocation")
