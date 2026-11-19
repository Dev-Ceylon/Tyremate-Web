const creditNoteService = require("../../../packages/services/creditNoteService")
const { registerIpcHandler, registerServiceHandler } = require("./errorMiddleware")

// Credit Note CRUD
registerServiceHandler("creditNote:create", { permission: "creditNote.create" }, creditNoteService, "createCreditNote")
registerServiceHandler("creditNote:generateFromSalesReturn", { permission: "creditNote.create" }, creditNoteService, "createCreditNoteFromSalesReturn")
registerServiceHandler("creditNote:approve", { permission: "creditNote.approve" }, creditNoteService, "approveCreditNote")
registerServiceHandler("creditNote:cancel", { permission: "creditNote.cancel" }, creditNoteService, "cancelCreditNote")

registerIpcHandler("creditNote:getById", { permission: "creditNote.view" }, (_event, id) => creditNoteService.getCreditNoteWithLines(id))
registerIpcHandler("creditNote:getByInvoiceId", { permission: "creditNote.view" }, (_event, invoiceId) => creditNoteService.getCreditNotesByInvoiceId(invoiceId))
registerIpcHandler("creditNote:getBySalesReturnId", { permission: "creditNote.view" }, (_event, salesReturnId) => creditNoteService.getCreditNotesBySalesReturnId(salesReturnId))
registerIpcHandler("creditNote:getCustomerCredit", { permission: "creditNote.view" }, (_event, customerId) => creditNoteService.getCustomerCredit(customerId))
registerIpcHandler("creditNote:getCustomerCreditTransactions", { permission: "creditNote.view" }, (_event, customerId, limit) => creditNoteService.getCustomerCreditTransactions(customerId, limit))

// Refund handlers
registerIpcHandler("creditNote:createRefund", { permission: "creditNote.refund" }, (_event, creditNoteId, data) => creditNoteService.createRefund({ ...data, CreditNoteID: creditNoteId }))
registerServiceHandler("creditNote:completeRefund", { permission: "creditNote.refund" }, creditNoteService, "completeRefund")
registerServiceHandler("creditNote:failRefund", { permission: "creditNote.refund" }, creditNoteService, "failRefund")
registerServiceHandler("creditNote:cancelRefund", { permission: "creditNote.refund" }, creditNoteService, "cancelRefund")

registerIpcHandler("creditNote:getRefundsByCreditNoteId", { permission: "creditNote.view" }, (_event, creditNoteId) => creditNoteService.getRefundsByCreditNoteId(creditNoteId))
registerIpcHandler("creditNote:getRefundsBySalesReturnId", { permission: "creditNote.view" }, (_event, salesReturnId) => creditNoteService.getRefundsBySalesReturnId(salesReturnId))
registerIpcHandler("creditNote:getPendingRefunds", { permission: "creditNote.view" }, (_event) => creditNoteService.getPendingRefunds())
registerIpcHandler("creditNote:getRefundMethods", { permission: "creditNote.view" }, (_event) => creditNoteService.getRefundMethods())

// Store Credit
registerServiceHandler("creditNote:issueStoreCredit", { permission: "creditNote.credit" }, creditNoteService, "issueStoreCredit")
registerServiceHandler("creditNote:applyCustomerCredit", { permission: "creditNote.credit" }, creditNoteService, "applyCustomerCredit")
