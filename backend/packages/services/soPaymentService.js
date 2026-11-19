const soPaymentRepo = require("../repositories/soPaymentRepository");

const normalizePositiveId = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`);
  }

  return parsed;
};

const normalizeSOId = (soId) => {
  const parsedId = Number(soId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid SO id is required");
  }

  return parsedId;
};

exports.getSOPaymentsBySoId = (soId) => {
  const normalizedId = normalizeSOId(soId);
  return soPaymentRepo.getSOPaymentsBySoId(normalizedId);
};

exports.getSOPaymentById = (id) => {
  const normalizedId = normalizePositiveId(id, "ID");
  const payment = soPaymentRepo.getSOPaymentById(normalizedId);

  if (!payment) {
    throw new Error("SO Payment not found");
  }

  return payment;
};

exports.createSOPayment = (payload) => {
  const data = {
    SoID: normalizeSOId(payload.SoID),
    PaymentID: payload.PaymentID ? normalizePositiveId(payload.PaymentID, "PaymentID") : undefined
  };

  return soPaymentRepo.createSOPayment(data);
};

exports.deleteSOPaymentsBySoId = (soId) => {
  const normalizedId = normalizeSOId(soId);
  return soPaymentRepo.deleteSOPaymentsBySoId(normalizedId);
};