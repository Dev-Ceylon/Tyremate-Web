import { useCallback, useEffect, useRef, useState } from "react"
import { creditNoteService } from "../../credit-note/services/creditNoteClient"
import { salesOrderService } from "../../sales-order/services/salesOrderService"
import { salesReturnService } from "../services/salesReturnService"
import {
  SALES_RETURN_CONDITION_CODES,
  SALES_RETURN_DISPOSITION_CODES,
  type SalesReturnConditionCode,
  type SalesReturnDispositionCode,
} from "../constants/salesReturnInspectionConstants"
import type { SalesReturnDetails, SalesReturnLineInspection, SalesReturnRecord } from "../models/salesReturn"
import { SALES_RETURN_STATUS_CODES, type SalesReturnStatusCode } from "../constants/salesReturnStatusConstants"

const INSPECTION_STATUSES: readonly SalesReturnStatusCode[] = [
  SALES_RETURN_STATUS_CODES.RECEIVED_IN_QUARANTINE,
  SALES_RETURN_STATUS_CODES.REQUESTED,
  SALES_RETURN_STATUS_CODES.UNDER_INSPECTION,
]

const COMPLETED_STATUSES: readonly SalesReturnStatusCode[] = [
  SALES_RETURN_STATUS_CODES.RECEIVED_IN_STOCK,
  SALES_RETURN_STATUS_CODES.CREDIT_ISSUED,
  SALES_RETURN_STATUS_CODES.REFUNDED,
  SALES_RETURN_STATUS_CODES.REJECTED,
]

const hasStatus = (status: SalesReturnStatusCode | null | undefined, statuses: readonly SalesReturnStatusCode[]) =>
  status != null && statuses.includes(status)

const getLineInspections = (details: SalesReturnDetails): Record<number, SalesReturnLineInspection> =>
  Object.fromEntries(details.lines.map((line) => [line.SalesReturnLineID, {
    condition: (line.ConditionCode as SalesReturnConditionCode) || SALES_RETURN_CONDITION_CODES.OTHER,
    disposition: (line.DispositionCode as SalesReturnDispositionCode) || SALES_RETURN_DISPOSITION_CODES.QUARANTINE,
    notes: line.InspectionNotes || "",
  }]))

