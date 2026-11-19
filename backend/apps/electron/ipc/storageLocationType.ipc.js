const storageLocationTypeService = require("../../../packages/services/storageLocationTypeService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("storageLocationTypes:getAll", {}, () => storageLocationTypeService.getStorageLocationTypes())

registerIpcHandler("storageLocationTypes:getById", {}, (_event, id) => storageLocationTypeService.getStorageLocationTypeById(id))

registerServiceHandler("storageLocationTypes:create", {}, storageLocationTypeService, "createStorageLocationType")

registerServiceHandler("storageLocationTypes:update", {}, storageLocationTypeService, "updateStorageLocationType")

registerServiceHandler("storageLocationTypes:delete", {}, storageLocationTypeService, "deleteStorageLocationType")
