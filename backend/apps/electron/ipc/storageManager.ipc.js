const storageManagerService = require("../../../packages/services/storageManagerService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("storageManagers:getAll", {}, () => storageManagerService.getStorageManagers())

registerIpcHandler("storageManagers:getByLocation", {}, (_event, locationId) => storageManagerService.getStorageManagersByLocationId(locationId))

registerIpcHandler("storageManagers:getById", {}, (_event, id) => storageManagerService.getStorageManagerById(id))

registerIpcHandler("storageManagers:getByTyreId", {}, (_event, tyreId) => storageManagerService.getStorageManagersByTyreId(tyreId))

registerIpcHandler("storageManagers:getBatchesByTyreId", {}, (_event, tyreId) => storageManagerService.getBatchesByTyreId(tyreId))

registerIpcHandler("storageManagers:getBatchesByStorageManagerId", {}, (_event, id) => storageManagerService.getBatchesByStorageManagerId(id))

registerIpcHandler("storageManagers:getBatchesByLocation", {}, (_event, locationId) => storageManagerService.getBatchesByLocationId(locationId))

registerServiceHandler("storageManagers:create", {}, storageManagerService, "createStorageManager")

registerServiceHandler("storageManagers:update", {}, storageManagerService, "updateStorageManager")

registerIpcHandler("storageManagers:delete", {}, (_event, id) => storageManagerService.deleteStorageManager(id))
