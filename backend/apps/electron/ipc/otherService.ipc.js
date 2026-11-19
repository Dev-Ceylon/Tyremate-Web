const otherServiceService = require("../../../packages/services/otherServiceService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("otherServices:getAll", { permission: "other.view" }, () => otherServiceService.getOtherServices())

registerIpcHandler("otherServices:getById", { permission: "other.view" }, (_event, osId) => otherServiceService.getOtherServiceById(osId))

registerServiceHandler("otherServices:create", { permission: "other.create" }, otherServiceService, "createOtherService")

registerServiceHandler("otherServices:update", { permission: "other.edit" }, otherServiceService, "updateOtherService")

registerServiceHandler("otherServices:delete", { permission: "other.delete" }, otherServiceService, "deleteOtherService")

registerServiceHandler("otherServices:makeAPayment", { permission: "other.create" }, otherServiceService, "makeAPaymentForOS")

registerServiceHandler("otherServices:completeChequePayment", { permission: "other.create" }, otherServiceService, "completeChequePayment")

registerServiceHandler("otherServices:complete", { permission: "other.approve" }, otherServiceService, "completeOtherService")
