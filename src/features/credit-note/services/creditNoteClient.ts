import type { CreditNotePayload } from "../models/creditNote"

export const creditNoteClient = {
  // Credit Note CRUD
  createCreditNote(data: CreditNotePayload): Promise<any> {
    return window.api.creditNote.create(data)
  },

  generateFromSalesReturn(salesReturnId: number): Promise<any> {
    return window.api.creditNote.generateFromSalesReturn(salesReturnId)
  },

  approve(id: number): Promise<any> {
    return window.api.creditNote.approve(id)
  },

  cancel(id: number, reason: string): Promise<any> {
    return window.api.creditNote.cancel(id, reason)
  },

  getById(id: number): Promise<any> {
    return window.api.creditNote.getById(id)
  },

  getByInvoiceId(invoiceId: number): Promise<any> {
    return window.api.creditNote.getByInvoiceId(invoiceId)
  },

  getBySalesReturnId(salesReturnId: number): Promise<any> {
    return window.api.creditNote.getBySalesReturnId(salesReturnId)
  },

  // Refund
  createRefund(creditNoteId: number, data: any): Promise<any> {
    return window.api.creditNote.createRefund(creditNoteId, data)
  },

  completeRefund(refundId: number): Promise<any> {
    return window.api.creditNote.completeRefund(refundId)
  },

  failRefund(refundId: number, reason: string): Promise<any> {
    return window.api.creditNote.failRefund(refundId, reason)
  },

  cancelRefund(refundId: number, reason: string): Promise<any> {
    return window.api.creditNote.cancelRefund(refundId, reason)
  },

  getRefundsByCreditNoteId(creditNoteId: number): Promise<any> {
    return window.api.creditNote.getRefundsByCreditNoteId(creditNoteId)
  },

  getRefundsBySalesReturnId(salesReturnId: number): Promise<any> {
    return window.api.creditNote.getRefundsBySalesReturnId(salesReturnId)
  },

  getRefundMethods(): Promise<Array<{ MethodId: number; MethodCode: string; MethodName: string }>> {
    return window.api.creditNote.getRefundMethods()
  },

  getPendingRefunds(): Promise<any> {
    return window.api.creditNote.getPendingRefunds()
  },

  // Store Credit
  issueStoreCredit(creditNoteId: number): Promise<any> {
    return window.api.creditNote.issueStoreCredit(creditNoteId)
  },

  applyCustomerCredit(customerId: number, invoiceId: number, amount: number): Promise<any> {
    return window.api.creditNote.applyCustomerCredit(customerId, invoiceId, amount)
  },

  getCustomerCredit(customerId: number): Promise<any> {
    return window.api.creditNote.getCustomerCredit(customerId)
  },

  getCustomerCreditTransactions(customerId: number, limit?: number): Promise<any> {
    return window.api.creditNote.getCustomerCreditTransactions(customerId, limit)
  },
}

export const creditNoteService = {
  async createCreditNote(data: any): Promise<any> {
    return creditNoteClient.createCreditNote(data)
  },

  async generateFromSalesReturn(salesReturnId: number): Promise<any> {
    return creditNoteClient.generateFromSalesReturn(salesReturnId)
  },

  async approve(id: number): Promise<any> {
    return creditNoteClient.approve(id)
  },

  async cancel(id: number, reason: string): Promise<any> {
    return creditNoteClient.cancel(id, reason)
  },

  async getById(id: number): Promise<any> {
    return creditNoteClient.getById(id)
  },

  async getByInvoiceId(invoiceId: number): Promise<any> {
    return creditNoteClient.getByInvoiceId(invoiceId)
  },

  async getBySalesReturnId(salesReturnId: number): Promise<any> {
    return creditNoteClient.getBySalesReturnId(salesReturnId)
  },

  async createRefund(creditNoteId: number, data: any): Promise<any> {
    return creditNoteClient.createRefund(creditNoteId, data)
  },

  async completeRefund(refundId: number): Promise<any> {
    return creditNoteClient.completeRefund(refundId)
  },

  async failRefund(refundId: number, reason: string): Promise<any> {
    return creditNoteClient.failRefund(refundId, reason)
  },

  async cancelRefund(refundId: number, reason: string): Promise<any> {
    return creditNoteClient.cancelRefund(refundId, reason)
  },

  async getRefundsByCreditNoteId(creditNoteId: number): Promise<any> {
    return creditNoteClient.getRefundsByCreditNoteId(creditNoteId)
  },

  async getRefundsBySalesReturnId(salesReturnId: number): Promise<any> {
    return creditNoteClient.getRefundsBySalesReturnId(salesReturnId)
  },

  async getRefundMethods(): Promise<Array<{ MethodId: number; MethodCode: string; MethodName: string }>> {
    return creditNoteClient.getRefundMethods()
  },

  async getPendingRefunds(): Promise<any> {
    return creditNoteClient.getPendingRefunds()
  },

  async issueStoreCredit(creditNoteId: number): Promise<any> {
    return creditNoteClient.issueStoreCredit(creditNoteId)
  },

  async getCustomerCredit(customerId: number): Promise<any> {
    return creditNoteClient.getCustomerCredit(customerId)
  },

  async getCustomerCreditTransactions(customerId: number, limit?: number): Promise<any> {
    return creditNoteClient.getCustomerCreditTransactions(customerId, limit)
  },

  async applyCustomerCredit(customerId: number, invoiceId: number, amount: number): Promise<any> {
    return creditNoteClient.applyCustomerCredit(customerId, invoiceId, amount)
  },
}
