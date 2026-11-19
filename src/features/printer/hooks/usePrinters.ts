import { useEffect, useState } from "react"
import type { PrinterInfo } from "../../../shared/models/printer"
import { printerService } from "../services/printerService"

export function usePrinters() {
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await printerService.getPrinters()
      setPrinters(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load printers")
    } finally {
      setLoading(false)
    }
  }

  const testPrint = async (printerName: string) => {
    setTesting(true)

    try {
      return await printerService.testPrint(printerName)
    } catch (err) {
      console.error("Print test failed:", err)
      throw err
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { printers, loading, testing, error, refresh, testPrint }
}
