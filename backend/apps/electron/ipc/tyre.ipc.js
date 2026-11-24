const tyreService = require("../../../packages/services/tyreService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("tyres:getAll", {}, () => tyreService.getTyres())

registerIpcHandler("tyres:getById", {}, (_event, tyreId) => tyreService.getTyreById(tyreId))

registerIpcHandler("tyres:getByIdWithAvailableQuantity", {}, (_event, tyreId) => tyreService.getTyreByIdWithAvailableQuantity(tyreId))

registerIpcHandler("tyres:getAllWithAvailableQuantity", {}, () => tyreService.getTyresWithAvailableQuantity())

registerIpcHandler("tyres:getLowStockCount", {}, () => tyreService.getLowStockCount())

registerServiceHandler("tyres:create", { permission: "inventory.manage" }, tyreService, "createTyre")

registerServiceHandler("tyres:update", { permission: "inventory.manage" }, tyreService, "updateTyre")

registerServiceHandler("tyres:delete", { permission: "inventory.manage" }, tyreService, "deleteTyre")
