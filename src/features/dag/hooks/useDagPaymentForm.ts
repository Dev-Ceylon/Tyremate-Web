import { useCallback, useMemo, useState } from "react"
import {
    type PaymentTypeCode,
    PAYMENT_TYPE_CODES,
} from "../../../shared/payment/constants/paymentTypeConstants"
import {
    type CashPaymentData,
    type ChequePaymentData,
    type BankTransferPaymentData,
    type DagPaymentPayload,
} from "../models/payment"
import { usePaymentSettlement } from "../../../shared/payment/hooks/usePaymentSettlement"
import { useStagedReceipts, type StagedReceiptAttachments } from "../../../shared/payment/hooks/receipts/useStagedReceipts"
import type { PaymentFormState } from "../../../shared/payment/models/paymentForm"

type UseDagPaymentFormProps = {
    initialPaymentType?: PaymentTypeCode
    totalAmount: number
}

/**
 * Hook to manage multi-method payment form state for DAGs.
 * Unlike Sales Order, this supports combining multiple payment methods in one action.
 */
export function useDagPaymentForm({
    initialPaymentType = PAYMENT_TYPE_CODES.CASH,
    totalAmount,
}: UseDagPaymentFormProps): PaymentFormState<DagPaymentPayload> {
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

    const settlement = usePaymentSettlement(totalAmount, cashPaymentData, chequePaymentData, bankTransferPaymentData)

    // Validation helpers
    const isCashValid = cashPaymentData.amountReceived > 0
    const isChequeValid =
        chequePaymentData.amount > 0 &&
        chequePaymentData.chequeNumber.trim() !== "" &&
        chequePaymentData.bankName.trim() !== ""
    const isBankValid =
        bankTransferPaymentData.amount > 0 &&
        (bankTransferPaymentData.bankDetailsId ?? 0) > 0

    const getPaymentPayload = useCallback(
        (attachments: StagedReceiptAttachments): DagPaymentPayload => {
            // For multi-payment, we calculate total settled by non-cash methods 
            // to determine if cash should return a balance relative to the total DAG cost.
            const nonCashSettled = (isChequeValid ? chequePaymentData.amount : 0) + 
                                   (isBankValid ? bankTransferPaymentData.amount : 0);

            return {
                CashPayment: isCashValid
                    ? {
                        PaymentTypeCode: PAYMENT_TYPE_CODES.CASH,
                        AmountReceived: cashPaymentData.amountReceived,
                        BalanceToReturn: Math.max(0, cashPaymentData.amountReceived - (totalAmount - nonCashSettled)),
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
                        Amount: chequePaymentData.amount,
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
                        Amount: bankTransferPaymentData.amount,
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
            }
        },
        [isCashValid, isChequeValid, isBankValid, cashPaymentData, chequePaymentData, bankTransferPaymentData, totalAmount]
    )

    const isValid = useMemo(() => isCashValid || isChequeValid || isBankValid, [isCashValid, isChequeValid, isBankValid])

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