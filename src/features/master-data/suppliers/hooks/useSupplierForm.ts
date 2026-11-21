import { useCallback, useEffect, useState, type FormEvent } from "react"
import type { TyreRecord } from "../../tyres/models/tyre"
import { tyreService } from "../../tyres/services/tyreService"
import { SUPPLIER_TYPE_CODES } from "../constants/supplierTypeConstants"
import type { SupplierPayload, SupplierRecord, SupplierTypeRecord } from "../models/supplier"
import { supplierService } from "../services/supplierService"

const initialFormState: SupplierPayload = {
  SupplierCode: "",
  Name: "",
  TinNo: "",
  VatNo: "",
  SupplierTypeID: null,
  SupplierTypeCode: SUPPLIER_TYPE_CODES.TYRES,
  SupplierTypeName: "Tyres",
  Contacts: [],
  Emails: [],
  Addresses: [],
  Tyres: [],
}

type UseSupplierFormOptions = {
  supplierId?: number
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useSupplierForm(options?: UseSupplierFormOptions) {
  const supplierId = options?.supplierId
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const [formData, setFormData] = useState<SupplierPayload>(initialFormState)
  const [supplierTypes, setSupplierTypes] = useState<SupplierTypeRecord[]>([])
  const [availableTyres, setAvailableTyres] = useState<TyreRecord[]>([])
  const [tyresLoading, setTyresLoading] = useState(false)
  const [tyresError, setTyresError] = useState<string | null>(null)
  const [hasLoadedTyres, setHasLoadedTyres] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setError(null)
    setInitializing(false)
  }, [])

  const fetchTyres = useCallback(async () => {
    setTyresLoading(true)
    setTyresError(null)

    try {
      const tyres = await tyreService.getTyres()
      setAvailableTyres(tyres)
      setHasLoadedTyres(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tyres"
      setTyresError(message)
      onError?.(message)
    } finally {
      setTyresLoading(false)
    }
  }, [onError])

  const loadTyresOnDemand = useCallback(async () => {
    if (hasLoadedTyres) {
      return
    }

    await fetchTyres()
  }, [hasLoadedTyres, fetchTyres])

  const reloadTyres = useCallback(async () => {
    await fetchTyres()
  }, [fetchTyres])

  const loadSupplier = useCallback(
    async (currentSupplierId: number, isActive: () => boolean) => {
      setInitializing(true)
      setError(null)

      try {
        const supplier = await supplierService.getSupplierById(currentSupplierId)

        if (!isActive()) {
          return
        }

        setFormData(toFormState(supplier))
      } catch (err) {
        if (!isActive()) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Failed to load supplier"
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
    if (!supplierId) {
      resetForm()
      return
    }

    let active = true
    loadSupplier(supplierId, () => active)

    return () => {
      active = false
    }
  }, [supplierId, loadSupplier, resetForm])

  useEffect(() => {
    let active = true
    supplierService
      .getSupplierTypes()
      .then((types) => {
        if (active && Array.isArray(types)) {
          setSupplierTypes(types)
          setFormData((prev) => {
            if (!prev.SupplierTypeID && prev.SupplierTypeCode) {
              const matched = types.find((t) => t.TypeCode === prev.SupplierTypeCode)
              if (matched) {
                return {
                  ...prev,
                  SupplierTypeID: matched.Id,
                  SupplierTypeName: matched.TypeName,
                }
              }
            }
            return prev
          })
        }
      })
      .catch(() => {
        // Fallback gracefully to constants if offline/loading
      })

    return () => {
      active = false
    }
  }, [])

  function updateField<K extends keyof SupplierPayload>(
    field: K,
    value: SupplierPayload[K],
  ) {
    if (field === "SupplierTypeCode") {
      const code = value as string
      const matched = supplierTypes.find((t) => t.TypeCode === code)
      setFormData((prev) => ({
        ...prev,
        SupplierTypeCode: code,
        SupplierTypeID: matched ? matched.Id : prev.SupplierTypeID,
        SupplierTypeName: matched ? matched.TypeName : prev.SupplierTypeName,
      }))
      return
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const normalizedTyres = formData.Tyres?.map((tyre) => ({
      TyreID: tyre.TyreID,
      Price: normalizeNumber(tyre.Price),
    })) ?? []

    const invalidTyre = normalizedTyres.find(
      (tyre) => tyre.Price === null || tyre.Price <= 0,
    )

    if (invalidTyre) {
      const message = `Enter a valid price for tyre ${invalidTyre.TyreID}.`
      setError(message)
      onError?.(message)
      setSubmitting(false)
      return
    }

    const payload: SupplierPayload = {
      SupplierCode: formData.SupplierCode.trim(),
      Name: formData.Name.trim(),
      TinNo: formData.TinNo?.trim() || null,
      VatNo: formData.VatNo?.trim() || null,
      SupplierTypeID: formData.SupplierTypeID ?? null,
      SupplierTypeCode: formData.SupplierTypeCode ?? null,
      Contacts: formData.Contacts,
      Emails: formData.Emails,
      Addresses: formData.Addresses,
      Tyres: normalizedTyres,
    }

    try {
      if (supplierId) {
        await supplierService.updateSupplier(supplierId, payload)
      } else {
        await supplierService.createSupplier(payload)
      }
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : supplierId
            ? "Failed to update supplier"
            : "Failed to create supplier"
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formData,
    supplierTypes,
    availableTyres,
    tyresLoading,
    tyresError,
    submitting,
    initializing,
    error,
    updateField,
    handleSubmit,
    loadTyresOnDemand,
    reloadTyres,
  }
}

function normalizeNumber(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return null
  }

  const normalized = Number(value)

  if (!Number.isFinite(normalized)) {
    return null
  }

  return normalized
}

function toFormState(supplier: SupplierRecord): SupplierPayload {
  return {
    SupplierCode: supplier.SupplierCode,
    Name: supplier.Name,
    TinNo: supplier.TinNo ?? "",
    VatNo: supplier.VatNo ?? "",
    SupplierTypeID: supplier.SupplierTypeID ?? null,
    SupplierTypeCode: supplier.SupplierTypeCode ?? SUPPLIER_TYPE_CODES.TYRES,
    SupplierTypeName: supplier.SupplierTypeName ?? "Tyres",
    Contacts: supplier.Contacts ?? [],
    Emails: supplier.Emails ?? [],
    Addresses: supplier.Addresses ?? [],
    Tyres: (supplier.Tyres ?? []).map((tyre) => ({
      TyreID: tyre.TyreID,
      Price: tyre.Price ?? null,
      Size: tyre.Size ?? null,
      Pattern: tyre.Pattern ?? null,
      LL_SR: tyre.LL_SR ?? null,
      PR: tyre.PR ?? null,
      SideWall: tyre.SideWall ?? null,
    })),
  }
}
