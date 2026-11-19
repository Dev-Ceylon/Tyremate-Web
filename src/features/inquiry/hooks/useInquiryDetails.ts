import { useCallback, useEffect, useState } from "react"
import { useParams } from "@/lib/router"
import type { InquiryRecord } from "../models/inquiry"
import { inquiryService } from "../services/inquiryService"

export function useInquiryDetails() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const [inquiry, setInquiry] = useState<InquiryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInquiryDetails = useCallback(async () => {
    if (!inquiryId) return

    setLoading(true)
    try {
      const data = await inquiryService.getInquiryById(Number(inquiryId))
      setInquiry(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inquiry details")
    } finally {
      setLoading(false)
    }
  }, [inquiryId])

  useEffect(() => {
    void fetchInquiryDetails()
  }, [fetchInquiryDetails])

  return {
    inquiry,
    loading,
    error,
    refresh: fetchInquiryDetails,
  }
}
