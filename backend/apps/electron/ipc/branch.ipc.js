const branchService = require("../../../packages/services/branchService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("branches:getAll", {}, () => branchService.getBranches())

registerIpcHandler("branches:getById", {}, (_event, id) => branchService.getBranchById(id))

registerServiceHandler("branches:create", {}, branchService, "createBranch")

registerServiceHandler("branches:update", {}, branchService, "updateBranch")

registerServiceHandler("branches:delete", {}, branchService, "deleteBranch")
