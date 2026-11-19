const bankTransferPaymentRepo = require("../repositories/bankTransferPaymentRepository")

exports.createBankTransferPayment = (paymentId, bankData) => {
  if (!paymentId) throw new Error("Payment ID is required")
  if (!bankData || !bankData.BankDetailsID) {
    throw new Error("Bank details ID and Amount are required for Bank Transfer payment type")
  }

  return bankTransferPaymentRepo.createBankTransferPayment({
    PaymentID: paymentId,
    BankDetailsID: bankData.BankDetailsID,
    Amount: bankData.Amount,
    ReceiptPath: bankData.ReceiptPath,
    ReceiptEncIV: bankData.ReceiptEncIV,
    ReceiptEncAuthTag: bankData.ReceiptEncAuthTag,
    ReceiptEncKey: bankData.ReceiptEncKey,
  })
}

exports.getBankTransferPaymentByPaymentId = (paymentId) => {
  if (!paymentId) throw new Error("Payment ID is required")
  return bankTransferPaymentRepo.getBankTransferPaymentByPaymentId(paymentId)
}

exports.deleteBankTransferPaymentByPaymentId = (paymentId) => {
  if (!paymentId) throw new Error("Payment ID is required")
  return bankTransferPaymentRepo.deleteBankTransferPaymentByPaymentId(paymentId)
}