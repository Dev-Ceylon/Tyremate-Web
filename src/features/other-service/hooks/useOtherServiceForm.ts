import { useCallback, useEffect, useMemo, useState } from "react"
import type { ConsumableRecord } from "../../../shared/models/consumables/consumable"
import { consumableService } from "../../master-data/consumables/services/consumableService"
import { otherServiceService } from "../services/otherServiceService"
import { printOtherService } from "../services/otherServicePrintService"
import type { OtherServiceFormData, OtherServicePaymentPayload } from "../models/otherService"
import { PAYMENT_TYPE_CODES } from "../../../shared/payment/constants/paymentTypeConstants"
import { usePrinterStore } from "../../../shared/state/printerStore"
import { validatePhone } from "../../../shared/validation/phone"
import { validateEmail } from "../../../shared/validation/email"

export type OtherServiceLineForm = {
  RowId: number
  ConsumableID: number | ""
  Price: number
  Qty: number
}

type UseOtherServiceFormOptions = {
  onSuccess?: () => void
  onError?: (message: string) => void
}

const createEmptyLine = (consumableId: number | "" = ""): OtherServiceLineForm => ({
  RowId: Date.now() + Math.floor(Math.random() * 1000),
  ConsumableID: consumableId,
  Price: 0,
  Qty: 1,
})

const createInitialState = (): OtherServiceFormData => ({
  Date: new Date().toISOString().slice(0, 10),
  CustomerName: "",
  CustomerPhone: "",
  CustomerEmail: "",
})

