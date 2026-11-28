import { useCallback, useEffect, useMemo, useState } from "react"
import { salesTargetClient } from "../services/salesTargetClient"
import type {
  SalesRepUser,
  SalesTargetFilter,
  SalesTargetPayload,
  SalesTargetRecord,
  SalesTargetUpdatePayload,
} from "../models/salesTarget"

export interface TargetStats {
  totalTargets: number
  totalTargetAmount: number
  totalActualAmount: number
  overallAttainmentRate: number
  totalTargetQty: number
  totalActualQty: number
  achievedCount: number
  inProgressCount: number
  missedCount: number
  topPerformer: {
    repName: string
    actualAmount: number
    attainmentRate: number
  } | null
}

export function useSalesTargets(initialFilter: SalesTargetFilter = {}) {
  const [targets, setTargets] = useState<SalesTargetRecord[]>([])
  const [salesReps, setSalesReps] = useState<SalesRepUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SalesTargetFilter>(initialFilter)

  const loadReps = useCallback(async () => {
    try {
      const reps = await salesTargetClient.getSalesReps()
      setSalesReps(reps)
    } catch (err: unknown) {
      console.error("Failed to load sales representatives:", err)
    }
  }, [])

  const loadTargets = useCallback(async (currentFilter: SalesTargetFilter = filter) => {
    setLoading(true)
    setError(null)
    try {
      const data = await salesTargetClient.getAll(currentFilter)
      setTargets(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load sales targets"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void loadReps()
  }, [loadReps])

  useEffect(() => {
    void loadTargets(filter)
  }, [filter, loadTargets])

  const stats = useMemo<TargetStats>(() => {
    let totalTargetAmount = 0
    let totalActualAmount = 0
    let totalTargetQty = 0
    let totalActualQty = 0
    let achievedCount = 0
    let inProgressCount = 0
    let missedCount = 0

    const repAttainmentMap = new Map<number, { name: string; target: number; actual: number }>()

    for (const t of targets) {
      totalTargetAmount += Number(t.TargetAmount) || 0
      totalActualAmount += Number(t.ActualAmount) || 0
      totalTargetQty += Number(t.TargetQty) || 0
      totalActualQty += Number(t.ActualQty) || 0

      if (t.Status === "achieved") achievedCount++
      else if (t.Status === "missed") missedCount++
      else inProgressCount++

      const existing = repAttainmentMap.get(t.SalesRepID) || {
        name: t.SalesRepName || t.SalesRepUsername || `Rep #${t.SalesRepID}`,
        target: 0,
        actual: 0,
      }
      existing.target += Number(t.TargetAmount) || 0
      existing.actual += Number(t.ActualAmount) || 0
      repAttainmentMap.set(t.SalesRepID, existing)
    }

    const overallAttainmentRate =
      totalTargetAmount > 0 ? Math.round((totalActualAmount / totalTargetAmount) * 1000) / 10 : 0

    let topPerformer: TargetStats["topPerformer"] = null
    let maxActual = -1

    repAttainmentMap.forEach((val) => {
      if (val.actual > maxActual) {
        maxActual = val.actual
        const repRate = val.target > 0 ? Math.round((val.actual / val.target) * 1000) / 10 : 0
        topPerformer = {
          repName: val.name,
          actualAmount: val.actual,
          attainmentRate: repRate,
        }
      }
    })

    return {
      totalTargets: targets.length,
      totalTargetAmount,
      totalActualAmount,
      overallAttainmentRate,
      totalTargetQty,
      totalActualQty,
      achievedCount,
      inProgressCount,
      missedCount,
      topPerformer,
    }
  }, [targets])

  const createTarget = async (payload: SalesTargetPayload) => {
    const created = await salesTargetClient.create(payload)
    await loadTargets(filter)
    return created
  }

  const updateTarget = async (id: number, payload: SalesTargetUpdatePayload) => {
    const updated = await salesTargetClient.update(id, payload)
    await loadTargets(filter)
    return updated
  }

  const deleteTarget = async (id: number) => {
    const res = await salesTargetClient.delete(id)
    await loadTargets(filter)
    return res
  }

  return {
    targets,
    salesReps,
    loading,
    error,
    filter,
    setFilter,
    stats,
    refresh: () => loadTargets(filter),
    createTarget,
    updateTarget,
    deleteTarget,
  }
}
