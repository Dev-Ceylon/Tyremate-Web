import { useCallback, useEffect, useState } from "react"
import { useParams } from "@/lib/router"
import type { OtherServiceDetailedRecord, OtherServicePaymentPayload } from "../models/otherService"
import { otherServiceService } from "../services/otherServiceService"

type UseOtherServiceDetailsOptions = {
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useOtherServiceDetails(options?: UseOtherServiceDetailsOptions) {
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const { osId } = useParams<{ osId: string }>()
  const [record, setRecord] = useState<OtherServiceDetailedRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async () => {
    if (!osId) return

    setLoading(true)
    try {
      const data = await otherServiceService.getById(Number(osId))
      setRecord(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load details")
    } finally {
      setLoading(false)
    }
  }, [osId])

  useEffect(() => {
    void fetchDetails()
  }, [fetchDetails])

  const makePayment = useCallback(
    async (payment: OtherServicePaymentPayload): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!osId) throw new Error("OS ID is missing from route parameters")

        const result = await otherServiceService.makeAPayment(Number(osId), payment)

        if (result.success) {
          await fetchDetails()
          onSuccess?.()
          return true
        } else {
          const message = "Payment failed"
          setError(message)
          onError?.(message)
          return false
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process payment"
        setError(message)
        onError?.(message)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [osId, fetchDetails, onSuccess, onError],
  )

  const completeChequePayment = useCallback(
    async (paymentId: number): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!osId) throw new Error("OS ID is missing from route parameters")

        const result = await otherServiceService.completeChequePayment(Number(osId), paymentId)

        if (result.success) {
          await fetchDetails()
          onSuccess?.()
          return true
        } else {
          const message = "Failed to complete cheque payment"
          setError(message)
          onError?.(message)
          return false
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to process cheque completion"
        setError(message)
        onError?.(message)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [osId, fetchDetails, onSuccess, onError],
  )

  const completeService = useCallback(
    async (): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!osId) throw new Error("OS ID is missing from route parameters")

        const confirmed = window.confirm("Are you sure you want to mark this Other Service as completed?")
        if (!confirmed) {
          setSubmitting(false)
          return false
        }

        const result = await otherServiceService.complete(Number(osId))

        if (result.success) {
          await fetchDetails()
          onSuccess?.()
          return true
        } else {
          const message = "Failed to complete Other Service"
          setError(message)
          onError?.(message)
          return false
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to complete Other Service"
        setError(message)
        onError?.(message)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [osId, fetchDetails, onSuccess, onError],
  )

  return {
    record,
    loading,
    submitting,
    error,
    refresh: fetchDetails,
    makePayment,
    completeChequePayment,
    completeService,
  }
}