import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams } from "@/lib/router"
import { purchaseOrderService } from "../services/purchaseOrderService"
import { goodsReceiptService } from "../../goods-receipt/services/goodsReceiptService"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import type { GoodsReceiptLineRecord, GoodsReceiptPayload } from "../../goods-receipt/models/goodsReceipt"
import type { PoDetailedRecord, PoTyreRecord, PoTyreSupplierRecord } from "../models/purchaseOrder"

export interface PurchaseOrderDisplayRow extends PoTyreRecord {
  displaySupplier: PoTyreSupplierRecord | null;
  rowKey: string;
  // These are required by the detail view table
  Brand: string;
  Size: string;
  Pattern: string;
  BatteryID?: number;
  Model?: string;
  Capacity?: string;
  Voltage?: string;
  Technology?: string;
  // Derived UI values
  lineTotal: number;
  isApproved: boolean;
  isRejected: boolean;
  rowClass: string;
}

export type UpdateApprovalHandler = (
  supplierAllocationId: number,
  isApproved: boolean | null,
  action: 'Approved' | 'Rejected'
) => Promise<void>;

export type UpdateSupplierDeliveryDateHandler = (
  supplierAllocationId: number,
  dates: {
    ExpectedDeliveryDate?: string | null
    ActualDeliveryDate?: string | null
  }
) => Promise<void>;

