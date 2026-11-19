const manufactureOrderService = require("../../../packages/services/manufactureOrderService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("manufactureOrders:getAll", {}, () => manufactureOrderService.getManufactureOrders())

registerIpcHandler("manufactureOrders:getById", {}, (_event, id) => manufactureOrderService.getManufactureOrderById(id))

registerIpcHandler("manufactureOrders:create", {}, (_event, payload) => manufactureOrderService.createManufactureOrder(payload))

registerIpcHandler("manufactureOrders:update", {}, (_event, id, payload) => manufactureOrderService.updateManufactureOrder(id, payload))

registerIpcHandler("manufactureOrders:delete", {}, (_event, id) => manufactureOrderService.deleteManufactureOrder(id))
