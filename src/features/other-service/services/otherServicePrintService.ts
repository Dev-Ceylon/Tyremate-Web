import { otherServiceService } from "./otherServiceService"
import { printerService } from "../../printer/services/printerService"
import { PAYMENT_TYPE_CODES } from "../../../shared/payment/constants/paymentTypeConstants"

export async function printOtherService(osId: number, deviceName: string) {
  const os = await otherServiceService.getById(osId)

  const serviceStatus = os.IsCompleted ? "Completed" : "In Progress"
  const paymentStatus = os.IsPaymentCompleted === 1 ? "Paid" : "Unpaid"
  const customerName = os.CustomerName || os.AdHocCustomerName || ""
  const customerCode = os.CustomerCode || ""
  const remainingAmount = os.RemainingAmount ?? 0

  const consumables = (os.Consumables || []).map((c) => ({
    displayName: `${c.ConsumableName || "NA"}${c.ConsumableCategory ? ` (${c.ConsumableCategory})` : ""}`,
    price: c.Price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    qty: String(c.Qty),
    lineTotal: (c.Price * c.Qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }))

  const payments = (os.Payments || []).map((p) => ({
    typeName: p.PaymentTypeName || p.PaymentTypeCode,
    amount: Number(p.Amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    reference: p.ReferenceNumber || "",
    paymentDate: p.PaymentDate || "",
    bankName: p.BankName || "",
    collected: p.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE ? (p.Collected === 1 ? "Yes" : "No") : "",
  }))

  await printerService.printTemplate("other-service-details.html", {
    osId: String(os.OSID),
    customerName,
    customerCode,
    date: os.Date || "",
    serviceStatus,
    paymentStatus,
    totalAmount: (os.TotalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    remainingAmount: remainingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    consumables,
    payments,
    printedAt: new Date().toLocaleString(),
  }, deviceName)
}
