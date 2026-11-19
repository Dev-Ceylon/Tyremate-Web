const paymentRepo = require("../repositories/paymentRepository")
const cashPaymentRepo = require("../repositories/cashPaymentRepository")
const chequePaymentRepo = require("../repositories/chequePaymentRepository")
const chequePaymentReceiptRepo = require("../repositories/chequePaymentReceiptRepository")
const bankTransferPaymentService = require("./bankTransferPaymentService")
const reminderRepo = require("../repositories/reminderRepository")
const { getPaymentTypeIdByCode, PAYMENT_TYPE_CODES, PAYMENT_TYPE_NAMES } = require("../constants/paymentTypeConstants")
const { getReminderTypeId } = require("../constants/reminderTypeConstants")

const normalizeDate = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`)
  }

  const normalized = String(value).trim()

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
  }

  return normalized
}

const normalizeBooleanFlag = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  if (value === true || value === "true") {
    return 1
  }

  if (value === false || value === "false") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || (parsed !== 0 && parsed !== 1)) {
    throw new Error(`${fieldName} must be 0 or 1`)
  }

  return parsed
}

const normalizePositiveId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`)
  }

  return parsed
}

/**
 * Calculates the settled amount from the payment payload.
 * Cash (settled) + Bank Transfer (settled). Cheques are excluded until cleared.
 */
const calculateSettledAmount = (payment) => {
  if (!payment) return 0
  let settled = 0

  if (payment.CashPayment) {
    const received = payment.CashPayment.AmountReceived || 0
    const balance = payment.CashPayment.BalanceToReturn || 0
    // Effective cash is the amount kept after returning balance
    settled += Math.max(0, received - balance)
  }

  if (payment.BankTransferPayment) {
    settled += (payment.BankTransferPayment.Amount || 0)
  }

  if (payment.ChequePayment && payment.ChequePayment.Collected === 1) {
    settled += (payment.ChequePayment.Amount || 0)
  }

  return settled
}

/**
 * Calculates the total settled amount from an array of aggregated payment items.
 * This is used when payments are already fetched and processed by getSOById.
 */
const calculateSettledAmountFromAggregatedPaymentsArray = (paymentsArray) => {
  if (!paymentsArray || paymentsArray.length === 0) return 0;
  let settled = 0;
  for (const paymentItem of paymentsArray) {
    const isCashOrBank = paymentItem.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
                         paymentItem.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER;
    const isCollectedCheque = paymentItem.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE &&
                              paymentItem.Collected === 1;

    if (isCashOrBank || isCollectedCheque) {
      settled += paymentItem.Amount || 0;
    }
  }
  return settled;
};

/**
 * Normalizes and validates a raw payment payload.
 */
