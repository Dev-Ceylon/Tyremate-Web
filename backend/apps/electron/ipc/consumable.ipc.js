const consumableService = require("../../../packages/services/consumableService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("consumables:getAll", {}, () => consumableService.getConsumables())

registerIpcHandler("consumables:getById", {}, (_event, id) => consumableService.getConsumableById(id))

registerIpcHandler("consumables:getWithStock", {}, () => consumableService.getConsumablesWithStock())

registerIpcHandler("consumables:getLowStockCount", {}, () => consumableService.getLowStockCount())

registerIpcHandler("consumables:getByCategory", {}, (_event, category) => consumableService.getConsumablesByCategory(category))

registerServiceHandler("consumables:create", {}, consumableService, "createConsumable")

registerServiceHandler("consumables:update", {}, consumableService, "updateConsumable")

registerServiceHandler("consumables:delete", {}, consumableService, "deleteConsumable")
