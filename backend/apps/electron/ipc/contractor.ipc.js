const contractorService = require("../../../packages/services/contractorService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("contractors:getAll", {}, () => contractorService.getContractors())

registerIpcHandler("contractors:getById", {}, (_event, contractorId) => contractorService.getContractorById(contractorId))

registerServiceHandler("contractors:create", {}, contractorService, "createContractor")

registerServiceHandler("contractors:update", {}, contractorService, "updateContractor")

registerServiceHandler("contractors:delete", {}, contractorService, "deleteContractor")