const normalizePaymentPayload = (rawPaymentPayload) => {
  if (rawPaymentPayload === undefined || rawPaymentPayload === null) {
    return null; // No payment provided
  }

  const payment = {
    CashPayment: rawPaymentPayload.CashPayment ? {
      PaymentTypeCode: String(rawPaymentPayload.CashPayment.PaymentTypeCode || "").trim(),
      AmountReceived: normalizeNumber(rawPaymentPayload.CashPayment.AmountReceived, "AmountReceived"),
      BalanceToReturn: normalizeNumber(rawPaymentPayload.CashPayment.BalanceToReturn, "BalanceToReturn"),
      ReceiptPath: rawPaymentPayload.CashPayment.ReceiptPath
        ? String(rawPaymentPayload.CashPayment.ReceiptPath).trim()
        : null,
      ReceiptEncIV: rawPaymentPayload.CashPayment.ReceiptEncIV
        ? String(rawPaymentPayload.CashPayment.ReceiptEncIV).trim()
        : null,
      ReceiptEncAuthTag: rawPaymentPayload.CashPayment.ReceiptEncAuthTag
        ? String(rawPaymentPayload.CashPayment.ReceiptEncAuthTag).trim()
        : null,
      ReceiptEncKey: rawPaymentPayload.CashPayment.ReceiptEncKey
        ? String(rawPaymentPayload.CashPayment.ReceiptEncKey).trim()
        : null,
    } : null,
    ChequePayment: rawPaymentPayload.ChequePayment ? {
          PaymentTypeCode: String(rawPaymentPayload.ChequePayment.PaymentTypeCode || "").trim(),
          ChequeNumber: String(rawPaymentPayload.ChequePayment.ChequeNumber || "").trim(),
          ChequeDate: normalizeDate(rawPaymentPayload.ChequePayment.ChequeDate, "ChequeDate"),
          BankName: String(rawPaymentPayload.ChequePayment.BankName || "").trim(),
          Amount: normalizeNumber(rawPaymentPayload.ChequePayment.Amount, "Amount"),
          Collected: normalizeBooleanFlag(rawPaymentPayload.ChequePayment.Collected, "Collected"),
          Receipts: Array.isArray(rawPaymentPayload.ChequePayment.Receipts)
            ? rawPaymentPayload.ChequePayment.Receipts.map((receipt) => ({
                ReceiptPath: receipt.ReceiptPath ? String(receipt.ReceiptPath).trim() : null,
                ReceiptEncIV: receipt.ReceiptEncIV ? String(receipt.ReceiptEncIV).trim() : null,
                ReceiptEncAuthTag: receipt.ReceiptEncAuthTag ? String(receipt.ReceiptEncAuthTag).trim() : null,
                ReceiptEncKey: receipt.ReceiptEncKey ? String(receipt.ReceiptEncKey).trim() : null,
                OriginalFileName: receipt.OriginalFileName ? String(receipt.OriginalFileName).trim() : null,
              }))
            : [],
        } : null,
    BankTransferPayment: rawPaymentPayload.BankTransferPayment ? {
      PaymentTypeCode: String(rawPaymentPayload.BankTransferPayment.PaymentTypeCode || "").trim(),
      BankDetailsID: normalizePositiveId(rawPaymentPayload.BankTransferPayment.BankDetailsID, "BankDetailsID"),
      BankName: rawPaymentPayload.BankTransferPayment.BankName ? String(rawPaymentPayload.BankTransferPayment.BankName).trim() : undefined,
      AccountNumber: rawPaymentPayload.BankTransferPayment.AccountNumber ? String(rawPaymentPayload.BankTransferPayment.AccountNumber).trim() : undefined,
      AccountName: rawPaymentPayload.BankTransferPayment.AccountName ? String(rawPaymentPayload.BankTransferPayment.AccountName).trim() : undefined,
      Branch: rawPaymentPayload.BankTransferPayment.Branch ? String(rawPaymentPayload.BankTransferPayment.Branch).trim() : undefined,
      Amount: normalizeNumber(rawPaymentPayload.BankTransferPayment.Amount, "Amount"),
      ReceiptPath: rawPaymentPayload.BankTransferPayment.ReceiptPath
        ? String(rawPaymentPayload.BankTransferPayment.ReceiptPath).trim()
        : null,
      ReceiptEncIV: rawPaymentPayload.BankTransferPayment.ReceiptEncIV
        ? String(rawPaymentPayload.BankTransferPayment.ReceiptEncIV).trim()
        : null,
      ReceiptEncAuthTag: rawPaymentPayload.BankTransferPayment.ReceiptEncAuthTag
        ? String(rawPaymentPayload.BankTransferPayment.ReceiptEncAuthTag).trim()
        : null,
      ReceiptEncKey: rawPaymentPayload.BankTransferPayment.ReceiptEncKey
        ? String(rawPaymentPayload.BankTransferPayment.ReceiptEncKey).trim()
        : null,
    } : null
  };

  // Ensure at least one payment type is provided if rawPaymentPayload is not null
  if (!payment.CashPayment && !payment.ChequePayment && !payment.BankTransferPayment) {
    throw new Error("If a payment payload is provided, at least one payment method (Cash, Cheque, or Bank Transfer) must be specified.");
  }

  return payment;
};

/**
 * Processes and saves cash-specific payment details.
 */
