const salesReturnService = require("../../../packages/services/salesReturnService")
const quarantineService = require("../../../packages/services/quarantineService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerServiceHandler("salesReturn:createRequest", { permission: "so.create" }, salesReturnService, "createRequest")
registerServiceHandler("salesReturn:inspectAndApprove", { permission: "so.edit" }, salesReturnService, "inspectAndApprove")
registerServiceHandler("salesReturn:receiveToQuarantine", { permission: "so.edit" }, salesReturnService, "receiveToQuarantine")
registerServiceHandler("salesReturn:transferToSaleable", { permission: "so.edit" }, salesReturnService, "transferToSaleable")
registerServiceHandler("salesReturn:moveToScrapOrSupplier", { permission: "so.edit" }, salesReturnService, "moveToScrapOrSupplier")
registerServiceHandler("salesReturn:reject", { permission: "so.edit" }, salesReturnService, "reject")
registerServiceHandler("salesReturn:linkExchangeSalesOrder", { permission: "so.edit" }, salesReturnService, "linkExchangeSalesOrder")

registerIpcHandler("salesReturn:getById", { permission: "so.view" }, (_event, salesReturnId) => salesReturnService.getSalesReturnById(salesReturnId))
registerIpcHandler("salesReturn:list", { permission: "so.view" }, () => salesReturnService.getAllSalesReturns())
registerIpcHandler("salesReturn:getDetails", { permission: "so.view" }, (_event, salesReturnId) => salesReturnService.getSalesReturnDetails(salesReturnId))

registerServiceHandler("quarantine:receiveToQuarantine", { permission: "so.edit" }, quarantineService, "receiveToQuarantine")
registerServiceHandler("quarantine:transferToSaleable", { permission: "so.edit" }, quarantineService, "transferToSaleable")
registerServiceHandler("quarantine:moveToScrapOrSupplier", { permission: "so.edit" }, quarantineService, "moveToScrapOrSupplier")
