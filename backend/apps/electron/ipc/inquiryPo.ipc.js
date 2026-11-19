const inquiryPoService = require("../../../packages/services/inquiryPoService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("inquiryPo:getByInquiryId", { permission: "po.view" }, (_event, inquiryId) =>
  inquiryPoService.getLinkedPosByInquiryId(inquiryId)
)

registerIpcHandler("inquiryPo:getByPoId", { permission: "po.view" }, (_event, poId) =>
  inquiryPoService.getLinkedInquiriesByPoId(poId)
)

registerServiceHandler("inquiryPo:link", { permission: "po.edit" }, inquiryPoService, "linkInquiryToPo")

registerServiceHandler("inquiryPo:unlink", { permission: "po.edit" }, inquiryPoService, "unlinkInquiryFromPo")
