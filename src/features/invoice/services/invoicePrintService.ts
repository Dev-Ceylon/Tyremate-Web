import { invoiceService } from "./invoiceService"
import { printerService } from "../../printer/services/printerService"
import type { InvoiceDetailedRecord } from "../models/invoice"

export function buildInvoicePrintData(invoice: InvoiceDetailedRecord) {
  const format = (n: number) => Number(n).toLocaleString()

  const lines = (invoice.Lines || []).map((l) => {
    const desc = l.Description || [l.Brand, l.Size, l.Pattern, l.SerialNo].filter(Boolean).join(" / ")
    return {
      description: desc,
      qty: String(l.Qty),
      unitPrice: format(l.UnitPrice),
      discount: String(l.Discount),
      lineTotal: format(l.LineTotal),
    }
  })

  return {
    invoiceId: String(invoice.InvoiceID),
    invoiceNumber: invoice.InvoiceNumber,
    invoiceDate: invoice.InvoiceDate || "",
    dueDate: invoice.DueDate || "",
    printedAt: new Date().toLocaleString(),
    customerName: invoice.CustomerName || "",
    customerAddress: invoice.CustomerAddress || "",
    customerPhone: invoice.CustomerPhone || "",
    customerVatNo: invoice.CustomerVatNo || "",
    sourceType: invoice.SourceType || "",
    sourceId: invoice.SourceID === null ? "" : String(invoice.SourceID),
    status: invoice.Status || "",
    notes: invoice.Notes || "",
    subtotal: format(invoice.Subtotal),
    discountTotal: format(invoice.DiscountTotal),
    taxLabel: invoice.TaxLabel || "Tax",
    taxAmount: format(invoice.TaxAmount),
    total: format(invoice.Total),
    amountPaid: format(invoice.AmountPaid),
    balanceDue: format(invoice.BalanceDue),
    lines,
  }
}

export async function printInvoice(invoiceId: number, deviceName: string) {
  const invoice = await invoiceService.getInvoiceById(invoiceId)
  const payload = buildInvoicePrintData(invoice)
  await printerService.printTemplate("invoice-details.html", payload, deviceName)
}

export async function downloadInvoicePdf(invoiceId: number) {
  const invoice = await invoiceService.getInvoiceById(invoiceId)
  const payload = buildInvoicePrintData(invoice)
  return printerService.downloadTemplatePdf(
    "invoice-details.html",
    payload,
    `Invoice-${invoice.InvoiceNumber}.pdf`
  )
}
