import { useCallback, useMemo, useState } from "react"
import {
    type PaymentTypeCode,
    PAYMENT_TYPE_CODES,
} from "../../../shared/payment/constants/paymentTypeConstants"
import {
    type CashPaymentData,
    type ChequePaymentData,
    type BankTransferPaymentData,
} from "../../sales-order/models/payment"
import { usePaymentSettlement, type PaymentSettlement } from "../../../shared/payment/hooks/usePaymentSettlement"
import { useStagedReceipts, type StagedReceiptAttachments } from "../../../shared/payment/hooks/receipts/useStagedReceipts"
import type { PaymentFormState } from "../../../shared/payment/models/paymentForm"

export type { PaymentSettlement }

type UseInvoicePaymentFormProps = {
    initialPaymentType?: PaymentTypeCode
    totalAmount: number
}

const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

export function useInvoicePaymentForm({
    initialPaymentType = PAYMENT_TYPE_CODES.CASH,
    totalAmount,
}: UseInvoicePaymentFormProps): PaymentFormState<{ Payment: unknown }> {
    const needToPay = positive(totalAmount)

    const [selectedPaymentType, setSelectedPaymentType] =
        useState<PaymentTypeCode>(initialPaymentType)
    const [cashPaymentData, setCashPaymentData] = useState<CashPaymentData>({
        amountReceived: 0,
    })
    const [chequePaymentData, setChequePaymentData] = useState<ChequePaymentData>({
        chequeNumber: "",
        chequeDate: new Date().toISOString().slice(0, 10),
        bankName: "",
        amount: 0,
    })
    const [bankTransferPaymentData, setBankTransferPaymentData] =
        useState<BankTransferPaymentData>({
            bankName: "",
            accountNumber: "",
            accountName: "",
            branch: "",
            amount: 0,
            bankDetailsId: undefined,
        })

    // Staged receipts for the payment modal
    const {
        cashReceipt,
        bankReceipt,
        chequeReceipts,
        replaceSingle,
        removeSingle,
        setChequeReceipts,
        removeChequeAt,
        commit,
        discard,
        reset: resetStagedReceipts,
    } = useStagedReceipts()

    const cashAmount = positive(cashPaymentData.amountReceived)
    const chequeAmount = positive(chequePaymentData.amount)
    const bankAmount = positive(bankTransferPaymentData.amount)

    const settlement = usePaymentSettlement(needToPay, cashPaymentData, chequePaymentData, bankTransferPaymentData)

    const isCashValid = cashAmount > 0
    const isChequeValid =
        chequeAmount > 0 &&
        chequePaymentData.chequeNumber.trim() !== "" &&
        chequePaymentData.bankName.trim() !== ""
    const isBankValid = bankAmount > 0 && (bankTransferPaymentData.bankDetailsId ?? 0) > 0

    const isValid = useMemo(() => {
        return isCashValid || isChequeValid || isBankValid
    }, [isCashValid, isChequeValid, isBankValid])

    const getPaymentPayload = useCallback(
        (attachments: StagedReceiptAttachments): { Payment: unknown } => {
            const nonCashSettled = (isChequeValid ? chequeAmount : 0) + (isBankValid ? bankAmount : 0)

            return {
                Payment: {
                    CashPayment: isCashValid
                        ? {
                            PaymentTypeCode: PAYMENT_TYPE_CODES.CASH,
                            AmountReceived: cashAmount,
                            BalanceToReturn: Math.max(0, cashAmount - (needToPay - nonCashSettled)),
                            ReceiptPath: attachments.cash?.meta.ReceiptPath ?? null,
                            ReceiptEncIV: attachments.cash?.meta.ReceiptEncIV ?? null,
                            ReceiptEncAuthTag: attachments.cash?.meta.ReceiptEncAuthTag ?? null,
                            ReceiptEncKey: attachments.cash?.meta.ReceiptEncKey ?? null,
                        }
                        : null,
                    ChequePayment: isChequeValid
                        ? {
                            PaymentTypeCode: PAYMENT_TYPE_CODES.CHEQUE,
                            ChequeNumber: chequePaymentData.chequeNumber,
                            ChequeDate: chequePaymentData.chequeDate,
                            BankName: chequePaymentData.bankName,
                            Amount: chequeAmount,
                            Receipts: attachments.cheque.map((receipt) => ({
                                ReceiptPath: receipt.meta.ReceiptPath,
                                ReceiptEncIV: receipt.meta.ReceiptEncIV,
                                ReceiptEncAuthTag: receipt.meta.ReceiptEncAuthTag,
                                ReceiptEncKey: receipt.meta.ReceiptEncKey,
                                OriginalFileName: receipt.fileName,
                            })),
                        }
                        : null,
                    BankTransferPayment: isBankValid
                        ? {
                            PaymentTypeCode: PAYMENT_TYPE_CODES.BANK_TRANSFER,
                            BankDetailsID: bankTransferPaymentData.bankDetailsId || 0,
                            Amount: bankAmount,
                            BankName: bankTransferPaymentData.bankName,
                            AccountNumber: bankTransferPaymentData.accountNumber,
                            AccountName: bankTransferPaymentData.accountName,
                            Branch: bankTransferPaymentData.branch,
                            ReceiptPath: attachments.bank?.meta.ReceiptPath ?? null,
                            ReceiptEncIV: attachments.bank?.meta.ReceiptEncIV ?? null,
                            ReceiptEncAuthTag: attachments.bank?.meta.ReceiptEncAuthTag ?? null,
                            ReceiptEncKey: attachments.bank?.meta.ReceiptEncKey ?? null,
                        }
                        : null,
                },
            }
        },
        [
            isCashValid,
            isChequeValid,
            isBankValid,
            cashAmount,
            chequeAmount,
            bankAmount,
            chequePaymentData,
            bankTransferPaymentData,
            needToPay,
        ]
    )

    const resetPaymentForm = useCallback(() => {
        setSelectedPaymentType(initialPaymentType)
        setCashPaymentData({ amountReceived: 0 })
        setChequePaymentData({
            chequeNumber: "",
            chequeDate: new Date().toISOString().slice(0, 10),
            bankName: "",
            amount: 0,
        })
        setBankTransferPaymentData({
            bankName: "",
            accountNumber: "",
            accountName: "",
            branch: "",
            amount: 0,
            bankDetailsId: undefined,
        })
        resetStagedReceipts()
    }, [initialPaymentType, resetStagedReceipts])

    return {
        selectedPaymentType,
        setSelectedPaymentType,
        cashPaymentData,
        setCashPaymentData,
        chequePaymentData,
        setChequePaymentData,
        bankTransferPaymentData,
        setBankTransferPaymentData,
        resetPaymentForm,
        getPaymentPayload,
        isValid,
        settlement,
        // Staged receipt state for PaymentModalController
        cashReceipt,
        bankReceipt,
        chequeReceipts,
        replaceSingle,
        removeSingle,
        setChequeReceipts,
        removeChequeAt,
        commit,
        discard,
        reset: resetStagedReceipts,
    }
}