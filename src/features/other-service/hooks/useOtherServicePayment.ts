import { useState } from "react"
import type { PaymentTypeCode } from "../../../shared/payment/constants/paymentTypeConstants"
import { PAYMENT_TYPE_CODES } from "../../../shared/payment/constants/paymentTypeConstants"
import type { OtherServicePaymentPayload } from "../models/otherService"

type UseOtherServicePaymentOptions = {
  totalAmount: number
  buildPaymentPayload: (data: {
    cashAmountReceived?: number
    chequeNumber?: string
    chequeDate?: string
    bankName?: string
    chequeAmount?: number
    bankTransferAmount?: number
    bankDetailsId?: number
  }) => OtherServicePaymentPayload | null
  submitOrder: (payment?: OtherServicePaymentPayload | null) => Promise<boolean>
}

export function useOtherServicePayment(options: UseOtherServicePaymentOptions) {
  const { totalAmount, buildPaymentPayload, submitOrder } = options
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentTypeCode>(PAYMENT_TYPE_CODES.CASH)
  const [cashPaymentData, setCashPaymentData] = useState({ amountReceived: 0 })
  const [chequePaymentData, setChequePaymentData] = useState({
    chequeNumber: "",
    chequeDate: new Date().toISOString().slice(0, 10),
    bankName: "",
    amount: totalAmount,
  })
  const [bankTransferPaymentData, setBankTransferPaymentData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    branch: "",
    amount: totalAmount,
    bankDetailsId: undefined as number | undefined,
  })

  const openPaymentModal = () => {
    setIsPaymentModalOpen(true)
    setSelectedPaymentType(PAYMENT_TYPE_CODES.CASH)
  }

  const handleModalConfirm = async () => {
    const paymentPayload = buildPaymentPayload({
      cashAmountReceived: cashPaymentData.amountReceived,
      chequeNumber: chequePaymentData.chequeNumber,
      chequeDate: chequePaymentData.chequeDate,
      bankName: chequePaymentData.bankName,
      chequeAmount: chequePaymentData.amount,
      bankTransferAmount: bankTransferPaymentData.amount,
      bankDetailsId: bankTransferPaymentData.bankDetailsId,
    })
    const success = await submitOrder(paymentPayload)

    if (success) {
      setIsPaymentModalOpen(false)
    }
  }

  const closePaymentModal = () => setIsPaymentModalOpen(false)

  return {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    closePaymentModal,
    selectedPaymentType,
    setSelectedPaymentType,
    cashPaymentData,
    setCashPaymentData,
    chequePaymentData,
    setChequePaymentData,
    bankTransferPaymentData,
    setBankTransferPaymentData,
    openPaymentModal,
    handleModalConfirm,
  }
}
