const poTyresService = require("../../../packages/services/poTyresService")
const poTyreBatchesService = require("../../../packages/services/poTyreBatchesService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("poTyres:getAll", {}, () => poTyresService.getPoTyres())

registerIpcHandler("poTyres:getByPair", {}, (_event, poId, tyreId) => poTyresService.getPoTyre(poId, tyreId))

registerIpcHandler("poTyres:create", {}, (_event, payload) => poTyresService.createPoTyre(payload))

registerIpcHandler("poTyres:update", {}, (_event, poId, tyreId, payload) => poTyresService.updatePoTyre(poId, tyreId, payload))

registerIpcHandler("poTyres:updateStatus", {}, (_event, poTyresId, statusCode) => poTyresService.updatePoTyreStatus(poTyresId, statusCode))

registerIpcHandler("poTyres:delete", {}, (_event, poId, tyreId) => poTyresService.deletePoTyre(poId, tyreId))

registerIpcHandler("poTyres:getBatches", {}, (_event, poTyresId) => poTyreBatchesService.getPoTyreBatches(poTyresId))

registerIpcHandler("poTyres:getBatchStatusByPoId", {}, (_event, poId) => poTyreBatchesService.getBatchStatusByPoId(poId))

registerServiceHandler("poTyres:saveBatches", {}, poTyreBatchesService, "savePoTyreBatches")
