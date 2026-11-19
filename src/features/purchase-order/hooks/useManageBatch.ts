import { useState, useEffect, useCallback, useMemo } from "react"
import { purchaseOrderService } from "../services/purchaseOrderService"
import type { PoTyreBatchPayload, PoTyreBatchRecord } from "../models/purchaseOrder"

export interface UseManageBatchOptions {
  poTyresId: number | null
  lineQty: number
  isOpen: boolean
  onSaved?: () => void
}

export interface BatchDraft {
  localId: number
  DOT: string
  Qty: string
}

const EMPTY_DRAFT = (localId: number): BatchDraft => ({ localId, DOT: "", Qty: "" })

const toNonNegativeInt = (raw: string): number => {
  if (raw.trim() === "") return Number.NaN
  const value = Number(raw)
  return Number.isInteger(value) ? Math.max(value, 0) : Number.NaN
}

const sanitizeDot = (raw: string): string => raw.replace(/\D/g, "").slice(0, 4)

const isValidDot = (dot: string): boolean => {
  if (!/^\d{4}$/.test(dot)) return false
  const week = Number(dot.slice(0, 2))
  return week >= 1 && week <= 53
}

const DOT_FORMAT_ERROR = "DOT must be a 4-digit WWYY code (e.g. 2526 = week 25 of 2026)"
const DOT_DUPLICATE_ERROR = "Duplicate DOT"

export function useManageBatch({ poTyresId, lineQty, isOpen, onSaved }: UseManageBatchOptions) {
  const [drafts, setDrafts] = useState<BatchDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextLocalId, setNextLocalId] = useState(1)

  useEffect(() => {
    if (!isOpen || !poTyresId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const records = await purchaseOrderService.getPoTyreBatches(poTyresId)
        if (cancelled) return

        if (records.length === 0) {
          setDrafts([EMPTY_DRAFT(1)])
          setNextLocalId(2)
          return
        }

        setDrafts(
          records.map((record: PoTyreBatchRecord, index) => ({
            localId: index + 1,
            DOT: record.DOT ?? "",
            Qty: String(record.Qty),
          })),
        )
        setNextLocalId(records.length + 1)
      } catch (err: any) {
        if (cancelled) return
        setError(err.message || "Failed to load batches")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isOpen, poTyresId])

  const allocatedTotal = drafts.reduce((sum, draft) => {
    const value = toNonNegativeInt(draft.Qty)
    return Number.isNaN(value) ? sum : sum + value
  }, 0)

  const update = useCallback((localId: number, patch: Partial<BatchDraft>) => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.localId !== localId) return draft
        const next = { ...draft, ...patch }
        if (patch.DOT !== undefined) {
          next.DOT = sanitizeDot(patch.DOT ?? "")
        }
        return next
      })
    )
  }, [])

  const addRow = useCallback(() => {
    setDrafts((prev) => [...prev, EMPTY_DRAFT(nextLocalId)])
    setNextLocalId((id) => id + 1)
  }, [nextLocalId])

  const removeRow = useCallback((localId: number) => {
    setDrafts((prev) => prev.filter((draft) => draft.localId !== localId))
  }, [])

  const dotErrors = useMemo(() => {
    const errors: Record<number, string | undefined> = {}
    const seen = new Map<string, number>()

    drafts.forEach((draft) => {
      const dot = draft.DOT.trim()
      if (!dot) {
        errors[draft.localId] = undefined
        return
      }

      if (!isValidDot(dot)) {
        errors[draft.localId] = DOT_FORMAT_ERROR
        return
      }

      if (seen.has(dot)) {
        errors[draft.localId] = DOT_DUPLICATE_ERROR
        const firstLocalId = seen.get(dot)!
        errors[firstLocalId] = DOT_DUPLICATE_ERROR
        return
      }

      seen.set(dot, draft.localId)
      errors[draft.localId] = undefined
    })

    return errors
  }, [drafts])

  const validate = (): string | null => {
    for (const draft of drafts) {
      const dotError = dotErrors[draft.localId]
      if (dotError) {
        return dotError
      }
    }

    for (const draft of drafts) {
      const qty = toNonNegativeInt(draft.Qty)
      if (Number.isNaN(qty) || qty <= 0) {
        return "Each batch quantity must be a positive whole number"
      }
    }

    if (drafts.length === 0) {
      return null
    }

    if (allocatedTotal !== lineQty) {
      return `Batch quantities must total ${lineQty}, the ordered quantity`
    }

    return null
  }

  const validationError = useMemo(() => validate(), [drafts, allocatedTotal, lineQty])

  const save = useCallback(async () => {
    if (!poTyresId) return

    if (validationError) {
      setError(validationError)
      return
    }

    const batches: PoTyreBatchPayload[] = drafts.map((draft) => ({
      DOT: draft.DOT.trim() || null,
      Qty: toNonNegativeInt(draft.Qty),
    }))

    setSaving(true)
    setError(null)
    try {
      await purchaseOrderService.savePoTyreBatches(poTyresId, batches)
      onSaved?.()
    } catch (err: any) {
      setError(err.message || "Failed to save batches")
    } finally {
      setSaving(false)
    }
  }, [poTyresId, drafts, validationError, onSaved])

  return {
    drafts,
    loading,
    saving,
    error,
    allocatedTotal,
    validationError,
    dotErrors,
    actions: {
      update,
      addRow,
      removeRow,
      save,
    },
  }
}