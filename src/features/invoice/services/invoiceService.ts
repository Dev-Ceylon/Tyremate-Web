import type {
  CancelInvoicePayload,
  CreditNotePayload,
  DirectInvoicePayload,
  InvoiceDetailedRecord,
  InvoiceRecord,
  UpdateInvoicePayload,
} from "../models/invoice"
import { invoiceClient } from "./invoiceClient"

export const invoiceService = {
  getAll(): Promise<InvoiceRecord[]> {
    return invoiceClient.getInvoices()
  },

  getOutstanding(): Promise<InvoiceRecord[]> {
    return invoiceClient.getOutstandingInvoices()
  },

  getInvoiceById(invoiceId: number): Promise<InvoiceDetailedRecord> {
    return invoiceClient.getInvoiceById(invoiceId)
  },

  generateFromSO(soId: number): Promise<InvoiceDetailedRecord> {
    return invoiceClient.generateFromSO(soId)
  },

  generateFromDAG(dagId: number): Promise<InvoiceDetailedRecord> {
    return invoiceClient.generateFromDAG(dagId)
  },

  generateFromOtherService(osId: number): Promise<InvoiceDetailedRecord> {
    return invoiceClient.generateFromOtherService(osId)
  },

  generateFromDelivery(deliveryId: number): Promise<InvoiceDetailedRecord> {
    return invoiceClient.generateFromDelivery(deliveryId)
  },

  createDirect(data: DirectInvoicePayload): Promise<InvoiceDetailedRecord> {
    return invoiceClient.createDirect(data)
  },

  updateInvoice(invoiceId: number, data: UpdateInvoicePayload): Promise<InvoiceDetailedRecord> {
    return invoiceClient.updateInvoice(invoiceId, data)
  },

  cancelInvoice(invoiceId: number, data: CancelInvoicePayload): Promise<InvoiceDetailedRecord> {
    return invoiceClient.cancelInvoice(invoiceId, data)
  },

  createCreditNote(invoiceId: number, data: CreditNotePayload): Promise<InvoiceDetailedRecord> {
    return invoiceClient.createCreditNote(invoiceId, data)
  },

  recordPayment(invoiceId: number, data: { Payment: unknown }): Promise<InvoiceDetailedRecord> {
    return invoiceClient.recordPayment(invoiceId, data)
  },
}
