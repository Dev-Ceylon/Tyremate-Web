import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "@/lib/router"
import type { SalesOrderPaymentPayload } from "../models/payment"
import type { SoDetailedRecord, SoReturnTyresPayload } from "../models/salesOrder"
import { salesOrderService } from "../services/salesOrderService"

type UseSalesOrderDetailsOptions = {
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function useSalesOrderDetails(options?: UseSalesOrderDetailsOptions) {
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const { soId } = useParams<{ soId: string }>()
  const [order, setOrder] = useState<SoDetailedRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialLoadCompleteRef = useRef(false)

  useEffect(() => {
    // A route/param change starts a new order; next fetch is treated as initial.
    initialLoadCompleteRef.current = false
  }, [soId])

  const fetchOrderDetails = useCallback(async () => {
    if (!soId) return

    const isInitialLoad = !initialLoadCompleteRef.current
    if (isInitialLoad) setLoading(true)

    try {
      const [data, violations] = await Promise.all([
        salesOrderService.getSOById(Number(soId)),
        salesOrderService.getViolationsBySoId(Number(soId)),
      ])
      initialLoadCompleteRef.current = true
      setOrder({ ...data, Violations: violations })
      setError(null)
    } catch (err) {
      if (isInitialLoad) {
        setError(err instanceof Error ? err.message : "Failed to load order details")
      }
      // Background refreshes keep the last loaded data on screen.
    } finally {
      if (isInitialLoad) setLoading(false)
    }
  }, [soId])

  useEffect(() => {
    void fetchOrderDetails()
  }, [fetchOrderDetails])

  const makePayment = useCallback(
    async (payment: SalesOrderPaymentPayload): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!soId) {
          throw new Error("Order ID is missing from route parameters")
        }

        const result = await salesOrderService.makeAPaymentForSo(Number(soId), payment)

        if (result.success) {
          await fetchOrderDetails()
          onSuccess?.()
          return true
        } else {
          const message =  "Payment failed"
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
    [soId, fetchOrderDetails, onSuccess, onError]
  )

  const completeChequePayment = useCallback(
    async (paymentId: number): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!soId) {
          throw new Error("Order ID is missing from route parameters")
        }

        const result = await salesOrderService.completeChequePayment(Number(soId), paymentId)

        if (result.success) {
          await fetchOrderDetails()
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
    [soId, fetchOrderDetails, onSuccess, onError]
  )

  const completeSalesOrder = useCallback(
    async (): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!soId) {
          throw new Error("Order ID is missing from route parameters")
        }

        const confirmed = window.confirm("Are you sure you want to mark this Sales Order as completed?")
        if (!confirmed) {
          setSubmitting(false)
          return false
        }

        const result = await salesOrderService.completeSalesOrder(Number(soId))

        if (result.success) {
          await fetchOrderDetails()
          onSuccess?.()
          return true
        } else {
          const message = "Failed to complete Sales Order"
          setError(message)
          onError?.(message)
          return false
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to complete Sales Order"
        setError(message)
        onError?.(message)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [soId, fetchOrderDetails, onSuccess, onError]
  )

  const createTyreReturn = useCallback(
    async (tyreReturnPayload: SoReturnTyresPayload): Promise<boolean> => {
      setSubmitting(true)
      setError(null)

      try {
        if (!soId) {
          throw new Error("Order ID is missing from route parameters")
        }
        if (Number(soId) !== tyreReturnPayload.SoID) {
          throw new Error("Sales Order ID in payload does not match current order ID.")
        }

        await salesOrderService.createSoTyreReturn(Number(soId), tyreReturnPayload)

        await fetchOrderDetails() // Refresh order details to reflect the return
        onSuccess?.()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to record tyre return"
        setError(message)
        onError?.(message)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [soId, fetchOrderDetails, onSuccess, onError]
  )

  return {
    order,
    loading,
    submitting,
    error,
    refresh: fetchOrderDetails,
    makePayment,
    completeChequePayment,
    completeSalesOrder,
    createTyreReturn,
  }
}