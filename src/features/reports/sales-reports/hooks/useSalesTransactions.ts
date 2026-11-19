import { useState, useEffect, useCallback } from "react"
import { reportClient } from "../services/salesReportClient"
import type {
  DatePreset,
  TransactionCategory,
  SalesTransactionsReportResult,
} from "../models/salesReport"

interface UseSalesTransactionsProps {
  preset: DatePreset
  fromDate?: string
  toDate?: string
}

export function useSalesTransactions({ preset, fromDate, toDate }: UseSalesTransactionsProps) {
  const [category, setCategory] = useState<TransactionCategory>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(25)
  const [sortBy, setSortBy] = useState<string>("transactionDate")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

  const [data, setData] = useState<SalesTransactionsReportResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search term by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // Reset to page 1 on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset to page 1 on category change
  const handleCategoryChange = (newCat: TransactionCategory) => {
    setCategory(newCat)
    setPage(1)
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (page - 1) * limit
      const result = await reportClient.getTransactions({
        preset,
        fromDate: preset === "custom" ? fromDate : undefined,
        toDate: preset === "custom" ? toDate : undefined,
        category,
        searchTerm: debouncedSearch,
        limit,
        offset,
        sortBy,
        sortOrder,
      })
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load sales transactions"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [preset, fromDate, toDate, category, debouncedSearch, page, limit, sortBy, sortOrder])

  useEffect(() => {
    if (preset !== "custom" || (fromDate && toDate)) {
      fetchTransactions()
    }
  }, [fetchTransactions, preset, fromDate, toDate])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"))
    } else {
      setSortBy(column)
      setSortOrder("DESC")
    }
    setPage(1)
  }

  return {
    transactions: data?.transactions || [],
    totalCount: data?.totalCount || 0,
    pageSummary: data?.pageSummary || { totalGross: 0, totalDiscount: 0, totalNet: 0 },
    pagination: data?.pagination || { limit, offset: 0, page: 1, totalPages: 1 },
    category,
    searchTerm,
    sortBy,
    sortOrder,
    loading,
    error,
    setCategory: handleCategoryChange,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refetch: fetchTransactions,
  }
}
