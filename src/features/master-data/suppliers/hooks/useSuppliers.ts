import { useCallback, useEffect, useState } from "react"
import type { SupplierRecord } from "../models/supplier"
import { supplierService } from "../services/supplierService"

type UseSuppliersOptions = {
  onDeleteSuccess?: (supplier: SupplierRecord) => void
  onDeleteError?: (message: string, supplier: SupplierRecord) => void
}

export function useSuppliers(options?: UseSuppliersOptions) {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingSupplierId, setDeletingSupplierId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await supplierService.getSuppliers()
      setSuppliers(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load suppliers"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeSupplier = useCallback(async (supplier: SupplierRecord) => {
    setDeletingSupplierId(supplier.SupplierID)

    try {
      await supplierService.deleteSupplier(supplier.SupplierID)
      setSuppliers((current) =>
        current.filter((currentSupplier) => currentSupplier.SupplierID !== supplier.SupplierID)
      )
      options?.onDeleteSuccess?.(supplier)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete supplier"
      options?.onDeleteError?.(message, supplier)
      throw err
    } finally {
      setDeletingSupplierId(null)
    }
  }, [options])

  return { suppliers, loading, error, deletingSupplierId, refresh, removeSupplier }
}
