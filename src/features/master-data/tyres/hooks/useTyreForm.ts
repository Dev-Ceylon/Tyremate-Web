import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { SupplierRecord } from "../../suppliers/models/supplier"
import { supplierService } from "../../suppliers/services/supplierService"
import type { TyrePayload, TyreRecord } from "../models/tyre"
import { tyreService } from "../services/tyreService"

const initialFormState: TyrePayload = {
  Brand: "",
  Size: "",
  Pattern: "",
  LL_SR: "",
  PR: "",
  SideWall: "",
  DOT: "",
  SupplierIDs: [],
  PriceValidityFrom: "",
  PriceValidityTo: "",
  PurchasedPrice: null,
  DAGCost: null,
  DiscountOffered: null,
  DiscountAmount: null,
  MRP_WithoutVAT: null,
  MRP_WithVAT: null,
  ActualSellingPrice: null,
}

type UseTyreFormOptions = {
  tyreId?: number
  autoLoad?: boolean
  onSuccess?: (createdTyre?: TyreRecord | null) => void
  onError?: (message: string) => void
}

export function useTyreForm(options?: UseTyreFormOptions) {
  const tyreId = options?.tyreId
  const autoLoad = options?.autoLoad ?? true
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<TyrePayload>(initialFormState)
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

  const loadTyre = useCallback(
    async (currentTyreId: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const [tyre, supplierRows] = await Promise.all([
          tyreService.getTyreById(currentTyreId),
          supplierService.getSuppliers(),
        ])

        if (!isActive()) {
          return
        }

        setFormData(toFormState(tyre))
        setSuppliers(supplierRows)
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message = err instanceof Error ? err.message : "Failed to load tyre"
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

    if (!tyreId) {
      resetForm()
      void loadSuppliers(() => active)
      return () => {
        active = false
      }
    }

    void loadTyre(tyreId, () => active)

    return () => {
      active = false
    }
  }, [tyreId, loadTyre, loadSuppliers, resetForm, autoLoad])

  function updateField<K extends keyof TyrePayload>(
    field: K,
    value: TyrePayload[K],
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: TyrePayload = {
      Brand: normalizeText(formData.Brand),
      Size: normalizeText(formData.Size),
      Pattern: normalizeText(formData.Pattern),
      LL_SR: normalizeText(formData.LL_SR),
      PR: normalizeText(formData.PR),
      SideWall: normalizeText(formData.SideWall),
      DOT: normalizeText(formData.DOT),
      SupplierIDs: formData.SupplierIDs ?? [],
      PriceValidityFrom: normalizeText(formData.PriceValidityFrom),
      PriceValidityTo: normalizeText(formData.PriceValidityTo),
      PurchasedPrice: normalizeNumber(formData.PurchasedPrice),
      DAGCost: normalizeNumber(formData.DAGCost),
      DiscountOffered: normalizeNumber(formData.DiscountOffered),
      DiscountAmount: normalizeNumber(formData.DiscountAmount),
      MRP_WithoutVAT: normalizeNumber(formData.MRP_WithoutVAT),
      MRP_WithVAT: normalizeNumber(formData.MRP_WithVAT),
      ActualSellingPrice: normalizeNumber(formData.ActualSellingPrice),
    }

    //console.log(payload)

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
      let createdTyre: TyreRecord | null = null

      if (tyreId) {
        await tyreService.updateTyre(tyreId, payload)
      } else {
        createdTyre = await tyreService.createTyre(payload)
      }
      onSuccess?.(createdTyre)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : tyreId
            ? "Failed to update tyre"
            : "Failed to create tyre"
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

function toFormState(tyre: TyreRecord): TyrePayload {
  return {
    Brand: tyre.Brand ?? "",
    Size: tyre.Size ?? "",
    Pattern: tyre.Pattern ?? "",
    LL_SR: tyre.LL_SR ?? "",
    PR: tyre.PR ?? "",
    SideWall: tyre.SideWall ?? "",
    DOT: tyre.DOT ?? "",
    SupplierIDs: tyre.SupplierIDs ?? [],
    PriceValidityFrom: tyre.PriceValidityFrom ?? "",
    PriceValidityTo: tyre.PriceValidityTo ?? "",
    PurchasedPrice: tyre.PurchasedPrice ?? null,
    DAGCost: tyre.DAGCost ?? null,
    DiscountOffered: tyre.DiscountOffered ?? null,
    DiscountAmount: tyre.DiscountAmount ?? null,
    MRP_WithoutVAT: tyre.MRP_WithoutVAT ?? null,
    MRP_WithVAT: tyre.MRP_WithVAT ?? null,
    ActualSellingPrice: tyre.ActualSellingPrice ?? null,
  }
}
