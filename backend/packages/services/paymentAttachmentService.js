const db = require("../database/connection")
const cashPaymentRepo = require("../repositories/cashPaymentRepository")
const bankTransferPaymentRepo = require("../repositories/bankTransferPaymentRepository")
const chequePaymentReceiptRepo = require("../repositories/chequePaymentReceiptRepository")
const chequePaymentService = require("./chequePaymentService")
const { PAYMENT_TYPE_CODES } = require("../constants/paymentTypeConstants")
const paymentReceiptService = require("../../apps/electron/services/PaymentReceiptService")

const normalizePositiveId = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }
  return parsed
}

const isCompleteReceiptMeta = (receipt) => {
  return Boolean(
    receipt &&
      typeof receipt.ReceiptPath === "string" &&
      receipt.ReceiptPath.trim() !== "" &&
      typeof receipt.ReceiptEncIV === "string" &&
      typeof receipt.ReceiptEncAuthTag === "string" &&
      typeof receipt.ReceiptEncKey === "string"
  )
}

const normalizeReceipts = (receipts) => {
  if (!Array.isArray(receipts) || receipts.length === 0) {
    throw new Error("At least one receipt is required")
  }
  const normalized = receipts.filter(isCompleteReceiptMeta)
  if (normalized.length === 0) {
    throw new Error("Receipt metadata is incomplete")
  }
  return normalized
}

const deleteStoredFile = (receiptMeta) => {
  if (!receiptMeta || !receiptMeta.ReceiptPath) return
  try {
    paymentReceiptService.deleteReceipt(receiptMeta)
  } catch (error) {
    console.error("Failed to delete replaced receipt file", error)
  }
}

/**
 * Attaches encrypted receipt metadata to a persisted payment.
 * - Cash / Bank Transfer: single receipt per payment, the attachment replaces it.
 * - Cheque: multiple receipts are appended to the ChequePaymentReceipts table.
 */
exports.attachPaymentReceipts = ({ PaymentID, PaymentTypeCode, receipts } = {}) => {
  const paymentId = normalizePositiveId(PaymentID, "PaymentID")
  const list = normalizeReceipts(receipts)
  const newReceipt = list[list.length - 1]

  switch (PaymentTypeCode) {
    case PAYMENT_TYPE_CODES.CASH: {
      const existing = cashPaymentRepo.getCashPaymentByPaymentId(paymentId)
      if (!existing) {
        throw new Error("Cash payment not found")
      }
      cashPaymentRepo.updateCashPaymentReceipt(paymentId, newReceipt)
      if (existing.ReceiptPath && existing.ReceiptPath !== newReceipt.ReceiptPath) {
        deleteStoredFile(existing)
      }
      return { attached: 1 }
    }

    case PAYMENT_TYPE_CODES.BANK_TRANSFER: {
      const existing = bankTransferPaymentRepo.getBankTransferPaymentByPaymentId(paymentId)
      if (!existing) {
        throw new Error("Bank transfer payment not found")
      }
      bankTransferPaymentRepo.updateBankTransferPaymentReceipt(paymentId, newReceipt)
      if (existing.ReceiptPath && existing.ReceiptPath !== newReceipt.ReceiptPath) {
        deleteStoredFile(existing)
      }
      return { attached: 1 }
    }

    case PAYMENT_TYPE_CODES.CHEQUE: {
      const cheque = chequePaymentService.getChequePaymentByPaymentId(paymentId)
      if (!cheque) {
        throw new Error("Cheque payment not found")
      }
      const existing = chequePaymentReceiptRepo.getChequePaymentReceiptsByChequePaymentId(cheque.ID)
      const nextSortOrder = existing.reduce(
        (max, item) => Math.max(max, item.SortOrder ?? 0),
        0
      ) + 1

      const insertReceipts = db.transaction((items, startSort) => {
        items.forEach((receipt, index) => {
          chequePaymentReceiptRepo.createChequePaymentReceipt({
            ChequePaymentID: cheque.ID,
            SortOrder: startSort + index,
            ReceiptPath: receipt.ReceiptPath,
            ReceiptEncIV: receipt.ReceiptEncIV,
            ReceiptEncAuthTag: receipt.ReceiptEncAuthTag,
            ReceiptEncKey: receipt.ReceiptEncKey,
            OriginalFileName: receipt.OriginalFileName ?? null,
          })
        })
      })

      insertReceipts(list, nextSortOrder)
      return { attached: list.length }
    }

    default:
      throw new Error("Unsupported payment type for receipt attachment")
  }
}

/**
 * Removes a single stored receipt from a cheque payment (row + encrypted file).
 */
exports.removePaymentReceipt = ({ PaymentID, PaymentTypeCode, receiptId } = {}) => {
  if (PaymentTypeCode !== PAYMENT_TYPE_CODES.CHEQUE) {
    throw new Error("Receipt removal is only supported for cheque payments")
  }

  const paymentId = normalizePositiveId(PaymentID, "PaymentID")
  const id = normalizePositiveId(receiptId, "ReceiptID")

  const cheque = chequePaymentService.getChequePaymentByPaymentId(paymentId)
  if (!cheque) {
    throw new Error("Cheque payment not found")
  }

  const receipts = chequePaymentReceiptRepo.getChequePaymentReceiptsByChequePaymentId(cheque.ID)
  const target = receipts.find((item) => item.ID === id)
  if (!target) {
    throw new Error("Receipt not found for this payment")
  }

  const result = chequePaymentReceiptRepo.deleteChequePaymentReceiptById(id)
  deleteStoredFile(target)
  return result
}