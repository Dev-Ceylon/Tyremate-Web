import { useState, useEffect, useCallback } from "react"
import { cashFlowReportClient } from "../services/cashFlowReportClient"
import type {
  DatePreset,
  FlowType,
  PaymentFilter,
  CashFlowLedgerResult,
} from "../models/cashFlowReport"

interface UseCashFlowLedgerProps {
  preset: DatePreset
  fromDate?: string
  toDate?: string
}

export function useCashFlowLedger({ preset, fromDate, toDate }: UseCashFlowLedgerProps) {
  const [flowType, setFlowType] = useState<FlowType>("ALL")
  const [paymentMethod, setPaymentMethod] = useState<PaymentFilter>("ALL")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(25)
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

  const [data, setData] = useState<CashFlowLedgerResult | null>(null)
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

  const handleFlowTypeChange = (newFlowType: FlowType) => {
    setFlowType(newFlowType)
    setPage(1)
  }

  const handlePaymentMethodChange = (newMethod: PaymentFilter) => {
    setPaymentMethod(newMethod)
    setPage(1)
  }

  const fetchLedger = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (page - 1) * limit
      const result = await cashFlowReportClient.getLedger({
        preset,
        fromDate: preset === "custom" ? fromDate : undefined,
        toDate: preset === "custom" ? toDate : undefined,
        flowType,
        paymentMethod,
        searchTerm: debouncedSearch,
        limit,
        offset,
        sortBy,
        sortOrder,
      })
      setData(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load cash flow ledger"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [preset, fromDate, toDate, flowType, paymentMethod, debouncedSearch, page, limit, sortBy, sortOrder])

  useEffect(() => {
    if (preset !== "custom" || (fromDate && toDate)) {
      fetchLedger()
    }
  }, [fetchLedger, preset, fromDate, toDate])

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
    flowType,
    paymentMethod,
    searchTerm,
    page,
    limit,
    sortBy,
    sortOrder,
    data,
    items: data?.items || [],
    totalCount: data?.totalCount || 0,
    pageSummary: data?.pageSummary || { totalInflow: 0, totalOutflow: 0, netAmount: 0 },
    pagination: data?.pagination || { limit, offset: (page - 1) * limit, page, totalPages: 1 },
    loading,
    error,
    setFlowType: handleFlowTypeChange,
    setPaymentMethod: handlePaymentMethodChange,
    setSearchTerm,
    setPage,
    setLimit,
    handleSort,
    refetch: fetchLedger,
  }
}
