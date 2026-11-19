const dagGatePassService = require("../../../packages/services/dagGatePassService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("dagGatePass:getAll", {}, () => dagGatePassService.getDAGGatePasses())

registerIpcHandler("dagGatePass:getById", {}, (_event, id) => dagGatePassService.getDAGGatePassById(id))

registerIpcHandler("dagGatePass:getByDAGId", {}, (_event, dagId) => dagGatePassService.getDAGGatePassByDAGId(dagId))

registerIpcHandler("dagGatePass:create", {}, (_event, payload) => dagGatePassService.createDAGGatePass(payload))

registerIpcHandler("dagGatePass:update", {}, (_event, id, payload) => dagGatePassService.updateDAGGatePass(id, payload))

registerIpcHandler("dagGatePass:delete", {}, (_event, id) => dagGatePassService.deleteDAGGatePass(id))
