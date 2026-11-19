import { useCallback, useEffect, useState } from "react"
import type {
  CancelInvoicePayload,
  CreditNotePayload,
  InvoiceDetailedRecord,
  UpdateInvoicePayload,
} from "../models/invoice"
import { invoiceService } from "../services/invoiceService"

export function useInvoiceDetails(invoiceId: number | null) {
  const [record, setRecord] = useState<InvoiceDetailedRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await invoiceService.getInvoiceById(invoiceId)
      setRecord(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch invoice")
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    void fetchInvoice()
  }, [fetchInvoice])

  const updateInvoice = useCallback(
    async (data: UpdateInvoicePayload) => {
      if (!invoiceId) return
      setSubmitting(true)
      try {
        const updated = await invoiceService.updateInvoice(invoiceId, data)
        setRecord(updated)
        return updated
      } finally {
        setSubmitting(false)
      }
    },
    [invoiceId],
  )

  const cancelInvoice = useCallback(
    async (data: CancelInvoicePayload) => {
      if (!invoiceId) return
      setSubmitting(true)
      try {
        const updated = await invoiceService.cancelInvoice(invoiceId, data)
        setRecord(updated)
        return updated
      } finally {
        setSubmitting(false)
      }
    },
    [invoiceId],
  )

  const createCreditNote = useCallback(
    async (data: CreditNotePayload) => {
      if (!invoiceId) return
      setSubmitting(true)
      try {
        const updated = await invoiceService.createCreditNote(invoiceId, data)
        setRecord(updated)
        return updated
      } finally {
        setSubmitting(false)
      }
    },
    [invoiceId],
  )

  const recordPayment = useCallback(
    async (paymentPayload: { Payment: unknown }) => {
      if (!invoiceId) return
      setSubmitting(true)
      try {
        const updated = await invoiceService.recordPayment(invoiceId, paymentPayload)
        setRecord(updated)
        return updated
      } finally {
        setSubmitting(false)
      }
    },
    [invoiceId],
  )

  return {
    record,
    loading,
    error,
    submitting,
    refresh: fetchInvoice,
    updateInvoice,
    cancelInvoice,
    createCreditNote,
    recordPayment,
  }
}
