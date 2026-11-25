import { printerService } from "../../printer/services/printerService"
import type { DagDetailedRecord, DagPaymentDetail } from "../models/dag"

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

export function buildDAGPaymentReceiptPrintData(dag: DagDetailedRecord, payment: DagPaymentDetail) {
  const isCheque = (payment.PaymentTypeCode || "").toLowerCase() === "cheque" || (payment.PaymentTypeCode || "").toLowerCase() === "chq"
  const customer = dag.Customer
  const isWalkin = customer?.IsWalkinCustomer === true

  const invoiceReferences = (payment.Invoices ?? [])
    .map((invoice) => invoice.InvoiceNumber || `#${invoice.InvoiceID}`)
    .join(", ")

  const takenSerials = (payment.SaleLines ?? [])
    .map((line) => {
      const parts = [line.SerialNumber]
      if (line.TyreCode) parts.push(`(${line.TyreCode}${line.TyreName ? ` ${line.TyreName}` : ""})`)
      return parts.filter(Boolean).join(" ")
    })
    .filter(Boolean)
    .join(", ")

  const tenderedVal = payment.PaidAmount !== undefined ? payment.PaidAmount : payment.AmountReceived
  const changeVal = payment.BalanceAmount !== undefined ? payment.BalanceAmount : payment.BalanceToReturn

  return {
    receiptNumber: `PR-${payment.PaymentID ?? ""}`,
    issuedAt: formatDateTime(payment.CreatedAt),
    dagNumber: String(dag.ID),
    customerName: escapeHtml(customer?.CustomerName || dag.CustomerName || "Customer"),
    customerCode: escapeHtml(!isWalkin ? (customer && "CustomerCode" in customer ? customer.CustomerCode : dag.CustomerCode) || "" : ""),
    customerPhone: escapeHtml(isWalkin ? (customer && "CustomerPhone" in customer ? customer.CustomerPhone : "") : ""),
    customerAddress: escapeHtml(isWalkin ? (customer && "CustomerAddress" in customer ? customer.CustomerAddress : "") : ""),
    vehicleNumber: escapeHtml(isWalkin ? (customer && "VehicleNumber" in customer ? customer.VehicleNumber : "") : ""),
    paymentMethod: escapeHtml(payment.PaymentTypeName || payment.PaymentTypeCode),
    paymentDate: escapeHtml(payment.PaymentDate || formatDateTime(payment.CreatedAt)),
    referenceNumber: escapeHtml(payment.ReferenceNumber || payment.ChequeNumber || ""),
    bankName: escapeHtml(payment.BankName || ""),
    invoiceReferences: escapeHtml(invoiceReferences),
    takenSerials: escapeHtml(takenSerials),
    receivedAmount: formatMoney(payment.Amount),
    tenderedAmount: tenderedVal === undefined ? "" : formatMoney(tenderedVal),
    changeReturned: changeVal === undefined ? "" : formatMoney(changeVal),
    tenderNote: isCheque
      ? "Cheque received subject to bank clearance. This receipt confirms receipt of the cheque, not cleared funds."
      : payment.IsAdvance
        ? "Advance payment received against DAG retreading order. Thank you."
        : "Payment received for DAG retreading. Thank you.",
  }
}

