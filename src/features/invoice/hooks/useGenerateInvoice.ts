import { useState } from "react"
import { useNavigate } from "@/lib/router"
import { useToast } from "../../../shared/ui/toast/ToastProvider"
import { invoiceService } from "../services/invoiceService"

export type InvoiceSource =
  | { type: "salesOrder"; id: number | null }
  | { type: "otherService"; id: number | null }
  | { type: "dag"; id: number | null }

export function useGenerateInvoice(source: InvoiceSource) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const generate = async () => {
    if (!source.id) return

    setIsGenerating(true)
    try {
      let invoice
      if (source.type === "salesOrder") {
        invoice = await invoiceService.generateFromSO(source.id)
      } else if (source.type === "otherService") {
        invoice = await invoiceService.generateFromOtherService(source.id)
      } else {
        invoice = await invoiceService.generateFromDAG(source.id)
      }
      navigate(`/invoices/${invoice.InvoiceID}`)
    } catch (err) {
      showToast({
        variant: "error",
        title: "Invoice generation failed",
        message: err instanceof Error ? err.message : "Failed to generate invoice",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return { isGenerating, generate }
}