const processCashPayment = (paymentId, cashData) => {
  if (!cashData) {
    throw new Error("Cash payment details (AmountReceived, BalanceToReturn) are required for Cash payment type")
  }

  cashPaymentRepo.createCashPayment({
    PaymentID: paymentId, // Correctly uses generic PaymentID
    AmountReceived: cashData.AmountReceived,
    BalanceToReturn: cashData.BalanceToReturn,
    ReceiptPath: cashData.ReceiptPath,
    ReceiptEncIV: cashData.ReceiptEncIV,
    ReceiptEncAuthTag: cashData.ReceiptEncAuthTag,
    ReceiptEncKey: cashData.ReceiptEncKey,
  })
}

/**
 * Processes and saves cheque-specific payment details.
 */
const processChequePayment = (paymentId, chequeData) => {
  if (!chequeData) {
    throw new Error("Cheque payment details (ChequeNumber, ChequeDate, BankName, Amount) are required for Cheque payment type")
  }

  const chequePayment = chequePaymentRepo.createChequePayment({
    PaymentID: paymentId, // Correctly uses generic PaymentID
    ChequeNumber: chequeData.ChequeNumber,
    ChequeDate: chequeData.ChequeDate,
    BankName: chequeData.BankName,
    Amount: chequeData.Amount,
    Collected: chequeData.Collected,
  })

   const reminderTypeId =
    getReminderTypeId("CHEQUE_FOLLOW_UP");

  const reminder =
    reminderRepo.createReminder({
      ReminderTypeID: reminderTypeId,
      Date: chequeData.ChequeDate,
      IsCompleted: 0,
    });

  chequePaymentRepo.createChequeReminder({
    ChequeID: chequePayment.ID,
    ReminderID: reminder.ID,
    ReminderDate: chequeData.ChequeDate,
    ReminderNote:
      `Cheque ${chequeData.ChequeNumber} due`,
    ReminderAction: "Cheque Due",
    IsDone: 0,
  });

  if (Array.isArray(chequeData.Receipts)) {
    chequeData.Receipts.forEach((receipt, index) => {
      if (!receipt.ReceiptPath) return
      chequePaymentReceiptRepo.createChequePaymentReceipt({
        ChequePaymentID: chequePayment.ID,
        SortOrder: index,
        ReceiptPath: receipt.ReceiptPath,
        ReceiptEncIV: receipt.ReceiptEncIV,
        ReceiptEncAuthTag: receipt.ReceiptEncAuthTag,
        ReceiptEncKey: receipt.ReceiptEncKey,
        OriginalFileName: receipt.OriginalFileName,
      })
    })
  }

}

/**
 * Processes and saves bank transfer-specific payment details.
 */
const processBankTransferPayment = (paymentId, bankData) => {
  if (!bankData || !bankData.BankDetailsID || bankData.Amount === undefined) {
    throw new Error("Bank details ID and Amount are required for Bank Transfer payment type")
  }

  bankTransferPaymentService.createBankTransferPayment(paymentId, bankData) // Correctly uses generic PaymentID
}

const PAYMENT_CONFIGS = [
  { key: 'CashPayment', processor: processCashPayment },
  { key: 'ChequePayment', processor: processChequePayment },
  { key: 'BankTransferPayment', processor: processBankTransferPayment },
]

/**
 * Nominal amount of a single type-specific payment record: what the customer
 * handed over (cash net of change returned, cheque face value, bank amount).
 * Settled amount may be lower (uncollected cheques settle only on collection).
 */
const paymentNominalAmount = (key, data) => {
  if (key === 'CashPayment') {
    return Math.max(0, (data.AmountReceived || 0) - (data.BalanceToReturn || 0))
  }
  return data.Amount || 0
}

/**
 * Creates the generic Payment records for a normalized payment payload and
 * writes each type-specific detail row. `linkPayment(payment, data)` is called
 * per created payment so the caller can attach its own link rows (SOPayments,
 * InvoicePaymentLink, ...) inside the caller's transaction. The payment object
 * carries PaymentID, PaymentTypeCode, Nominal (handed over) and Settled (counts
 * towards balances now).
 * Returns the created payments.
 */
