const poService = require("../../../packages/services/poService")
const poTyresSuppliersService = require("../../../packages/services/poTyresSuppliersService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("po:getAll", { permission: "po.view" }, (_event, category) => poService.getPOs(category))

registerIpcHandler("po:getPendingPOCount", { permission: "po.view" }, (_event, category) => poService.getPendingPOCount(category))

registerIpcHandler("po:getById", { permission: "po.view" }, (_event, id) => poService.getPOById(id))

registerServiceHandler("po:create", { permission: "po.create" }, poService, "createPO")

registerServiceHandler("po:createStandalone", { permission: "po.create" }, poService, "createStandalonePO")

registerServiceHandler("po:update", { permission: "po.edit" }, poService, "updatePO")

registerServiceHandler("po:updateStandalone", { permission: "po.edit" }, poService, "updateStandalonePO")

registerServiceHandler("po:delete", { permission: "po.delete" }, poService, "deletePO")

registerServiceHandler("po:updateSupplierApproval", { permission: "po.approve" }, poTyresSuppliersService, "updateApprovalById")

registerServiceHandler("po:updateSupplierDeliveryDate", { permission: "po.edit" }, poTyresSuppliersService, "updateDeliveryDatesById")

registerServiceHandler("po:setSupplierExpectedDeliveryDate", { permission: "po.edit" }, poTyresSuppliersService, "setExpectedDeliveryDate")

registerServiceHandler("po:setSupplierActualDeliveryDate", { permission: "po.edit" }, poTyresSuppliersService, "setActualDeliveryDate")

registerServiceHandler("po:updateStatus", { permission: "po.edit" }, poService, "updatePOStatus")

registerServiceHandler("po:allocateLocation", { permission: "po.edit" }, poService, "AllocatePoTyreLocation")
