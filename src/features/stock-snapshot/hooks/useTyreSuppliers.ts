import { useState, useEffect, useCallback } from "react"
import { tyreSupplierService } from "../services/tyreSupplierService"

export type Supplier = {
  SupplierID: number
  SupplierCode: string
  Name: string
  Contact: string
  Address: string
  TinNo: string
  VatNo: string
}

export function useTyreSuppliers(tyreId?: number) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSuppliers = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await tyreSupplierService.getSuppliersByTyreId(id)
      setSuppliers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load suppliers"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tyreId && tyreId > 0) {
      void loadSuppliers(tyreId)
    } else {
      setSuppliers([])
      setError(null)
    }
  }, [tyreId, loadSuppliers])

  return { suppliers, loading, error, refetch: () => tyreId && loadSuppliers(tyreId) }
}