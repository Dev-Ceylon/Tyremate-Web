const chequePaymentService = require("../../../packages/services/chequePaymentService");
const { registerIpcHandler } = require("./errorMiddleware")

registerIpcHandler(
  "cheque-payment:getByPaymentId",
  {},
  (_event, paymentId) => chequePaymentService.getChequePaymentByPaymentId(paymentId)
);

registerIpcHandler(
  "cheque-payment:create",
  {},
  (_event, payload) => chequePaymentService.createChequePayment(payload)
);

registerIpcHandler(
  "cheque-payment:deleteByPaymentId",
  {},
  (_event, paymentId) => chequePaymentService.deleteChequePaymentByPaymentId(paymentId)
);

registerIpcHandler(
  "cheque-payment:getSoIdByChequeReminderId",
  {},
  (_event, chequeReminderId) => chequePaymentService.getSoIdByChequeReminderId(chequeReminderId)
);
