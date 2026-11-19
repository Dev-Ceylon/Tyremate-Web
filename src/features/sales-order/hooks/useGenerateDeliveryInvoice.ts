import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { invoiceService } from "../../invoice/services/invoiceService"

/**
 * Generates an invoice for a single hand-over and opens it. Owns the service
 * call, navigation and the per-row pending state so the page stays presentational.
 */
export function useGenerateDeliveryInvoice() {
  const navigate = useNavigate()
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const generate = async (deliveryId: number) => {
    setGeneratingId(deliveryId)
    try {
      const invoice = await invoiceService.generateFromDelivery(deliveryId)
      if (invoice?.InvoiceID) {
        navigate(`/invoices/${invoice.InvoiceID}`)
      }
    } catch {
      // The IPC layer surfaces the error as a toast.
    } finally {
      setGeneratingId(null)
    }
  }

  return { generatingId, generate }
}
