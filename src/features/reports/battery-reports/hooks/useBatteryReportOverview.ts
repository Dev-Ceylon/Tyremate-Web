import { useState, useEffect, useCallback } from "react"
import { batteryReportClient } from "../services/batteryReportClient"
import type {
  BatteryDatePreset,
  BatteryChartInterval,
  BatteryReportOverview,
} from "../models/batteryReport"

export function useBatteryReportOverview() {
  const [preset, setPreset] = useState<BatteryDatePreset>("this_month")
  const [customFrom, setCustomFrom] = useState<string>("")
  const [customTo, setCustomTo] = useState<string>("")
  const [interval, setInterval] = useState<BatteryChartInterval | undefined>(undefined)
  const [brand, setBrand] = useState<string>("")
  const [overview, setOverview] = useState<BatteryReportOverview | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await batteryReportClient.getOverview({
        preset,
        fromDate: preset === "custom" ? customFrom : undefined,
        toDate: preset === "custom" ? customTo : undefined,
        interval,
        brand: brand || undefined,
        limitTop: 6,
      })
      setOverview(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load battery report overview"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [preset, customFrom, customTo, interval, brand])

  useEffect(() => {
    if (preset !== "custom" || (customFrom && customTo)) {
      fetchOverview()
    }
  }, [fetchOverview, preset, customFrom, customTo])

  const handlePresetChange = (newPreset: BatteryDatePreset) => {
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
    interval: interval || overview?.meta?.interval || "day",
    brand,
    overview,
    loading,
    error,
    setPreset: handlePresetChange,
    setCustomRange: handleCustomRangeApply,
    setInterval,
    setBrand,
    refresh: fetchOverview,
  }
}
