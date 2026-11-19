import { purchaseOrderService } from "./purchaseOrderService"
import { printerService } from "../../printer/services/printerService"
import { getStatusName } from "../../../shared/constants/statusConstants"

export function buildPurchaseOrderPrintData(po: any) {
  const adminApproval = po.IsAdminApproved ? "Approved" : "Pending"
  const supplierApproval = po.IsSupplierApproved ? "Approved" : "Pending"
  const supplierFeedback = po.SupplierFeedback ? "Complete" : "Incomplete"
  const storageAllocated = po.isStoragesAllocated ? "Yes" : "No"

  const tyres = (po.Tyres || []).map((t: any) => ({
    displayName: `${t.Brand || "NA"} / ${t.Size || "NA"} - ${t.Pattern || "NA"}`,
    price: t.Price.toLocaleString(),
    discount: String(t.Discount),
    qty: String(t.Qty),
    lineTotal: (t.Price * t.Qty * (1 - t.Discount / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    suppliers: (t.Suppliers || []).map((s: any) => `${s.SupplierName || "NA"} (${s.SupplierCode || ""}): ${s.Qty} units`).join("; ") || "None",
  }))

  const supplierAllocations = (po.Tyres || []).flatMap((t: any) =>
    (t.Suppliers || []).map((s: any) => ({
      supplierName: s.SupplierName || "Unknown",
      supplierCode: s.SupplierCode || "",
      qty: String(s.Qty),
      status: s.IsApproved === null ? "Pending" : s.IsApproved === 1 ? "Approved" : "Rejected",
    }))
  )

  return {
    poId: String(po.ID),
    date: po.Date,
    statusCode: po.StatusCode || "",
    statusName: getStatusName(po.StatusCode),
    adminApproval,
    supplierApproval,
    supplierFeedback,
    storageAllocated,
    soId: po.SoID ? String(po.SoID) : "",
    tyres,
    supplierAllocations,
    printedAt: new Date().toLocaleString(),
  }
}

export async function printPurchaseOrder(poId: number, deviceName: string) {
  const po = await purchaseOrderService.getPurchaseOrderById(poId)
  const payload = buildPurchaseOrderPrintData(po)

  await printerService.printTemplate("po-details.html", payload, deviceName)
}

export async function downloadPurchaseOrderPdf(poId: number) {
  const po = await purchaseOrderService.getPurchaseOrderById(poId)
  const payload = buildPurchaseOrderPrintData(po)

  return printerService.downloadTemplatePdf("po-details.html", payload, `PO-${poId}.pdf`)
}