export function usePurchaseOrderDetails() {
  const { poId } = useParams<{ poId: string }>()
  const { showToast } = useToast()
  const [order, setOrder] = useState<PoDetailedRecord | null>(null)
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptLineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false)
  const [isUpdatingDeliveryDates, setIsUpdatingDeliveryDates] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isPostingGoodsReceipt, setIsPostingGoodsReceipt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrderDetails = useCallback(async () => {
    async function loadDetails() {
      if (!poId) return
      try {
        setLoading(true)
        const [data, receipts] = await Promise.all([
          purchaseOrderService.getPurchaseOrderById(Number(poId)),
          goodsReceiptService.getGoodsReceiptsByPoId(Number(poId)),
        ])
        setOrder(data)
        setGoodsReceipts(receipts)
      } catch (err: any) {
        setError(err.message || "Failed to load purchase order details")
      } finally {
        setLoading(false)
      }
    }

    await loadDetails()
  }, [poId])

  const handleUpdateApproval = useCallback(async (
    supplierAllocationId: number,
    isApproved: boolean | null,
    action: 'Approved' | 'Rejected'
  ) => {
    if (!supplierAllocationId) return

    setIsUpdatingApproval(true)
    try {
      await purchaseOrderService.updateSupplierApproval(supplierAllocationId, isApproved)
      showToast({
        variant: "success",
        title: `Allocation ${action}`,
        message: `Supplier allocation was successfully ${action.toLowerCase()}.`,
      })
      await fetchOrderDetails() 
    } catch (err: any) {
      showToast({
        variant: "error",
        title: `Failed to ${action.toLowerCase()} allocation`,
        message: err.message || `An error occurred while ${action.toLowerCase()} the allocation.`,
      })
    } finally {
      setIsUpdatingApproval(false)
    }
  }, [showToast, fetchOrderDetails])

  const handlePostGoodsReceipt = useCallback(async (payload: GoodsReceiptPayload) => {
    setIsPostingGoodsReceipt(true)
    try {
      const receipt = await goodsReceiptService.postGoodsReceipt(payload)
      showToast({
        variant: "success",
        title: `GRN ${receipt.GRNNumber} posted`,
        message: `${receipt.AcceptedQty} accepted tyre${receipt.AcceptedQty === 1 ? "" : "s"} added to stock.`,
      })
      await fetchOrderDetails()
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "GRN posting failed",
        message: err.message || "An error occurred while posting the goods receipt.",
      })
      throw err
    } finally {
      setIsPostingGoodsReceipt(false)
    }
  }, [showToast, fetchOrderDetails])

  const handleUpdateSupplierDeliveryDate = useCallback(async (
    supplierAllocationId: number,
    dates: { ExpectedDeliveryDate?: string | null; ActualDeliveryDate?: string | null }
  ) => {
    if (!supplierAllocationId) return

    setIsUpdatingDeliveryDates(true)
    try {
      await purchaseOrderService.updateSupplierDeliveryDate(supplierAllocationId, dates)
      showToast({
        variant: "success",
        title: "Delivery date saved",
        message: "The supplier delivery dates were updated successfully.",
      })
      await fetchOrderDetails()
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Delivery date failed",
        message: err.message || "An error occurred while saving the delivery dates.",
      })
    } finally {
      setIsUpdatingDeliveryDates(false)
    }
  }, [showToast, fetchOrderDetails])

  const handleUpdateStatus = useCallback(async (statusCode: string) => {
    if (!poId) return

    setIsUpdatingStatus(true)
    try {
      await purchaseOrderService.updatePurchaseOrderStatus(Number(poId), statusCode)
      showToast({
        variant: "success",
        title: "Order Updated",
        message: `The purchase order status has been updated to ${statusCode}.`,
      })
      await fetchOrderDetails() 
    } catch (err: any) {
      showToast({
        variant: "error",
        title: "Status Update Failed",
        message: err.message || "Failed to update purchase order status",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }, [poId, showToast, fetchOrderDetails])

  const displayRows = useMemo<PurchaseOrderDisplayRow[]>(() => {
    const rawItems = (order?.Category === "battery" ? order?.Batteries : order?.Tyres) || order?.Lines || []
    if (!rawItems || rawItems.length === 0) return []

    return rawItems.flatMap((item: any): PurchaseOrderDisplayRow[] => {
      const base = item as PurchaseOrderDisplayRow
      const lineTotal = (item.Price * item.Qty) * (1 - (item.Discount || 0) / 100)

      const brand = item.Brand || ""
      const sizeOrModel = order?.Category === "battery" ? (item.Model || item.Voltage || "") : (item.Size || "")
      const patternOrCapacity = order?.Category === "battery" ? (item.Capacity || item.Technology || "") : (item.Pattern || "")

      if (!item.Suppliers || item.Suppliers.length === 0) {
        return [{ 
          ...base, 
          Brand: brand,
          Size: sizeOrModel,
          Pattern: patternOrCapacity,
          BatteryID: item.BatteryID,
          Model: item.Model,
          Capacity: item.Capacity,
          Voltage: item.Voltage,
          Technology: item.Technology,
          displaySupplier: null, 
          rowKey: `line-${item.ID}`,
          lineTotal,
          isApproved: false,
          isRejected: false,
          rowClass: ""
        }]
      }

      return item.Suppliers.map((s: any) => {
        const isApproved = s.IsApproved === 1 || s.IsApproved === true
        const isRejected = s.IsApproved !== null && !isApproved
        const rowClass = isApproved ? "row-approved" : isRejected ? "row-rejected" : ""

        return {
          ...base, 
          Brand: brand,
          Size: sizeOrModel,
          Pattern: patternOrCapacity,
          BatteryID: item.BatteryID,
          Model: item.Model,
          Capacity: item.Capacity,
          Voltage: item.Voltage,
          Technology: item.Technology,
          Qty: s.Qty,
          displaySupplier: s,
          rowKey: `line-${item.ID}-sup-${s.ID}`,
          lineTotal: (item.Price * s.Qty) * (1 - (item.Discount || 0) / 100),
          isApproved,
          isRejected,
          rowClass
        }
      })
    })
  }, [order?.Category, order?.Tyres, order?.Batteries, order?.Lines])

  const totals = useMemo(() => {
    const rawItems = (order?.Category === "battery" ? order?.Batteries : order?.Tyres) || order?.Lines || []
    const subtotal = rawItems.reduce((acc: number, t: any) => acc + ((t.Price || 0) * (t.Qty || 0)), 0) || 0
    const totalDiscount = rawItems.reduce((acc: number, t: any) => acc + ((t.Price || 0) * (t.Qty || 0) * ((t.Discount || 0) / 100)), 0) || 0
    const netTotal = subtotal - totalDiscount

    return {
      subtotal,
      totalDiscount,
      netTotal
    }
  }, [order?.Category, order?.Tyres, order?.Batteries, order?.Lines])

  useEffect(() => {
    fetchOrderDetails()
  }, [fetchOrderDetails])

  return { 
    order, 
    goodsReceipts,
    loading, 
    error, 
    isUpdatingApproval,
    isUpdatingDeliveryDates,
    isUpdatingStatus,
    isPostingGoodsReceipt,
    displayRows,
    totals,
    actions: {
      refresh: fetchOrderDetails,
      updateApproval: handleUpdateApproval,
      updateSupplierDates: handleUpdateSupplierDeliveryDate,
      postGoodsReceipt: handlePostGoodsReceipt,
      updateStatus: handleUpdateStatus
    }
  }
}