export function useSalesReturnList(salesReturnId?: number) {
  const [returns, setReturns] = useState<SalesReturnRecord[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedIdRef = useRef<number | null>(null)
  const [details, setDetails] = useState<SalesReturnDetails | null>(null)
  const [inspections, setInspections] = useState<Record<number, SalesReturnLineInspection>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refundMethods, setRefundMethods] = useState<Array<{ MethodId: number; MethodCode: string; MethodName: string }>>([])
  const [refundAmount, setRefundAmount] = useState("")
  const [refundMethodId, setRefundMethodId] = useState("")
  const [exchangeOrderId, setExchangeOrderId] = useState("")
  const [exchangeOrderValue, setExchangeOrderValue] = useState<number | null>(null)

  const loadDetails = useCallback(async (id: number) => {
    const result = await salesReturnService.getDetails(id)
    setDetails(result)
    setExchangeOrderId(result.salesReturn.ExchangeSoID ? String(result.salesReturn.ExchangeSoID) : "")
    if (result.salesReturn.ExchangeSoID) {
      const order = await salesOrderService.getSOById(result.salesReturn.ExchangeSoID)
      setExchangeOrderValue(Number(order.TotalSale || 0) - Number(order.TotalDiscount || 0))
    } else setExchangeOrderValue(null)
    setInspections(getLineInspections(result))
  }, [])

  const loadReturns = useCallback(async (selectId?: number | null) => {
    setLoading(true)
    setError(null)
    try {
      const rows = await salesReturnService.list()
      setReturns(rows)
      const id = selectId ?? selectedIdRef.current
      selectedIdRef.current = id
      setSelectedId(id)
      if (id) await loadDetails(id)
      else setDetails(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales returns")
    } finally {
      setLoading(false)
    }
  }, [loadDetails])

  const selectReturn = useCallback(async (id: number) => {
    selectedIdRef.current = id
    setSelectedId(id)
    setLoading(true)
    setError(null)
    try {
      await loadDetails(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load return details")
    } finally {
      setLoading(false)
    }
  }, [loadDetails])

  const refresh = useCallback(() => {
    if (salesReturnId) return selectReturn(salesReturnId)
    return loadReturns(null)
  }, [loadReturns, salesReturnId, selectReturn])

  useEffect(() => {
    if (salesReturnId) void selectReturn(salesReturnId)
    else void loadReturns(null)
  }, [loadReturns, salesReturnId, selectReturn])

  useEffect(() => {
    if (!salesReturnId) return
    void creditNoteService.getRefundMethods().then((methods) => {
      const cashMethods = methods.filter((method) => method.MethodCode !== "STORE_CREDIT")
      setRefundMethods(cashMethods)
      if (cashMethods[0]) setRefundMethodId(String(cashMethods[0].MethodId))
    }).catch(() => setRefundMethods([]))
  }, [salesReturnId])

  const runAction = useCallback(async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sales return action failed"
      // Inspection can commit before a follow-up credit note fails.
      await refresh()
      setError(message)
    } finally {
      setBusy(false)
    }
  }, [refresh])

  const inspectAndApprove = useCallback(() => {
    if (!details) return
    void runAction(async () => {
      const salesReturnId = details.salesReturn.SalesReturnID
      await salesReturnService.inspectAndApprove({
        salesReturnId,
        lines: details.lines.map((line) => {
          const inspection = inspections[line.SalesReturnLineID]
          return {
            salesReturnLineId: line.SalesReturnLineID,
            condition: inspection?.condition || SALES_RETURN_CONDITION_CODES.OTHER,
            disposition: inspection?.disposition || SALES_RETURN_DISPOSITION_CODES.QUARANTINE,
            inspected: true,
            approved: true,
            inspectionNotes: inspection?.notes || null,
          }
        }),
      })
      if (details.lines.some((line) => inspections[line.SalesReturnLineID]?.disposition === SALES_RETURN_DISPOSITION_CODES.RESTOCK_SALEABLE)) {
        await salesReturnService.transferToSaleable({ salesReturnId })
      }
      if (details.lines.some((line) => inspections[line.SalesReturnLineID]?.disposition === SALES_RETURN_DISPOSITION_CODES.SCRAP)) {
        await salesReturnService.moveToScrapOrSupplier({ salesReturnId, actionCode: "SCRAP" })
      }
      if (details.lines.some((line) => inspections[line.SalesReturnLineID]?.disposition === SALES_RETURN_DISPOSITION_CODES.RETURN_TO_SUPPLIER)) {
        await salesReturnService.moveToScrapOrSupplier({ salesReturnId, actionCode: "RETURN_TO_SUPPLIER" })
      }
    })
  }, [details, inspections, runAction])

  const rejectReturn = useCallback(() => {
    if (!details) return
    void runAction(() => salesReturnService.reject({
      salesReturnId: details.salesReturn.SalesReturnID,
      rejectionReason: "Rejected after inspection",
    }))
  }, [details, runAction])

  const linkExchangeOrder = useCallback(() => {
    if (!details || !exchangeOrderId) return
    void runAction(async () => {
      const exchangeSoId = Number(exchangeOrderId)
      const order = await salesOrderService.getSOById(exchangeSoId)
      await salesReturnService.linkExchangeSalesOrder({ salesReturnId: details.salesReturn.SalesReturnID, exchangeSoId })
      setExchangeOrderValue(Number(order.TotalSale || 0) - Number(order.TotalDiscount || 0))
    })
  }, [details, exchangeOrderId, runAction])

  const retryCreditNote = useCallback(() => {
    if (details) void runAction(() => creditNoteService.generateFromSalesReturn(details.salesReturn.SalesReturnID))
  }, [details, runAction])

  const approveCreditNote = useCallback((creditNoteId: number) => {
    void runAction(() => creditNoteService.approve(creditNoteId))
  }, [runAction])

  const issueStoreCredit = useCallback((creditNoteId: number) => {
    void runAction(() => creditNoteService.issueStoreCredit(creditNoteId))
  }, [runAction])

  const recordRefund = useCallback((creditNoteId: number, available: number) => {
    void runAction(async () => {
      const amount = Number(refundAmount)
      if (!Number.isFinite(amount) || amount <= 0 || amount > available) {
        throw new Error(`Refund must be between LKR 0.01 and LKR ${available.toFixed(2)}`)
      }
      await creditNoteService.createRefund(creditNoteId, { Amount: amount, MethodId: Number(refundMethodId) })
      setRefundAmount("")
    })
  }, [refundAmount, refundMethodId, runAction])

  const completeRefund = useCallback((refundId: number) => {
    void runAction(() => creditNoteService.completeRefund(refundId))
  }, [runAction])

  const canInspect = details && hasStatus(details.salesReturn.StatusCode, INSPECTION_STATUSES)
  const awaitingInspectionCount = returns.filter((item) => hasStatus(item.StatusCode, INSPECTION_STATUSES)).length
  const completedCount = returns.filter((item) => hasStatus(item.StatusCode, COMPLETED_STATUSES)).length

  return {
    returns, selectedId, details, inspections, setInspections, loading, busy, error,
    refundMethods, refundAmount, setRefundAmount, refundMethodId, setRefundMethodId,
    exchangeOrderId, setExchangeOrderId, exchangeOrderValue,
    loadReturns, selectReturn, refresh, inspectAndApprove, rejectReturn,
    linkExchangeOrder, retryCreditNote, approveCreditNote, issueStoreCredit,
    recordRefund, completeRefund,
    canInspect, awaitingInspectionCount, completedCount,
  }
}
