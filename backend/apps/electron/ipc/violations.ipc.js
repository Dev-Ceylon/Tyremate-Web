const soPolicyViolationService = require("../../../packages/services/soPolicyViolationService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

// Violations - List and Get
registerIpcHandler("violations:getAll", { permission: "violations.view" }, (_event, filters) => soPolicyViolationService.getSOPolicyViolations(filters))
registerIpcHandler("violations:getPending", { permission: "violations.view" }, (_event) => soPolicyViolationService.getPendingSOPolicyViolations())
registerIpcHandler("violations:getById", { permission: "violations.view" }, (_event, id) => soPolicyViolationService.getSOPolicyViolationById(id))

// Violations - By SO ID
registerIpcHandler("violations:getBySoId", { permission: "violations.view" }, (_event, soId) => soPolicyViolationService.getSOPolicyViolationGroupsBySoId(soId))
registerIpcHandler("violations:getByTyreId", { permission: "violations.view" }, (_event, soTyreId) => soPolicyViolationService.getSOPolicyViolationsByTyreId(soTyreId))

// Violations - DOTs
registerIpcHandler("violations:getDOTsByViolationId", { permission: "violations.view" }, (_event, violationId) => {
  // We need to get the violation first to get its ID, then get DOTs
  // For now, we'll need a method to get DOTs by violation ID
  // This can be added to the service if needed
  return soPolicyViolationService.getSOPolicyViolationById(violationId)
})

// Violations - Approve/Reject
registerServiceHandler("violations:approve", { permission: "violations.approve" }, soPolicyViolationService, "approveSOPolicyViolation")
registerServiceHandler("violations:reject", { permission: "violations.approve" }, soPolicyViolationService, "deleteSOPolicyViolation")

// Violations - Create
registerServiceHandler("violations:create", { permission: "violations.create" }, soPolicyViolationService, "createSOPolicyViolation")

// Violations - Name lookup
registerIpcHandler("violations:getName", { permission: "violations.view" }, (_event, code) => soPolicyViolationService.getPolicyViolationName(code))