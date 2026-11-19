const chequePaymentRepo = require("../repositories/chequePaymentRepository");

const normalizePositiveId = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`);
  }
  return parsed;
};

const normalizeNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }
  return parsed;
};

const normalizeRequiredText = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }
  const normalized = String(value).trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
};

exports.getChequePaymentByPaymentId = (paymentId) => {
  const normalizedId = normalizePositiveId(paymentId, "PaymentID");
  return chequePaymentRepo.getChequePaymentByPaymentId(normalizedId);
};

exports.createChequePayment = (payload) => {
  const data = {
    PaymentID: normalizePositiveId(payload.PaymentID, "PaymentID"),
    ChequeNumber: normalizeRequiredText(payload.ChequeNumber, "ChequeNumber"),
    ChequeDate: normalizeRequiredText(payload.ChequeDate, "ChequeDate"),
    BankName: normalizeRequiredText(payload.BankName, "BankName"),
    Amount: normalizeNumber(payload.Amount, "Amount"),
  };

  return chequePaymentRepo.createChequePayment(data);
};

exports.deleteChequePaymentByPaymentId = (paymentId) => {
  const normalizedId = normalizePositiveId(paymentId, "PaymentID");
  return chequePaymentRepo.deleteChequePaymentByPaymentId(normalizedId);
};

exports.getSoIdByChequeReminderId = (
  chequeReminderId
) => {
  const normalizedId =
    normalizePositiveId(
      chequeReminderId,
      "ChequeReminderID"
    );

  const result =
    chequePaymentRepo.getSoIdByChequeReminderId(
      normalizedId
    );

  if (!result) {
    throw new Error(
      "Sales Order not found for the given cheque reminder"
    );
  }

  return result.SoID;
};