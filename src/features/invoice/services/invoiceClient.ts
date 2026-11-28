import type {
  CancelInvoicePayload,
  CreditNotePayload,
  DirectInvoicePayload,
  InvoiceDetailedRecord,
  InvoiceRecord,
  InvoiceSourceType,
  UpdateInvoicePayload,
} from "../models/invoice"

export const invoiceClient = {
  getInvoices(): Promise<InvoiceRecord[]> {
    return window.api.invoices.getInvoices()
  },

  getOutstandingInvoices(): Promise<InvoiceRecord[]> {
    return window.api.invoices.getOutstandingInvoices()
  },

  getInvoiceById(invoiceId: number): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.getInvoiceById(invoiceId)
  },

  getBySource(sourceType: InvoiceSourceType, sourceId: number): Promise<InvoiceDetailedRecord | null> {
    return window.api.invoices.getBySource(sourceType, sourceId)
  },

  generateFromSO(soId: number): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.generateFromSO(soId)
  },

  generateFromDAG(dagId: number): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.generateFromDAG(dagId)
  },

  generateFromOtherService(osId: number): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.generateFromOtherService(osId)
  },

  generateFromDelivery(deliveryId: number): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.generateFromDelivery(deliveryId)
  },

  createDirect(data: DirectInvoicePayload): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.createDirect(data)
  },

  updateInvoice(invoiceId: number, data: UpdateInvoicePayload): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.updateInvoice(invoiceId, data)
  },

  cancelInvoice(invoiceId: number, data: CancelInvoicePayload): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.cancelInvoice(invoiceId, data)
  },

  createCreditNote(invoiceId: number, data: CreditNotePayload): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.createCreditNote(invoiceId, data)
  },

  recordPayment(invoiceId: number, data: { Payment: unknown }): Promise<InvoiceDetailedRecord> {
    return window.api.invoices.recordPayment(invoiceId, data)
  },
}
