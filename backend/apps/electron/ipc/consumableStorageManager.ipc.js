const consumableStorageManagerService = require("../../../packages/services/consumableStorageManagerService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("consumableStorageManagers:getAll", {}, () => consumableStorageManagerService.getConsumableStorageManagers())

registerIpcHandler("consumableStorageManagers:getByLocation", {}, (_event, locationId) => consumableStorageManagerService.getConsumableStorageManagersByLocationId(locationId))

registerIpcHandler("consumableStorageManagers:getById", {}, (_event, id) => consumableStorageManagerService.getConsumableStorageManagerById(id))

registerIpcHandler("consumableStorageManagers:create", {}, (_event, payload) => consumableStorageManagerService.createConsumableStorageManager(payload))

registerIpcHandler("consumableStorageManagers:update", {}, (_event, id, payload) => consumableStorageManagerService.updateConsumableStorageManager(id, payload))

registerIpcHandler("consumableStorageManagers:delete", {}, (_event, id) => consumableStorageManagerService.deleteConsumableStorageManager(id))