export function buildDAGPaymentSummaryReceiptPrintData(dag: DagDetailedRecord) {
  const payments = [...(dag.Payments ?? [])].sort((left, right) => {
    const leftDate = new Date(left.CreatedAt || left.PaymentDate || 0).getTime()
    const rightDate = new Date(right.CreatedAt || right.PaymentDate || 0).getTime()
    return leftDate - rightDate || (left.PaymentID ?? 0) - (right.PaymentID ?? 0)
  })

  let settledTotal = 0
  let pendingChequeTotal = 0

  const rows = payments.map((payment) => {
    const typeCode = (payment.PaymentTypeCode || "").toLowerCase()
    const isCheque = typeCode === "cheque" || typeCode === "chq"
    const isPendingCheque = isCheque && !Boolean(payment.Collected)
    const amount = Number(payment.Amount) || 0

    if (isPendingCheque) pendingChequeTotal += amount
    else settledTotal += amount

    const invoiceReferences = (payment.Invoices ?? [])
      .map((invoice) => invoice.InvoiceNumber || `#${invoice.InvoiceID}`)
      .join(", ")

    const takenSerials = (payment.SaleLines ?? [])
      .map((line) => line.SerialNumber)
      .filter(Boolean)
      .join(", ")

    const details = [
      payment.ReferenceNumber || payment.ChequeNumber,
      payment.BankName,
      takenSerials ? `Serials: ${takenSerials}` : "",
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

  const customer = dag.Customer
  const isWalkin = customer?.IsWalkinCustomer === true
  const totalCost = Number(dag.TotalDAGCost) || 0
  const balanceDue = Math.max(0, totalCost - settledTotal)

  return {
    summaryNumber: `DAG-${dag.ID}-PAYMENTS`,
    generatedAt: new Date().toLocaleString(),
    dagNumber: String(dag.ID),
    customerName: escapeHtml(customer?.CustomerName || dag.CustomerName || "Customer"),
    customerCode: escapeHtml(!isWalkin ? (customer && "CustomerCode" in customer ? customer.CustomerCode : dag.CustomerCode) || "" : ""),
    customerPhone: escapeHtml(isWalkin ? (customer && "CustomerPhone" in customer ? customer.CustomerPhone : "") : ""),
    customerAddress: escapeHtml(isWalkin ? (customer && "CustomerAddress" in customer ? customer.CustomerAddress : "") : ""),
    vehicleNumber: escapeHtml(isWalkin ? (customer && "VehicleNumber" in customer ? customer.VehicleNumber : "") : ""),
    paymentCount: String(payments.length),
    totalCost: formatMoney(totalCost),
    settledTotal: formatMoney(settledTotal),
    pendingChequeTotal: formatMoney(pendingChequeTotal),
    recordedTotal: formatMoney(settledTotal + pendingChequeTotal),
    balanceDue: formatMoney(balanceDue),
    payments: rows,
  }
}

export async function printDAGPaymentReceipt(
  dag: DagDetailedRecord,
  payment: DagPaymentDetail,
  deviceName: string,
) {
  if (!payment.PaymentID) throw new Error("This payment has no receipt number.")
  const data = buildDAGPaymentReceiptPrintData(dag, payment)
  return printerService.printTemplate("dag-payment-receipt.html", data, deviceName)
}

export async function downloadDAGPaymentReceipt(dag: DagDetailedRecord, payment: DagPaymentDetail) {
  if (!payment.PaymentID) throw new Error("This payment has no receipt number.")
  const data = buildDAGPaymentReceiptPrintData(dag, payment)
  return printerService.downloadTemplatePdf(
    "dag-payment-receipt.html",
    data,
    `DAG-Payment-Receipt-PR-${payment.PaymentID}.pdf`,
  )
}

export async function printDAGPaymentSummaryReceipt(dag: DagDetailedRecord, deviceName: string) {
  if (!dag.Payments?.length) throw new Error("This DAG has no payments to print.")
  return printerService.printTemplate(
    "dag-payment-summary-receipt.html",
    buildDAGPaymentSummaryReceiptPrintData(dag),
    deviceName,
  )
}

export async function downloadDAGPaymentSummaryReceipt(dag: DagDetailedRecord) {
  if (!dag.Payments?.length) throw new Error("This DAG has no payments to download.")
  return printerService.downloadTemplatePdf(
    "dag-payment-summary-receipt.html",
    buildDAGPaymentSummaryReceiptPrintData(dag),
    `DAG-${dag.ID}-Consolidated-Payment-Receipt.pdf`,
  )
}
