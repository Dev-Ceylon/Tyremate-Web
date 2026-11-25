import { invoiceService } from "./invoiceService"
import { printerService } from "../../printer/services/printerService"
import type { InvoiceDetailedRecord } from "../models/invoice"

const SOURCE_LABELS: Record<string, string> = {
  so: "Sales Order",
  other_service: "Other Service",
  direct: "Direct",
  delivery: "Delivery",
  dag: "DAG Retreading",
}

export function buildInvoicePrintData(invoice: InvoiceDetailedRecord) {
  const format = (n: number) => Number(n).toLocaleString()

  const lines = (invoice.Lines || []).map((l) => {
    const isBattery = l.LineType === "battery" || Boolean(l.BatteryID)
    const spec = isBattery
      ? [l.Brand, l.Model, l.Capacity, l.Voltage, l.SerialNo ? `SN: ${l.SerialNo}` : null].filter(Boolean).join(" / ")
      : [l.Brand, l.Size, l.Pattern, l.SerialNo ? `SN: ${l.SerialNo}` : null].filter(Boolean).join(" / ")
    const desc = l.Description || spec
    return {
      description: desc,
      qty: String(l.Qty),
      unitPrice: format(l.UnitPrice),
      discount: String(l.Discount),
      lineTotal: format(l.LineTotal),
    }
  })

  const sourceLabel = SOURCE_LABELS[invoice.SourceType] || invoice.SourceType || ""

  return {
    invoiceId: String(invoice.InvoiceID),
    invoiceNumber: invoice.InvoiceNumber,
    invoiceDate: invoice.InvoiceDate || "",
    dueDate: invoice.DueDate || "",
    printedAt: new Date().toLocaleString(),
    customerName: invoice.CustomerName || "Walk-in Customer",
    customerAddress: invoice.CustomerAddress || "",
    customerPhone: invoice.CustomerPhone || "",
    customerVatNo: invoice.CustomerVatNo || "",
    sourceType: sourceLabel,
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
