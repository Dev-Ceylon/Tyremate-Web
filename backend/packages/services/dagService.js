const db = require("../database/connection")
const dagRepo = require("../repositories/dagRepository")
const dagTyresRepo = require("../repositories/dagTyresRepository")
const dagGatePassRepo = require("../repositories/dagGatePassRepository")
const dagContractorApprovalRepo = require("../repositories/dagContractorApprovalRepository")
const dagGoodsReceiptRepo = require("../repositories/dagGoodsReceiptRepository")
const dagTyresSerialsRepo = require("../repositories/dagTyresSerialsRepository")
const dagTyreStorageRepo = require("../repositories/dagTyreStorageRepository")
const customerRepo = require("../repositories/customerRepository")
const walkinCustomerRepo = require("../repositories/walkinCustomerRepository")
const dagWalkinLinkRepo = require("../repositories/dagWalkinLinkRepository")
const { normalizePhone, normalizeEmail, normalizeRequiredText } = require("../validation")
const tyreRepo = require("../repositories/tyreRepository")
const contractorRepo = require("../repositories/contractorRepository")
const storageLocationRepo = require("../repositories/storageLocationRepository")
const storageManagerService = require("./storageManagerService")
const dagTyreStorageService = require("./dagTyreStorageService")
const paymentRepo = require("../repositories/paymentRepository")
const dagPaymentRepo = require("../repositories/dagPaymentRepository")
const dagSalesRepo = require("../repositories/dagSalesRepository")
const cashPaymentRepo = require("../repositories/cashPaymentRepository")
const chequePaymentRepo = require("../repositories/chequePaymentRepository")
const chequePaymentReceiptRepo = require("../repositories/chequePaymentReceiptRepository")
const cashPaymentService = require("./cashPaymentService")
const chequePaymentService = require("./chequePaymentService")
const bankTransferPaymentService = require("./bankTransferPaymentService")
const invoiceService = require("./invoiceService")
const invoiceSettlementService = require("./invoiceSettlementService")
const invoiceLinkRepo = require("../repositories/invoicePaymentLinkRepository")
const bankDetailsRepo = require("../repositories/bankDetailsRepository")
const { PAYMENT_TYPE_CODES, PAYMENT_TYPE_NAMES, getPaymentTypeIdByCode } = require("../constants/paymentTypeConstants")
const { STATUS_CODES, getStatusId } = require("../constants/statusConstants")
const { getStorageSourceId } = require("../constants/storageSourceConstants")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeOptionalId = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  return normalizeId(value, fieldName)
}

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = String(value).trim()
  return normalized === "" ? null : normalized
}

const APPROVAL_STATUSES = ["approved", "rejected"]

const normalizeApprovalStatus = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase()

  if (!APPROVAL_STATUSES.includes(normalized)) {
    throw new Error(`ApprovalStatus must be one of: ${APPROVAL_STATUSES.join(", ")}`)
  }

  return normalized
}

/**
 * Local wall-clock timestamp in SQLite's `datetime('now','localtime')` format.
 *
 * Computed in JS rather than SQL so it cannot drift with the SQLite/Node
 * timezone the way `date('now')` did in the pending-GRN overdue filter.
 */
const localDateTimeStamp = () => {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")

  return [
    now.getFullYear(),
    "-",
    pad(now.getMonth() + 1),
    "-",
    pad(now.getDate()),
    " ",
    pad(now.getHours()),
    ":",
    pad(now.getMinutes()),
    ":",
    pad(now.getSeconds()),
  ].join("")
}

