const soService = require("../../../packages/services/soService")
const soTyresService = require("../../../packages/services/soTyresService")
const soAllocationRepo = require("../../../packages/repositories/soTyreStorageAllocationRepository")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("so:getAll", { permission: "so.view" }, () => soService.getSOs())
registerIpcHandler("so:getAllocationsBySoTyreId", { permission: "so.view" }, (_event, soTyreId) => soAllocationRepo.getAllocationsBySoTyreId(soTyreId))

registerIpcHandler("so:getTodaySalesSummary", { permission: "so.view" }, (_event, date) => soService.getTodaySalesSummary(date))

registerIpcHandler("so:getSalesTrendSummary", { permission: "so.view" }, (_event, fromDate, toDate) => soService.getSalesTrendSummary(fromDate, toDate))

registerIpcHandler("so:getById", { permission: "so.view" }, (_event, soId) => soService.getSOById(soId))

registerIpcHandler("so:getTyresBySoId", { permission: "so.view" }, (_event, soId) => soTyresService.getSoTyresBySoId(soId))

registerIpcHandler("so:getWarehouseDispatch", { permission: "so.view" }, (_event, soId) => soService.getWarehouseDispatch(soId))
registerIpcHandler("so:getDeliveryWarehouseDispatch", { permission: "so.view" }, (_event, soId, deliveryId) => soService.getDeliveryWarehouseDispatch(soId, deliveryId))

registerIpcHandler("so:getDeliveryProgress", { permission: "so.view" }, (_event, soId) => soService.getDeliveryProgress(soId))

registerIpcHandler("so:getDeliveries", { permission: "so.view" }, (_event, soId) => soService.getDeliveries(soId))

registerIpcHandler("so:getDeliveryById", { permission: "so.view" }, (_event, deliveryId) => soService.getDeliveryById(deliveryId))
registerIpcHandler("so:getGatePasses", { permission: "so.view" }, () => soService.getSOGatePasses())
registerIpcHandler("so:getPendingGatePasses", { permission: "so.view" }, () => soService.getPendingSOGatePasses())
registerServiceHandler("so:recordDelivery", { permission: "so.edit" }, soService, "recordDelivery")
registerServiceHandler("so:issueDeliveryGatePass", { permission: "so.edit" }, soService, "issueDeliveryGatePass")

registerServiceHandler("so:create", { permission: "so.create" }, soService, "createSO")

registerServiceHandler("so:createWithAutoPO", { permission: "so.create" }, soService, "createSOWithAutoPO")

registerServiceHandler("so:update", { permission: "so.edit" }, soService, "updateSO")

registerServiceHandler("so:delete", { permission: "so.delete" }, soService, "deleteSO")

registerServiceHandler("so:makeAPayment", { permission: "so.create" }, soService, "makeAPaymentForSo")

registerServiceHandler("so:completeChequePayment", { permission: "so.create" }, soService, "completeChequePayment")

registerIpcHandler("so:createReturn", { permission: "so.edit" }, (_event, soId, payload) => require("../../../packages/services/salesReturnService").createLegacyRequest(soId, payload))
registerServiceHandler("so:getReturnsBySoId", { permission: "so.view" }, soService, "getReturnsBySoId")

registerServiceHandler("so:complete", { permission: "so.approve" }, soService, "completeSO")
