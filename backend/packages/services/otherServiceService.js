const db = require("../database/connection")
const otherServiceRepo = require("../repositories/otherServiceRepository")
const otherServiceCustomerRepo = require("../repositories/otherServiceCustomerRepository")
const otherServiceCustomerDetailRepo = require("../repositories/otherServiceCustomerDetailRepository")
const otherServiceConsumablesRepo = require("../repositories/otherServiceConsumablesRepository")
const consumableStorageManagerRepo = require("../repositories/consumableStorageManagerRepository")
const otherServicePaymentRepo = require("../repositories/otherServicePaymentRepository")
const paymentRepo = require("../repositories/paymentRepository")
const cashPaymentRepo = require("../repositories/cashPaymentRepository")
const chequePaymentRepo = require("../repositories/chequePaymentRepository")
const bankTransferPaymentService = require("./bankTransferPaymentService")
const invoiceSettlementService = require("./invoiceSettlementService")
const invoiceService = require("./invoiceService")
const otherServiceAuditLogService = require("./otherServiceAuditLogService")
const { getPaymentTypeIdByCode, PAYMENT_TYPE_CODES, PAYMENT_TYPE_NAMES } = require("../constants/paymentTypeConstants")
const { getReminderTypeId } = require("../constants/reminderTypeConstants")
const reminderRepo = require("../repositories/reminderRepository")
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants")
const { normalizePhone, normalizeEmail } = require("../validation")

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

const normalizeOSId = (osId) => {
  const parsedId = Number(osId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid Other Service id is required")
  }

  return parsedId
}

