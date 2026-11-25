import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { TyreRecord } from "../../master-data/tyres/models/tyre"
import type { StorageLocationRecord } from "../../master-data/storage-locations/models/storageLocation"
import type { CreateDagWithTyresPayload } from "../models/dag"
import { dagService } from "../services/dagService"
import { invoiceService } from "../../invoice/services/invoiceService"
import { customerService } from "../../master-data/customers/services/customerService"
import { tyreService } from "../../master-data/tyres/services/tyreService"
import { storageLocationService } from "../../master-data/storage-locations/services/storageLocationService"
import {
  WALKIN_CUSTOMER_FIELDS,
  createEmptyWalkinCustomer,
  sanitizeWalkinCustomerValue,
  validateWalkinCustomer,
  type WalkinCustomerFieldErrors,
  type WalkinCustomerFieldKey,
  type WalkinCustomerForm,
} from "../../../shared/walkinCustomer/models/walkinCustomer"

export type DagSerialForm = {
  SerialNumber: string
  DAGCost: number | null
}

export type DagLineForm = {
  RowId: number
  TyreID: number | ""
  StorageLocationID: number | ""
  RawSerialsString: string
  Serials: DagSerialForm[]
}

export const getLineQty = (line: DagLineForm): number =>
  line.Serials.filter((serial) => serial.SerialNumber.trim() !== "").length

export type DagFormState = {
  Date: string
  CustomerMode: "registered" | "walkin"
  CustomerID: number | ""
  WalkinCustomer: WalkinCustomerForm
  Comment: string
}

type UseDagFormOptions = {
  onSuccess?: () => void
  onError?: (message: string) => void
}

const createEmptySerial = (dagCost: number | null = null): DagSerialForm => ({
  SerialNumber: "",
  DAGCost: dagCost,
})

const createEmptyLine = (): DagLineForm => ({
  RowId: Date.now() + Math.floor(Math.random() * 1000),
  TyreID: "",
  StorageLocationID: "",
  RawSerialsString: "",
  Serials: [],
})

const createInitialState = (): DagFormState => ({
  Date: new Date().toISOString().slice(0, 10),
  CustomerMode: "registered",
  CustomerID: "",
  WalkinCustomer: createEmptyWalkinCustomer(),
  Comment: "",
})

