import { useCallback, useEffect, useMemo, useState } from "react"
import type { InvoiceRecord } from "../models/invoice"
import { invoiceService } from "../services/invoiceService"

export type InvoiceListFilter = "all" | "outstanding" | "overdue"

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<InvoiceListFilter>("all")

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await invoiceService.getAll()
      setInvoices(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch invoices")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchInvoices()
  }, [fetchInvoices])

  const visibleInvoices = useMemo(() => {
    if (filter === "outstanding") {
      return invoices.filter((i) => i.IsCreditNote === 0 && i.Status !== "paid" && i.Status !== "can")
    }
    if (filter === "overdue") {
      return invoices.filter((i) => i.IsCreditNote === 0 && i.IsOverdue === 1 && i.Status !== "paid" && i.Status !== "can")
    }
    return invoices
  }, [invoices, filter])

  return {
    invoices,
    visibleInvoices,
    loading,
    error,
    filter,
    setFilter,
    refresh: fetchInvoices,
  }
}
