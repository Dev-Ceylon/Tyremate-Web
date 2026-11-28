import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { invoiceService } from "../../invoice/services/invoiceService"
import type { InvoiceDetailedRecord } from "../../invoice/models/invoice"

export function useDagInvoice(dagId: number | undefined) {
  const [invoice, setInvoice] = useState<InvoiceDetailedRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const refreshInvoice = useCallback(async () => {
    if (!dagId) {
      setInvoice(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await invoiceService.getBySource("dag", dagId)
      setInvoice(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load invoice"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [dagId])

  useEffect(() => {
    void refreshInvoice()
  }, [refreshInvoice])

  const generateInvoice = useCallback(async () => {
    if (!dagId) return

    setIsGenerating(true)
    try {
      const generated = await invoiceService.generateFromDAG(dagId)
      setInvoice(generated)
      showToast({
        variant: "success",
        title: "Invoice generated",
        message: `Invoice ${generated.InvoiceNumber} generated successfully.`,
      })
      navigate(`/invoices/${generated.InvoiceID}`)
      return generated
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate invoice"
      showToast({
        variant: "error",
        title: "Invoice generation failed",
        message,
      })
    } finally {
      setIsGenerating(false)
    }
  }, [dagId, navigate, showToast])

  return {
    invoice,
    loading,
    error,
    isGenerating,
    generateInvoice,
    refreshInvoice,
  }
}