const normalizePositiveId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeInteger = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return 0
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative integer`)
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

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()
  return normalized === "" ? null : normalized
}

const normalizeRequiredText = (value, fieldName) => {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new Error(`${fieldName} is required`)
  }

  return normalized
}

/**
 * Calculates the total payable amount from consumable lines.
 */
const calculatePayableTotal = (lines) => {
  return lines.reduce((total, line) => {
    const price = line.Price || 0
    const qty = line.Qty || 0
    return total + (price * qty)
  }, 0)
}

/**
 * Calculates the settled amount from the payment payload.
 */
const calculateSettledAmount = (payment) => {
  if (!payment) return 0
  let settled = 0

  if (payment.CashPayment) {
    const received = payment.CashPayment.AmountReceived || 0
    const balance = payment.CashPayment.BalanceToReturn || 0
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
 * Calculates total settled from aggregated payments array.
 */
const calculateSettledAmountFromAggregated = (paymentsArray) => {
  if (!paymentsArray || paymentsArray.length === 0) return 0
  let settled = 0

  for (const item of paymentsArray) {
    const isCashOrBank = item.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
                         item.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER
    const isCollectedCheque = item.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE &&
                              item.Collected === 1

    if (isCashOrBank || isCollectedCheque) {
      settled += item.Amount || 0
    }
  }

  return settled
}

/**
 * Normalizes and validates a raw payment payload.
 */
const normalizePaymentPayload = (rawPaymentPayload) => {
  if (rawPaymentPayload === undefined || rawPaymentPayload === null) {
    return null
  }

  const payment = {
    CashPayment: rawPaymentPayload.CashPayment ? {
      PaymentTypeCode: String(rawPaymentPayload.CashPayment.PaymentTypeCode || "").trim(),
      AmountReceived: normalizeNumber(rawPaymentPayload.CashPayment.AmountReceived, "AmountReceived"),
      BalanceToReturn: normalizeNumber(rawPaymentPayload.CashPayment.BalanceToReturn, "BalanceToReturn")
    } : null,
    ChequePayment: rawPaymentPayload.ChequePayment ? {
      PaymentTypeCode: String(rawPaymentPayload.ChequePayment.PaymentTypeCode || "").trim(),
      ChequeNumber: String(rawPaymentPayload.ChequePayment.ChequeNumber || "").trim(),
      ChequeDate: normalizeDate(rawPaymentPayload.ChequePayment.ChequeDate, "ChequeDate"),
      BankName: String(rawPaymentPayload.ChequePayment.BankName || "").trim(),
      Amount: normalizeNumber(rawPaymentPayload.ChequePayment.Amount, "Amount"),
      Collected: normalizeBooleanFlag(rawPaymentPayload.ChequePayment.Collected, "Collected"),
    } : null,
    BankTransferPayment: rawPaymentPayload.BankTransferPayment ? {
      PaymentTypeCode: String(rawPaymentPayload.BankTransferPayment.PaymentTypeCode || "").trim(),
      BankDetailsID: normalizePositiveId(rawPaymentPayload.BankTransferPayment.BankDetailsID, "BankDetailsID"),
      Amount: normalizeNumber(rawPaymentPayload.BankTransferPayment.Amount, "Amount")
    } : null
  }

  if (!payment.CashPayment && !payment.ChequePayment && !payment.BankTransferPayment) {
    throw new Error("At least one payment method (Cash, Cheque, or Bank Transfer) must be specified.")
  }

  return payment
}

const deriveIsPaymentCompleted = (lines, payment) => {
  const payableTotal = calculatePayableTotal(lines)
  const settledAmount = calculateSettledAmount(payment)
  return settledAmount >= (payableTotal - 0.01) ? 1 : 0
}

/**
 * Processes and saves cash-specific payment details.
 */
const processCashPayment = (paymentId, cashData) => {
  if (!cashData) {
    throw new Error("Cash payment details are required")
  }

  cashPaymentRepo.createCashPayment({
    PaymentID: paymentId,
    AmountReceived: cashData.AmountReceived,
    BalanceToReturn: cashData.BalanceToReturn,
  })
}

/**
 * Processes and saves cheque-specific payment details with reminder.
 */
const processChequePayment = (paymentId, chequeData) => {
  if (!chequeData) {
    throw new Error("Cheque payment details are required")
  }

  const chequePayment = chequePaymentRepo.createChequePayment({
    PaymentID: paymentId,
    ChequeNumber: chequeData.ChequeNumber,
    ChequeDate: chequeData.ChequeDate,
    BankName: chequeData.BankName,
    Amount: chequeData.Amount,
    Collected: chequeData.Collected,
  })

  const reminderTypeId = getReminderTypeId("CHEQUE_FOLLOW_UP")
  const reminder = reminderRepo.createReminder({
    ReminderTypeID: reminderTypeId,
    Date: chequeData.ChequeDate,
    IsCompleted: 0,
  })

  chequePaymentRepo.createChequeReminder({
    ChequeID: chequePayment.ID,
    ReminderID: reminder.ID,
    ReminderDate: chequeData.ChequeDate,
    ReminderNote: `Cheque ${chequeData.ChequeNumber} due`,
    ReminderAction: "Cheque Due",
    IsDone: 0,
  })
}

/**
 * Processes and saves bank transfer-specific payment details.
 */
const processBankTransferPayment = (paymentId, bankData) => {
  if (!bankData || !bankData.BankDetailsID || bankData.Amount === undefined) {
    throw new Error("Bank details ID and Amount are required for Bank Transfer payment type")
  }

  bankTransferPaymentService.createBankTransferPayment(paymentId, bankData)
}

/**
 * Processes and saves payment information for an Other Service.
 */
const processOSPayment = (osId, paymentData) => {
  if (!paymentData) return

  const paymentConfigs = [
    { key: 'CashPayment', processor: processCashPayment },
    { key: 'ChequePayment', processor: processChequePayment },
    { key: 'BankTransferPayment', processor: processBankTransferPayment },
  ]

  for (const config of paymentConfigs) {
    const data = paymentData[config.key]
    if (data && data.PaymentTypeCode) {
      const paymentTypeId = getPaymentTypeIdByCode(data.PaymentTypeCode)
      if (!paymentTypeId) {
        throw new Error(`Invalid payment type code: ${data.PaymentTypeCode}`)
      }

      const payment = paymentRepo.createPayment()

      otherServicePaymentRepo.createOtherServicePayment({
        OSID: osId,
        PaymentID: payment.ID
      })

      config.processor(payment.ID, data)
    }
  }
}

/**
 * Resolves the payment type details from a generic PaymentID.
 */
const resolvePaymentDetails = (genericPaymentId) => {
  const paymentItem = {
    PaymentID: genericPaymentId,
    PaymentTypeCode: null,
    PaymentTypeName: null,
    Amount: 0,
  }

  const cashPayment = cashPaymentRepo.getCashPaymentByPaymentId(genericPaymentId)
  if (cashPayment) {
    paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.CASH
    paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CASH]
    paymentItem.Amount = (cashPayment.AmountReceived || 0) - (cashPayment.BalanceToReturn || 0)
    paymentItem.PaidAmount = cashPayment.AmountReceived
    paymentItem.BalanceAmount = cashPayment.BalanceToReturn
    return paymentItem
  }

  const chequePayment = chequePaymentRepo.getChequePaymentByPaymentId(genericPaymentId)
  if (chequePayment) {
    paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.CHEQUE
    paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CHEQUE]
    paymentItem.Amount = chequePayment.Amount || 0
    paymentItem.ReferenceNumber = chequePayment.ChequeNumber
    paymentItem.PaymentDate = chequePayment.ChequeDate
    paymentItem.BankName = chequePayment.BankName
    paymentItem.Collected = chequePayment.Collected ?? 0
    return paymentItem
  }

  try {
    const bankTransferPayment = bankTransferPaymentService.getBankTransferPaymentByPaymentId(genericPaymentId)
    if (bankTransferPayment) {
      paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.BANK_TRANSFER
      paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.BANK_TRANSFER]
      paymentItem.Amount = bankTransferPayment.Amount || 0
      paymentItem.ReferenceNumber = `Ref ID: ${bankTransferPayment.BankDetailsID}`
      return paymentItem
    }
  } catch (error) {
    console.error(`Failed to fetch bank transfer payment for PaymentID ${genericPaymentId}`, error)
  }

  return null
}

// ─────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────

exports.getOtherServices = () => {
  return otherServiceRepo.getAllOtherServices()
}

exports.getOtherServiceById = (osId) => {
  const normalizedId = normalizeOSId(osId)
  const os = otherServiceRepo.getOtherServiceById(normalizedId)

  if (!os) {
    throw new Error("Other Service not found")
  }

  const consumables = otherServiceConsumablesRepo.getOtherServiceConsumablesByOsId(normalizedId)

  const osPayments = otherServicePaymentRepo.getOtherServicePaymentsByOsId(normalizedId)
  const paymentsDetails = []

  for (const osPayment of osPayments) {
    const paymentItem = resolvePaymentDetails(osPayment.PaymentID)
    if (paymentItem) {
      paymentsDetails.push(paymentItem)
    }
  }

  const settledAmount = calculateSettledAmountFromAggregated(paymentsDetails)
  const netTotal = calculatePayableTotal(consumables)

  return {
    ...os,
    Consumables: consumables,
    Payments: paymentsDetails,
    RemainingAmount: Math.max(0, netTotal - settledAmount),
  }
}

exports.createOtherService = (payload, ctx) => {
  const osData = {
    Date: normalizeDate(payload.Date, "Date"),
    IsCompleted: normalizeBooleanFlag(payload.IsCompleted, "IsCompleted"),
    IsPaymentCompleted: normalizeBooleanFlag(payload.IsPaymentCompleted, "IsPaymentCompleted"),
  }

  const consumablesInput = Array.isArray(payload.Consumables) ? payload.Consumables : []
  const payment = normalizePaymentPayload(payload.Payment)

  if (consumablesInput.length === 0) {
    throw new Error("At least one consumable line is required")
  }

  const consumables = consumablesInput.map((line, index) => {
    const row = index + 1
    const qty = normalizeInteger(line?.Qty, `Qty on line ${row}`)

    if (qty <= 0) {
      throw new Error(`Qty must be greater than 0 on line ${row}`)
    }

    return {
      ConsumableID: normalizePositiveId(line?.ConsumableID, `ConsumableID on line ${row}`),
      Price: normalizeNumber(line?.Price, `Price on line ${row}`),
      Qty: qty,
    }
  })

  const isPaymentCompleted = deriveIsPaymentCompleted(consumables, payment)

  const createTransaction = db.transaction(() => {
    const os = otherServiceRepo.createOtherService({
      Date: osData.Date,
      IsCompleted: isPaymentCompleted,
      IsPaymentCompleted: isPaymentCompleted,
    })

    if (payload.CustomerID) {
      otherServiceCustomerRepo.createOtherServiceCustomer({
        OSID: os.OSID,
        CustomerID: normalizePositiveId(payload.CustomerID, "CustomerID"),
      })
    } else if (payload.CustomerName) {
      otherServiceCustomerDetailRepo.createOtherServiceCustomerDetail({
        OSID: os.OSID,
        CustomerName: normalizeRequiredText(payload.CustomerName, "Customer name"),
        CustomerPhone: normalizePhone(payload.CustomerPhone),
        CustomerEmail: normalizeEmail(payload.CustomerEmail),
      })
    }

    consumables.forEach((line) => {
      otherServiceConsumablesRepo.createOtherServiceConsumable({
        OSID: os.OSID,
        ConsumableID: line.ConsumableID,
        Price: line.Price,
        Qty: line.Qty,
      })

      let remainingToAllocate = line.Qty
      const storageRows = consumableStorageManagerRepo.getConsumableStorageManagersByConsumableId(line.ConsumableID)

      for (const row of storageRows) {
        if (remainingToAllocate <= 0) break

        const deductQty = Math.min(remainingToAllocate, row.Qty)

        consumableStorageManagerRepo.updateConsumableStorageManager(row.Id, {
          ...row,
          Qty: row.Qty - deductQty,
        })

        remainingToAllocate -= deductQty
      }

      if (remainingToAllocate > 0) {
        throw new Error(`Insufficient stock for consumable ID ${line.ConsumableID}. Required: ${line.Qty}, available: ${line.Qty - remainingToAllocate}`)
      }
    })

    processOSPayment(os.OSID, payment)

    const after = exports.getOtherServiceById(os.OSID)

    otherServiceAuditLogService.recordOSAction({
      action: AUDIT_ACTIONS.CREATE,
      osId: os.OSID,
      before: null,
      after,
      ctx,
    })

    return os
  })

  return createTransaction()
}

exports.makeAPaymentForOS = (osId, paymentPayload, ctx) => {
  const makePaymentTransaction = db.transaction(() => {
    const normalizedOsId = normalizeOSId(osId)
    const existingOs = otherServiceRepo.getOtherServiceById(normalizedOsId)

    if (!existingOs) {
      throw new Error("Other Service not found")
    }

    const before = exports.getOtherServiceById(normalizedOsId)

    const normalizedPayment = normalizePaymentPayload(paymentPayload)
    if (!normalizedPayment) {
      throw new Error("Payment payload is required.")
    }

    processOSPayment(normalizedOsId, normalizedPayment)

    const updatedOsDetails = exports.getOtherServiceById(normalizedOsId)

    const payableTotal = calculatePayableTotal(updatedOsDetails.Consumables)
    const currentSettledAmount = calculateSettledAmountFromAggregated(updatedOsDetails.Payments)
    const newIsPaymentCompleted = (currentSettledAmount >= (payableTotal - 0.01)) ? 1 : 0

    otherServiceRepo.updateOtherService(normalizedOsId, {
      ...existingOs,
      IsCompleted: newIsPaymentCompleted,
      IsPaymentCompleted: newIsPaymentCompleted,
    })

    const after = exports.getOtherServiceById(normalizedOsId)

    otherServiceAuditLogService.recordOSAction({
      action: AUDIT_ACTIONS.PAYMENT,
      osId: normalizedOsId,
      eventData: normalizedPayment,
      before,
      after,
      ctx,
    })

    return { success: true, osId: normalizedOsId, isPaymentCompleted: newIsPaymentCompleted }
  })

  return makePaymentTransaction()
}

exports.completeChequePayment = (osId, paymentId, ctx) => {
  const completePaymentTransaction = db.transaction(() => {
    const normalizedOsId = normalizeOSId(osId)
    const normalizedPaymentId = normalizePositiveId(paymentId, "PaymentID")

    const existingOs = otherServiceRepo.getOtherServiceById(normalizedOsId)
    if (!existingOs) {
      throw new Error("Other Service not found")
    }

    const before = exports.getOtherServiceById(normalizedOsId)

    const osPayments = otherServicePaymentRepo.getOtherServicePaymentsByOsId(normalizedOsId)
    const isLinked = osPayments.some((p) => p.PaymentID === normalizedPaymentId)
    if (!isLinked) {
      throw new Error("Cheque payment not found for this Other Service")
    }

    const chequePayment = chequePaymentRepo.getChequePaymentByPaymentId(normalizedPaymentId)
    if (!chequePayment) {
      throw new Error("Cheque payment details not found")
    }

    if (chequePayment.Collected !== 1) {
      chequePaymentRepo.updateChequePaymentByPaymentId(normalizedPaymentId, {
        ...chequePayment,
        Collected: 1,
      })
    }

    invoiceSettlementService.syncInvoiceSettlementOnChequeCollected(normalizedPaymentId)

    const updatedOsDetails = exports.getOtherServiceById(normalizedOsId)

    const payableTotal = calculatePayableTotal(updatedOsDetails.Consumables)
    const settledAmount = calculateSettledAmountFromAggregated(updatedOsDetails.Payments)
    const newIsPaymentCompleted = settledAmount >= payableTotal - 0.01 ? 1 : 0

    otherServiceRepo.updateOtherService(normalizedOsId, {
      ...existingOs,
      IsCompleted: newIsPaymentCompleted,
      IsPaymentCompleted: newIsPaymentCompleted,
    })

    const after = exports.getOtherServiceById(normalizedOsId)

    otherServiceAuditLogService.recordOSAction({
      action: AUDIT_ACTIONS.CHEQUE_COLLECTED,
      osId: normalizedOsId,
      eventData: { paymentId: normalizedPaymentId, chequeNumber: chequePayment.ChequeNumber },
      before,
      after,
      ctx,
    })

    return {
      success: true,
      osId: normalizedOsId,
      paymentId: normalizedPaymentId,
      isPaymentCompleted: newIsPaymentCompleted,
      remainingAmount: updatedOsDetails.RemainingAmount,
    }
  })

  return completePaymentTransaction()
}

exports.completeOtherService = (osId, ctx) => {
  const normalizedOsId = normalizeOSId(osId)

  const completeTransaction = db.transaction(() => {
    const existingOs = otherServiceRepo.getOtherServiceById(normalizedOsId)

    if (!existingOs) {
      throw new Error("Other Service not found")
    }

    const before = exports.getOtherServiceById(normalizedOsId)

    const updated = otherServiceRepo.updateOtherService(normalizedOsId, {
      ...existingOs,
      IsCompleted: 1,
    })

    if (!updated) {
      throw new Error("Failed to mark Other Service as completed")
    }

    const after = exports.getOtherServiceById(normalizedOsId)

    otherServiceAuditLogService.recordOSAction({
      action: AUDIT_ACTIONS.COMPLETE,
      osId: normalizedOsId,
      eventData: { IsCompleted: 1 },
      before,
      after,
      ctx,
    })

    return { success: true, osId: normalizedOsId, isCompleted: 1 }
  })

  const result = completeTransaction()

  try {
    invoiceService.generateInvoiceFromOtherService(normalizedOsId, ctx)
  } catch (invoiceError) {
    // Invoice generation is best-effort; do not block service completion.
    console.error("Failed to auto-generate invoice for Other Service", normalizedOsId, invoiceError)
  }

  return result
}

exports.updateOtherService = (osId, payload, ctx) => {
  const normalizedId = normalizeOSId(osId)
  const os = {
    Date: normalizeDate(payload.Date, "Date"),
    IsCompleted: normalizeBooleanFlag(payload.IsCompleted, "IsCompleted"),
    IsPaymentCompleted: normalizeBooleanFlag(payload.IsPaymentCompleted, "IsPaymentCompleted"),
  }

  const before = exports.getOtherServiceById(normalizedId)

  const updatedOs = otherServiceRepo.updateOtherService(normalizedId, os)

  if (!updatedOs) {
    throw new Error("Other Service not found")
  }

  const after = exports.getOtherServiceById(normalizedId)

  otherServiceAuditLogService.recordOSAction({
    action: AUDIT_ACTIONS.UPDATE,
    osId: normalizedId,
    before,
    after,
    ctx,
  })

  return updatedOs
}

exports.deleteOtherService = (osId, ctx) => {
  const normalizedId = normalizeOSId(osId)

  const deleteTransaction = db.transaction(() => {
    const before = exports.getOtherServiceById(normalizedId)

    const payments = otherServicePaymentRepo.getOtherServicePaymentsByOsId(normalizedId)

    payments.forEach((payment) => {
      const cheque = chequePaymentRepo.getChequePaymentByPaymentId(payment.PaymentID)
      if (cheque) {
        const chequeReminders = chequePaymentRepo.getChequeReminderByChequeId(cheque.ID)
        chequePaymentRepo.deleteChequeReminderByChequeId(cheque.ID)
        chequeReminders.forEach((cr) => {
          if (cr.ReminderID) {
            reminderRepo.deleteReminder(cr.ReminderID)
          }
        })
      }

      chequePaymentRepo.deleteChequePaymentByPaymentId(payment.PaymentID)
      cashPaymentRepo.deleteCashPaymentByPaymentId(payment.PaymentID)
      bankTransferPaymentService.deleteBankTransferPaymentByPaymentId(payment.PaymentID)
    })

    otherServicePaymentRepo.deleteOtherServicePaymentsByOsId(normalizedId)

    payments.forEach((payment) => {
      if (payment.PaymentID) {
        paymentRepo.deletePaymentById(payment.PaymentID)
      }
    })

    const consumableLines = otherServiceConsumablesRepo.getOtherServiceConsumablesByOsId(normalizedId)

    consumableLines.forEach((line) => {
      let remainingToRestore = line.Qty
      const storageRows = consumableStorageManagerRepo.getConsumableStorageManagersByConsumableId(line.ConsumableID)

      for (const row of storageRows) {
        if (remainingToRestore <= 0) break

        consumableStorageManagerRepo.updateConsumableStorageManager(row.Id, {
          ...row,
          Qty: row.Qty + remainingToRestore,
        })

        remainingToRestore = 0
      }
    })

    otherServiceCustomerRepo.deleteOtherServiceCustomerByOsId(normalizedId)
    otherServiceCustomerDetailRepo.deleteOtherServiceCustomerDetailByOsId(normalizedId)
    otherServiceConsumablesRepo.deleteOtherServiceConsumablesByOsId(normalizedId)

    const result = otherServiceRepo.deleteOtherService(normalizedId)

    if (result.changes === 0) {
      throw new Error("Other Service not found")
    }

    otherServiceAuditLogService.recordOSAction({
      action: AUDIT_ACTIONS.DELETE,
      osId: normalizedId,
      before,
      after: null,
      ctx,
    })

    return result
  })

  const result = deleteTransaction()

  if (result.changes === 0) {
    throw new Error("Other Service not found")
  }

  return { success: true }
}
