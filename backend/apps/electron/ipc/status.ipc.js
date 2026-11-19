const statusService = require("../../../packages/services/statusService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("statuses:getAll", {}, () => statusService.getStatuses())

registerIpcHandler("statuses:getById", {}, (_event, id) => statusService.getStatusById(id))

registerIpcHandler("statuses:getByCode", {}, (_event, statusCode) => statusService.getStatusByCode(statusCode))
