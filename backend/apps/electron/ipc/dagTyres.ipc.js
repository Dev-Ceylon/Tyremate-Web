const dagTyresService = require("../../../packages/services/dagTyresService")
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler("dagTyres:getAll", {}, () => dagTyresService.getDAGTyres())

registerIpcHandler("dagTyres:getByDagId", {}, (_event, dagId) => dagTyresService.getDAGTyresByDAGId(dagId))

registerIpcHandler("dagTyres:getById", {}, (_event, id) => dagTyresService.getDAGTyreById(id))

registerIpcHandler("dagTyres:create", {}, (_event, payload) => dagTyresService.createDAGTyre(payload))

registerIpcHandler("dagTyres:update", {}, (_event, id, payload) => dagTyresService.updateDAGTyre(id, payload))

registerIpcHandler("dagTyres:delete", {}, (_event, id) => dagTyresService.deleteDAGTyre(id))
