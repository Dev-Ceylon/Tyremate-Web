import { useState, useEffect, useCallback } from "react"
import { inquiryService } from "../../inquiry/services/inquiryService"
import { purchaseOrderService } from "../services/purchaseOrderService"
import type { CreatePoPayload, PoLinePayload } from "../models/purchaseOrder"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { InquiryRecord } from "../../inquiry/models/inquiry"
import { v4 as uuidv4 } from "uuid"

export interface PurchaseOrderLineSupplier {
  id: string
  SupplierID: number
  SupplierName?: string
  Qty: number
  Price: number
  Discount: number
}

export interface PurchaseOrderLine extends Omit<PoLinePayload, "IsAdminApproved" | "Suppliers"> {
  id: string
  Suppliers: PurchaseOrderLineSupplier[]
}

export interface PurchaseOrderFormData {
  Date: string
}

interface UsePurchaseOrderFormProps {
  poId?: number
  inquiryId?: number | null
  onSuccess: () => void
  onError: (message: string) => void
}

export function usePurchaseOrderForm({ poId, inquiryId, onSuccess, onError }: UsePurchaseOrderFormProps) {
  const [initializing, setInitializing] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [sourceInquiry, setSourceInquiry] = useState<InquiryRecord | null>(null)

  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    Date: new Date().toISOString().split("T")[0],
  })

  const [lines, setLines] = useState<PurchaseOrderLine[]>([])

  const loadData = useCallback(async () => {
    try {
      setInitializing(true)
      const [tyreData, orderData, inquiryData] = await Promise.all([
        window.api.tyres.getTyres(),
        poId ? purchaseOrderService.getPurchaseOrderById(poId) : Promise.resolve(null),
        inquiryId ? inquiryService.getInquiryById(inquiryId) : Promise.resolve(null),
      ])

      setTyres(tyreData)
      setSourceInquiry(inquiryData)

      if (orderData) {
        setFormData({ Date: orderData.Date })
        const mappedLines = (orderData.Tyres || []).map((t: any) => ({
          id: uuidv4(),
          TyreID: t.TyreID,
          Price: t.Price,
          Discount: t.Discount,
          Qty: t.Qty,
          Suppliers: (t.Suppliers || []).map((s: any) => ({
            id: uuidv4(),
            SupplierID: s.SupplierID,
            SupplierName: s.SupplierName,
            Qty: s.Qty,
            Price: s.Price ?? 0,
            Discount: s.Discount ?? 0,
          })),
        }))
        setLines(mappedLines)
      } else if (inquiryData && Array.isArray(inquiryData.tyres)) {
        const mapped = inquiryData.tyres
          .filter((t) => {
            const need = (t as any).NeedToOrderQty ?? t.Qty ?? 0
            return need > 0 && t.TyreID
          })
          .map((t) => ({
            id: uuidv4(),
            TyreID: t.TyreID,
            Price: t.Price,
            Discount: t.Discount,
            Qty: (t as any).NeedToOrderQty ?? t.Qty ?? 0,
            Suppliers: [],
          }))
        setLines(mapped.length > 0 ? mapped : [{ id: uuidv4(), TyreID: 0, Price: 0, Discount: 0, Qty: 1, Suppliers: [] }])
      } else {
        setLines([{ id: uuidv4(), TyreID: 0, Price: 0, Discount: 0, Qty: 1, Suppliers: [] }])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load initial data")
    } finally {
      setInitializing(false)
    }
  }, [poId, inquiryId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const updateField = (field: keyof PurchaseOrderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: uuidv4(),
        TyreID: 0,
        Price: 0,
        Discount: 0,
        Qty: 1,
        Suppliers: [],
      },
    ])
  }

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const updateLine = (id: string, field: keyof PurchaseOrderLine, value: any) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const setLineSuppliers = (lineId: string, suppliers: PurchaseOrderLineSupplier[]) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l
        const firstSupplier = suppliers[0]
        return {
          ...l,
          Suppliers: suppliers,
          Price: firstSupplier?.Price ?? l.Price,
          Discount: firstSupplier?.Discount ?? l.Discount,
        }
      }),
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (lines.length === 0) {
      onError("At least one line item is required")
      return
    }

    for (const line of lines) {
      if (!line.TyreID) {
        onError("All lines must have a tyre selected")
        return
      }
      const totalSupplierQty = line.Suppliers.reduce((sum, s) => sum + s.Qty, 0)
      if (totalSupplierQty > line.Qty) {
        onError(`Total supplier quantity for line with Tyre ID ${line.TyreID} exceeds line quantity`)
        return
      }
      if (line.Suppliers.length === 0) {
        onError(`Line with Tyre ID ${line.TyreID} must have at least one supplier allocation`)
        return
      }
    }

    try {
      setSubmitting(true)
      const payload: CreatePoPayload = {
        Date: formData.Date,
        IsAdminApproved: false,
        IsSupplierApproved: false,
        Lines: lines.map((l) => ({
          TyreID: l.TyreID,
          Price: l.Price,
          Discount: l.Discount,
          Qty: l.Qty,
          IsAdminApproved: false,
          Suppliers: l.Suppliers.map((s) => ({
            SupplierID: s.SupplierID,
            Qty: s.Qty,
            Price: s.Price,
            Discount: s.Discount,
            IsApproved: null,
          })),
        })),
      }

      if (inquiryId) {
        payload.InquiryID = inquiryId
      }

      if (poId) {
        await purchaseOrderService.updatePurchaseOrder(poId, payload)
      } else {
        await purchaseOrderService.createPurchaseOrder(payload)
      }
      onSuccess()
    } catch (err: any) {
      onError(err.message || "Failed to create purchase order")
    } finally {
      setSubmitting(false)
    }
  }

  const reloadTyres = useCallback(async () => {
    const tyreData = await window.api.tyres.getTyres()
    setTyres(tyreData)
  }, [])

  const selectTyreForOrder = useCallback(
    (tyreId: number) => {
      const tyre = tyres.find((t) => t.Id === tyreId)
      if (!tyre) return

      setLines((prev) => {
        const emptyLine = prev.find((l) => l.TyreID === 0)
        if (emptyLine) {
          return prev.map((l) =>
            l.id === emptyLine.id
              ? { ...l, TyreID: tyre.Id, Price: tyre.ActualSellingPrice || 0, Qty: 1 }
              : l,
          )
        }
        return [
          ...prev,
          {
            id: uuidv4(),
            TyreID: tyre.Id,
            Price: tyre.ActualSellingPrice || 0,
            Discount: 0,
            Qty: 1,
            Suppliers: [],
          },
        ]
      })
    },
    [tyres],
  )

  return {
    formData,
    lines,
    tyres,
    sourceInquiry,
    initializing,
    submitting,
    error,
    updateField,
    addLine,
    removeLine,
    updateLine,
    setLineSuppliers,
    handleSubmit,
    reloadTyres,
    selectTyreForOrder,
  }
}
