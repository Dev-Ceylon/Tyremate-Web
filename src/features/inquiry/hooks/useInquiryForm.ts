import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import { salesOrderService } from "../../sales-order/services/salesOrderService"
import { inquiryService } from "../services/inquiryService"
import {
  createEmptyWalkinCustomer,
  sanitizeWalkinCustomerValue,
  validateWalkinCustomer,
  type WalkinCustomerFieldErrors,
  type WalkinCustomerFieldKey,
  type WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"

export type InquiryLineForm = {
  RowId: number
  TyreID: number | ""
  Price: number
  Discount: number
  Qty: number
}

type InquiryFormState = {
  Date: string
  CustomerMode: "registered" | "walkin"
  CustomerID: number | ""
  WalkinCustomer: WalkinCustomerForm
  Notes: string
}

type UseInquiryFormOptions = {
  onSuccess?: () => void
  onError?: (message: string) => void
}

const createEmptyLine = (tyreId: number | "" = ""): InquiryLineForm => ({
  RowId: Date.now() + Math.floor(Math.random() * 1000),
  TyreID: tyreId,
  Price: 0,
  Discount: 0,
  Qty: 1,
})

const createInitialState = (): InquiryFormState => ({
  Date: new Date().toISOString().slice(0, 10),
  CustomerMode: "registered",
  CustomerID: "",
  WalkinCustomer: createEmptyWalkinCustomer(),
  Notes: "",
})

export function useInquiryForm(options?: UseInquiryFormOptions) {
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<InquiryFormState>(createInitialState())
  const [walkinCustomerErrors, setWalkinCustomerErrors] = useState<WalkinCustomerFieldErrors>({})
  const [lines, setLines] = useState<InquiryLineForm[]>([createEmptyLine()])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [initializing, setInitializing] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setInitializing(true)
    setError(null)
    try {
      const [customerRows, tyreRows] = await Promise.all([
        salesOrderService.getCustomers(),
        salesOrderService.getTyres(),
      ])
      setCustomers(customerRows)
      setTyres(tyreRows)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load options"
      setError(msg)
      onError?.(msg)
    } finally {
      setInitializing(false)
    }
  }, [onError])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const updateField = useCallback(<K extends keyof InquiryFormState>(field: K, value: InquiryFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()])
  }, [])

  const removeLine = useCallback((rowId: number) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.RowId !== rowId)))
  }, [])

  const updateLine = useCallback(<K extends keyof InquiryLineForm>(rowId: number, field: K, value: InquiryLineForm[K]) => {
    setLines((prev) => prev.map((l) => (l.RowId === rowId ? { ...l, [field]: value } : l)))
  }, [])

  const setLineTyre = useCallback((rowId: number, tyreId: number | "") => {
    const selectedTyre = tyreId === "" ? null : tyres.find((t) => t.Id === tyreId) ?? null
    const sellingPrice = Number(selectedTyre?.ActualSellingPrice ?? 0) || 0

    setLines((prev) =>
      prev.map((l) =>
        l.RowId === rowId
          ? {
              ...l,
              TyreID: tyreId,
              Price: sellingPrice,
            }
          : l,
      ),
    )
  }, [tyres])

  const changeCustomerMode = useCallback((mode: "registered" | "walkin") => {
    setFormData((prev) => ({ ...prev, CustomerMode: mode }))
    setWalkinCustomerErrors({})
  }, [])

  const changeWalkinCustomer = useCallback((patch: Partial<WalkinCustomerForm>) => {
    setFormData((prev) => ({
      ...prev,
      WalkinCustomer: Object.fromEntries(
        Object.entries({ ...prev.WalkinCustomer, ...patch }).map(([key, value]) => [
          key,
          sanitizeWalkinCustomerValue(key as WalkinCustomerFieldKey, value),
        ]),
      ) as WalkinCustomerForm,
    }))
    setWalkinCustomerErrors({})
  }, [])

  const validate = useCallback(() => {
    if (!formData.Date) throw new Error("Reminder Date is required")
    if (lines.length === 0) throw new Error("At least one tyre line is required")

    if (formData.CustomerMode === "registered") {
      if (!formData.CustomerID) throw new Error("Customer is required")
    } else {
      const errors = validateWalkinCustomer(formData.WalkinCustomer)
      setWalkinCustomerErrors(errors)
      const firstError = Object.values(errors)[0]
      if (firstError) throw new Error(firstError)
    }

    const selectedTyres = new Set<number>()

    lines.forEach((line, index) => {
      const row = index + 1
      if (!line.TyreID) throw new Error(`Tyre is required on line ${row}`)
      if (selectedTyres.has(line.TyreID)) throw new Error(`Duplicate tyre selected on line ${row}`)
      selectedTyres.add(line.TyreID)

      if (line.Qty <= 0) throw new Error(`Qty must be greater than 0 on line ${row}`)
      if (line.Price < 0 || line.Discount < 0) throw new Error(`Numeric values cannot be negative on line ${row}`)
      if (line.Discount > 100) throw new Error(`Discount cannot exceed 100% on line ${row}`)
    })
  }, [formData, lines])

  const handleSubmit = useCallback(async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      validate()

      const isWalkin = formData.CustomerMode === "walkin"

      await inquiryService.createInquiry({
        ReminderDate: formData.Date,
        CustomerID: isWalkin ? null : Number(formData.CustomerID),
        ...(isWalkin ? { WalkinCustomer: formData.WalkinCustomer } : {}),
        Notes: formData.Notes,
        IsAdminApproved: 0,
        ConvertedSOID: null,
        tyres: lines.map((l) => ({
          TyreID: Number(l.TyreID),
          Price: l.Price,
          Discount: l.Discount,
          Qty: l.Qty,
          IsAdminApproved: 0,
        })),
      })

      onSuccess?.()
      setFormData(createInitialState())
      setWalkinCustomerErrors({})
      setLines([createEmptyLine()])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create inquiry"
      setError(msg)
      onError?.(msg)
    } finally {
      setSubmitting(false)
    }
  }, [formData, lines, validate, onSuccess, onError])

  const reloadCustomers = async () => {
    const rows = await salesOrderService.getCustomers()
    setCustomers(rows)
  }

  const reloadTyres = async () => {
    const rows = await salesOrderService.getTyres()
    setTyres(rows)
  }

  return {
    formData,
    lines,
    customers,
    tyres,
    initializing,
    submitting,
    error,
    walkinCustomerErrors,
    updateField,
    addLine,
    removeLine,
    updateLine,
    setLineTyre,
    reloadCustomers,
    reloadTyres,
    changeCustomerMode,
    changeWalkinCustomer,
    selectCustomer: (id: number) => updateField("CustomerID", id),
    selectTyreForInquiry: (tyreId: number) => {
      const firstEmpty = lines.findIndex((l) => l.TyreID === "")
      if (firstEmpty >= 0) setLineTyre(lines[firstEmpty].RowId, tyreId)
      else setLines((prev) => [...prev, createEmptyLine(tyreId)])
    },
    handleSubmit,
  }
}
