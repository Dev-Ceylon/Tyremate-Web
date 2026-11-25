import { useState, useEffect, useCallback } from "react"
import { batteryReportClient } from "../services/batteryReportClient"
import type {
  BatteryDatePreset,
  BatteryTransactionType,
  BatteryTransactionsReportResult,
} from "../models/batteryReport"

interface UseBatteryTransactionsProps {
  preset: BatteryDatePreset
  fromDate?: string
  toDate?: string
  brand?: string
}

export function useBatteryTransactions({ preset, fromDate, toDate, brand }: UseBatteryTransactionsProps) {
  const [type, setType] = useState<BatteryTransactionType>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(25)
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

  const [data, setData] = useState<BatteryTransactionsReportResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleTypeChange = (newType: BatteryTransactionType) => {
    setType(newType)
    setPage(1)
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await batteryReportClient.getTransactions({
        preset,
        fromDate: preset === "custom" ? fromDate : undefined,
        toDate: preset === "custom" ? toDate : undefined,
        type,
        brand: brand || undefined,
        searchTerm: debouncedSearch,
        page,
        limit,
        sortBy,
        sortOrder,
      })
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load battery transactions"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [preset, fromDate, toDate, type, brand, debouncedSearch, page, limit, sortBy, sortOrder])

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
    items: data?.items || [],
    totalCount: data?.pagination?.totalCount || 0,
    summary: data?.summary || { totalQty: 0, totalAmount: 0 },
    pagination: data?.pagination || { page: 1, limit: 25, totalCount: 0, totalPages: 1 },
    type,
    searchTerm,
    sortBy,
    sortOrder,
    loading,
    error,
    setType: handleTypeChange,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refetch: fetchTransactions,
  }
}
