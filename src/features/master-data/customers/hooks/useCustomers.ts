import { useCallback, useEffect, useState } from "react"
import type { CustomerRecord } from "../models/customer"
import { customerService } from "../services/customerService"

type UseCustomersOptions = {
  onDeleteSuccess?: (customer: CustomerRecord) => void
  onDeleteError?: (message: string, customer: CustomerRecord) => void
}

export function useCustomers(options?: UseCustomersOptions) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await customerService.getCustomers()
      setCustomers(data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removeCustomer = useCallback(async (customer: CustomerRecord) => {
    setDeletingCustomerId(customer.CustomerID)

    try {
      await customerService.deleteCustomer(customer.CustomerID)
      setCustomers((current) =>
        current.filter(
          (currentCustomer) => currentCustomer.CustomerID !== customer.CustomerID
        )
      )
      options?.onDeleteSuccess?.(customer)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete customer"
      options?.onDeleteError?.(message, customer)
      throw err
    } finally {
      setDeletingCustomerId(null)
    }
  }, [options])

  return { customers, loading, error, deletingCustomerId, refresh, removeCustomer }
}
