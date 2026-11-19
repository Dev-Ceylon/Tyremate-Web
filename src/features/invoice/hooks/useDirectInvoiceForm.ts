import { useCallback, useEffect, useMemo, useState } from "react"
import type { CustomerRecord } from "../../master-data/customers/models/customer"
import type { DirectInvoicePayload, InvoiceDetailedRecord, InvoiceLinePayload } from "../models/invoice"
import { invoiceService } from "../services/invoiceService"

export type DirectInvoiceLineForm = {
  key: string
  description: string
  qty: string
  unitPrice: string
  discount: string
}

const localToday = () => {
  const now = new Date()
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
}

const emptyLine = (): DirectInvoiceLineForm => ({
  key: Math.random().toString(36).slice(2),
  description: "",
  qty: "1",
  unitPrice: "",
  discount: "0",
})

const num = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function useDirectInvoiceForm(onCreated: (invoice: InvoiceDetailedRecord) => void) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [customerId, setCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerVatNo, setCustomerVatNo] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(localToday())
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [taxLabel, setTaxLabel] = useState("")
  const [taxAmount, setTaxAmount] = useState("0")
  const [amountPaid, setAmountPaid] = useState("0")
  const [lines, setLines] = useState<DirectInvoiceLineForm[]>([emptyLine()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await window.api.customers.getCustomers()
        setCustomers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customers")
      } finally {
        setLoadingCustomers(false)
      }
    })()
  }, [])

  const handleSelectCustomer = useCallback(
    (value: string) => {
      setCustomerId(value)
      const selected = customers.find((c) => String(c.CustomerID) === value)
      if (selected) {
        const primaryAddress = selected.Addresses?.find((a) => a.IsPrimary) || selected.Addresses?.[0]
        const addressText = primaryAddress
          ? [primaryAddress.AddressLine1, primaryAddress.AddressLine2, primaryAddress.City].filter(Boolean).join(", ")
          : ""
        const primaryContact = selected.Contacts?.find((c) => c.IsPrimary) || selected.Contacts?.[0]
        setCustomerName(selected.Name)
        setCustomerAddress(addressText)
        setCustomerPhone(primaryContact?.PhoneNumber || "")
        setCustomerVatNo(selected.VatNo || "")
      }
    },
    [customers],
  )

  const addLine = useCallback(() => setLines((prev) => [...prev, emptyLine()]), [])

  const removeLine = useCallback((key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))
  }, [])

  const updateLine = useCallback((key: string, patch: Partial<DirectInvoiceLineForm>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }, [])

  const totals = useMemo(() => {
    let subtotal = 0
    let discountTotal = 0
    for (const line of lines) {
      const gross = num(line.qty) * num(line.unitPrice)
      const discount = (gross * num(line.discount)) / 100
      subtotal += gross
      discountTotal += discount
    }
    const total = subtotal - discountTotal + num(taxAmount)
    return { subtotal, discountTotal, total }
  }, [lines, taxAmount])

  const submit = useCallback(async () => {
    setError(null)

    const payloadLines: InvoiceLinePayload[] = lines
      .filter((l) => l.description.trim() || num(l.unitPrice) > 0)
      .map((l) => ({
        Description: l.description.trim(),
        Qty: num(l.qty),
        UnitPrice: num(l.unitPrice),
        Discount: num(l.discount),
      }))

    if (payloadLines.length === 0) {
      setError("Add at least one line item.")
      return
    }
    if (!customerId && !customerName.trim()) {
      setError("Select a customer or enter a customer name.")
      return
    }

    const payload: DirectInvoicePayload = {
      CustomerID: customerId ? Number(customerId) : undefined,
      CustomerName: customerName.trim() || null,
      CustomerAddress: customerAddress.trim() || null,
      CustomerPhone: customerPhone.trim() || null,
      CustomerVatNo: customerVatNo.trim() || null,
      InvoiceDate: invoiceDate || null,
      DueDate: dueDate || null,
      Notes: notes.trim() || null,
      TaxLabel: taxLabel.trim() || null,
      TaxAmount: num(taxAmount),
      AmountPaid: num(amountPaid),
      Lines: payloadLines,
    }

    setSubmitting(true)
    try {
      const created = await invoiceService.createDirect(payload)
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice")
    } finally {
      setSubmitting(false)
    }
  }, [
    lines,
    customerId,
    customerName,
    customerAddress,
    customerPhone,
    customerVatNo,
    invoiceDate,
    dueDate,
    notes,
    taxLabel,
    taxAmount,
    amountPaid,
    onCreated,
  ])

  return {
    customers,
    loadingCustomers,
    customerId,
    customerName,
    customerAddress,
    customerPhone,
    customerVatNo,
    invoiceDate,
    dueDate,
    notes,
    taxLabel,
    taxAmount,
    amountPaid,
    lines,
    totals,
    submitting,
    error,
    setCustomerName,
    setCustomerAddress,
    setCustomerPhone,
    setCustomerVatNo,
    setInvoiceDate,
    setDueDate,
    setNotes,
    setTaxLabel,
    setTaxAmount,
    setAmountPaid,
    handleSelectCustomer,
    addLine,
    removeLine,
    updateLine,
    submit,
  }
}
