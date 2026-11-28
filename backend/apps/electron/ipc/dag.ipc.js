const dagService = require("../../../packages/services/dagService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("dag:getAll", { permission: "dag.view" }, () => dagService.getDAGs())

registerIpcHandler("dag:getById", { permission: "dag.view" }, (_event, id) => dagService.getDAGById(id))

registerIpcHandler("dag:getDetailedById", { permission: "dag.view" }, (_event, id) => dagService.getDetailedDAGById(id))

registerIpcHandler("dag:processPayments", { permission: "dag.create" }, (_event, id, payload) => dagService.processPayments(id, payload))

// A take records the customer collecting selected serials together with the
// mandatory payment for exactly those. registerServiceHandler so the audit ctx
// reaches the service and SoldBy is attributed to the logged-in operator.
registerServiceHandler("dag:sellTyres", { permission: "dag.edit" }, dagService, "sellDAGTyres")

registerIpcHandler("dag:create", { permission: "dag.create" }, (_event, payload) => dagService.createDAG(payload))

registerServiceHandler("dag:createWithTyres", { permission: "dag.create" }, dagService, "createDAGWithTyres")

registerIpcHandler("dag:updateTyreSerialCost", { permission: "dag.edit" }, (_event, id, cost) => dagService.updateDAGTyreSerialCost(id, cost))

registerIpcHandler("dag:update", { permission: "dag.edit" }, (_event, id, payload) => dagService.updateDAG(id, payload))

registerIpcHandler("dag:delete", { permission: "dag.delete" }, (_event, id) => dagService.deleteDAG(id))

registerIpcHandler("dag:updateStatus", { permission: "dag.edit" }, (_event, id, statusCode) => dagService.updateDAGStatus(id, statusCode))

registerIpcHandler("dag:markArrived", { permission: "dag.edit" }, (_event, id) => dagService.markDAGArrived(id))

registerIpcHandler("dag:markArriving", { permission: "dag.edit" }, (_event, id, deliveryDate) => dagService.markDAGArriving(id, deliveryDate))

registerIpcHandler("dag:updateDeliveryDate", { permission: "dag.edit" }, (_event, id, deliveryDate) => dagService.updateDAGDeliveryDate(id, deliveryDate))

// Kept on registerServiceHandler so the audit ctx reaches the service and the
// whole gate-pass path stays attributable even though issueGatePass itself
// currently ignores it. The contractor is derived from the approved allocation
// in dagService.issueGatePass rather than passed in, so a gate pass can never
// be issued against an unapproved contractor.
registerServiceHandler("dag:issueGatePass", { permission: "dag.create" }, dagService, "issueGatePass")

// Step 1 of 2: allocate the contractor. Creates a pending approval row and
// attributes nothing to the operator, so plain registerIpcHandler is enough.
// Split from dag:updateContractorApproval below to mirror PO supplier
// allocation, where the allocation and the approval are separate operations.
registerIpcHandler("dag:assignContractor", { permission: "dag.approve" }, (_event, id, payload) => dagService.assignContractor(id, payload))

// Step 2 of 2: record the approve/reject decision. Needs the audit ctx so the
// deciding operator is attributed via CapturedBy, hence registerServiceHandler.
registerServiceHandler("dag:updateContractorApproval", { permission: "dag.approve" }, dagService, "updateDAGContractorApproval")

registerIpcHandler("dag:getContractorApprovals", { permission: "dag.view" }, (_event, id) => dagService.getDAGContractorApprovals(id))

registerServiceHandler("dag:completeChequePayment", { permission: "dag.create" }, dagService, "completeChequePayment")