const normalizeRequiredDate = (value, fieldName) => {
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

const normalizeQty = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeOptionalCost = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`)
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

const normalizePaymentPayload = (rawPaymentPayload) => {
  if (rawPaymentPayload === undefined || rawPaymentPayload === null) {
    return null;
  }

  const payment = {
    CashPayment: rawPaymentPayload.CashPayment ? {
      PaymentTypeCode: String(rawPaymentPayload.CashPayment.PaymentTypeCode || PAYMENT_TYPE_CODES.CASH).trim(),
      AmountReceived: normalizeNumber(rawPaymentPayload.CashPayment.AmountReceived, "AmountReceived"),
      BalanceToReturn: normalizeNumber(rawPaymentPayload.CashPayment.BalanceToReturn, "BalanceToReturn")
    } : null,
    ChequePayment: rawPaymentPayload.ChequePayment ? {
          PaymentTypeCode: String(rawPaymentPayload.ChequePayment.PaymentTypeCode || PAYMENT_TYPE_CODES.CHEQUE).trim(),
          ChequeNumber: String(rawPaymentPayload.ChequePayment.ChequeNumber || "").trim(),
          ChequeDate: normalizeRequiredDate(rawPaymentPayload.ChequePayment.ChequeDate, "ChequeDate"),
          BankName: String(rawPaymentPayload.ChequePayment.BankName || "").trim(),
          Amount: normalizeNumber(rawPaymentPayload.ChequePayment.Amount, "Amount"),
          Collected: normalizeBooleanFlag(rawPaymentPayload.ChequePayment.Collected, "Collected"),
        } : null,
    BankTransferPayment: rawPaymentPayload.BankTransferPayment ? {
      PaymentTypeCode: String(rawPaymentPayload.BankTransferPayment.PaymentTypeCode || PAYMENT_TYPE_CODES.BANK_TRANSFER).trim(),
      BankDetailsID: normalizeId(rawPaymentPayload.BankTransferPayment.BankDetailsID, "BankDetailsID"),
      Amount: normalizeNumber(rawPaymentPayload.BankTransferPayment.Amount, "Amount")
    } : null
  };

  return payment;
};

const calculateTotalDAGCost = (dagId) => {
  try {
    const dagTyres = dagTyresRepo.getDAGTyresByDAGId(dagId)
    let totalCost = 0

    for (const dagTyre of dagTyres) {
      const dagTyreId = dagTyre.ID || dagTyre.Id
      const serials = dagTyresSerialsRepo.getDAGTyresSerialsByDAGTyresId(dagTyreId)

      for (const serial of serials) {
        const value = Number(serial.DAGCost)
        totalCost += Number.isNaN(value) ? 0 : value
      }
    }

    return totalCost
  } catch (error) {
    console.error(`Failed to calculate total DAG cost for DAG ${dagId}`, error)
    return 0
  }
}

/**
 * Calculates the settled amount from a raw payment payload (Cash + Bank Transfer).
 * Freshly submitted cheques are never considered settled in the submission payload.
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
    settled += payment.BankTransferPayment.Amount || 0
  }

  return settled
}

/**
 * Calculates the total settled amount from an array of aggregated payment items.
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

const getPendingStatusId = () => {
  const statusId = getStatusId('PENDING')
  if (!statusId) {
    throw new Error("Pending status not initialized. Call initializeStatusIds() during app startup.")
  }
  return statusId
}

const getCompletedStatusId = () => {
  const statusId = getStatusId('COMPLETED')
  if (!statusId) {
    throw new Error("Completed status not initialized. Call initializeStatusIds() during app startup.")
  }
  return statusId
}

const assertCustomerExists = (customerId) => {
  if (customerId === null || customerId === undefined) return
  const customer = customerRepo.getCustomerById(customerId)

  if (!customer) {
    throw new Error("Customer not found")
  }
}

const assertContractorExists = (contractorId) => {
  if (contractorId === null) return

  const contractor = contractorRepo.getContractorById(contractorId)

  if (!contractor) {
    throw new Error("Contractor not found")
  }
}

const assertStorageLocationExists = (storageLocationId) => {
  const storageLocation = storageLocationRepo.getStorageLocationById(storageLocationId)

  if (!storageLocation) {
    throw new Error("Storage location not found")
  }
}

const createPaymentForDag = (dagId, paymentData) => {
  const payment = paymentRepo.createPayment()
  dagPaymentRepo.createDAGPayment({
    DAGID: dagId,
    PaymentID: payment.ID,
  })
  return payment.ID
}

const getDAGPaymentDetails = (paymentId) => {
  try {
    const paymentRecord = paymentRepo.getPaymentById(paymentId)
    const createdAt = paymentRecord?.CreatedDate ?? null
    const invoiceLinks = invoiceLinkRepo.getLinksByPaymentId(paymentId) || []
    const invoices = invoiceLinks.map((link) => ({
      InvoiceID: link.InvoiceID,
      InvoiceNumber: link.InvoiceNumber,
    }))

    const paymentItem = {
      PaymentID: paymentId,
      PaymentTypeCode: null,
      PaymentTypeName: null,
      Amount: 0,
      CreatedAt: createdAt,
      PaymentDate: createdAt,
      ReferenceNumber: null,
      BankName: null,
      Invoices: invoices,
    }

    const cashPayment = cashPaymentService.getCashPaymentByPaymentId(paymentId)
    if (cashPayment) {
      paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.CASH
      paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CASH]
      paymentItem.Amount = (cashPayment.AmountReceived || 0) - (cashPayment.BalanceToReturn || 0)
      paymentItem.AmountReceived = cashPayment.AmountReceived
      paymentItem.BalanceToReturn = cashPayment.BalanceToReturn
      paymentItem.PaidAmount = cashPayment.AmountReceived
      paymentItem.BalanceAmount = cashPayment.BalanceToReturn
      // Include receipt fields for frontend receipt preview
      paymentItem.ReceiptPath = cashPayment.ReceiptPath ?? null
      paymentItem.ReceiptEncIV = cashPayment.ReceiptEncIV ?? null
      paymentItem.ReceiptEncAuthTag = cashPayment.ReceiptEncAuthTag ?? null
      paymentItem.ReceiptEncKey = cashPayment.ReceiptEncKey ?? null
      return paymentItem
    }

    const chequePayment = chequePaymentService.getChequePaymentByPaymentId(paymentId)
    if (chequePayment) {
      paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.CHEQUE
      paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CHEQUE]
      paymentItem.Amount = chequePayment.Amount || 0
      paymentItem.ChequeNumber = chequePayment.ChequeNumber
      paymentItem.ReferenceNumber = chequePayment.ChequeNumber
      paymentItem.ChequeDate = chequePayment.ChequeDate
      paymentItem.PaymentDate = chequePayment.ChequeDate || createdAt
      paymentItem.BankName = chequePayment.BankName
      paymentItem.Collected = chequePayment.Collected ?? 0
      // Include receipts for cheque payments
      const chequeReceipts = chequePaymentReceiptRepo.getChequePaymentReceiptsByChequePaymentId(chequePayment.ID)
      paymentItem.Receipts = chequeReceipts.map((r) => ({
        ReceiptPath: r.ReceiptPath,
        ReceiptEncIV: r.ReceiptEncIV,
        ReceiptEncAuthTag: r.ReceiptEncAuthTag,
        ReceiptEncKey: r.ReceiptEncKey,
        OriginalFileName: r.OriginalFileName ?? null,
      }))
      return paymentItem
    }

    const bankTransferPayment = bankTransferPaymentService.getBankTransferPaymentByPaymentId(paymentId)
    if (bankTransferPayment) {
      paymentItem.PaymentTypeCode = PAYMENT_TYPE_CODES.BANK_TRANSFER
      paymentItem.PaymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.BANK_TRANSFER]
      paymentItem.Amount = bankTransferPayment.Amount || 0
      paymentItem.BankDetailsID = bankTransferPayment.BankDetailsID
      if (bankTransferPayment.BankDetailsID) {
        const bank = bankDetailsRepo.getBankDetailsById(bankTransferPayment.BankDetailsID)
        paymentItem.BankName = bank?.BankName ?? null
        paymentItem.ReferenceNumber = bank?.AccountNumber ?? null
      }
      // Include receipt fields for frontend receipt preview
      paymentItem.ReceiptPath = bankTransferPayment.ReceiptPath ?? null
      paymentItem.ReceiptEncIV = bankTransferPayment.ReceiptEncIV ?? null
      paymentItem.ReceiptEncAuthTag = bankTransferPayment.ReceiptEncAuthTag ?? null
      paymentItem.ReceiptEncKey = bankTransferPayment.ReceiptEncKey ?? null
      return paymentItem
    }

    return null
  } catch (error) {
    console.error(`Failed to get payment details for payment ${paymentId}`, error)
    return null
  }
}

const processCashPayment = (paymentId, paymentData) => {
  if (!paymentData || !paymentData.PaymentTypeCode) return
  if (paymentData.PaymentTypeCode !== PAYMENT_TYPE_CODES.CASH) return

  cashPaymentRepo.createCashPayment({
    PaymentID: paymentId,
    AmountReceived: paymentData.AmountReceived,
    BalanceToReturn: paymentData.BalanceToReturn,
    ReceiptPath: paymentData.ReceiptPath ?? null,
    ReceiptEncIV: paymentData.ReceiptEncIV ?? null,
    ReceiptEncAuthTag: paymentData.ReceiptEncAuthTag ?? null,
    ReceiptEncKey: paymentData.ReceiptEncKey ?? null,
  })
}

const processChequePayment = (paymentId, paymentData) => {
  if (!paymentData || !paymentData.PaymentTypeCode) return
  if (paymentData.PaymentTypeCode !== PAYMENT_TYPE_CODES.CHEQUE) return

  const chequePayment = chequePaymentRepo.createChequePayment({
    PaymentID: paymentId,
    ChequeNumber: paymentData.ChequeNumber,
    ChequeDate: paymentData.ChequeDate,
    BankName: paymentData.BankName,
    Amount: paymentData.Amount,
    Collected: paymentData.Collected,
  })

  if (Array.isArray(paymentData.Receipts)) {
    paymentData.Receipts.forEach((receipt, index) => {
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

const processBankTransferPayment = (paymentId, paymentData) => {
  if (!paymentData || !paymentData.PaymentTypeCode) return
  if (paymentData.PaymentTypeCode !== PAYMENT_TYPE_CODES.BANK_TRANSFER) return

  bankTransferPaymentService.createBankTransferPayment(paymentId, {
    BankDetailsID: paymentData.BankDetailsID,
    Amount: paymentData.Amount,
    ReceiptPath: paymentData.ReceiptPath ?? null,
    ReceiptEncIV: paymentData.ReceiptEncIV ?? null,
    ReceiptEncAuthTag: paymentData.ReceiptEncAuthTag ?? null,
    ReceiptEncKey: paymentData.ReceiptEncKey ?? null,
  })
}

const processPayments = (dagId, payments = {}) => {
  if (!dagId) {
    throw new Error("DAG ID is required to process payments")
  }

  const paymentEntries = [
    { data: payments.CashPayment, handler: processCashPayment },
    { data: payments.ChequePayment, handler: processChequePayment },
    { data: payments.BankTransferPayment, handler: processBankTransferPayment },
  ]

  for (const entry of paymentEntries) {
    if (!entry.data || !entry.data.PaymentTypeCode) {
      continue
    }

    const paymentTypeId = getPaymentTypeIdByCode(entry.data.PaymentTypeCode)
    if (!paymentTypeId) {
      throw new Error(`Unsupported payment type code: ${entry.data.PaymentTypeCode}`)
    }

    const paymentId = createPaymentForDag(dagId, entry.data)
    entry.handler(paymentId, entry.data)
  }

  // Auto-mark payment as completed if business rules are met
  const dag = dagRepo.getDAGById(dagId)
  if (dag && dag.TotalDAGCost > 0) {
    const hasCheque = !!payments.ChequePayment
    const payloadSettled = calculateSettledAmount(payments)

    // If no cheque is in this submission and the payload covers the full cost
    if (!hasCheque && payloadSettled >= dag.TotalDAGCost - 0.01) {
      dagRepo.updateDAG(dagId, {
        ...dag,
        IsPaymentCompleted: 1,
      })
    }
  }
}

/**
 * Nominal value of a take payment: cash net of change plus the face value of any
 * cheque and bank transfer. Unlike calculateSettledAmount, an uncollected cheque
 * still counts here, because at the moment of a take the customer has handed the
 * cheque over, so it settles the selection.
 */
const calculateNominalPaymentAmount = (payment) => {
  if (!payment) return 0

  let total = 0

  if (payment.CashPayment) {
    total += Math.max(0, (payment.CashPayment.AmountReceived || 0) - (payment.CashPayment.BalanceToReturn || 0))
  }

  if (payment.ChequePayment) {
    total += payment.ChequePayment.Amount || 0
  }

  if (payment.BankTransferPayment) {
    total += payment.BankTransferPayment.Amount || 0
  }

  return total
}

const normalizeSerialIds = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Select at least one serial to take")
  }

  const ids = value.map((serialId) => normalizeId(serialId, "Serial ID"))
  return [...new Set(ids)]
}

// A take records ONE Payments row and attaches whichever methods were used as
// its children, rather than one Payment row per method like processPayments.
const createTakePayment = (dagId, paymentData) => {
  const payment = paymentRepo.createPayment()
  dagPaymentRepo.createDAGPayment({ DAGID: dagId, PaymentID: payment.ID })

  if (paymentData && paymentData.CashPayment) {
    processCashPayment(payment.ID, paymentData.CashPayment)
  }
  if (paymentData && paymentData.ChequePayment) {
    processChequePayment(payment.ID, paymentData.ChequePayment)
  }
  if (paymentData && paymentData.BankTransferPayment) {
    processBankTransferPayment(payment.ID, paymentData.BankTransferPayment)
  }

  return payment.ID
}

const toDAGPayload = (payload = {}) => {
  const customerId = payload.CustomerID ? normalizeOptionalId(payload.CustomerID, "CustomerID") : null
  const contractorId = normalizeOptionalId(payload.ContractorID, "ContractorID")

  if (customerId) {
    assertCustomerExists(customerId)
  }
  assertContractorExists(contractorId)

  const hasWalkinName = Boolean(payload.CustomerName || payload.WalkinCustomer?.CustomerName)
  if (!customerId && !hasWalkinName) {
    throw new Error("Either CustomerID or CustomerName is required")
  }

  const walkinCustomer = !customerId
    ? {
        CustomerName: normalizeRequiredText(payload.CustomerName || payload.WalkinCustomer?.CustomerName, "Customer name"),
        CustomerPhone: normalizePhone(payload.CustomerPhone || payload.WalkinCustomer?.CustomerPhone),
        CustomerAddress: normalizeRequiredText(payload.CustomerAddress || payload.WalkinCustomer?.CustomerAddress, "Customer address"),
        CustomerEmail: normalizeEmail(payload.CustomerEmail || payload.WalkinCustomer?.CustomerEmail),
        VehicleNumber: normalizeText(payload.VehicleNumber || payload.WalkinCustomer?.VehicleNumber),
        TinNo: normalizeText(payload.TinNo || payload.WalkinCustomer?.TinNo),
        VatNo: normalizeText(payload.VatNo || payload.WalkinCustomer?.VatNo),
      }
    : null

  return {
    CustomerID: customerId,
    WalkinCustomer: walkinCustomer,
    ContractorID: contractorId,
    StatusID: payload.StatusID || getPendingStatusId(), // Default to pending
    Comment: normalizeText(payload.Comment),
    Date: normalizeRequiredDate(payload.Date, "Date"),
  }
}

const toDAGCreateWithTyresPayload = (payload = {}) => {
  const dag = toDAGPayload(payload)
  const tyresInput = Array.isArray(payload.Tyres) ? payload.Tyres : []
  const payment = normalizePaymentPayload(payload.Payment);

  if (tyresInput.length === 0) {
    throw new Error("At least one DAG tyre line is required")
  }

  const tyres = tyresInput.map((line, index) => {
    const row = index + 1
    const tyreId = normalizeId(line?.TyreID, `TyreID on line ${row}`)
    const storageLocationId = normalizeId(line?.StorageLocationID, `StorageLocationID on line ${row}`)
    const qty = normalizeQty(line?.Qty, `Qty on line ${row}`)

    const tyre = tyreRepo.getTyreById(tyreId)

    if (!tyre) {
      throw new Error("Tyre not found")
    }

    // Default the serial cost to the tyre master's DAG cost unless a specific
    // cost is supplied for this serial.
    const defaultDagCost = tyre.DAGCost ?? null

    const serials = Array.isArray(line?.Serials)
      ? line.Serials.map((s) => {
          const serialNumber = normalizeText(s?.SerialNumber)
          const cost = normalizeOptionalCost(s?.DAGCost, `DAGCost for serial ${serialNumber || "unknown"} on line ${row}`) ?? defaultDagCost
          return {
            SerialNumber: serialNumber,
            DAGCost: cost,
          }
        }).filter((s) => s.SerialNumber !== null)
      : []

    assertStorageLocationExists(storageLocationId)

    return {
      TyreID: tyreId,
      StorageLocationID: storageLocationId,
      Qty: qty,
      Serials: serials,
    }
  })

  return {
    ...dag,
    Tyres: tyres,
    Payment: payment,
  }
}

exports.getDAGs = () => {
  return dagRepo.getAllDAGs()
}

exports.getDAGById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const dag = dagRepo.getDAGById(normalizedId)

  if (!dag) {
    throw new Error("DAG not found")
  }

  return dag
}

/**
 * Fetches a DAG by ID with all associated tyre lines and their serial numbers.
 */
exports.getDetailedDAGById = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const dag = dagRepo.getDAGById(normalizedId)

  if (!dag) {
    throw new Error("DAG not found")
  }

  try {
    const tyres = dagTyresRepo.getDAGTyresByDAGIdWithDetails(normalizedId)

    const tyresWithDetails = tyres.map(tyre => {
      try {
        const tyreLineId = tyre.ID || tyre.Id
        const serials = dagTyresSerialsRepo.getDAGTyresSerialsByDAGTyresId(tyreLineId)
        const serialList = serials || []
        const soldSerials = serialList.filter((serial) => !!serial.SoldAt)

        return {
          ...tyre,
          Serials: serialList,
          SoldQty: soldSerials.length,
        }
      } catch (error) {
        console.error(`Failed to load serials for DAG tyre ${tyre.ID}`, error)
        return {
          ...tyre,
          Serials: [],
          SoldQty: 0,
        }
      }
    })

    // Taken value/quantity are derived from the serial sold markers so the UI can
    // show how much has actually left the DAG versus the contracted total.
    const takenAmount = tyresWithDetails.reduce((sum, tyre) => {
      return sum + (tyre.Serials || []).reduce((lineSum, serial) => {
        if (!serial.SoldAt) return lineSum
        const value = Number(serial.DAGCost)
        return lineSum + (Number.isNaN(value) ? 0 : value)
      }, 0)
    }, 0)
    const takenQty = tyresWithDetails.reduce((sum, tyre) => sum + (tyre.SoldQty ?? 0), 0)

    const dagPayments = dagPaymentRepo.getDAGPaymentsByDAGId(normalizedId)
    const payments = dagPayments
      .map((dagPayment) => {
        const details = getDAGPaymentDetails(dagPayment.PaymentID)
        if (!details) return null
        // Which serials were collected for this payment, so the UI can show the
        // tyres tied to each take without a second round trip.
        details.SaleLines = dagSalesRepo.getDAGSaleLinesWithDetailsByPaymentId(
          dagPayment.PaymentID,
          normalizedId
        )
        details.IsAdvance = (!details.SaleLines || details.SaleLines.length === 0) ? 1 : 0
        return details
      })
      .filter(Boolean)

    const settledAmount = calculateSettledAmountFromAggregatedPaymentsArray(payments)

    const calculatedTotalCost = tyresWithDetails.reduce((sum, tyre) => {
      return sum + (tyre.Serials || []).reduce((lineSum, serial) => {
        const value = Number(serial.DAGCost)
        return lineSum + (Number.isNaN(value) ? 0 : value)
      }, 0)
    }, 0)

    const totalCost = (Number(dag.TotalDAGCost) > 0) ? Number(dag.TotalDAGCost) : calculatedTotalCost

    // Sync TotalDAGCost in database if it was not stored or out of sync
    if (calculatedTotalCost > 0 && Number(dag.TotalDAGCost) !== calculatedTotalCost) {
      dagRepo.updateDAG(normalizedId, {
        ...dag,
        TotalDAGCost: calculatedTotalCost,
      })
      dag.TotalDAGCost = calculatedTotalCost
    }

    const isPaymentCompleted = (totalCost > 0 && settledAmount >= totalCost - 0.01) ? 1 : 0

    if (dag.IsPaymentCompleted !== isPaymentCompleted) {
      dagRepo.updateDAG(normalizedId, {
        ...dag,
        TotalDAGCost: totalCost,
        IsPaymentCompleted: isPaymentCompleted,
      })
      dag.IsPaymentCompleted = isPaymentCompleted
    }

    // Goods receipt progress: a DAG's tyres return from a gate pass into
    // quarantine and are only released by a GRN. Compare the accepted quantity
    // against the total sent out so the UI can show completed / partial / none.
    const grnSummary = dagGoodsReceiptRepo.getDagGoodsReceiptSummary(normalizedId)
    const grnRequiredQty = tyresWithDetails.reduce((sum, tyre) => sum + Number(tyre.Qty ?? 0), 0)
    const grnAcceptedQty = Number(grnSummary?.AcceptedQty ?? 0)
    const grnStatus = grnAcceptedQty <= 0
      ? "none"
      : grnAcceptedQty >= grnRequiredQty
        ? "completed"
        : "partial"

    const walkinCustomer = dagWalkinLinkRepo.getWalkinCustomerForDag(normalizedId)

    return {
      ...dag,
      Customer: walkinCustomer
        ? {
            IsWalkinCustomer: true,
            CustomerName: walkinCustomer.CustomerName,
            CustomerPhone: walkinCustomer.CustomerPhone,
            CustomerAddress: walkinCustomer.CustomerAddress,
            CustomerEmail: walkinCustomer.CustomerEmail,
            VehicleNumber: walkinCustomer.VehicleNumber,
            TinNo: walkinCustomer.TinNo,
            VatNo: walkinCustomer.VatNo,
          }
        : {
            IsWalkinCustomer: false,
            CustomerID: dag.CustomerID,
            CustomerName: dag.CustomerName,
            CustomerCode: dag.CustomerCode,
          },
      TotalDAGCost: totalCost,
      Tyres: tyresWithDetails,
      Payments: payments,
      IsPaymentCompleted: isPaymentCompleted,
      TakenAmount: takenAmount,
      TakenQty: takenQty,
      GrnStatus: grnStatus,
      GrnAcceptedQty: grnAcceptedQty,
      GrnRequiredQty: grnRequiredQty,
    }
  } catch (error) {
    console.error(`Failed to load detailed DAG data for DAG ${normalizedId}`, error)
    const walkinCustomer = dagWalkinLinkRepo.getWalkinCustomerForDag(normalizedId)
    return {
      ...dag,
      Customer: walkinCustomer
        ? {
            IsWalkinCustomer: true,
            CustomerName: walkinCustomer.CustomerName,
            CustomerPhone: walkinCustomer.CustomerPhone,
            CustomerAddress: walkinCustomer.CustomerAddress,
            CustomerEmail: walkinCustomer.CustomerEmail,
            VehicleNumber: walkinCustomer.VehicleNumber,
            TinNo: walkinCustomer.TinNo,
            VatNo: walkinCustomer.VatNo,
          }
        : {
            IsWalkinCustomer: false,
            CustomerID: dag.CustomerID,
            CustomerName: dag.CustomerName,
            CustomerCode: dag.CustomerCode,
          },
      Tyres: [],
      Payments: [],
      IsPaymentCompleted: 0,
      TakenAmount: 0,
      TakenQty: 0,
      GrnStatus: "none",
      GrnAcceptedQty: 0,
      GrnRequiredQty: 0,
    }
  }
}

exports.createDAG = (payload) => {
  const dag = toDAGPayload(payload)
  return db.transaction(() => {
    const created = dagRepo.createDAG(dag)
    if (dag.WalkinCustomer) {
      const wc = walkinCustomerRepo.createWalkinCustomer(dag.WalkinCustomer)
      dagWalkinLinkRepo.linkDagToWalkinCustomer(created.ID, wc.ID)
    }
    return created
  })()
}

exports.createDAGWithTyres = (payload, ctx) => {
  const data = toDAGCreateWithTyresPayload(payload)

  const createTransaction = db.transaction(() => {
    let initialTotalCost = 0
    if (Array.isArray(data.Tyres)) {
      data.Tyres.forEach((line) => {
        if (Array.isArray(line.Serials)) {
          line.Serials.forEach((serial) => {
            const val = Number(serial.DAGCost)
            initialTotalCost += Number.isNaN(val) ? 0 : val
          })
        }
      })
    }

    const dag = dagRepo.createDAG({
      CustomerID: data.CustomerID,
      ContractorID: data.ContractorID,
      StatusID: data.StatusID,
      Comment: data.Comment,
      TotalDAGCost: initialTotalCost,
      Date: data.Date,
    })

    if (data.WalkinCustomer) {
      const wc = walkinCustomerRepo.createWalkinCustomer(data.WalkinCustomer)
      dagWalkinLinkRepo.linkDagToWalkinCustomer(dag.ID, wc.ID)
    }

    if (data.Payment) {
      processPayments(dag.ID, data.Payment)
    }

    const tyres = data.Tyres.map((line) => {
      const createdTyre = dagTyresRepo.createDAGTyre({
        DAGID: dag.ID,
        TyreID: line.TyreID,
        StorageLocationID: line.StorageLocationID,
        Qty: line.Qty,
      })

      const dagTyresId = createdTyre.ID || createdTyre.Id

      line.Serials.forEach((serial) => {
        dagTyresSerialsRepo.createDAGTyresSerial({
          DAGTyresID: dagTyresId,
          SerialNumber: serial.SerialNumber,
          DAGCost: serial.DAGCost ?? 0,
        })
      })

      let smRecord
      try {
        smRecord = storageManagerService.createStorageManager({
          TyreId: line.TyreID,
          LocationID: line.StorageLocationID,
          Qty: line.Qty,
          SourceTypeId: getStorageSourceId("DAG"),
          SourceId: dag.ID,
        })
      } catch (error) {
        console.error(`Failed to create storage manager for DAG tyre line (TyreID: ${line.TyreID})`, error)
        throw error
      }

      try {
        dagTyreStorageService.createDagTyreStorage({
          DAGTyresID: dagTyresId,
          StorageManagerID: smRecord.Id || smRecord.ID,
        })
      } catch (error) {
        console.error(`Failed to create dag tyre storage link (DAGTyresID: ${dagTyresId})`, error)
        throw error
      }

      return createdTyre
    })

    return { dag, tyres }
  })

  const result = createTransaction()

  if (data.Payment) {
    try {
      invoiceService.generateInvoiceFromDAG(result.dag.ID, ctx)
    } catch (invoiceError) {
      console.error(`Failed to auto-generate invoice for DAG ${result.dag.ID}:`, invoiceError)
    }
  }

  return result
}

/**
 * Issues the gate pass for a DAG, moving it to GP_ISSUED and drawing the DAG's
 * tyre quantities out of storage.
 *
 * The contractor is NOT a parameter. It is derived from the latest allocation
 * row, and that row must be approved: issuing stock against a contractor who was
 * never approved (or whose approval was rejected) is the exact case the
 * two-step allocation flow exists to prevent. The latest row is checked rather
 * than the most recent approved one, so a contractor who was approved and then
 * reassigned cannot slip through on their predecessor's decision.
 *
 * @param {number} id DAG id
 * @param {{ user?:{ id:number } }} ctx injected by registerServiceHandler
 */
exports.issueGatePass = (id) => {
  const normalizedId = normalizeId(id, "ID")
  const current = dagRepo.getDAGById(normalizedId)

  if (!current) {
    throw new Error("DAG not found")
  }

  const gpStatusId = getStatusId('GP_ISSUED')
  if (!gpStatusId) {
    throw new Error("Gate Pass Issued status not initialized. Call initializeStatusIds() during app startup.")
  }

  const issueTransaction = db.transaction(() => {
    const existingGP = dagGatePassRepo.getDAGGatePassByDAGId(normalizedId)

    // Re-issuing is idempotent and must stay available: the gate pass and its
    // contractor are already bound, so the storage movement is skipped. A DAG
    // that predates this check can still be nudged back to GP_ISSUED.
    if (existingGP || current.StatusID === gpStatusId) {
      return dagRepo.updateDAG(normalizedId, {
        ...current,
        StatusID: gpStatusId,
      })
    }

    const latestAllocation = dagContractorApprovalRepo.getLatestDAGContractorApprovalByDAGId(normalizedId)

    if (!latestAllocation) {
      throw new Error("Assign a contractor before issuing a gate pass")
    }

    if (latestAllocation.ApprovalStatus === null || latestAllocation.ApprovalStatus === undefined) {
      throw new Error("Approve the contractor before issuing a gate pass")
    }

    if (latestAllocation.ApprovalStatus !== "approved") {
      throw new Error("The contractor assignment was rejected. Reassign and approve a contractor before issuing a gate pass")
    }

    assertContractorExists(latestAllocation.ContractorID)

    const dagTyres = dagTyresRepo.getDAGTyresByDAGId(normalizedId)

    for (const dagTyre of dagTyres) {
      const dagTyreId = dagTyre.ID || dagTyre.Id
      const requiredQty = Number(dagTyre.Qty ?? 0)

      let dagTyreStorageLinks
      try {
        dagTyreStorageLinks = dagTyreStorageService.getDagTyreStoragesByDagTyresId(dagTyreId)
      } catch (error) {
        console.error(`Failed to fetch storage links for DAG tyre ${dagTyreId}`, error)
        throw error
      }

      if (dagTyreStorageLinks.length === 0) {
        throw new Error(`No storage manager link found for DAG tyre ID ${dagTyreId}`)
      }

      const link = dagTyreStorageLinks[0]
      const storageManagerId = link.StorageManagerID

      let storageManagerRecord
      try {
        storageManagerRecord = storageManagerService.getStorageManagerById(storageManagerId)
      } catch (error) {
        console.error(`Failed to fetch storage manager record ${storageManagerId}`, error)
        throw error
      }

      const currentStockQty = Number(storageManagerRecord.Qty ?? 0)

      if (currentStockQty < requiredQty) {
        throw new Error(
          `Insufficient stock for Tyre ID ${dagTyre.TyreID} in storage location ${storageManagerRecord.LocationID}. Required: ${requiredQty}, Available: ${currentStockQty}`
        )
      }

      try {
        storageManagerService.updateStorageManager(storageManagerId, {
          TyreId: storageManagerRecord.TyreId,
          LocationID: storageManagerRecord.LocationID,
          Qty: currentStockQty - requiredQty,
        })
      } catch (error) {
        console.error(`Failed to update storage manager ${storageManagerId} for DAG tyre ${dagTyreId}`, error)
        throw error
      }
    }

    const updatedDag = dagRepo.updateDAG(normalizedId, {
      ...current,
      StatusID: gpStatusId,
      ContractorID: latestAllocation.ContractorID,
    })

    dagGatePassRepo.createDAGGatePass({ DAGID: normalizedId })

    return updatedDag
  })

  return issueTransaction()
}

/**
 * Marks an arriving DAG as ARRIVED and returns its tyres to the quarantine
 * location of each tyre line's branch. The returned stock is deliberately not
 * put back into sellable storage: it stays quarantined (`q-tine`) until an
 * operator releases it. For that reason the original storage lot is not
 * restored in place; a fresh lot is created and linked to the DAG tyre line
 * with the DAG source so its origin stays explicit even when PO stock shares
 * the same quarantine location.
 *
 * Only the sent-out -> arrived transition moves stock, and it is idempotent:
 * a DAG that is already ARRIVED is returned unchanged without creating a
 * second lot.
 *
 * @param {number} id DAG id
 */
exports.markDAGArrived = (id) => {
  const normalizedId = normalizeId(id, "ID")

  const current = dagRepo.getDAGById(normalizedId)
  if (!current) {
    throw new Error("DAG not found")
  }

  const arrivedStatusId = getStatusId("ARRIVED")
  if (!arrivedStatusId) {
    throw new Error(
      "Arrived status not initialized. Call initializeStatusIds() during app startup."
    )
  }

  if (current.StatusID === arrivedStatusId) {
    return current
  }

  const arrivingStatusId = getStatusId("ARRIVING")
  if (!arrivingStatusId) {
    throw new Error(
      "Arriving status not initialized. Call initializeStatusIds() during app startup."
    )
  }

  if (current.StatusID !== arrivingStatusId) {
    throw new Error(
      "A DAG can only be marked as arrived after its delivery date has been set"
    )
  }

  const arriveTransaction = db.transaction(() => {
    const dagTyres = dagTyresRepo.getDAGTyresByDAGId(normalizedId)

    for (const dagTyre of dagTyres) {
      const qty = Number(dagTyre.Qty ?? 0)

      if (qty <= 0) {
        continue
      }

      const storageLocation = storageLocationRepo.getStorageLocationById(
        dagTyre.StorageLocationID
      )

      if (!storageLocation || !storageLocation.BranchId) {
        throw new Error(
          `DAG tyre ${dagTyre.TyreID} is not linked to a branch storage location`
        )
      }

      const quarantineLocation = storageLocationRepo.getQuarantineLocationByBranchId(
        storageLocation.BranchId
      )

      if (!quarantineLocation) {
        throw new Error(
          `No quarantine location is configured for branch ${storageLocation.BranchId}. ` +
            "Add one before marking this DAG as arrived."
        )
      }

      const lot = storageManagerService.addInternalStorageLot({
        tyreId: dagTyre.TyreID,
        locationId: quarantineLocation.Id,
        qty,
        sourceTypeId: getStorageSourceId("DAG"),
        sourceId: normalizedId,
      })

      dagTyreStorageService.createDagTyreStorage({
        DAGTyresID: dagTyre.ID || dagTyre.Id,
        StorageManagerID: lot.Id || lot.ID,
      })
    }

    const updated = dagRepo.updateDAGStatus(normalizedId, arrivedStatusId)

    if (!updated) {
      throw new Error("DAG not found")
    }

    return updated
  })

  return arriveTransaction()
}

/**
 * Marks a sent-out DAG as arriving and records its delivery date in the same
 * transaction. This is the only UI path into ARRIVING: the date is mandatory so
 * the status cannot be nudged forward blankly.
 *
 * Deliberately does NOT touch stock. Returning tyres to inventory is a separate
 * concern (see markDAGArrived), so quantity movement is not duplicated here.
 *
 * @param {number} id DAG id
 * @param {string} deliveryDate delivery date in YYYY-MM-DD form
 */
exports.markDAGArriving = (id, deliveryDate) => {
  const normalizedId = normalizeId(id, "ID")
  const normalizedDeliveryDate = normalizeRequiredDate(deliveryDate, "DeliveryDate")

  const current = dagRepo.getDAGById(normalizedId)
  if (!current) {
    throw new Error("DAG not found")
  }

  const arrivingStatusId = getStatusId("ARRIVING")
  if (!arrivingStatusId) {
    throw new Error(
      "Arriving status not initialized. Call initializeStatusIds() during app startup."
    )
  }

  // Idempotency: already arriving means the transition landed, so return the
  // record unchanged rather than overwriting an earlier delivery date.
  if (current.StatusID === arrivingStatusId) {
    return current
  }

  const sentOutStatusId = getStatusId("SENT_OUT")
  if (!sentOutStatusId) {
    throw new Error(
      "Sent Out status not initialized. Call initializeStatusIds() during app startup."
    )
  }

  if (current.StatusID !== sentOutStatusId) {
    throw new Error("A delivery date can only be set after the DAG is sent out")
  }

  const updated = dagRepo.updateDAGDeliveryDate(
    normalizedId,
    normalizedDeliveryDate,
    arrivingStatusId,
  )

  if (!updated) {
    throw new Error("DAG not found")
  }

  return updated
}

/**
 * Corrects the delivery date on a DAG whose arrival is already recorded
 * (ARRIVING or ARRIVED) without changing its status. Kept separate from
 * markDAGArriving so the sno -> arriving transition and a pure correction stay
 * independent: the status is passed through unchanged.
 *
 * @param {number} id DAG id
 * @param {string} deliveryDate delivery date in YYYY-MM-DD form
 */
exports.updateDAGDeliveryDate = (id, deliveryDate) => {
  const normalizedId = normalizeId(id, "ID")
  const normalizedDeliveryDate = normalizeRequiredDate(deliveryDate, "DeliveryDate")

  const current = dagRepo.getDAGById(normalizedId)
  if (!current) {
    throw new Error("DAG not found")
  }

  const editableStatusIds = [getStatusId("ARRIVING"), getStatusId("ARRIVED")].filter(Boolean)
  if (!editableStatusIds.includes(current.StatusID)) {
    throw new Error("The delivery date can only be updated after the DAG is arriving")
  }

  const updated = dagRepo.updateDAGDeliveryDate(
    normalizedId,
    normalizedDeliveryDate,
    current.StatusID,
  )

  if (!updated) {
    throw new Error("DAG not found")
  }

  return updated
}

exports.updateDAGStatus = (id, statusCode) => {
  const normalizedId = normalizeId(id, "ID")
  const normalizedCode = normalizeText(statusCode)

  if (!normalizedCode) {
    throw new Error("Status code is required")
  }

  const current = dagRepo.getDAGById(normalizedId)
  if (!current) {
    throw new Error("DAG not found")
  }

  // Map the status code (e.g., 'pdn') back to its constant key (e.g., 'PENDING')
  const statusKey = Object.keys(STATUS_CODES).find(
    (key) => STATUS_CODES[key] === normalizedCode
  )

  if (!statusKey) {
    throw new Error(`Invalid status code: ${normalizedCode}`)
  }

  const statusId = getStatusId(statusKey)
  if (!statusId) {
    throw new Error(
      `Status ID for code "${normalizedCode}" not initialized. Call initializeStatusIds() during app startup.`
    )
  }

  const updated = dagRepo.updateDAGStatus(normalizedId, statusId)

  if (!updated) {
    throw new Error("DAG not found")
  }

  return updated
}

exports.updateDAG = (id, payload) => {
  const normalizedId = normalizeId(id, "ID")
  const data = toDAGCreateWithTyresPayload(payload)

  const current = dagRepo.getDAGById(normalizedId)
  if (!current) {
    throw new Error("DAG not found")
  }

  const updateTransaction = db.transaction(() => {
    let initialTotalCost = 0
    if (Array.isArray(data.Tyres)) {
      data.Tyres.forEach((line) => {
        if (Array.isArray(line.Serials)) {
          line.Serials.forEach((serial) => {
            const val = Number(serial.DAGCost)
            initialTotalCost += Number.isNaN(val) ? 0 : val
          })
        }
      })
    }

    // 1. Update the main DAG record
    const updatedDag = dagRepo.updateDAG(normalizedId, {
      ...data,
      TotalDAGCost: initialTotalCost,
    })

    if (data.WalkinCustomer) {
      const existing = dagWalkinLinkRepo.getWalkinCustomerForDag(normalizedId)
      if (existing) {
        walkinCustomerRepo.updateWalkinCustomer(existing.ID, data.WalkinCustomer)
      } else {
        const wc = walkinCustomerRepo.createWalkinCustomer(data.WalkinCustomer)
        dagWalkinLinkRepo.linkDagToWalkinCustomer(normalizedId, wc.ID)
      }
    } else {
      dagWalkinLinkRepo.unlinkDagWalkin(normalizedId)
    }

    // 2. Cleanup existing child records to prepare for replacement
    const existingTyreLines = dagTyresRepo.getDAGTyresByDAGId(normalizedId)
    existingTyreLines.forEach((tyreLine) => {
      const tyreLineId = tyreLine.ID || tyreLine.Id

      // Get linked storage manager records via the link table
      let links
      try {
        links = dagTyreStorageService.getDagTyreStoragesByDagTyresId(tyreLineId)
      } catch (error) {
        console.error(`Failed to fetch storage links for DAG tyre ${tyreLineId}`, error)
        throw error
      }

      links.forEach((link) => {
        try {
          dagTyreStorageService.deleteDagTyreStorage(link.ID || link.Id)
        } catch (error) {
          console.error(`Failed to delete dag tyre storage ${link.ID || link.Id}`, error)
          throw error
        }
        try {
          storageManagerService.deleteStorageManager(link.StorageManagerID)
        } catch (error) {
          console.error(`Failed to delete storage manager ${link.StorageManagerID}`, error)
          throw error
        }
      })

      // Delete associated serial numbers
      dagTyresSerialsRepo.deleteDAGTyresSerialsByDAGTyresId(tyreLineId)
    })

    // Delete the tyre lines themselves
    dagTyresRepo.deleteDAGTyresByDAGId(normalizedId)

    // 3. Recreate child records from the payload (matching createDAGWithTyres logic)
    const tyres = data.Tyres.map((line) => {
      const createdTyre = dagTyresRepo.createDAGTyre({
        DAGID: updatedDag.ID,
        TyreID: line.TyreID,
        StorageLocationID: line.StorageLocationID,
        Qty: line.Qty,
      })

      const dagTyresId = createdTyre.ID || createdTyre.Id

      line.Serials.forEach((serial) => {
        dagTyresSerialsRepo.createDAGTyresSerial({
          DAGTyresID: dagTyresId,
          SerialNumber: serial.SerialNumber,
          DAGCost: serial.DAGCost ?? 0,
        })
      })

      let smRecord
      try {
        smRecord = storageManagerService.createStorageManager({
          TyreId: line.TyreID,
          LocationID: line.StorageLocationID,
          Qty: line.Qty,
          SourceTypeId: getStorageSourceId("DAG"),
          SourceId: updatedDag.ID,
        })
      } catch (error) {
        console.error(`Failed to create storage manager for DAG tyre line (TyreID: ${line.TyreID})`, error)
        throw error
      }

      try {
        dagTyreStorageService.createDagTyreStorage({
          DAGTyresID: dagTyresId,
          StorageManagerID: smRecord.Id || smRecord.ID,
        })
      } catch (error) {
        console.error(`Failed to create dag tyre storage link (DAGTyresID: ${dagTyresId})`, error)
        throw error
      }

      return createdTyre
    })

    return { dag: updatedDag, tyres }
  })

  return updateTransaction()
}

/**
 * Step 1 of 2: allocates a contractor to a DAG. The allocation row is created
 * pending (ApprovalStatus NULL) and the contractor is approved or rejected later
 * via `updateDAGContractorApproval`, mirroring how PO supplier allocation
 * writes a NULL PoTyresSuppliers.IsApproved at allocation time.
 *
 * Deliberately uses the targeted `dagRepo.updateDAG` with the current record
 * spread in, NOT the service-level `updateDAG` above. That one rebuilds every
 * child row (tyre lines, serials, storage links) and deletes the
 * StorageManager records behind them, so routing a contractor change through
 * it would destroy stock data and reset TotalDAGCost / IsPaymentCompleted.
 *
 * @param {number} id DAG id
 * @param {{ ContractorID:number }} payload
 */
exports.assignContractor = (id, payload = {}) => {
  const normalizedId = normalizeId(id, "ID")
  const contractorId = normalizeId(payload.ContractorID, "ContractorID")

  const assignTransaction = db.transaction(() => {
    const current = dagRepo.getDAGById(normalizedId)

    if (!current) {
      throw new Error("DAG not found")
    }

    // Once the gate pass has been issued the contractor is bound to the stock
    // movement, so reassignment must not silently rewrite history.
    if (current.StatusID !== getPendingStatusId()) {
      throw new Error("Contractor can only be assigned while the DAG is pending")
    }

    assertContractorExists(contractorId)

    dagRepo.updateDAG(normalizedId, { ...current, ContractorID: contractorId })

    return dagContractorApprovalRepo.createDAGContractorApproval({
      DAGID: normalizedId,
      ContractorID: contractorId,
    })
  })

  return assignTransaction()
}

/**
 * Step 2 of 2: records the approve/reject decision against a pending
 * allocation. Narrow and separate from assignment, matching
 * poTyresSuppliersService.updateApprovalById.
 *
 * The decision is guarded on ApprovalStatus IS NULL, so an already-decided
 * approval cannot be re-decided: to change the outcome, allocate again.
 *
 * @param {number} approvalId DAGContractorApprovals row id
 * @param {string} approvalStatus 'approved' | 'rejected'
 * @param {{ user?:{ id:number } }} ctx injected by registerServiceHandler
 */
exports.updateDAGContractorApproval = (approvalId, approvalStatus, ctx) => {
  const normalizedApprovalId = normalizeId(approvalId, "approvalId")
  const normalizedStatus = normalizeApprovalStatus(approvalStatus)
  const capturedBy = normalizeOptionalId(ctx?.user?.id, "ctx.user.id")

  const approvalTransaction = db.transaction(() => {
    const current = dagContractorApprovalRepo.getDAGContractorApprovalById(normalizedApprovalId)

    if (!current) {
      throw new Error("DAG contractor approval not found")
    }

    if (current.ApprovalStatus !== null && current.ApprovalStatus !== undefined) {
      throw new Error("Contractor approval has already been decided")
    }

    const result = dagContractorApprovalRepo.updateDAGContractorApprovalStatus(
      normalizedApprovalId,
      normalizedStatus,
      localDateTimeStamp(),
      capturedBy,
    )

    if (result.changes === 0) {
      throw new Error("Contractor approval has already been decided")
    }

    return result.approval
  })

  return approvalTransaction()
}

exports.getDAGContractorApprovals = (id) => {
  const normalizedId = normalizeId(id, "ID")

  const current = dagRepo.getDAGById(normalizedId)
  if (!current) {
    throw new Error("DAG not found")
  }

  return dagContractorApprovalRepo.getDAGContractorApprovalsByDAGId(normalizedId)
}

exports.deleteDAG = (id) => {
  const normalizedId = normalizeId(id, "ID")
  

  const deleteTransaction = db.transaction(() => {
    // Get all DAGTyres for this DAG to delete their child records
    const dagTyres = dagTyresRepo.getDAGTyresByDAGId(normalizedId)

    // Sales reference serials, so clear them before the serials themselves.
    dagSalesRepo.deleteDAGSalesByDAGId(normalizedId)

    // Delete child records first (before deleting DAGTyres)
    dagTyres.forEach(dagTyre => {
      dagTyresSerialsRepo.deleteDAGTyresSerialsByDAGTyresId(dagTyre.ID)
      dagTyreStorageRepo.deleteDagTyreStorageByDagTyresId(dagTyre.ID)
    })
    
    // Now delete DAGTyres
    dagTyresRepo.deleteDAGTyresByDAGId(normalizedId)
    dagGatePassRepo.deleteDAGGatePassByDAGId(normalizedId)
    dagContractorApprovalRepo.deleteDAGContractorApprovalsByDAGId(normalizedId)
    dagPaymentRepo.deleteDAGPaymentsByDAGId(normalizedId)

    dagWalkinLinkRepo.unlinkDagWalkin(normalizedId)
    const result = dagRepo.deleteDAG(normalizedId)
    
    if (result.changes === 0) {
      throw new Error("DAG not found")
    }
    
    return { success: true }
  })

  return deleteTransaction()
}

exports.updateDAGTyreSerialCost = (id, cost) => {
  const normalizedId = normalizeId(id, "ID")
  const normalizedCost = normalizeOptionalCost(cost, "DAGCost")

  const serialRecord = dagTyresSerialsRepo.getDAGTyresSerialById(normalizedId)
  if (!serialRecord) {
    throw new Error("DAG tyre serial not found")
  }

  const dagTyre = dagTyresRepo.getDAGTyreById(serialRecord.DAGTyresID)
  if (!dagTyre) {
    throw new Error("Associated DAG tyre line not found")
  }

  const dag = dagRepo.getDAGById(dagTyre.DAGID)
  if (!dag) {
    throw new Error("Associated DAG not found")
  }

  const updateTransaction = db.transaction(() => {
    const updatedSerial = dagTyresSerialsRepo.updateDAGTyresSerial(normalizedId, {
      DAGTyresID: serialRecord.DAGTyresID,
      SerialNumber: serialRecord.SerialNumber,
      DAGCost: normalizedCost,
    })

    if (!updatedSerial) {
      throw new Error("Failed to update DAG tyre serial cost")
    }

    const totalCost = calculateTotalDAGCost(dagTyre.DAGID)
    const updatedDag = dagRepo.updateDAG(dagTyre.DAGID, {
      ...dag,
      TotalDAGCost: totalCost,
    })

    if (!updatedDag) {
      throw new Error("Failed to update total DAG cost")
    }

    return {
      dag: updatedDag,
      serial: updatedSerial,
    }
  })

  return updateTransaction()
}

/**
 * Records a "take": the customer collects one or more serials and pays for
 * exactly those. Payment is mandatory and must cover the selected serials' cost
 * (a zero-cost selection is taken without a payment). When the last serial is
 * taken the DAG is moved to COMPLETED.
 *
 * @param {number} id DAG id
 * @param {{ SerialIds: number[], Payment?: object }} payload
 * @param {{ user?:{ id:number } }} ctx injected by registerServiceHandler
 */
exports.sellDAGTyres = (id, payload = {}, ctx) => {
  const normalizedId = normalizeId(id, "ID")
  const dag = dagRepo.getDAGById(normalizedId)

  if (!dag) {
    throw new Error("DAG not found")
  }

  const serialIds = normalizeSerialIds(payload.SerialIds)
  const payment = normalizePaymentPayload(payload.Payment)

  // Validate every selection up front so the transaction never starts on a bad
  // input, and so a serial from another DAG cannot be smuggled in by id.
  const selections = serialIds.map((serialId) => {
    const serial = dagTyresSerialsRepo.getDAGTyresSerialById(serialId)

    if (!serial) {
      throw new Error(`DAG tyre serial ${serialId} not found`)
    }

    const dagTyre = dagTyresRepo.getDAGTyreById(serial.DAGTyresID)

    if (!dagTyre) {
      throw new Error(`DAG tyre line for serial ${serialId} not found`)
    }

    if (Number(dagTyre.DAGID) !== normalizedId) {
      throw new Error("A selected serial does not belong to this DAG")
    }

    if (serial.SoldAt) {
      throw new Error(`Serial ${serial.SerialNumber || serialId} has already been taken`)
    }

    return { serial, dagTyre }
  })

  const selectionCost = selections.reduce((sum, item) => {
    const value = Number(item.serial.DAGCost)
    return sum + (Number.isNaN(value) ? 0 : value)
  }, 0)

  const hasPayment = !!(payment && (payment.CashPayment || payment.ChequePayment || payment.BankTransferPayment))

  if (selectionCost > 0) {
    if (!hasPayment) {
      throw new Error("Payment for the selected tyres is required")
    }

    const provided = calculateNominalPaymentAmount(payment)

    if (provided < selectionCost - 0.01) {
      throw new Error(
        `Payment must cover the selected tyres (required ${selectionCost.toFixed(2)}, provided ${provided.toFixed(2)})`
      )
    }
  }

  const soldBy = ctx?.user?.id ?? null

  const sellTransaction = db.transaction(() => {
    const paymentId = selectionCost > 0 && hasPayment
      ? createTakePayment(normalizedId, payment)
      : null

    const sale = dagSalesRepo.createDAGSale({
      DAGID: normalizedId,
      PaymentID: paymentId,
      SoldDate: localDateTimeStamp(),
      SoldBy: soldBy,
    })

    for (const { serial, dagTyre } of selections) {
      const marked = dagTyresSerialsRepo.markDAGTyresSerialSold(serial.ID, {
        SoldAt: localDateTimeStamp(),
        SoldBy: soldBy,
      })

      if (!marked) {
        throw new Error(`Serial ${serial.SerialNumber || serial.ID} has already been taken`)
      }

      dagSalesRepo.createDAGSaleLine({
        DAGSaleID: sale.ID,
        DAGTyresID: dagTyre.ID,
        DAGTyresSerialID: serial.ID,
        Amount: Number(serial.DAGCost) || 0,
      })
    }

    // The DAG is complete once every serial has left, regardless of the order in
    // which the takes happened.
    const allSerials = dagTyresSerialsRepo.getDAGTyresSerialsByDAGId(normalizedId)
    const completed = allSerials.length > 0 && allSerials.every((item) => !!item.SoldAt)

    const updatedDag = completed
      ? dagRepo.updateDAG(normalizedId, { ...dag, StatusID: getCompletedStatusId() })
      : dag

    return {
      success: true,
      saleId: sale.ID,
      soldCount: selections.length,
      soldAmount: selectionCost,
      completed,
      dag: updatedDag,
    }
  })

  const result = sellTransaction()
  invoiceSettlementService.syncInvoiceSettlementsForDAG(normalizedId)

  try {
    invoiceService.generateInvoiceFromDAG(normalizedId, ctx)
  } catch (invoiceError) {
    console.error(`Failed to auto-generate invoice for DAG ${normalizedId}:`, invoiceError)
  }

  return result
}

/**
 * Marks a specific cheque payment as collected and updates the DAG's overall payment status.
 */
exports.completeChequePayment = (dagId, paymentId, ctx) => {
  const completePaymentTransaction = db.transaction(() => {
    const normalizedDagId = normalizeId(dagId, "ID")
    const normalizedPaymentId = normalizeId(paymentId, "PaymentID")

    const existingDag = dagRepo.getDAGById(normalizedDagId)
    if (!existingDag) {
      throw new Error("DAG not found")
    }

    const dagPayments = dagPaymentRepo.getDAGPaymentsByDAGId(normalizedDagId)
    const isLinked = dagPayments.some((p) => p.PaymentID === normalizedPaymentId)
    if (!isLinked) {
      throw new Error("Cheque payment not found for this DAG")
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

    // Re-fetch detailed DAG to recalculate settled amount with collected cheque
    const updatedDag = exports.getDetailedDAGById(normalizedDagId)

    if (existingDag.IsPaymentCompleted !== updatedDag.IsPaymentCompleted) {
      dagRepo.updateDAG(normalizedDagId, {
        ...existingDag,
        IsPaymentCompleted: updatedDag.IsPaymentCompleted,
      })
    }

    return {
      success: true,
      dagId: normalizedDagId,
      paymentId: normalizedPaymentId,
      isPaymentCompleted: updatedDag.IsPaymentCompleted,
    }
  })

  const result = completePaymentTransaction()
  invoiceSettlementService.syncInvoiceSettlementsForDAG(dagId)
  return result
}

exports.processPayments = processPayments
