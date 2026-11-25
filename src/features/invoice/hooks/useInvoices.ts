import { useCallback, useEffect, useMemo, useState } from "react"
import type { InvoiceRecord, InvoiceSourceType } from "../models/invoice"
import { invoiceService } from "../services/invoiceService"
import { SOURCE_LABELS } from "../components/InvoiceTable"

export type InvoiceListFilter = "all" | "outstanding" | "overdue"
export type InvoiceSourceFilter = "all" | InvoiceSourceType

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<InvoiceListFilter>("all")
  const [sourceFilter, setSourceFilter] = useState<InvoiceSourceFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

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
    let result = invoices

    // 1. Status Filter
    if (filter === "outstanding") {
      result = result.filter((i) => i.IsCreditNote === 0 && i.Status !== "paid" && i.Status !== "can")
    } else if (filter === "overdue") {
      result = result.filter((i) => i.IsCreditNote === 0 && i.IsOverdue === 1 && i.Status !== "paid" && i.Status !== "can")
    }

    // 2. Source Filter
    if (sourceFilter !== "all") {
      result = result.filter((i) => i.SourceType === sourceFilter)
    }

    // 3. Search Query
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((i) => {
        const sourceLabel = SOURCE_LABELS[i.SourceType] || i.SourceType
        const searchable = [
          i.InvoiceNumber,
          i.CustomerName || "Walk-in",
          i.CustomerPhone || "",
          sourceLabel,
          i.SourceType,
          i.SourceID ? String(i.SourceID) : "",
          i.Notes || "",
        ]
          .join(" ")
          .toLowerCase()
        return searchable.includes(query)
      })
    }

    return result
  }, [invoices, filter, sourceFilter, searchQuery])

  const isFiltering = filter !== "all" || sourceFilter !== "all" || Boolean(searchQuery.trim())

  return {
    invoices,
    visibleInvoices,
    loading,
    error,
    filter,
    setFilter,
    sourceFilter,
    setSourceFilter,
    searchQuery,
    setSearchQuery,
    isFiltering,
    refresh: fetchInvoices,
  }
}

