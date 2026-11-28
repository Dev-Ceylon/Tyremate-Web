import { useCallback, useEffect, useMemo, useState } from "react"
import { salesTargetClient } from "../services/salesTargetClient"
import type { ActiveTargetsMap, PeriodType, SalesTargetRecord } from "../models/salesTarget"

export interface MyTargetSummary {
  hasAnyActive: boolean
  totalAchieved: number
  totalInProgress: number
  monthlyAttainment: number
  activeCount: number
}

export function useMyTargets() {
  const [activeTargets, setActiveTargets] = useState<ActiveTargetsMap>({
    daily: null,
    weekly: null,
    monthly: null,
    annually: null,
  })
  const [historyTargets, setHistoryTargets] = useState<SalesTargetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCadence, setSelectedCadence] = useState<PeriodType | "all">("all")

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [active, all] = await Promise.all([
        salesTargetClient.getMyActiveTargets(),
        salesTargetClient.getAll(),
      ])
      setActiveTargets(active)
      setHistoryTargets(all)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load targets"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const summary = useMemo<MyTargetSummary>(() => {
    const list = [
      activeTargets.daily,
      activeTargets.weekly,
      activeTargets.monthly,
      activeTargets.annually,
    ].filter(Boolean) as SalesTargetRecord[]

    let achieved = 0
    let inProgress = 0

    for (const t of historyTargets) {
      if (t.Status === "achieved" || t.IsAchieved === 1) achieved++
      else if (t.Status === "in_progress") inProgress++
    }

    const monthly = activeTargets.monthly
    const monthlyAttainment = monthly ? monthly.AmountPercentage : 0

    return {
      hasAnyActive: list.length > 0,
      totalAchieved: achieved,
      totalInProgress: inProgress,
      monthlyAttainment,
      activeCount: list.length,
    }
  }, [activeTargets, historyTargets])

  const filteredHistory = useMemo(() => {
    if (selectedCadence === "all") return historyTargets
    return historyTargets.filter((t) => t.PeriodType === selectedCadence)
  }, [historyTargets, selectedCadence])

  return {
    activeTargets,
    historyTargets: filteredHistory,
    allHistoryCount: historyTargets.length,
    loading,
    error,
    summary,
    selectedCadence,
    setSelectedCadence,
    refresh: loadData,
  }
}
