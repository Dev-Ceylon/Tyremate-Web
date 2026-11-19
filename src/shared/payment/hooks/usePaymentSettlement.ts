import { useMemo } from "react"
import type { CashPaymentData, ChequePaymentData, BankTransferPaymentData } from "../models/payment"

export type PaymentSettlement = {
  needToPay: number
  enteredTotal: number
  remainingDue: number
  overPaid: number
  remainingForCash: number
}

export function usePaymentSettlement(
  totalAmount: number,
  cashPaymentData: CashPaymentData,
  chequePaymentData: ChequePaymentData,
  bankTransferPaymentData: BankTransferPaymentData,
): PaymentSettlement {
  const cashAmt = cashPaymentData.amountReceived || 0
  const chequeAmt = chequePaymentData.amount || 0
  const bankAmt = bankTransferPaymentData.amount || 0

  return useMemo(() => {
    const safeTotal = Number.isFinite(totalAmount) ? Math.max(0, totalAmount) : 0
    const needToPay = safeTotal
    const enteredTotal = cashAmt + chequeAmt + bankAmt

    return {
      needToPay,
      enteredTotal,
      remainingDue: Math.max(0, needToPay - enteredTotal),
      overPaid: Math.max(0, enteredTotal - needToPay),
      remainingForCash: Math.max(0, needToPay - chequeAmt - bankAmt),
    }
  }, [totalAmount, cashAmt, chequeAmt, bankAmt])
}
