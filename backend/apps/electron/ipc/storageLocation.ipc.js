const storageLocationService = require("../../../packages/services/storageLocationService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("storageLocations:getAll", {}, () => storageLocationService.getStorageLocations())

registerIpcHandler("storageLocations:getByBranch", {}, (_event, branchId) => storageLocationService.getStorageLocationsByBranchId(branchId))

registerIpcHandler("storageLocations:getByLocationType", {}, (_event, locationTypeId) => storageLocationService.getStorageLocationsByLocationTypeId(locationTypeId))

registerIpcHandler("storageLocations:getById", {}, (_event, id) => storageLocationService.getStorageLocationById(id))

registerServiceHandler("storageLocations:create", {}, storageLocationService, "createStorageLocation")

registerServiceHandler("storageLocations:update", {}, storageLocationService, "updateStorageLocation")

registerServiceHandler("storageLocations:delete", {}, storageLocationService, "deleteStorageLocation")