export function useDagForm(options?: UseDagFormOptions) {
  const onSuccess = options?.onSuccess
  const onError = options?.onError

  const [formData, setFormData] = useState<DagFormState>(createInitialState)
  const [lines, setLines] = useState<DagLineForm[]>([createEmptyLine()])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [tyres, setTyres] = useState<TyreRecord[]>([])
  const [storageLocations, setStorageLocations] = useState<StorageLocationRecord[]>([])
  const [initializing, setInitializing] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [touchedWalkinFields, setTouchedWalkinFields] = useState<Partial<Record<WalkinCustomerFieldKey, boolean>>>({})
  const [error, setError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setInitializing(true)
    setError(null)

    try {
      const [customerRows, tyreRows, locationRows] = await Promise.all([
        customerService.getCustomers(),
        tyreService.getTyres(),
        storageLocationService.getStorageLocationsByLocationType(3),
      ])

      setCustomers(customerRows)
      setTyres(tyreRows)
      setStorageLocations(locationRows)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load DAG form options"
      setError(message)
      onError?.(message)
    } finally {
      setInitializing(false)
    }
  }, [onError])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const updateField = useCallback(
    <K extends keyof DagFormState>(field: K, value: DagFormState[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const reloadCustomers = useCallback(async () => {
    try {
      const customerRows = await customerService.getCustomers()
      setCustomers(customerRows)
      return customerRows
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load customers"
      setError(message)
      onError?.(message)
      return []
    }
  }, [onError])

  const selectCustomer = useCallback(
    (customerId: number) => {
      updateField("CustomerID", customerId)
    },
    [updateField],
  )

  const updateWalkinCustomer = useCallback((patch: Partial<WalkinCustomerForm>) => {
    const sanitized = Object.fromEntries(
      Object.entries(patch).map(([key, value]) => [
        key,
        value !== undefined ? sanitizeWalkinCustomerValue(key as WalkinCustomerFieldKey, value) : value,
      ]),
    ) as Partial<WalkinCustomerForm>

    setTouchedWalkinFields((prev) => {
      const next = { ...prev }
      Object.keys(patch).forEach((k) => {
        next[k as WalkinCustomerFieldKey] = true
      })
      return next
    })

    setFormData((prev) => ({
      ...prev,
      WalkinCustomer: { ...prev.WalkinCustomer, ...sanitized },
    }))
  }, [])

  const handleBlurWalkinCustomer = useCallback((fieldKey: WalkinCustomerFieldKey) => {
    setTouchedWalkinFields((prev) => ({ ...prev, [fieldKey]: true }))
  }, [])

  const setCustomerMode = useCallback(
    (mode: "registered" | "walkin") => {
      updateField("CustomerMode", mode)
      setSubmitAttempted(false)
    },
    [updateField],
  )

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()])
  }, [])

  const removeLine = useCallback((rowId: number) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.RowId !== rowId)))
  }, [])

  const updateLine = useCallback(
    <K extends keyof DagLineForm>(rowId: number, field: K, value: DagLineForm[K]) => {
      setLines((prev) => prev.map((line) => (line.RowId === rowId ? { ...line, [field]: value } : line)))
    },
    [],
  )

  const defaultCostForTyreId = useCallback(
    (tyreId: number | "") => {
      if (tyreId === "") {
        return null
      }

      return tyres.find((tyre) => tyre.Id === tyreId)?.DAGCost ?? null
    },
    [tyres],
  )

  const handleLineTyre = useCallback(
    (rowId: number, tyreId: number | "") => {
      const defaultCost = defaultCostForTyreId(tyreId)

      setLines((prev) =>
        prev.map((line) => {
          if (line.RowId !== rowId) {
            return line
          }

          // Apply the tyre's master DAG cost to serials that don't have one yet.
          const Serials = line.Serials.map((serial) =>
            serial.DAGCost === null ? { ...serial, DAGCost: defaultCost } : serial,
          )

          return { ...line, TyreID: tyreId, Serials }
        }),
      )
    },
    [defaultCostForTyreId],
  )

  const handleLineStorageLocation = useCallback((rowId: number, storageLocationId: number | "") => {
    updateLine(rowId, "StorageLocationID", storageLocationId)
  }, [updateLine])

  const handleLineSerials = useCallback((rowId: number, rawValue: string) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line

        // Automatically add a space after a comma for better UX
        let formattedValue = rawValue.replace(/,([^\s])/g, ", $1")
        if (rawValue.length > line.RawSerialsString.length && rawValue.endsWith(",")) {
          formattedValue += " "
        }

        const defaultCost = defaultCostForTyreId(line.TyreID)

        return {
          ...line,
          RawSerialsString: formattedValue,
          Serials: formattedValue
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((SerialNumber) => ({ SerialNumber, DAGCost: defaultCost })),
        }
      }),
    )
  }, [defaultCostForTyreId])

  const addLineSerial = useCallback((rowId: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line
        const newSerials = [...line.Serials, createEmptySerial(defaultCostForTyreId(line.TyreID))]
        return {
          ...line,
          Serials: newSerials,
          RawSerialsString: newSerials.map((s) => s.SerialNumber).join(", "),
        }
      }),
    )
  }, [defaultCostForTyreId])

  const removeLineSerial = useCallback((rowId: number, serialIndex: number) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.RowId !== rowId) return line
        const newSerials = line.Serials.filter((_, index) => index !== serialIndex)
        return {
          ...line,
          Serials: newSerials,
          RawSerialsString: newSerials.map((s) => s.SerialNumber).join(", "),
        }
      }),
    )
  }, [])

  const updateLineSerial = useCallback(
    (rowId: number, serialIndex: number, field: keyof DagSerialForm, value: string | number | null) => {
      setLines((prev) =>
        prev.map((line) => {
          if (line.RowId !== rowId) {
            return line
          }

          const serials = line.Serials.map((serial, index) => {
            if (index !== serialIndex) {
              return serial
            }

            return {
              ...serial,
              [field]: field === "DAGCost" ? (value === null || value === "" ? null : Number(value)) : String(value),
            }
          })

          return {
            ...line,
            Serials: serials,
            RawSerialsString: serials.map((s) => s.SerialNumber).join(", "),
          }
        }),
      )
    },
    [],
  )

  const handleLineSerialNumber = useCallback(
    (rowId: number, serialIndex: number, value: string) => {
      updateLineSerial(rowId, serialIndex, "SerialNumber", value)
    },
    [updateLineSerial],
  )

  const handleLineSerialCost = useCallback(
    (rowId: number, serialIndex: number, value: number | "") => {
      updateLineSerial(rowId, serialIndex, "DAGCost", value)
    },
    [updateLineSerial],
  )

  const walkinCustomerErrors = useMemo(() => {
    if (formData.CustomerMode !== "walkin") return {}
    const allErrors = validateWalkinCustomer(formData.WalkinCustomer)

    const visibleErrors: WalkinCustomerFieldErrors = {}
    for (const [key, message] of Object.entries(allErrors) as [WalkinCustomerFieldKey, string][]) {
      const isTouched = Boolean(touchedWalkinFields[key])
      const hasValue = Boolean(formData.WalkinCustomer[key]?.trim())
      if (submitAttempted || isTouched || hasValue) {
        visibleErrors[key] = message
      }
    }
    return visibleErrors
  }, [formData.CustomerMode, formData.WalkinCustomer, touchedWalkinFields, submitAttempted])

  const validate = useCallback(() => {
    if (formData.CustomerMode === "walkin") {
      const [firstError] = Object.values(validateWalkinCustomer(formData.WalkinCustomer))
      if (firstError) throw new Error(firstError)
    } else {
      if (!formData.CustomerID) {
        throw new Error("Customer is required")
      }
    }

    if (!formData.Date) {
      throw new Error("Date is required")
    }

    if (lines.length === 0) {
      throw new Error("At least one tyre line is required")
    }

    const selectedTyres = new Set<number>()

    lines.forEach((line, index) => {
      const row = index + 1

      if (!line.TyreID) {
        throw new Error(`Tyre is required on line ${row}`)
      }

      if (!line.StorageLocationID) {
        throw new Error(`Storage location is required on line ${row}`)
      }

      if (selectedTyres.has(line.TyreID)) {
        throw new Error(`Duplicate tyre selected on line ${row}`)
      }

      const validSerialNumbers = line.Serials.map((s) => s.SerialNumber.trim()).filter(Boolean)
      if (validSerialNumbers.length === 0) {
        throw new Error(`Line ${row}: At least one serial number is required`)
      }
      if (new Set(validSerialNumbers).size !== validSerialNumbers.length) {
        throw new Error(`Line ${row}: Duplicate serial numbers detected`)
      }

      line.Serials.forEach((serial, serialIndex) => {
        if (serial.SerialNumber.trim() === "") {
          throw new Error(`Line ${row}: Serial ${serialIndex + 1} requires a serial number`)
        }
        // if (serial.DAGCost === null || Number.isNaN(serial.DAGCost) || serial.DAGCost < 0) {
        //   throw new Error(`Line ${row}: Serial ${serialIndex + 1} requires a valid cost`)
        // }
      })

      selectedTyres.add(line.TyreID)
    })
  }, [formData.CustomerMode, formData.CustomerID, formData.WalkinCustomer, formData.Date, lines])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitAttempted(true)
      setSubmitting(true)
      setError(null)

      try {
        validate()

        const isWalkin = formData.CustomerMode === "walkin"

        const walkinPayload = Object.fromEntries(
          WALKIN_CUSTOMER_FIELDS.map((field) => {
            const value = formData.WalkinCustomer[field.key].trim()
            return [field.key, value === "" ? undefined : value]
          }),
        )

        const payload: CreateDagWithTyresPayload = {
          CustomerID: isWalkin ? null : Number(formData.CustomerID),
          ...(isWalkin ? walkinPayload : {}),
          Date: formData.Date,
          Comment: formData.Comment.trim() || null,
          Tyres: lines.map((line) => ({
            DAGID: 0,
            TyreID: Number(line.TyreID),
            StorageLocationID: Number(line.StorageLocationID),
            Qty: getLineQty(line),
            Serials: line.Serials.map((s) => ({
              SerialNumber: s.SerialNumber.trim(),
              DAGCost: s.DAGCost,
            })),
          })),
        }

        const result = await dagService.createDAGWithTyres(payload)
        const createdDagId = result?.dag?.ID ?? (result as any)?.ID
        if (createdDagId && (payload as any).Payment) {
          try {
            await invoiceService.generateFromDAG(createdDagId)
          } catch (invErr) {
            console.warn("Auto-invoicing on DAG create note:", invErr)
          }
        }
        onSuccess?.()
        setFormData(createInitialState())
        setLines([createEmptyLine()])
        setTouchedWalkinFields({})
        setSubmitAttempted(false)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create DAG"
        setError(message)
        onError?.(message)
      } finally {
        setSubmitting(false)
      }
    },
    [
      formData.Comment,
      formData.CustomerID,
      formData.CustomerMode,
      formData.Date,
      formData.WalkinCustomer,
      lines,
      onError,
      onSuccess,
      validate,
    ],
  )

  const totalQuantity = useMemo(() => lines.reduce((sum, line) => sum + getLineQty(line), 0), [lines])

  return {
    formData,
    customerMode: formData.CustomerMode,
    setCustomerMode,
    updateWalkinCustomer,
    handleBlurWalkinCustomer,
    walkinCustomerErrors,
    lines,
    customers,
    tyres,
    storageLocations,
    initializing,
    submitting,
    error,
    totalQuantity,
    updateField,
    reloadCustomers,
    selectCustomer,
    addLine,
    removeLine,
    handleLineTyre,
    handleLineStorageLocation,
    handleLineSerials,
    addLineSerial,
    removeLineSerial,
    handleLineSerialNumber,
    handleLineSerialCost,
    handleSubmit,
  }
}
