import { printerService } from "../../printer/services/printerService"
import type { SoDetailedRecord, SoPaymentRecord } from "../models/salesOrder"

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const formatMoney = (value: number) =>
  `LKR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDateTime = (value?: string | null) => {
  if (!value) return new Date().toLocaleString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export function buildSOPaymentReceiptPrintData(order: SoDetailedRecord, payment: SoPaymentRecord) {
  const isCheque = payment.PaymentTypeCode.toLowerCase() === "cheque"
  const customer = order.Customer
  const invoiceReferences = (payment.Invoices ?? [])
    .map((invoice) => invoice.InvoiceNumber || `#${invoice.InvoiceID}`)
    .join(", ")

  return {
    receiptNumber: `PR-${payment.PaymentID ?? ""}`,
    issuedAt: formatDateTime(payment.CreatedAt),
    salesOrderNumber: String(order.SoID),
    salesOrderDate: order.Date || "",
    customerName: escapeHtml(customer?.CustomerName || order.CustomerName || "Customer"),
    customerCode: escapeHtml(order.CustomerCode || ""),
    customerPhone: escapeHtml(customer?.IsWalkinCustomer ? customer.CustomerPhone || "" : ""),
    customerAddress: escapeHtml(customer?.IsWalkinCustomer ? customer.CustomerAddress || "" : ""),
    paymentMethod: escapeHtml(payment.PaymentTypeName || payment.PaymentTypeCode),
    paymentDate: escapeHtml(payment.PaymentDate || formatDateTime(payment.CreatedAt)),
    referenceNumber: escapeHtml(payment.ReferenceNumber || ""),
    bankName: escapeHtml(payment.BankName || ""),
    invoiceReferences: escapeHtml(invoiceReferences),
    receivedAmount: formatMoney(payment.Amount),
    tenderedAmount: payment.PaidAmount === undefined ? "" : formatMoney(payment.PaidAmount),
    changeReturned: payment.BalanceAmount === undefined ? "" : formatMoney(payment.BalanceAmount),
    tenderNote: isCheque
      ? "Cheque received subject to bank clearance. This receipt confirms receipt of the cheque, not cleared funds."
      : !invoiceReferences
        ? "Advance payment received against Sales Order. Thank you."
        : "Payment received. Thank you.",
  }
}

export function buildSOPaymentSummaryReceiptPrintData(order: SoDetailedRecord) {
  const payments = [...(order.Payments ?? [])].sort((left, right) => {
    const leftDate = new Date(left.CreatedAt || left.PaymentDate || 0).getTime()
    const rightDate = new Date(right.CreatedAt || right.PaymentDate || 0).getTime()
    return leftDate - rightDate || (left.PaymentID ?? 0) - (right.PaymentID ?? 0)
  })

  let settledTotal = 0
  let pendingChequeTotal = 0
  const rows = payments.map((payment) => {
    const isCheque = payment.PaymentTypeCode.toLowerCase() === "cheque"
    const isPendingCheque = isCheque && !Boolean(payment.Collected)
    const amount = Number(payment.Amount) || 0

    if (isPendingCheque) pendingChequeTotal += amount
    else settledTotal += amount

    const invoiceReferences = (payment.Invoices ?? [])
      .map((invoice) => invoice.InvoiceNumber || `#${invoice.InvoiceID}`)
      .join(", ")
    const details = [
      payment.ReferenceNumber,
      payment.BankName,
      invoiceReferences ? `Invoices: ${invoiceReferences}` : "",
    ]
      .filter(Boolean)
      .join(" / ")

    return {
      receiptNumber: `PR-${payment.PaymentID ?? ""}`,
      date: escapeHtml(payment.PaymentDate || formatDateTime(payment.CreatedAt)),
      method: escapeHtml(payment.PaymentTypeName || payment.PaymentTypeCode),
      referenceAndInvoices: escapeHtml(details),
      amount: formatMoney(amount),
      status: isPendingCheque ? "Pending clearance" : isCheque ? "Cheque collected" : "Settled",
    }
  })

  const customer = order.Customer
  return {
    summaryNumber: `SO-${order.SoID}-PAYMENTS`,
    generatedAt: new Date().toLocaleString(),
    salesOrderNumber: String(order.SoID),
    salesOrderDate: order.Date || "",
    customerName: escapeHtml(customer?.CustomerName || order.CustomerName || "Customer"),
    customerCode: escapeHtml(order.CustomerCode || ""),
    customerPhone: escapeHtml(customer?.IsWalkinCustomer ? customer.CustomerPhone || "" : ""),
    customerAddress: escapeHtml(customer?.IsWalkinCustomer ? customer.CustomerAddress || "" : ""),
    paymentCount: String(payments.length),
    settledTotal: formatMoney(settledTotal),
    pendingChequeTotal: formatMoney(pendingChequeTotal),
    recordedTotal: formatMoney(settledTotal + pendingChequeTotal),
    balanceDue: formatMoney(order.RemainingAmount ?? 0),
    payments: rows,
  }
}

export async function printSOPaymentReceipt(
  order: SoDetailedRecord,
  payment: SoPaymentRecord,
  deviceName: string,
) {
  if (!payment.PaymentID) throw new Error("This payment has no receipt number.")
  const data = buildSOPaymentReceiptPrintData(order, payment)
  return printerService.printTemplate("so-payment-receipt.html", data, deviceName)
}

export async function downloadSOPaymentReceipt(order: SoDetailedRecord, payment: SoPaymentRecord) {
  if (!payment.PaymentID) throw new Error("This payment has no receipt number.")
  const data = buildSOPaymentReceiptPrintData(order, payment)
  return printerService.downloadTemplatePdf(
    "so-payment-receipt.html",
    data,
    `Payment-Receipt-PR-${payment.PaymentID}.pdf`,
  )
}

export async function printSOPaymentSummaryReceipt(order: SoDetailedRecord, deviceName: string) {
  if (!order.Payments?.length) throw new Error("This sales order has no payments to print.")
  return printerService.printTemplate(
    "so-payment-summary-receipt.html",
    buildSOPaymentSummaryReceiptPrintData(order),
    deviceName,
  )
}

export async function downloadSOPaymentSummaryReceipt(order: SoDetailedRecord) {
  if (!order.Payments?.length) throw new Error("This sales order has no payments to download.")
  return printerService.downloadTemplatePdf(
    "so-payment-summary-receipt.html",
    buildSOPaymentSummaryReceiptPrintData(order),
    `SO-${order.SoID}-Consolidated-Payment-Receipt.pdf`,
  )
}
