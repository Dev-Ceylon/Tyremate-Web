import { useCallback, useEffect, useState } from "react"
import type { InquiryRecord } from "../models/inquiry"
import { inquiryService } from "../services/inquiryService"

export function useInquiryList() {
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchInquiries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await inquiryService.getInquiries()
      setInquiries(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inquiries")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchInquiries()
  }, [fetchInquiries])

  const handleDelete = useCallback(async (inquiryId: number) => {
    if (!window.confirm("Are you sure you want to delete this inquiry?")) return

    setDeletingId(inquiryId)
    try {
      await inquiryService.deleteInquiry(inquiryId)
      setInquiries((prev) => prev.filter((inq) => inq.InquiryID !== inquiryId))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete inquiry")
    } finally {
      setDeletingId(null)
    }
  }, [])

  return {
    inquiries,
    loading,
    error,
    deletingId,
    refresh: fetchInquiries,
    handleDelete,
  }
}