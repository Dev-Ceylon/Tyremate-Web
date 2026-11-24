import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { BatteryRecord } from "../../master-data/batteries/models/battery"
import { salesOrderService } from "../services/salesOrderService"
import type {
  CreateSalesOrderWithAutoPOResult,
  StorageAllocationInput,
  SalesOrderPaymentInput,
} from "../models/salesOrder"
import { inquiryService } from "../../inquiry/services/inquiryService"
import type { InquiryRecord } from "../../inquiry/models/inquiry"
import {
  SO_CATEGORIES,
  type SOCategory,
} from "../../../shared/constants/soCategoryConstants"
import {
  calculateLineTotal,
  calculateNeedToOrderQty,
  getAvailableQuantity,
} from "../utils/salesOrderCalculations"
import {
  WALKIN_CUSTOMER_FIELDS,
  createEmptyWalkinCustomer,
  sanitizeWalkinCustomerValue,
  validateWalkinCustomer,
  type WalkinCustomerFieldKey,
  type WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"

export type SalesOrderLineForm = {
  RowId: number
  TyreID: number | ""
  BatteryID?: number | ""
  Price: number
  MRP_WithVAT: number
  Discount: number
  MaxDiscount: number | null
  Qty: number
  Allocations: StorageAllocationInput[]
  AllocationsVersion: number
  NeedToOrderQty: number
  TakeNowQty: number
  LineTotal: number | null
}

// How many of a line are physically on hand (reserved stock) and therefore can
// be handed over today. Anything to-order can only be collected later.
export const getCollectableQty = (line: Pick<SalesOrderLineForm, "Qty" | "NeedToOrderQty">): number =>
  Math.max(0, line.Qty - line.NeedToOrderQty)

type SalesOrderFormState = {
  Date: string
  Category: SOCategory
  CustomerMode: "registered" | "walkin"
  CustomerID: number | ""
  WalkinCustomer: WalkinCustomerForm
}

type UseSalesOrderFormOptions = {
  onError?: (message: string) => void
  inquiryId?: number | null
}

const createEmptyLine = (category: SOCategory = "tyre", itemId: number | "" = ""): SalesOrderLineForm => ({
  RowId: Date.now() + Math.floor(Math.random() * 1000),
  TyreID: category === "tyre" ? itemId : "",
  BatteryID: category === "battery" ? itemId : "",
  Price: 0,
  MRP_WithVAT: 0,
  Discount: 0,
  MaxDiscount: null,
  Qty: 1,
  Allocations: [{ StorageManagerID: null, StorageManagerBatchID: null, Qty: 1 }],
  AllocationsVersion: 0,
  NeedToOrderQty: 0,
  TakeNowQty: 1,
  LineTotal: null,
})

const createInitialState = (): SalesOrderFormState => ({
  Date: new Date().toISOString().slice(0, 10),
  Category: SO_CATEGORIES.TYRE,
  CustomerMode: "registered",
  CustomerID: "",
  WalkinCustomer: createEmptyWalkinCustomer(),
})

export function useSalesOrderForm(options?: UseSalesOrderFormOptions) {
  const onError = options?.onError
  const inquiryId = options?.inquiryId ?? null
  const [formData, setFormData] = useState<SalesOrderFormState>(createInitialState)
  const [lines, setLines] = useState<SalesOrderLineForm[]>([createEmptyLine()])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [batteries, setBatteries] = useState<BatteryRecord[]>([])
  const [initializing, setInitializing] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingTyres, setLoadingTyres] = useState(false)
  const [loadingBatteries, setLoadingBatteries] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyInquiryPrefill = useCallback(
    (inquiry: InquiryRecord, tyreRows: TyreRecord[], batteryRows: BatteryRecord[]) => {
      const customer = inquiry.Customer

      if (customer?.IsWalkinCustomer) {
        setFormData((prev) => ({
          ...prev,
          Date: new Date().toISOString().slice(0, 10),
          CustomerMode: "walkin",
          CustomerID: "",
          WalkinCustomer: {
            CustomerName: customer.CustomerName ?? "",
            CustomerPhone: customer.CustomerPhone ?? "",
            CustomerAddress: customer.CustomerAddress ?? "",
            CustomerEmail: customer.CustomerEmail ?? "",
            VehicleNumber: customer.VehicleNumber ?? "",
            TinNo: customer.TinNo ?? "",
            VatNo: customer.VatNo ?? "",
          },
        }))
      } else if (inquiry.CustomerID) {
        setFormData((prev) => ({
          ...prev,
          CustomerMode: "registered",
          CustomerID: inquiry.CustomerID ?? "",
          WalkinCustomer: createEmptyWalkinCustomer(),
        }))
      }

      const isBatteryInquiry = (inquiry.Category || "tyre").toLowerCase() === "battery"
      setFormData((prev) => ({
        ...prev,
        Category: isBatteryInquiry ? "battery" : "tyre",
      }))

      if (isBatteryInquiry) {
        if (Array.isArray(inquiry.batteries) && inquiry.batteries.length > 0) {
          const baseRowId = Date.now()

          const prefilled = inquiry.batteries.map((b, index) => {
            const qty = Number(b.Qty) || 1
            const battery = batteryRows.find((row) => row.Id === b.BatteryID)
            const availableQty = getAvailableQuantity(battery)
            const needToOrderQty = calculateNeedToOrderQty(qty, availableQty)
            const mrpWithVat = Number((battery as any)?.MRP_WithVAT ?? 0) || 0
            const maxDiscount =
              (battery as any)?.DiscountOffered !== null && (battery as any)?.DiscountOffered !== undefined
                ? Number((battery as any).DiscountOffered)
                : null

            return {
              RowId: baseRowId + index,
              TyreID: "" as const,
              BatteryID: b.BatteryID,
              Price: Number(b.Price ?? (battery as any)?.SellingPrice ?? (battery as any)?.Price ?? 0) || 0,
              MRP_WithVAT: mrpWithVat,
              Discount: Number(b.Discount ?? 0) || 0,
              MaxDiscount: maxDiscount,
              Qty: qty,
              Allocations: [{ StorageManagerID: null, StorageManagerBatchID: null, Qty: qty }],
              AllocationsVersion: 0,
              NeedToOrderQty: needToOrderQty,
              TakeNowQty: Math.max(0, qty - needToOrderQty),
              LineTotal: null,
            }
          })

          setLines(prefilled)
        }
      } else {
        if (Array.isArray(inquiry.tyres) && inquiry.tyres.length > 0) {
          const baseRowId = Date.now()

          const prefilled = inquiry.tyres.map((t, index) => {
            const qty = Number(t.Qty) || 1
            const tyre = tyreRows.find((row) => row.Id === t.TyreID)
            const availableQty = getAvailableQuantity(tyre)
            const needToOrderQty = calculateNeedToOrderQty(qty, availableQty)
            const mrpWithVat = Number((tyre as any)?.MRP_WithVAT ?? 0) || 0
            const maxDiscount =
              tyre?.DiscountOffered !== null && tyre?.DiscountOffered !== undefined
                ? Number(tyre.DiscountOffered)
                : null

            return {
              RowId: baseRowId + index,
              TyreID: t.TyreID,
              BatteryID: undefined,
              Price: Number(t.Price ?? tyre?.ActualSellingPrice ?? 0) || 0,
              MRP_WithVAT: mrpWithVat,
              Discount: Number(t.Discount ?? 0) || 0,
              MaxDiscount: maxDiscount,
              Qty: qty,
              Allocations: [{ StorageManagerID: null, StorageManagerBatchID: null, Qty: qty }],
              AllocationsVersion: 0,
              NeedToOrderQty: needToOrderQty,
              TakeNowQty: Math.max(0, qty - needToOrderQty),
              LineTotal: null,
            }
          })

          setLines(prefilled)
        }
      }
    },
    [],
  )

  const loadOptions = useCallback(async () => {
    setInitializing(true)
    setLoadingCustomers(true)
    setLoadingTyres(true)
    setLoadingBatteries(true)
    setError(null)

    try {
      const [customerRows, tyreRows, batteryRows, sourceInquiry] = await Promise.all([
        salesOrderService.getCustomers(),
        salesOrderService.getTyres(),
        salesOrderService.getBatteries ? salesOrderService.getBatteries() : Promise.resolve([]),
        inquiryId ? inquiryService.getInquiryById(inquiryId) : Promise.resolve(null),
      ])

      setCustomers(customerRows)
      setTyres(tyreRows)
      setBatteries(batteryRows)

      if (sourceInquiry) {
        applyInquiryPrefill(sourceInquiry, tyreRows, batteryRows)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load sales order options"
      setError(message)
      onError?.(message)
    } finally {
      setInitializing(false)
      setLoadingCustomers(false)
      setLoadingTyres(false)
      setLoadingBatteries(false)
    }
  }, [onError, inquiryId, applyInquiryPrefill])

  const reloadCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    try {
      const customerRows = await salesOrderService.getCustomers()
      setCustomers(customerRows)
      return customerRows
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers"
      setError(message)
      onError?.(message)
      return []
    } finally {
      setLoadingCustomers(false)
    }
  }, [onError])

  const reloadTyres = useCallback(async () => {
    setLoadingTyres(true)
    try {
      const tyreRows = await salesOrderService.getTyres()
      setTyres(tyreRows)
      return tyreRows
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tyres"
      setError(message)
      onError?.(message)
      return []
    } finally {
      setLoadingTyres(false)
    }
  }, [onError])

  const reloadBatteries = useCallback(async () => {
    setLoadingBatteries(true)
    try {
      const batteryRows = await salesOrderService.getBatteries()
      setBatteries(batteryRows)
      return batteryRows
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load batteries"
      setError(message)
      onError?.(message)
      return []
    } finally {
      setLoadingBatteries(false)
    }
  }, [onError])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const updateField = useCallback(
    <K extends keyof SalesOrderFormState>(field: K, value: SalesOrderFormState[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const setCategory = useCallback(
    (newCat: SOCategory) => {
      setFormData((prev) => ({ ...prev, Category: newCat }))
      setLines([createEmptyLine(newCat)])
    },
    [],
  )

  const updateWalkinCustomer = useCallback((patch: Partial<WalkinCustomerForm>) => {
    const sanitized = Object.fromEntries(
      Object.entries(patch).map(([key, value]) => [
        key,
        sanitizeWalkinCustomerValue(key as WalkinCustomerFieldKey, value),
      ]),
    ) as Partial<WalkinCustomerForm>

    setFormData((prev) => ({
      ...prev,
      WalkinCustomer: { ...prev.WalkinCustomer, ...sanitized },
    }))
  }, [])

  const setCustomerMode = useCallback(
    (mode: "registered" | "walkin") => updateField("CustomerMode", mode),
    [updateField],
  )

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine(formData.Category)])
  }, [formData.Category])

  const removeLine = useCallback((rowId: number) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.RowId !== rowId)))
  }, [])

  const updateLine = useCallback(
    <K extends keyof SalesOrderLineForm>(rowId: number, field: K, value: SalesOrderLineForm[K]) => {
      setLines((prev) =>
        prev.map((line) => (line.RowId === rowId ? { ...line, [field]: value } : line)),
      )
    },
    [],
  )

  const setLineTyre = useCallback((rowId: number, tyreId: number | "") => {
    const selectedTyre =
      tyreId === ""
        ? null
        : tyres.find((tyre) => tyre.Id === tyreId) ?? null
    const sellingPrice = Number(selectedTyre?.ActualSellingPrice ?? 0) || 0
    const mrpWithVat = Number((selectedTyre as any)?.MRP_WithVAT ?? 0) || 0
    const maxDiscount =
      selectedTyre?.DiscountOffered !== null && selectedTyre?.DiscountOffered !== undefined
        ? Number(selectedTyre.DiscountOffered)
        : null
    const availableQty = getAvailableQuantity(selectedTyre)

    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line

        const needToOrderQty = calculateNeedToOrderQty(line.Qty, availableQty)

        return {
          ...line,
          TyreID: tyreId,
          Price: sellingPrice,
          MRP_WithVAT: mrpWithVat,
          MaxDiscount: maxDiscount,
          NeedToOrderQty: needToOrderQty,
          TakeNowQty: Math.max(0, line.Qty - needToOrderQty),
        }
      }),
    )
  }, [tyres])

  const setLineBattery = useCallback((rowId: number, batteryId: number | "") => {
    const selectedBattery =
      batteryId === ""
        ? null
        : batteries.find((battery) => battery.Id === batteryId) ?? null
    const sellingPrice = Number(selectedBattery?.ActualSellingPrice ?? 0) || 0
    const mrpWithVat = Number((selectedBattery as any)?.MRP_WithVAT ?? 0) || 0
    const maxDiscount =
      selectedBattery?.DiscountOffered !== null && selectedBattery?.DiscountOffered !== undefined
        ? Number(selectedBattery.DiscountOffered)
        : null
    const availableQty = getAvailableQuantity(selectedBattery)

    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line

        const needToOrderQty = calculateNeedToOrderQty(line.Qty, availableQty)

        return {
          ...line,
          BatteryID: batteryId,
          Price: sellingPrice,
          MRP_WithVAT: mrpWithVat,
          MaxDiscount: maxDiscount,
          NeedToOrderQty: needToOrderQty,
          TakeNowQty: Math.max(0, line.Qty - needToOrderQty),
        }
      }),
    )
  }, [batteries])

  const onChangeLineQty = useCallback((rowId: number, value: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line

        const isBattery = formData.Category === "battery"
        const selectedItem = isBattery
          ? batteries.find((b) => b.Id === line.BatteryID)
          : tyres.find((t) => t.Id === line.TyreID)
        const availableQty = getAvailableQuantity(selectedItem)
        const needToOrderQty = calculateNeedToOrderQty(value, availableQty)

        return {
          ...line,
          Qty: value,
          Allocations: [{ StorageManagerID: null, StorageManagerBatchID: null, Qty: value }],
          NeedToOrderQty: needToOrderQty,
          TakeNowQty: Math.max(0, value - needToOrderQty),
        }
      }),
    )
  }, [tyres, batteries, formData.Category])

  // Commits explicit lot quantities picked in the Quantity Manager. Qty always
  // equals the sum of the allocation quantities and, once committed, the Qty
  // input is remounted (via AllocationsVersion) to show the new total. The
  // line's Take Now follows the per-lot take-now the user picked in the modal.
  const setLineAllocations = useCallback(
    (rowId: number, allocations: StorageAllocationInput[]) => {
      setLines((prev) =>
        prev.map((line) => {
          if (line.RowId !== rowId) return line

          const total = allocations.reduce((sum, allocation) => sum + allocation.Qty, 0)
          const takeNowTotal = allocations.reduce(
            (sum, allocation) => sum + (allocation.TakeNowQty ?? 0),
            0,
          )
          const isBattery = formData.Category === "battery"
          const selectedItem = isBattery
            ? batteries.find((b) => b.Id === line.BatteryID)
            : tyres.find((t) => t.Id === line.TyreID)
          const availableQty = getAvailableQuantity(selectedItem)
          const needToOrderQty = calculateNeedToOrderQty(total, availableQty)
          const collectable = Math.max(0, total - needToOrderQty)

          return {
            ...line,
            Allocations: allocations,
            Qty: total,
            AllocationsVersion: line.AllocationsVersion + 1,
            NeedToOrderQty: needToOrderQty,
            TakeNowQty: Math.min(takeNowTotal, collectable),
          }
        }),
      )
    },
    [tyres, batteries, formData.Category],
  )

  // Editing the line-level Take Now redistributes the take-now across the
  // line's allocations (oldest allocation first) so the per-lot values sent to
  // the backend always match what the user sees.
  const onChangeLineTakeNow = useCallback((rowId: number, value: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line

        const collectable = Math.max(0, line.Qty - line.NeedToOrderQty)
        const clamped = Math.min(Math.max(0, Math.floor(Number(value) || 0)), collectable)

        let remaining = clamped
        const allocations = line.Allocations.map((allocation) => {
          const takeNow = Math.min(remaining, allocation.Qty)
          remaining -= takeNow
          return { ...allocation, TakeNowQty: takeNow }
        })

        return { ...line, TakeNowQty: clamped, Allocations: allocations }
      }),
    )
  }, [])

  const selectTyreForOrder = useCallback((tyreId: number) => {
    const selectedTyre = tyres.find((tyre) => tyre.Id === tyreId) ?? null
    const sellingPrice = Number(selectedTyre?.ActualSellingPrice ?? 0) || 0
    const mrpWithVat = Number((selectedTyre as any)?.MRP_WithVAT ?? 0) || 0
    const maxDiscount =
      selectedTyre?.DiscountOffered !== null && selectedTyre?.DiscountOffered !== undefined
        ? Number(selectedTyre.DiscountOffered)
        : null
    const availableQty = getAvailableQuantity(selectedTyre)

    setLines((prev) => {
      const firstEmpty = prev.findIndex((line) => line.TyreID === "")

      if (firstEmpty >= 0) {
        return prev.map((line, index) => {
          if (index !== firstEmpty) return line

          const needToOrderQty = calculateNeedToOrderQty(line.Qty, availableQty)

          return {
            ...line,
            TyreID: tyreId,
            Price: sellingPrice,
            MRP_WithVAT: mrpWithVat,
            MaxDiscount: maxDiscount,
            NeedToOrderQty: needToOrderQty,
            TakeNowQty: Math.max(0, line.Qty - needToOrderQty),
          }
        })
      }

      const needToOrderQty = calculateNeedToOrderQty(1, availableQty)
      return [
        ...prev,
        {
          ...createEmptyLine("tyre", tyreId),
          Price: sellingPrice,
          MRP_WithVAT: mrpWithVat,
          MaxDiscount: maxDiscount,
          NeedToOrderQty: needToOrderQty,
          TakeNowQty: Math.max(0, 1 - needToOrderQty),
        },
      ]
    })
  }, [tyres])

  const selectBatteryForOrder = useCallback((batteryId: number) => {
    const selectedBattery = batteries.find((battery) => battery.Id === batteryId) ?? null
    const sellingPrice = Number(selectedBattery?.ActualSellingPrice ?? 0) || 0
    const mrpWithVat = Number((selectedBattery as any)?.MRP_WithVAT ?? 0) || 0
    const maxDiscount =
      selectedBattery?.DiscountOffered !== null && selectedBattery?.DiscountOffered !== undefined
        ? Number(selectedBattery.DiscountOffered)
        : null
    const availableQty = getAvailableQuantity(selectedBattery)

    setLines((prev) => {
      const firstEmpty = prev.findIndex((line) => !line.BatteryID)

      if (firstEmpty >= 0) {
        return prev.map((line, index) => {
          if (index !== firstEmpty) return line

          const needToOrderQty = calculateNeedToOrderQty(line.Qty, availableQty)

          return {
            ...line,
            BatteryID: batteryId,
            Price: sellingPrice,
            MRP_WithVAT: mrpWithVat,
            MaxDiscount: maxDiscount,
            NeedToOrderQty: needToOrderQty,
            TakeNowQty: Math.max(0, line.Qty - needToOrderQty),
          }
        })
      }

      const needToOrderQty = calculateNeedToOrderQty(1, availableQty)
      return [
        ...prev,
        {
          ...createEmptyLine("battery", batteryId),
          Price: sellingPrice,
          MRP_WithVAT: mrpWithVat,
          MaxDiscount: maxDiscount,
          NeedToOrderQty: needToOrderQty,
          TakeNowQty: Math.max(0, 1 - needToOrderQty),
        },
      ]
    })
  }, [batteries])

  const totalAmount = useMemo(() => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0)
  }, [lines])

  const walkinCustomerErrors = useMemo(() => {
    if (formData.CustomerMode !== "walkin") return {}
    return validateWalkinCustomer(formData.WalkinCustomer)
  }, [formData.CustomerMode, formData.WalkinCustomer])

  const resetForm = useCallback(() => {
    setFormData(createInitialState())
    setLines([createEmptyLine(formData.Category)])
    setError(null)
  }, [formData.Category])

  const validate = useCallback(() => {
    if (formData.CustomerMode === "registered" && !formData.CustomerID) {
      throw new Error("Customer is required")
    }

    if (formData.CustomerMode === "walkin") {
      const [firstError] = Object.values(validateWalkinCustomer(formData.WalkinCustomer))
      if (firstError) throw new Error(firstError)
    }

    if (!formData.Date) {
      throw new Error("Date is required")
    }

    const isBattery = formData.Category === "battery"
    if (lines.length === 0) {
      throw new Error(`At least one ${isBattery ? "battery" : "tyre"} line is required`)
    }

    const selectedItems = new Set<number>()

    lines.forEach((line, index) => {
      const row = index + 1
      const itemId = isBattery ? line.BatteryID : line.TyreID

      if (!itemId) {
        throw new Error(`${isBattery ? "Battery" : "Tyre"} is required on line ${row}`)
      }

      if (selectedItems.has(Number(itemId))) {
        throw new Error(`Duplicate ${isBattery ? "battery" : "tyre"} selected on line ${row}`)
      }

      selectedItems.add(Number(itemId))

      if (!Number.isInteger(line.Qty) || line.Qty <= 0) {
        throw new Error(`Qty must be greater than 0 on line ${row}`)
      }

      if (line.Price < 0 || line.MRP_WithVAT < 0 || line.Discount < 0 || line.NeedToOrderQty < 0) {
        throw new Error(`Numeric values cannot be negative on line ${row}`)
      }

      if (line.Discount > 100) {
        throw new Error(`Discount cannot exceed 100% on line ${row}`)
      }

      const collectable = Math.max(0, line.Qty - line.NeedToOrderQty)
      if (line.TakeNowQty < 0 || line.TakeNowQty > collectable) {
        throw new Error(
          `Take now qty must be between 0 and ${collectable} (in stock) on line ${row}`,
        )
      }
    })
  }, [formData.CustomerMode, formData.CustomerID, formData.WalkinCustomer, formData.Date, formData.Category, lines])

  const submitOrder = useCallback(
    async (payment?: SalesOrderPaymentInput): Promise<CreateSalesOrderWithAutoPOResult | null> => {
      setSubmitting(true)
      setError(null)

      try {
        validate()

        const isBattery = formData.Category === "battery"
        const isAdminApproved = 1
        const isCompleted = isAdminApproved === 1 && lines.every((line) => line.NeedToOrderQty === 0) ? 1 : 0

        const payloadLines = lines.map((line) => ({
          ...(isBattery
            ? { BatteryID: Number(line.BatteryID), TyreID: null }
            : { TyreID: Number(line.TyreID), BatteryID: null }),
          Price: line.Price,
          MRP_WithVAT: line.MRP_WithVAT,
          Discount: line.Discount,
          Allocations: line.Allocations.length > 0
            ? line.Allocations.map((allocation) => ({ ...allocation }))
            : [{ StorageManagerID: null, StorageManagerBatchID: null, Qty: line.Qty }],
          NeedToOrderQty: line.NeedToOrderQty,
          TakeNowQty: line.TakeNowQty,
          IsAdminApproved: 0,
        }))

        const isWalkin = formData.CustomerMode === "walkin"

        const walkinPayload = Object.fromEntries(
          WALKIN_CUSTOMER_FIELDS.map((field) => {
            const value = formData.WalkinCustomer[field.key].trim()
            return [field.key, value === "" ? undefined : value]
          }),
        )

        const result = await salesOrderService.createSalesOrder({
          Date: formData.Date,
          Category: formData.Category,
          InquiryID: inquiryId ?? undefined,
          CustomerID: isWalkin ? null : Number(formData.CustomerID),
          ...(isWalkin ? walkinPayload : {}),
          IsAdminApproved: isAdminApproved,
          IsCompleted: isCompleted,
          Lines: payloadLines,
          Payment: payment,
        })

        // Auto-print disabled per user request
        // if (selectedPrinter) {
        //   try {
        //     await printSalesOrder(result.so.SoID, selectedPrinter)
        //   } catch (printErr) {
        //     console.error("Failed to print sales order:", printErr)
        //   }
        // }

        resetForm()
        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create sales order"
        setError(message)
        onError?.(message)
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [formData, lines, onError, resetForm, validate, inquiryId],
  )

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void submitOrder()
    },
    [submitOrder],
  )

  return {
    formData,
    lines,
    customers,
    tyres,
    batteries,
    initializing,
    loadingCustomers,
    loadingTyres,
    loadingBatteries,
    submitting,
    error,
    totalAmount,
    updateField,
    setCategory,
    reloadCustomers,
    reloadTyres,
    reloadBatteries,
    addLine,
    removeLine,
    updateLine,
    onChangeLineQty,
    onChangeLineTakeNow,
    setLineAllocations,
    selectCustomer: (customerId: number) => updateField("CustomerID", customerId),
    setCustomerMode,
    selectTyreForOrder,
    selectBatteryForOrder,
    setLineTyre,
    setLineBattery,
    updateWalkinCustomer,
    walkinCustomerErrors,
    submitOrder,
    handleSubmit,
  }
}
