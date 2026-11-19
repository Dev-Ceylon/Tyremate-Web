const soTyresService = require("../../../packages/services/soTyresService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("soTyres:getAll", {}, () => soTyresService.getSoTyres())

registerIpcHandler("soTyres:getByPair", {}, (_event, soId, tyreId) => soTyresService.getSoTyre(soId, tyreId))

registerIpcHandler("soTyres:create", {}, (_event, payload) => soTyresService.createSoTyre(payload))

registerIpcHandler("soTyres:update", {}, (_event, soId, tyreId, payload) => soTyresService.updateSoTyre(soId, tyreId, payload))

registerIpcHandler("soTyres:delete", {}, (_event, soId, tyreId) => soTyresService.deleteSoTyre(soId, tyreId))
