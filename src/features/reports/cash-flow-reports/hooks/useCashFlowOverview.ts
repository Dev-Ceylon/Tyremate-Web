import { useState, useEffect, useCallback } from "react"
import { cashFlowReportClient } from "../services/cashFlowReportClient"
import type {
  DatePreset,
  ChartInterval,
  CashFlowOverview,
} from "../models/cashFlowReport"

export function useCashFlowOverview() {
  const [preset, setPreset] = useState<DatePreset>("today")
  const [customFrom, setCustomFrom] = useState<string>("")
  const [customTo, setCustomTo] = useState<string>("")
  const [interval, setInterval] = useState<ChartInterval | undefined>(undefined)
  const [overview, setOverview] = useState<CashFlowOverview | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cashFlowReportClient.getOverview({
        preset,
        fromDate: preset === "custom" ? customFrom : undefined,
        toDate: preset === "custom" ? customTo : undefined,
        interval,
      })
      setOverview(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load cash flow overview"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [preset, customFrom, customTo, interval])

  useEffect(() => {
    if (preset !== "custom" || (customFrom && customTo)) {
      fetchOverview()
    }
  }, [fetchOverview, preset, customFrom, customTo])

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset)
    setInterval(undefined)
  }

  const handleCustomRangeApply = (from: string, to: string) => {
    setCustomFrom(from)
    setCustomTo(to)
    setPreset("custom")
    setInterval(undefined)
  }

  return {
    preset,
    customFrom,
    customTo,
    interval: interval || overview?.dateRange?.interval || "day",
    overview,
    loading,
    error,
    setPreset: handlePresetChange,
    setCustomRange: handleCustomRangeApply,
    setInterval,
    refresh: fetchOverview,
  }
}
