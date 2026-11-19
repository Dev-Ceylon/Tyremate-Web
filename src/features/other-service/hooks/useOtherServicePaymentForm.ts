import { useCallback, useState } from "react"
import {
  type PaymentTypeCode,
  PAYMENT_TYPE_CODES,
} from "../../../shared/payment/constants/paymentTypeConstants"
import type { OtherServicePaymentPayload } from "../models/otherService"

type UseOtherServicePaymentFormOptions = {
  totalAmount: number
  makePayment: (payment: OtherServicePaymentPayload) => Promise<boolean>
}

type CashFormData = { amountReceived: number }

type ChequeFormData = {
  chequeNumber: string
  chequeDate: string
  bankName: string
  amount: number
}

type BankTransferFormData = {
  bankDetailsId?: number
  bankName: string
  accountNumber: string
  accountName: string
  branch: string
  amount: number
}

const defaultCash = (): CashFormData => ({ amountReceived: 0 })
const defaultCheque = (): ChequeFormData => ({ chequeNumber: "", chequeDate: new Date().toISOString().slice(0, 10), bankName: "", amount: 0 })
const defaultBankTransfer = (): BankTransferFormData => ({ bankDetailsId: undefined, bankName: "", accountNumber: "", accountName: "", branch: "", amount: 0 })

export function useOtherServicePaymentForm({ totalAmount, makePayment }: UseOtherServicePaymentFormOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentTypeCode>(PAYMENT_TYPE_CODES.CASH)
  const [cashData, setCashData] = useState<CashFormData>(defaultCash())
  const [chequeData, setChequeData] = useState<ChequeFormData>(defaultCheque())
  const [bankTransferData, setBankTransferData] = useState<BankTransferFormData>(defaultBankTransfer())

  const resetForm = useCallback(() => {
    setCashData(defaultCash())
    setChequeData(defaultCheque())
    setBankTransferData(defaultBankTransfer())
    setSelectedPaymentType(PAYMENT_TYPE_CODES.CASH)
  }, [])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  const handleModalConfirm = useCallback(async () => {
    const payload: OtherServicePaymentPayload = {
      CashPayment: selectedPaymentType === PAYMENT_TYPE_CODES.CASH
        ? {
            PaymentTypeCode: PAYMENT_TYPE_CODES.CASH,
            AmountReceived: cashData.amountReceived,
            BalanceToReturn: Math.max(0, cashData.amountReceived - totalAmount),
          }
        : null,
      ChequePayment: selectedPaymentType === PAYMENT_TYPE_CODES.CHEQUE
        ? {
            PaymentTypeCode: PAYMENT_TYPE_CODES.CHEQUE,
            ChequeNumber: chequeData.chequeNumber,
            ChequeDate: chequeData.chequeDate,
            BankName: chequeData.bankName,
            Amount: chequeData.amount,
            Collected: 0,
          }
        : null,
      BankTransferPayment: selectedPaymentType === PAYMENT_TYPE_CODES.BANK_TRANSFER
        ? {
            PaymentTypeCode: PAYMENT_TYPE_CODES.BANK_TRANSFER,
            BankDetailsID: bankTransferData.bankDetailsId!,
            Amount: bankTransferData.amount,
          }
        : null,
    }

    const success = await makePayment(payload)

    if (success) {
      setIsModalOpen(false)
      resetForm()
    }
  }, [selectedPaymentType, cashData, chequeData, bankTransferData, totalAmount, makePayment, resetForm])

  return {
    isModalOpen,
    openModal,
    closeModal,
    selectedPaymentType,
    setSelectedPaymentType,
    cashData,
    setCashData,
    chequeData,
    setChequeData,
    bankTransferData,
    setBankTransferData,
    handleModalConfirm,
  }
}