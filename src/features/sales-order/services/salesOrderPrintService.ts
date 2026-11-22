import { salesOrderService } from "./salesOrderService"
import { printerService } from "../../printer/services/printerService"
import type { SoWarehouseDispatch, SoWarehouseDispatchSite } from "../models/salesOrder"

export function buildSalesOrderPrintData(so: any) {
  const netTotal = (so.TotalSale ?? 0) - (so.TotalDiscount ?? 0)
  const status = so.IsAdminApproved ? "Approved" : "Draft"
  const paymentStatus = so.IsPaymentCompleted === 1 ? "Completed" : "Pending"
  const isBattery = so.Category === "battery"

  const rawLines = isBattery ? (so.Batteries || []) : (so.Tyres || [])
  const tyres = rawLines.map((t: any) => ({
    displayName: isBattery
      ? `${t.Brand || "NA"} / ${t.Model || "NA"} (${t.Capacity || "NA"} ${t.Voltage || "NA"})`
      : `${t.Brand || "NA"} / ${t.Size || "NA"} - ${t.Pattern || "NA"}`,
    price: t.Price.toLocaleString(),
    discount: String(t.Discount),
    qty: String(t.Qty),
    returnedQty: String(t.returnedQty ?? 0),
    needToOrderQty: String(t.NeedToOrderQty),
    lineTotal: (t.Price * t.Qty * (1 - t.Discount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }))

  const payments = (so.Payments || []).map((p: any) => ({
    typeName: p.PaymentTypeName || p.PaymentTypeCode,
    amount: Number(p.Amount).toLocaleString(),
    reference: p.ReferenceNumber || "",
    paymentDate: p.PaymentDate || "",
    bankName: p.BankName || "",
    paidAmount: p.PaidAmount !== undefined ? `$${Number(p.PaidAmount).toLocaleString()}` : "",
    balanceAmount: p.BalanceAmount !== undefined ? `$${Number(p.BalanceAmount).toLocaleString()}` : "",
    collected: p.PaymentTypeCode === "CHEQUE" ? (p.Collected === 1 || p.Collected === true ? "Yes" : "No") : "",
  }))

  return {
    soId: String(so.SoID),
    customerName: so.CustomerName || "",
    customerCode: so.CustomerCode || "",
    date: so.Date || "",
    status,
    paymentStatus,
    totalSale: (so.TotalSale || 0).toLocaleString(),
    totalDiscount: (so.TotalDiscount || 0).toLocaleString(),
    netTotal: netTotal.toLocaleString(),
    remainingAmount: (so.RemainingAmount || 0).toLocaleString(),
    tyres,
    payments,
    printedAt: new Date().toLocaleString(),
  }
}

export async function printSalesOrder(soId: number, deviceName: string) {
  const so = await salesOrderService.getSOById(soId)
  const payload = buildSalesOrderPrintData(so)

  await printerService.printTemplate("so-details.html", payload, deviceName)
}

export async function downloadSalesOrderPdf(soId: number) {
  const so = await salesOrderService.getSOById(soId)
  const payload = buildSalesOrderPrintData(so)

  return printerService.downloadTemplatePdf("so-details.html", payload, `SO-${soId}.pdf`)
}

export function buildWarehouseDispatchPrintData(dispatch: SoWarehouseDispatch, site: SoWarehouseDispatchSite) {
  return {
    soId: String(dispatch.soId),
    date: dispatch.deliveryDate || dispatch.date || "",
    deliveryId: dispatch.deliveryId ? String(dispatch.deliveryId) : "",
    gatePassNo: dispatch.gatePassNo || "",
    customerName: dispatch.customerName || "",
    customerCode: dispatch.customerCode || "",
    warehouseName: site.locationName || "Unassigned",
    warehouseCode: site.locationCode || "",
    totalQty: String(site.totalQty),
    tyres: site.lines.map((line, index) => ({
      no: String(index + 1),
      displayName: line.displayName,
      dot: line.dot || "-",
      lot: line.storageManagerId !== null ? `#${line.storageManagerId}` : "-",
      qty: String(line.qty),
    })),
    printedAt: new Date().toLocaleString(),
  }
}

export async function printWarehouseDispatch(
  dispatch: SoWarehouseDispatch,
  sites: SoWarehouseDispatchSite[],
  deviceName: string,
) {
  const payloads = sites.map((site) => buildWarehouseDispatchPrintData(dispatch, site))

  await printerService.printTemplate("so-warehouse-dispatch.html", payloads, deviceName)
}

export async function downloadWarehouseDispatchPdf(
  dispatch: SoWarehouseDispatch,
  sites: SoWarehouseDispatchSite[],
) {
  const payloads = sites.map((site) => buildWarehouseDispatchPrintData(dispatch, site))

  return printerService.downloadTemplatePdf(
    "so-warehouse-dispatch.html",
    payloads,
    dispatch.deliveryId
      ? `SO-${dispatch.soId}-Delivery-${dispatch.deliveryId}-warehouse-issue-note.pdf`
      : `SO-${dispatch.soId}-warehouse-dispatch.pdf`,
  )
}
