const inquirySoService = require("../../../packages/services/inquirySoService")
const { registerServiceHandler } = require("./errorMiddleware")

registerServiceHandler(
  "inquirySo:getByInquiryId",
  { permission: "so.view" },
  inquirySoService,
  "getLinkedSosByInquiryId"
)

registerServiceHandler(
  "inquirySo:getBySoId",
  { permission: "so.view" },
  inquirySoService,
  "getLinkedInquiriesBySoId"
)

registerServiceHandler(
  "inquirySo:link",
  { permission: "so.edit" },
  inquirySoService,
  "linkInquiryToSo"
)

registerServiceHandler(
  "inquirySo:unlink",
  { permission: "so.edit" },
  inquirySoService,
  "unlinkInquiryFromSo"
)
