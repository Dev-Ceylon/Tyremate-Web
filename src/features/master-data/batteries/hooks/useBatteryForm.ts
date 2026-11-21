import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { SupplierRecord } from "../../suppliers/models/supplier"
import { supplierService } from "../../suppliers/services/supplierService"
import type { BatteryPayload, BatteryRecord } from "../models/battery"
import { batteryService } from "../services/batteryService"

const initialFormState: BatteryPayload = {
  Brand: "",
  Model: "",
  Series: "",
  Voltage: "",
  Capacity: "",
  Technology: "",
  Application: "",
  WarrantyMonths: null,
  BatchCode: "",
  SupplierIDs: [],
  PriceValidityFrom: "",
  PriceValidityTo: "",
  PurchasedPrice: null,
  DiscountOffered: null,
  DiscountAmount: null,
  MRP_WithoutVAT: null,
  MRP_WithVAT: null,
  ActualSellingPrice: null,
}

type UseBatteryFormOptions = {
  batteryId?: number
  autoLoad?: boolean
  onSuccess?: (createdBattery?: BatteryRecord | null) => void
  onError?: (message: string) => void
}

export function useBatteryForm(options?: UseBatteryFormOptions) {
  const batteryId = options?.batteryId
  const autoLoad = options?.autoLoad ?? true
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<BatteryPayload>(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const loadSuppliers = useCallback(
    async (isActive: () => boolean = () => true) => {
      try {
        const supplierRows = await supplierService.getSuppliers()

        if (!isActive()) {
          return
        }

        setSuppliers(supplierRows)
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load suppliers"
        setError(message)
        onError?.(message)
      }
    },
    [onError]
  )

  const loadBattery = useCallback(
    async (currentBatteryId: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const [battery, supplierRows] = await Promise.all([
          batteryService.getBatteryById(currentBatteryId),
          supplierService.getSuppliers(),
        ])

        if (!isActive()) {
          return
        }

        setFormData(toFormState(battery))
        setSuppliers(supplierRows)
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load battery"
        setError(message)
        onError?.(message)
      } finally {
        if (isActive()) {
          setInitializing(false)
        }
      }
    },
    [onError]
  )

  useEffect(() => {
    if (!autoLoad) {
      return
    }

    let active = true

    if (!batteryId) {
      resetForm()
      void loadSuppliers(() => active)
      return () => {
        active = false
      }
    }

    void loadBattery(batteryId, () => active)

    return () => {
      active = false
    }
  }, [batteryId, loadBattery, loadSuppliers, resetForm, autoLoad])

  function updateField<K extends keyof BatteryPayload>(
    field: K,
    value: BatteryPayload[K],
  ) {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-calculate discount amount if purchased price and discount offered are set
      if (field === "PurchasedPrice" || field === "DiscountOffered") {
        const purchasedPrice = field === "PurchasedPrice" ? Number(value) : Number(prev.PurchasedPrice)
        const discountOffered = field === "DiscountOffered" ? Number(value) : Number(prev.DiscountOffered)

        if (Number.isFinite(purchasedPrice) && purchasedPrice > 0 && Number.isFinite(discountOffered) && discountOffered >= 0) {
          updated.DiscountAmount = Number(((purchasedPrice * discountOffered) / 100).toFixed(2))
        }
      }

      // Auto-calculate MRP Without VAT if MRP With VAT is entered (18% VAT)
      if (field === "MRP_WithVAT") {
        const mrpWithVAT = Number(value)
        if (Number.isFinite(mrpWithVAT) && mrpWithVAT > 0) {
          updated.MRP_WithoutVAT = Number((mrpWithVAT / 1.18).toFixed(2))
        }
      }

      return updated
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: BatteryPayload = {
      Brand: normalizeText(formData.Brand),
      Model: normalizeText(formData.Model),
      Series: normalizeText(formData.Series),
      Voltage: normalizeText(formData.Voltage),
      Capacity: normalizeText(formData.Capacity),
      Technology: normalizeText(formData.Technology),
      Application: normalizeText(formData.Application),
      WarrantyMonths: normalizeInteger(formData.WarrantyMonths),
      BatchCode: normalizeText(formData.BatchCode),
      SupplierIDs: formData.SupplierIDs ?? [],
      PriceValidityFrom: normalizeText(formData.PriceValidityFrom),
      PriceValidityTo: normalizeText(formData.PriceValidityTo),
      PurchasedPrice: normalizeNumber(formData.PurchasedPrice),
      DiscountOffered: normalizeNumber(formData.DiscountOffered),
      DiscountAmount: normalizeNumber(formData.DiscountAmount),
      MRP_WithoutVAT: normalizeNumber(formData.MRP_WithoutVAT),
      MRP_WithVAT: normalizeNumber(formData.MRP_WithVAT),
      ActualSellingPrice: normalizeNumber(formData.ActualSellingPrice),
    }

    if (!payload.Brand) {
      setError("Battery brand is required")
      setSubmitting(false)
      return
    }

    if (!payload.Model) {
      setError("Battery model is required")
      setSubmitting(false)
      return
    }

    if (!payload.Capacity) {
      setError("Battery capacity is required (e.g. 5Ah)")
      setSubmitting(false)
      return
    }

    if (
      payload.DiscountOffered !== null &&
      payload.DiscountOffered !== undefined &&
      payload.DiscountOffered > 100
    ) {
      setError("Maximum discount offered cannot exceed 100%")
      setSubmitting(false)
      return
    }

    try {
      let createdBattery: BatteryRecord | null = null

      if (batteryId) {
        await batteryService.updateBattery(batteryId, payload)
      } else {
        createdBattery = await batteryService.createBattery(payload)
      }
      onSuccess?.(createdBattery)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : batteryId
            ? "Failed to update battery"
            : "Failed to create battery"
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formData,
    suppliers,
    submitting,
    initializing,
    error,
    updateField,
    handleSubmit,
    resetForm,
    loadSuppliers,
  }
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim() ?? ""
  return normalized === "" ? null : normalized
}

function normalizeNumber(value?: number | null) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
}

function normalizeInteger(value?: number | null) {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = Number(value)
  return Number.isInteger(normalized) ? normalized : null
}

function toFormState(battery: BatteryRecord): BatteryPayload {
  return {
    Brand: battery.Brand ?? "",
    Model: battery.Model ?? "",
    Series: battery.Series ?? "",
    Voltage: battery.Voltage ?? "",
    Capacity: battery.Capacity ?? "",
    Technology: battery.Technology ?? "",
    Application: battery.Application ?? "",
    WarrantyMonths: battery.WarrantyMonths ?? null,
    BatchCode: battery.BatchCode ?? "",
    SupplierIDs: battery.SupplierIDs ?? [],
    PriceValidityFrom: battery.PriceValidityFrom ?? "",
    PriceValidityTo: battery.PriceValidityTo ?? "",
    PurchasedPrice: battery.PurchasedPrice ?? null,
    DiscountOffered: battery.DiscountOffered ?? null,
    DiscountAmount: battery.DiscountAmount ?? null,
    MRP_WithoutVAT: battery.MRP_WithoutVAT ?? null,
    MRP_WithVAT: battery.MRP_WithVAT ?? null,
    ActualSellingPrice: battery.ActualSellingPrice ?? null,
  }
}
