import { useState, useEffect, useCallback } from "react"
import { poReportClient } from "../services/poReportClient"
import type {
  DatePreset,
  PoStatusCode,
  PoTransactionsReportResult,
} from "../models/poReport"

interface UsePoTransactionsProps {
  preset: DatePreset
  fromDate?: string
  toDate?: string
}

export function usePoTransactions({ preset, fromDate, toDate }: UsePoTransactionsProps) {
  const [statusCode, setStatusCode] = useState<PoStatusCode>("ALL")
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(25)
  const [sortBy, setSortBy] = useState<string>("Date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

  const [data, setData] = useState<PoTransactionsReportResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search term by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleStatusChange = (newStatus: PoStatusCode) => {
    setStatusCode(newStatus)
    setPage(1)
  }

  const handleSupplierChange = (newSupplierId: number | null) => {
    setSupplierId(newSupplierId)
    setPage(1)
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (page - 1) * limit
      const result = await poReportClient.getTransactions({
        preset,
        fromDate: preset === "custom" ? fromDate : undefined,
        toDate: preset === "custom" ? toDate : undefined,
        statusCode,
        supplierId,
        searchTerm: debouncedSearch,
        limit,
        offset,
        sortBy,
        sortOrder,
      })
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load PO transactions"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [preset, fromDate, toDate, statusCode, supplierId, debouncedSearch, page, limit, sortBy, sortOrder])

  useEffect(() => {
    if (preset !== "custom" || (fromDate && toDate)) {
      fetchTransactions()
    }
  }, [fetchTransactions, preset, fromDate, toDate])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"))
    } else {
      setSortBy(field)
      setSortOrder("DESC")
    }
    setPage(1)
  }

  return {
    statusCode,
    supplierId,
    searchTerm,
    page,
    limit,
    sortBy,
    sortOrder,
    data,
    transactions: data?.transactions || [],
    totalCount: data?.totalCount || 0,
    pageSummary: data?.pageSummary || { totalQty: 0, totalGross: 0, totalDiscount: 0, totalNet: 0 },
    pagination: data?.pagination || { limit, offset: (page - 1) * limit, page, totalPages: 1 },
    totalPages: data?.pagination?.totalPages || 1,
    loading,
    error,
    setStatusCode: handleStatusChange,
    setSupplierId: handleSupplierChange,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refresh: fetchTransactions,
    refetch: fetchTransactions,
  }
}
