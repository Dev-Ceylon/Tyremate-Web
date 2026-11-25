const invoiceService = require("../../../packages/services/invoiceService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

registerIpcHandler("invoice:getAll", { permission: "invoice.view" }, () =>
  invoiceService.getInvoices()
)

registerIpcHandler("invoice:getOutstanding", { permission: "invoice.view" }, () =>
  invoiceService.getOutstandingInvoices()
)

registerIpcHandler("invoice:getById", { permission: "invoice.view" }, (_event, id) =>
  invoiceService.getInvoiceById(id)
)

// registerServiceHandler so the audit ctx reaches the service and CreatedBy is
// attributed to the logged-in operator when an invoice is raised.
registerServiceHandler("invoice:generateFromSO", { permission: "invoice.create" }, invoiceService, "generateInvoiceFromSO")
registerServiceHandler("invoice:generateFromDAG", { permission: "invoice.create" }, invoiceService, "generateInvoiceFromDAG")
registerServiceHandler("invoice:generateFromOtherService", { permission: "invoice.create" }, invoiceService, "generateInvoiceFromOtherService")
registerServiceHandler("invoice:generateFromDelivery", { permission: "invoice.create" }, invoiceService, "generateInvoiceFromDelivery")

registerServiceHandler("invoice:createDirect", { permission: "invoice.create" }, invoiceService, "createDirectInvoice")

registerServiceHandler("invoice:update", { permission: "invoice.edit" }, invoiceService, "updateInvoice")

registerServiceHandler("invoice:cancel", { permission: "invoice.edit" }, invoiceService, "cancelInvoice")

registerServiceHandler("invoice:createCreditNote", { permission: "invoice.create" }, invoiceService, "createCreditNote")

registerServiceHandler("invoice:recordPayment", { permission: "invoice.create" }, invoiceService, "recordPaymentForInvoice")
