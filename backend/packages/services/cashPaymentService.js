const cashPaymentRepo = require("../repositories/cashPaymentRepository");

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

exports.getCashPaymentByPaymentId = (paymentId) => {
  const normalizedId = normalizePositiveId(paymentId, "PaymentID");
  return cashPaymentRepo.getCashPaymentByPaymentId(normalizedId);
};

exports.getCashPaymentById = (id) => {
  const normalizedId = normalizePositiveId(id, "ID");
  const payment = cashPaymentRepo.getCashPaymentById(normalizedId);

  if (!payment) {
    throw new Error("Cash Payment record not found");
  }

  return payment;
};

exports.createCashPayment = (payload) => {
  const data = {
    PaymentID: normalizePositiveId(payload.PaymentID, "PaymentID"),
    AmountReceived: normalizeNumber(payload.AmountReceived, "AmountReceived"),
    BalanceToReturn: normalizeNumber(payload.BalanceToReturn, "BalanceToReturn"),
  };

  // Business Logic: Ensure received amount covers the implied payment
  // (Balance calculation logic usually resides in the UI, but we validate the result here)
  return cashPaymentRepo.createCashPayment(data);
};

exports.deleteCashPaymentByPaymentId = (paymentId) => {
  const normalizedId = normalizePositiveId(paymentId, "PaymentID");
  return cashPaymentRepo.deleteCashPaymentByPaymentId(normalizedId);
};