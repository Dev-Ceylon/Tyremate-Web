const salesTargetService = require("../../../packages/services/salesTargetService")
const { registerServiceHandler } = require("./errorMiddleware")

registerServiceHandler(
  "salesTarget:getAll",
  { permission: "targets.view_own" },
  salesTargetService,
  "getAllTargets"
)

registerServiceHandler(
  "salesTarget:getById",
  { permission: "targets.view_own" },
  salesTargetService,
  "getTargetById"
)

registerServiceHandler(
  "salesTarget:getMyActiveTargets",
  { permission: "targets.view_own" },
  salesTargetService,
  "getMyActiveTargets"
)

registerServiceHandler(
  "salesTarget:create",
  { permission: "targets.manage" },
  salesTargetService,
  "createTarget"
)

registerServiceHandler(
  "salesTarget:update",
  { permission: "targets.manage" },
  salesTargetService,
  "updateTarget"
)

registerServiceHandler(
  "salesTarget:delete",
  { permission: "targets.manage" },
  salesTargetService,
  "deleteTarget"
)

registerServiceHandler(
  "salesTarget:getSalesReps",
  { permission: "targets.manage" },
  salesTargetService,
  "getSalesReps"
)
