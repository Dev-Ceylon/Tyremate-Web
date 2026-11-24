import { useCallback, useEffect, useState } from "react"
import type { LinkedSoRecord } from "../models/inquirySo"
import { inquirySoService } from "../services/inquirySoService"

export function useInquiryLinkedSos(inquiryId: number | null) {
  const [linkedSos, setLinkedSos] = useState<LinkedSoRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!inquiryId) return

    setLoading(true)
    try {
      const links = await inquirySoService.getLinkedSosByInquiryId(inquiryId)
      setLinkedSos(links)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load linked sales orders")
    } finally {
      setLoading(false)
    }
  }, [inquiryId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const linkSo = useCallback(
    async (soId: number) => {
      if (!inquiryId) return
      setIsSaving(true)
      try {
        const updated = await inquirySoService.linkSo(inquiryId, soId)
        setLinkedSos(updated)
      } finally {
        setIsSaving(false)
      }
    },
    [inquiryId],
  )

  const unlinkSo = useCallback(
    async (soId: number) => {
      if (!inquiryId) return
      setIsSaving(true)
      try {
        const updated = await inquirySoService.unlinkSo(inquiryId, soId)
        setLinkedSos(updated)
      } finally {
        setIsSaving(false)
      }
    },
    [inquiryId],
  )

  return { linkedSos, loading, isSaving, error, linkSo, unlinkSo, refresh }
}