const createPaymentsForPaymentData = (paymentData, linkPayment) => {
  const created = []

  for (const config of PAYMENT_CONFIGS) {
    const data = paymentData?.[config.key]
    if (data && data.PaymentTypeCode) {
      const paymentTypeId = getPaymentTypeIdByCode(data.PaymentTypeCode)
      if (!paymentTypeId) {
        throw new Error(`Invalid payment type code: ${data.PaymentTypeCode}`)
      }

      // 1. Create the new generic Payment record
      const payment = paymentRepo.createPayment()

      const entry = {
        PaymentID: payment.ID,
        PaymentTypeCode: data.PaymentTypeCode,
        Nominal: paymentNominalAmount(config.key, data),
        Settled: calculateSettledAmount({ [config.key]: data }),
        Data: data,
      }

      // 2. Let the caller link the payment to its owning document
      if (typeof linkPayment === "function") {
        linkPayment(entry, data)
      }

      // 3. Create the specific detail record using the generic Payment ID
      config.processor(payment.ID, data)

      created.push(entry)
    }
  }

  return created
}

/**
 * Hydrates a generic Payment row into the aggregated shape the SO and invoice
 * screens display (type, settled amount, references, receipts). Returns null
 * when the payment exists but its type cannot be determined.
 */
const getPaymentSummaryById = (paymentId) => {
  const paymentItem = {
    PaymentID: paymentId,
    PaymentTypeCode: null,
    PaymentTypeName: null,
    Amount: 0,
  }

  const cashPayment = cashPaymentRepo.getCashPaymentByPaymentId(paymentId)
  if (cashPayment) {
    paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.CASH
    paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CASH]
    paymentItem.Amount = (cashPayment.AmountReceived || 0) - (cashPayment.BalanceToReturn || 0)
    paymentItem.PaidAmount = cashPayment.AmountReceived
    paymentItem.BalanceAmount = cashPayment.BalanceToReturn
    paymentItem.ReceiptPath = cashPayment.ReceiptPath || null
    paymentItem.ReceiptEncIV = cashPayment.ReceiptEncIV || null
    paymentItem.ReceiptEncAuthTag = cashPayment.ReceiptEncAuthTag || null
    paymentItem.ReceiptEncKey = cashPayment.ReceiptEncKey || null
    return paymentItem
  }

  const chequePayment = chequePaymentRepo.getChequePaymentByPaymentId(paymentId)
  if (chequePayment) {
    paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.CHEQUE
    paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CHEQUE]
    paymentItem.Amount = chequePayment.Amount || 0
    paymentItem.ReferenceNumber = chequePayment.ChequeNumber
    paymentItem.PaymentDate = chequePayment.ChequeDate
    paymentItem.BankName = chequePayment.BankName
    paymentItem.Collected = chequePayment.Collected ?? 0
    paymentItem.Receipts = chequePaymentReceiptRepo.getChequePaymentReceiptsByChequePaymentId(chequePayment.ID)
    return paymentItem
  }

  let bankTransferPayment = null
  try {
    bankTransferPayment = bankTransferPaymentService.getBankTransferPaymentByPaymentId(paymentId)
  } catch (error) {
    console.error(`Failed to fetch bank transfer payment for PaymentID ${paymentId}`, error)
  }
  if (bankTransferPayment) {
    paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.BANK_TRANSFER
    paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.BANK_TRANSFER]
    paymentItem.Amount = bankTransferPayment.Amount || 0
    paymentItem.ReferenceNumber = `Ref ID: ${bankTransferPayment.BankDetailsID}`
    paymentItem.BankName = bankTransferPayment.BankName || null
    paymentItem.ReceiptPath = bankTransferPayment.ReceiptPath || null
    paymentItem.ReceiptEncIV = bankTransferPayment.ReceiptEncIV || null
    paymentItem.ReceiptEncAuthTag = bankTransferPayment.ReceiptEncAuthTag || null
    paymentItem.ReceiptEncKey = bankTransferPayment.ReceiptEncKey || null
    return paymentItem
  }

  console.warn(`Unknown payment type for generic PaymentID: ${paymentId}`)
  return null
}

module.exports = {
  normalizePaymentPayload,
  calculateSettledAmount,
  calculateSettledAmountFromAggregatedPaymentsArray,
  createPaymentsForPaymentData,
  getPaymentSummaryById,
  paymentNominalAmount,
  processCashPayment,
  processChequePayment,
  processBankTransferPayment,
}