export function useOtherServiceForm(options?: UseOtherServiceFormOptions) {
  const onSuccess = options?.onSuccess
  const onError = options?.onError
  const selectedPrinter = usePrinterStore((s) => s.selectedPrinter)
  const [formData, setFormData] = useState<OtherServiceFormData>(createInitialState)
  const [lines, setLines] = useState<OtherServiceLineForm[]>([createEmptyLine()])
  const [consumables, setConsumables] = useState<ConsumableRecord[]>([])
  const [initializing, setInitializing] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOptions = useCallback(async () => {
    setInitializing(true)
    setError(null)

    try {
      const consumableRows = await consumableService.getConsumablesWithStock()

      setConsumables(consumableRows ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load options"
      setError(message)
      onError?.(message)
    } finally {
      setInitializing(false)
    }
  }, [onError])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const updateField = useCallback(
    <K extends keyof OtherServiceFormData>(field: K, value: OtherServiceFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, createEmptyLine()])
  }, [])

  const removeLine = useCallback((rowId: number) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.RowId !== rowId)))
  }, [])

  const updateLine = useCallback(
    <K extends keyof OtherServiceLineForm>(rowId: number, field: K, value: OtherServiceLineForm[K]) => {
      setLines((prev) =>
        prev.map((line) => (line.RowId === rowId ? { ...line, [field]: value } : line)),
      )
    },
    [],
  )

  const setLineConsumable = useCallback((rowId: number, consumableId: number | "") => {
    const selected = consumableId === ""
      ? null
      : consumables.find((c) => c.Id === consumableId) ?? null
    const price = Number(selected?.CostPrice ?? 0) || 0

    setLines((prev) =>
      prev.map((line) =>
        line.RowId === rowId
          ? { ...line, ConsumableID: consumableId, Price: price }
          : line,
      ),
    )
  }, [consumables])

  const totalAmount = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = line.Price || 0
      const qty = line.Qty || 0
      return sum + price * qty
    }, 0)
  }, [lines])

  const resetForm = useCallback(() => {
    setFormData(createInitialState())
    setLines([createEmptyLine()])
    setError(null)
  }, [])

  const validate = useCallback(() => {
    if (!formData.Date) {
      throw new Error("Date is required")
    }

    if (!formData.CustomerName) {
      throw new Error("Customer name is required")
    }

    if (formData.CustomerPhone) {
      const phoneError = validatePhone(formData.CustomerPhone)
      if (phoneError) throw new Error(phoneError)
    }

    if (formData.CustomerEmail) {
      const emailError = validateEmail(formData.CustomerEmail)
      if (emailError) throw new Error(emailError)
    }

    if (lines.length === 0) {
      throw new Error("At least one consumable line is required")
    }

    lines.forEach((line, index) => {
      const row = index + 1

      if (!line.ConsumableID) {
        throw new Error(`Consumable is required on line ${row}`)
      }

      if (!Number.isInteger(line.Qty) || line.Qty <= 0) {
        throw new Error(`Qty must be greater than 0 on line ${row}`)
      }

      if (line.Price < 0) {
        throw new Error(`Price cannot be negative on line ${row}`)
      }
    })
  }, [formData.Date, formData.CustomerName, formData.CustomerPhone, formData.CustomerEmail, lines])

  const submitOrder = useCallback(
    async (payment?: OtherServicePaymentPayload | null) => {
      setSubmitting(true)
      setError(null)

      try {
        validate()

        const osPayload = {
          Date: formData.Date,
          IsCompleted: 0,
          IsPaymentCompleted: 0,
          CustomerName: formData.CustomerName || undefined,
          CustomerPhone: formData.CustomerPhone || undefined,
          CustomerEmail: formData.CustomerEmail || undefined,
          Consumables: lines.map((line) => ({
            ConsumableID: Number(line.ConsumableID),
            Price: line.Price,
            Qty: line.Qty,
          })),
          Payment: payment || null,
        }

        const result = await otherServiceService.create(osPayload)

        if (selectedPrinter) {
          try {
            await printOtherService(result.OSID, selectedPrinter)
          } catch (printErr) {
            console.error("Failed to print other service:", printErr)
          }
        }

        onSuccess?.()
        resetForm()
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create other service"
        setError(message)
        onError?.(message)
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [formData, lines, onError, onSuccess, resetForm, selectedPrinter, validate],
  )

  const buildPaymentPayload = useCallback(
    (paymentData: {
      cashAmountReceived?: number
      chequeNumber?: string
      chequeDate?: string
      bankName?: string
      chequeAmount?: number
      bankTransferAmount?: number
      bankDetailsId?: number
    }) => {
      const cashAmount =
        paymentData.cashAmountReceived && paymentData.cashAmountReceived > 0
          ? {
              PaymentTypeCode: PAYMENT_TYPE_CODES.CASH,
              AmountReceived: paymentData.cashAmountReceived,
              BalanceToReturn: Math.max(0, paymentData.cashAmountReceived - totalAmount),
            }
          : null

      const chequeAmount =
        paymentData.chequeAmount && paymentData.chequeAmount > 0 && paymentData.chequeNumber
          ? {
              PaymentTypeCode: PAYMENT_TYPE_CODES.CHEQUE,
              ChequeNumber: paymentData.chequeNumber,
              ChequeDate: paymentData.chequeDate || new Date().toISOString().slice(0, 10),
              BankName: paymentData.bankName || "",
              Amount: paymentData.chequeAmount,
              Collected: 0,
            }
          : null

      const bankAmount =
        paymentData.bankTransferAmount && paymentData.bankTransferAmount > 0 && paymentData.bankDetailsId
          ? {
              PaymentTypeCode: PAYMENT_TYPE_CODES.BANK_TRANSFER,
              BankDetailsID: paymentData.bankDetailsId,
              Amount: paymentData.bankTransferAmount,
            }
          : null

      if (!cashAmount && !chequeAmount && !bankAmount) return null

      return {
        CashPayment: cashAmount,
        ChequePayment: chequeAmount,
        BankTransferPayment: bankAmount,
      }
    },
    [totalAmount],
  )

  return {
    formData,
    lines,
    consumables,
    initializing,
    submitting,
    error,
    totalAmount,
    updateField,
    addLine,
    removeLine,
    updateLine,
    setLineConsumable,
    buildPaymentPayload,
    submitOrder,
  }
}
