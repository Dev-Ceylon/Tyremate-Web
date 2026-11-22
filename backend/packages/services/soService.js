const db = require("../database/connection")
const soRepo = require("../repositories/soRepository")
const tyreRepo = require("../repositories/tyreRepository")
const soCustomerRepo = require("../repositories/soCustomerRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const soBatteriesRepo = require("../repositories/soBatteriesRepository")
const poRepo = require("../repositories/poRepository")
const poService = require("./poService")
const goodsReceiptRepo = require("../repositories/goodsReceiptRepository")
const poTyresRepo = require("../repositories/poTyresRepository")
const poBatteriesRepo = require("../repositories/poBatteriesRepository")
const poTyresSuppliersRepo = require("../repositories/poTyresSuppliersRepository")
const poTyreAllocationsRepo = require("../repositories/poTyreAllocationsRepository")
const storageManagerRepo = require("../repositories/storageManagerRepository")
const storageManagerBatchRepo = require("../repositories/storageManagerBatchRepository")
const storageManagerService = require("./storageManagerService")
const batteryStorageManagerRepo = require("../repositories/batteryStorageManagerRepository")
const batteryStorageManagerBatchRepo = require("../repositories/batteryStorageManagerBatchRepository")
const batteryRepo = require("../repositories/batteryRepository")
const soAllocationRepo = require("../repositories/soTyreStorageAllocationRepository")
const soBatteryAllocationRepo = require("../repositories/soBatteryStorageAllocationRepository")
const { SO_CATEGORIES } = require("../constants/soCategoryConstants")
const soDeliveryRepo = require("../repositories/soDeliveryRepository")
const soDeliveryLineRepo = require("../repositories/soDeliveryLineRepository")
const manufactureOrderRepo = require("../repositories/manufactureOrderRepository")
const paymentRepo = require("../repositories/paymentRepository")
const soPaymentRepo = require("../repositories/soPaymentRepository")
const invoicePaymentLinkRepo = require("../repositories/invoicePaymentLinkRepository")
const invoiceSettlementService = require("./invoiceSettlementService")
const invoiceService = require("./invoiceService")
const cashPaymentRepo = require("../repositories/cashPaymentRepository")
const chequePaymentRepo = require("../repositories/chequePaymentRepository")
const chequePaymentReceiptRepo = require("../repositories/chequePaymentReceiptRepository")
const bankTransferPaymentService = require("./bankTransferPaymentService")
const soTyreReturnService = require("./soTyreReturnService")
const salesReturnService = require("./salesReturnService")
const inquirySoService = require("./inquirySoService")
const soTyreReturnRepo = require("../repositories/soTyreReturnRepository")
const salesReturnRepo = require("../repositories/salesReturnRepository")
const soReminderRepo = require("../repositories/soReminderRepository")
const inquiryRepo = require("../repositories/inquiryRepository")
const { PAYMENT_TYPE_CODES, PAYMENT_TYPE_NAMES } = require("../constants/paymentTypeConstants")
const { STATUS_CODES, getStatusId, getStatusIdByCode } = require("../constants/statusConstants")
const reminderRepo = require("../repositories/reminderRepository");
const paymentProcessingService = require("./paymentProcessingService")
const {
  calculateSettledAmount,
  calculateSettledAmountFromAggregatedPaymentsArray,
  normalizePaymentPayload,
} = paymentProcessingService
const soAuditLogService = require("./soAuditLogService");
const { AUDIT_ACTIONS } = require("../constants/auditActionConstants");
const walkinCustomerRepo = require("../repositories/walkinCustomerRepository");
const soWalkinLinkRepo = require("../repositories/soWalkinLinkRepository");
const { normalizePhone, normalizeEmail } = require("../validation");
const paymentReceiptService = require("../../apps/electron/services/PaymentReceiptService");
const soPolicyViolationRepo = require("../repositories/soPolicyViolationRepository");
const { POLICY_VIOLATION_CODES } = require("../constants/policyViolationConstants");

const buildSOGatePassNo = (soId, deliveryId) =>
  `SO-${soId}-GP-${String(deliveryId).padStart(4, "0")}`

/**
 * A gate pass authorises the warehouse to release goods, so it is never a side
 * effect of creating a delivery. It is issued only when the customer's settled
 * payments cover the value of every delivery handed over up to and including
 * this one. Cheques count only once collected, because
 * calculateSettledAmountFromAggregatedPaymentsArray excludes uncleared ones.
 *
 * Coverage is cumulative on purpose: goods leave in the order the deliveries
 * were recorded, so payment for the first hand-over must not also release the
 * second one.
 */
const GATE_PASS_TOLERANCE = 0.01

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100

const formatMoney = (value) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const getDeliveryValue = (delivery) =>
  (delivery?.Lines ?? []).reduce((sum, line) => sum + (Number(line.Amount) || 0), 0)

const getSettledAmountForSo = (soId) =>
  calculateSettledAmountFromAggregatedPaymentsArray(exports.getSOById(soId).Payments)

const issueSOGatePass = (delivery, ctx, paymentOverride = false, overrideShortfall = 0) => {
  if (delivery.GatePassNo && String(delivery.GatePassNo).trim()) return delivery

  return soDeliveryRepo.setGatePassNo(
    delivery.ID,
    buildSOGatePassNo(delivery.SoID, delivery.ID),
    ctx?.user?.id ?? null,
    paymentOverride,
    overrideShortfall,
  )
}

/**
 * Adds the gate-pass state to every delivery of a sales order. The renderer
 * reads this instead of recomputing money, so the UI and the service can never
 * disagree about whether goods may leave.
 */
const decorateDeliveriesWithGatePass = (soId) => {
  const deliveries = soDeliveryRepo.getDeliveriesWithLinesBySoId(soId)
  const settledAmount = roundMoney(getSettledAmountForSo(soId))

  let requiredCoverage = 0
  const eligibilityByDelivery = new Map()

  deliveries
    .slice()
    .sort((a, b) => a.ID - b.ID)
    .forEach((delivery) => {
      requiredCoverage = roundMoney(requiredCoverage + getDeliveryValue(delivery))

      const issued = Boolean(delivery.GatePassNo && String(delivery.GatePassNo).trim())
      const shortfall = roundMoney(Math.max(0, requiredCoverage - settledAmount))

      eligibilityByDelivery.set(delivery.ID, {
        Issued: issued,
        CanIssue: issued || shortfall <= GATE_PASS_TOLERANCE,
        SettledAmount: settledAmount,
        RequiredCoverage: requiredCoverage,
        Shortfall: shortfall,
      })
    })

  return deliveries.map((delivery) => ({
    ...delivery,
    GatePass: eligibilityByDelivery.get(delivery.ID),
  }))
}

const decorateDeliveryWithGatePass = (soId, deliveryId) =>
  decorateDeliveriesWithGatePass(soId).find((delivery) => delivery.ID === deliveryId) ?? null

/**
 * Issues the pass when the hand-over is already covered, otherwise leaves it
 * pending. Called right after a delivery is written and after every payment.
 */
const maybeIssueGatePass = (delivery, ctx) => {
  const decorated = decorateDeliveryWithGatePass(delivery.SoID, delivery.ID)

  if (!decorated?.GatePass?.CanIssue) return delivery

  return issueSOGatePass(delivery, ctx)
}

/**
 * Drains qty from a storage batch. The batch record is always kept (never
 * deleted), even when fully consumed, so its history is preserved. Returns the
 * batch id so the drained allocation always references a live batch row.
 */
const deductBatchQty = (batch, deductQty) => {
  const remaining = Math.max(Number(batch?.Qty ?? 0) - deductQty, 0)

  storageManagerBatchRepo.updateStorageManagerBatch(batch.Id, {
    DOT: batch.DOT,
    Qty: remaining,
  })

  return batch.Id
}

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

const getLocalDateString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

const normalizeSOId = (soId) => {
  const parsedId = Number(soId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("Valid SO id is required")
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
 * Calculates the total payable amount for the sales order based on lines.
 */
const calculatePayableTotal = (lines) => {
  return lines.reduce((total, line) => {
    const price = line.Price || 0
    const qty = line.Qty || 0
    const discount = line.Discount || 0
    return total + (price * qty * (1 - discount / 100.0))
  }, 0)
}

/**
 * Value of the tyres leaving on a hand-over, for the given quantity. Kept raw
 * (no rounding) so line amounts sum consistently across a delivery.
 */
const calculateDeliveredLineAmount = (soTyre, qty) => {
  const price = Number(soTyre?.Price) || 0
  const discount = Number(soTyre?.Discount) || 0
  return price * qty * (1 - discount / 100)
}

const deriveIsPaymentCompleted = (lines, payment) => {
  const payableTotal = calculatePayableTotal(lines)
  const settledAmount = calculateSettledAmount(payment)
  
  // Check if settled amount covers the total (with small precision allowance)
  return settledAmount >= (payableTotal - 0.01) ? 1 : 0
}

const collectInquiryIds = (payload = {}) => {
  const raw = []
  if (payload.InquiryID !== undefined && payload.InquiryID !== null && payload.InquiryID !== "") {
    raw.push(payload.InquiryID)
  }
  if (Array.isArray(payload.InquiryIDs)) {
    raw.push(...payload.InquiryIDs)
  }

  return [...new Set(
    raw
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  )]
}

const toSOPayload = (payload = {}) => {
  return {
    Date: normalizeDate(payload.Date, "Date"),
    Category: payload.Category || "tyre",
    IsAdminApproved: normalizeBooleanFlag(payload.IsAdminApproved, "IsAdminApproved"),
    IsCompleted: normalizeBooleanFlag(payload.IsCompleted, "IsCompleted"),
    IsPaymentCompleted: normalizeBooleanFlag(payload.IsPaymentCompleted, "IsPaymentCompleted")
  }
}

const toSalesOrderCreatePayload = (payload = {}) => {
  const so = toSOPayload(payload)
  const isBattery = so.Category === "battery"
  const customerId = payload.CustomerID ? normalizePositiveId(payload.CustomerID, "CustomerID") : null
  const linesInput = Array.isArray(payload.Lines) ? payload.Lines : []

  const payment = normalizePaymentPayload(payload.Payment);

  if (linesInput.length === 0) {
    throw new Error("At least one sales order line is required")
  }

  if (!customerId && !payload.CustomerName) {
    throw new Error("Either CustomerID or CustomerName is required")
  }

  const walkinCustomer = !customerId
    ? {
        CustomerName: normalizeRequiredText(payload.CustomerName, "Customer name"),
        CustomerPhone: normalizePhone(payload.CustomerPhone),
        CustomerAddress: normalizeRequiredText(payload.CustomerAddress, "Customer address"),
        CustomerEmail: normalizeEmail(payload.CustomerEmail),
        VehicleNumber: normalizeText(payload.VehicleNumber),
        TinNo: normalizeText(payload.TinNo),
        VatNo: normalizeText(payload.VatNo),
      }
    : null

  const lines = linesInput.map((line, index) => {
    const row = index + 1
    const allocationsInput = Array.isArray(line?.Allocations) ? line.Allocations : []

    if (allocationsInput.length === 0) {
      throw new Error(`At least one allocation is required on line ${row}`)
    }

    const allocations = allocationsInput.map((allocation, allocationIndex) => {
      const allocationRow = allocationIndex + 1
      const allocationQty = normalizeInteger(allocation?.Qty, `Qty in allocation ${allocationRow} on line ${row}`)

      if (allocationQty <= 0) {
        throw new Error(`Allocation Qty must be greater than 0 on line ${row}`)
      }

      const storageManagerId = allocation?.StorageManagerID ?? allocation?.BatteryStorageManagerID
      const storageManagerBatchId = allocation?.StorageManagerBatchID ?? allocation?.BatteryStorageManagerBatchID

      // Per-lot take-now: how many of this allocation the customer collects at
      // creation. null means "not specified" (the line-level TakeNowQty rules apply).
      const allocationTakeNowRaw = allocation?.TakeNowQty
      const allocationTakeNowQty =
        allocationTakeNowRaw === undefined || allocationTakeNowRaw === null || allocationTakeNowRaw === ""
          ? null
          : normalizeInteger(allocationTakeNowRaw, `TakeNowQty in allocation ${allocationRow} on line ${row}`)

      if (allocationTakeNowQty !== null && allocationTakeNowQty < 0) {
        throw new Error(`Allocation TakeNowQty cannot be negative on line ${row}`)
      }

      if (allocationTakeNowQty !== null && allocationTakeNowQty > allocationQty) {
        throw new Error(
          `Allocation TakeNowQty (${allocationTakeNowQty}) cannot exceed its Qty (${allocationQty}) on line ${row}`,
        )
      }

      return {
        StorageManagerID:
          storageManagerId === undefined || storageManagerId === null || storageManagerId === ""
            ? null
            : normalizePositiveId(storageManagerId, `StorageManagerID in allocation ${allocationRow} on line ${row}`),
        StorageManagerBatchID:
          storageManagerBatchId === undefined || storageManagerBatchId === null || storageManagerBatchId === ""
            ? null
            : normalizePositiveId(storageManagerBatchId, `StorageManagerBatchID in allocation ${allocationRow} on line ${row}`),
        Qty: allocationQty,
        TakeNowQty: allocationTakeNowQty,
      }
    })

    const qty = allocations.reduce((sum, allocation) => sum + allocation.Qty, 0)

    // How many of this line's reserved items the customer takes at creation.
    // null means "auto" = everything that is in stock (the form's default).
    const takeNowRaw = line?.TakeNowQty
    const takeNowQty =
      takeNowRaw === undefined || takeNowRaw === null || takeNowRaw === ""
        ? null
        : normalizeInteger(takeNowRaw, `TakeNowQty on line ${row}`)

    if (takeNowQty !== null && takeNowQty < 0) {
      throw new Error(`TakeNowQty cannot be negative on line ${row}`)
    }

    return {
      TyreID: !isBattery ? normalizePositiveId(line?.TyreID, `TyreID on line ${row}`) : null,
      BatteryID: isBattery ? normalizePositiveId(line?.BatteryID, `BatteryID on line ${row}`) : null,
      Price: normalizeNumber(line?.Price, `Price on line ${row}`),
      Discount: normalizeNumber(line?.Discount, `Discount on line ${row}`),
      Qty: qty,
      Allocations: allocations,
      NeedToOrderQty: normalizeInteger(line?.NeedToOrderQty, `NeedToOrderQty on line ${row}`),
      TakeNowQty: takeNowQty,
      IsAdminApproved: normalizeBooleanFlag(line?.IsAdminApproved, `IsAdminApproved on line ${row}`),
    }
  })

  return {
    ...so,
    CustomerID: customerId,
    WalkinCustomer: walkinCustomer,
    Payment: payment,
    Lines: lines,
  }
}
 
/**
 * Processes and saves payment information for a Sales Order.
 * Internal helper used within create transactions. Returns the created
 * payments so callers can settle linked invoices in the same transaction.
 */
const processSOPayment = (soId, paymentData) => {
  if (!paymentData) return []

  return paymentProcessingService.createPaymentsForPaymentData(paymentData, (payment) => {
    // Link the Sales Order to the generic Payment via SOPayments
    soPaymentRepo.createSOPayment({
      SoID: soId,
      PaymentID: payment.PaymentID
    })
  })
}

exports.getSOs = (category) => {
  return soRepo.getAllSOs(category)
}

exports.getTodaySalesSummary = (date) => {
  const normalizedDate = normalizeDate(date, "Date")
  return soRepo.getTodaySalesSummary(normalizedDate)
}

exports.getSalesTrendSummary = (fromDate, toDate) => {
  const normalizedFromDate = normalizeDate(fromDate, "fromDate")
  const normalizedToDate = normalizeDate(toDate, "toDate")

  if (normalizedToDate < normalizedFromDate) {
    throw new Error("toDate must be greater than or equal to fromDate")
  }

  return soRepo.getSalesTrendSummary(normalizedFromDate, normalizedToDate)
}

exports.getSOById = (soId) => {
  const normalizedId = normalizeSOId(soId)
  const so = soRepo.getSOById(normalizedId)

  if (!so) {
    throw new Error("SO not found")
  }

  const isBattery = (so.Category || "tyre") === "battery"

  let po = poRepo.getPOBySoId(normalizedId)

  if (po && !isBattery) {
    poService.allocateArrivedStockToSo(normalizedId, po.ID)
  }

  const tyres = !isBattery ? (soTyresRepo.getSoTyresBySoId?.(normalizedId) || []) : []
  const batteries = isBattery ? (soBatteriesRepo.getSoBatteriesBySoId?.(normalizedId) || []) : []

  if (po) {
    const arrivedStatusId = getStatusIdByCode(STATUS_CODES.ARRIVED);
    const completedStatusId = getStatusIdByCode(STATUS_CODES.COMPLETED);
    const isPOArrived = po.StatusID === arrivedStatusId || po.StatusID === completedStatusId;

    if (isBattery) {
      const poBatteryLines = (poBatteriesRepo.getPoBatteriesByPoId(po.ID) || []).map((pBat) => {
        const receivedQty = goodsReceiptRepo.getPostedAcceptedQtyByPoBatteriesId?.(pBat.ID || pBat.Id) || 0
        const orderedQty = Number(pBat.Qty || 0)
        return {
          ...pBat,
          ReceivedQty: receivedQty,
          PendingQty: Math.max(0, orderedQty - receivedQty),
        }
      })

      const totalOrdered = poBatteryLines.reduce((sum, b) => sum + Number(b.Qty || 0), 0)
      const totalReceived = poBatteryLines.reduce((sum, b) => sum + Number(b.ReceivedQty || 0), 0)
      const isPartiallyReceived = totalReceived > 0 && totalReceived < totalOrdered

      po = {
        ...po,
        Batteries: poBatteryLines,
        IsPOArrived: isPOArrived,
        IsPartiallyReceived: isPartiallyReceived,
        TotalOrdered: totalOrdered,
        TotalReceived: totalReceived,
      }
    } else {
      const poTyreLines = (poTyresRepo.getPoTyresByPoId(po.ID) || []).map((pTyre) => {
        const receivedQty = goodsReceiptRepo.getPostedAcceptedQtyByPoTyresId(pTyre.ID || pTyre.Id) || 0
        const orderedQty = Number(pTyre.Qty || 0)
        return {
          ...pTyre,
          ReceivedQty: receivedQty,
          PendingQty: Math.max(0, orderedQty - receivedQty),
        }
      })

      const totalOrdered = poTyreLines.reduce((sum, t) => sum + Number(t.Qty || 0), 0)
      const totalReceived = poTyreLines.reduce((sum, t) => sum + Number(t.ReceivedQty || 0), 0)
      const isPartiallyReceived = totalReceived > 0 && totalReceived < totalOrdered

      po = {
        ...po,
        Tyres: poTyreLines,
        IsPOArrived: isPOArrived,
        IsPartiallyReceived: isPartiallyReceived,
        TotalOrdered: totalOrdered,
        TotalReceived: totalReceived,
      }
    }
  }

  const soPayments = soPaymentRepo.getSOPaymentsBySoId(normalizedId)
  const paymentsDetails = []

  for (const soPayment of soPayments) {
    // soPayment now contains SoID and PaymentID (the generic payment ID)
    const genericPaymentId = soPayment.PaymentID
    let paymentTypeCode = null
    let paymentTypeName = null
    let paymentAmount = 0

    // Initialize payment item structure
    const paymentItem = {
      PaymentID: genericPaymentId,
      PaymentTypeCode: null,
      PaymentTypeName: null,
      Amount: 0,
      CreatedAt: paymentRepo.getPaymentById(genericPaymentId)?.CreatedDate ?? null,
    }
    const invoiceLinks = invoicePaymentLinkRepo.getLinksByPaymentId(genericPaymentId)
    if (invoiceLinks.length > 0) {
      paymentItem.Invoices = invoiceLinks.map((link) => ({
        InvoiceID: link.InvoiceID,
        InvoiceNumber: link.InvoiceNumber,
      }))
    }

    // Try to determine payment type from specific payment tables using the generic PaymentID
    const cashPayment = cashPaymentRepo.getCashPaymentByPaymentId(genericPaymentId)
    if (cashPayment) {
      paymentTypeCode = PAYMENT_TYPE_CODES.CASH
      paymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CASH]
      paymentAmount = (cashPayment.AmountReceived || 0) - (cashPayment.BalanceToReturn || 0)
      paymentItem.PaidAmount = cashPayment.AmountReceived
      paymentItem.BalanceAmount = cashPayment.BalanceToReturn
      paymentItem.ReceiptPath = cashPayment.ReceiptPath || null
      paymentItem.ReceiptEncIV = cashPayment.ReceiptEncIV || null
      paymentItem.ReceiptEncAuthTag = cashPayment.ReceiptEncAuthTag || null
      paymentItem.ReceiptEncKey = cashPayment.ReceiptEncKey || null
    } else {
      const chequePayment = chequePaymentRepo.getChequePaymentByPaymentId(genericPaymentId)
      if (chequePayment) {
        paymentTypeCode = PAYMENT_TYPE_CODES.CHEQUE
        paymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.CHEQUE]
        paymentAmount = chequePayment.Amount || 0
        paymentItem.ReferenceNumber = chequePayment.ChequeNumber
        paymentItem.PaymentDate = chequePayment.ChequeDate
        paymentItem.BankName = chequePayment.BankName
        paymentItem.Collected = chequePayment.Collected ?? 0
        paymentItem.Receipts = chequePaymentReceiptRepo.getChequePaymentReceiptsByChequePaymentId(chequePayment.ID)
      } else {
        let bankTransferPayment = null
        try {
          bankTransferPayment = bankTransferPaymentService.getBankTransferPaymentByPaymentId(genericPaymentId)
        } catch (error) {
          console.error(`Failed to fetch bank transfer payment for PaymentID ${genericPaymentId}`, error)
        }
        if (bankTransferPayment) {
          paymentTypeCode = PAYMENT_TYPE_CODES.BANK_TRANSFER
          paymentTypeName = PAYMENT_TYPE_NAMES[PAYMENT_TYPE_CODES.BANK_TRANSFER]
          paymentAmount = bankTransferPayment.Amount || 0
          paymentItem.ReferenceNumber = `Ref ID: ${bankTransferPayment.BankDetailsID}`
          paymentItem.ReceiptPath = bankTransferPayment.ReceiptPath || null
          paymentItem.ReceiptEncIV = bankTransferPayment.ReceiptEncIV || null
          paymentItem.ReceiptEncAuthTag = bankTransferPayment.ReceiptEncAuthTag || null
          paymentItem.ReceiptEncKey = bankTransferPayment.ReceiptEncKey || null
        }
      }
    }

    if (!paymentTypeCode) {
      console.warn(`Unknown payment type for generic PaymentID: ${genericPaymentId}`)
      continue // Skip this payment if type cannot be determined
    }

    paymentItem.PaymentTypeCode = paymentTypeCode
    paymentItem.PaymentTypeName = paymentTypeName
    paymentItem.Amount = paymentAmount

    paymentsDetails.push(paymentItem)
  }

  let returns = []
  let salesReturns = []
  try {
    returns = soTyreReturnService.getReturnsBySoId(normalizedId)
    salesReturns = salesReturnRepo.getSalesReturnsBySoId(normalizedId)
  } catch (error) {
    console.error(`Failed to fetch return history for SO ${normalizedId}`, error)
  }

  const settledAmount = calculateSettledAmountFromAggregatedPaymentsArray(paymentsDetails)
  const netTotal = calculatePayableTotal(isBattery ? batteries : tyres)

  const walkinCustomer = soWalkinLinkRepo.getWalkinCustomerForSo(normalizedId)

  return {
    ...so,
    Category: so.Category || "tyre",
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
          CustomerName: so.CustomerName,
          CustomerCode: so.CustomerCode,
        },
    Tyres: tyres,
    Batteries: batteries,
    PO: po || null,
    Payments: paymentsDetails,
    Returns: returns,
    SalesReturns: salesReturns,
    RemainingAmount: Math.max(0, netTotal - settledAmount),
    LinkedInquiries: inquirySoService.getLinkedInquiriesBySoId(normalizedId),
  }
}

/**
 * Builds the warehouse issue/dispatch read model for a sales order: the stock
 * lots that leave storage, grouped by warehouse (storage location). Only stock
 * already allocated to the order appears here; lines still to order have no
 * allocation and therefore nothing is leaving a warehouse for them.
 */
exports.getWarehouseDispatch = (soId) => {
  const normalizedId = normalizeSOId(soId)
  const so = soRepo.getSOById(normalizedId)

  if (!so) {
    throw new Error("SO not found")
  }

  const rows = soRepo.getWarehouseDispatchBySoId(normalizedId)
  const siteMap = new Map()

  for (const row of rows) {
    const siteKey = row.LocationID ?? "unassigned"

    if (!siteMap.has(siteKey)) {
      siteMap.set(siteKey, {
        locationId: row.LocationID ?? null,
        locationName: row.LocationName || "Unassigned",
        locationCode: row.LocationCode || "",
        totalQty: 0,
        lines: [],
      })
    }

    const site = siteMap.get(siteKey)

    const isBat = Boolean(row.BatteryID || row.SoBatteryID)
    const displayName = isBat
      ? `${row.Brand || "NA"} ${row.Model || "NA"} (${row.Capacity || ""} ${row.Voltage || ""})`.trim()
      : `${row.Brand || "NA"} / ${row.Size || "NA"} - ${row.Pattern || "NA"}`

    site.lines.push({
      tyreId: row.TyreID ?? row.BatteryID,
      displayName,
      dot: row.BatchCode || row.DOT || "",
      storageManagerId: (row.StorageManagerID ?? row.BatteryStorageManagerID) ?? null,
      qty: row.Qty,
    })

    site.totalQty += row.Qty
  }

  return {
    soId: so.SoID,
    date: so.Date,
    customerName: so.CustomerName || "",
    customerCode: so.CustomerCode || "",
    warehouses: Array.from(siteMap.values()),
  }
}

exports.getDeliveryWarehouseDispatch = (soId, deliveryId) => {
  const normalizedSoId = normalizeSOId(soId)
  const normalizedDeliveryId = normalizePositiveId(deliveryId, "DeliveryID")
  const so = soRepo.getSOById(normalizedSoId)

  if (!so) {
    throw new Error("SO not found")
  }

  const delivery = soDeliveryRepo.getDeliveryWithLinesById(normalizedDeliveryId)
  if (!delivery || delivery.SoID !== normalizedSoId) {
    throw new Error("Delivery not found for this sales order")
  }

  const siteMap = new Map()
  for (const row of delivery.Lines) {
    const siteKey = row.LocationID ?? "unassigned"
    if (!siteMap.has(siteKey)) {
      siteMap.set(siteKey, {
        locationId: row.LocationID ?? null,
        locationName: row.LocationName || "Unassigned",
        locationCode: row.LocationCode || "",
        totalQty: 0,
        lines: [],
      })
    }

    const site = siteMap.get(siteKey)
    const isBat = Boolean(row.BatteryID || row.SoBatteryID)
    const displayName = isBat
      ? `${row.Brand || "NA"} ${row.Model || "NA"} (${row.Capacity || ""} ${row.Voltage || ""})`.trim()
      : `${row.Brand || "NA"} / ${row.Size || "NA"} - ${row.Pattern || "NA"}`

    site.lines.push({
      tyreId: row.TyreID ?? row.BatteryID,
      displayName,
      dot: row.BatchCode || row.DOT || "",
      storageManagerId: (row.StorageManagerID ?? row.BatteryStorageManagerID) ?? null,
      qty: row.Qty,
    })
    site.totalQty += row.Qty
  }

  return {
    soId: so.SoID,
    date: so.Date,
    customerName: so.CustomerName || "",
    customerCode: so.CustomerCode || "",
    deliveryId: delivery.ID,
    deliveryDate: delivery.DeliveryDate,
    gatePassNo: delivery.GatePassNo || "",
    warehouses: Array.from(siteMap.values()),
  }
}

exports.createSO = (payload, ctx) => {
  const so = toSOPayload(payload)
  const created = soRepo.createSO(so)

  const inquiryIds = collectInquiryIds(payload)
  if (inquiryIds.length > 0) {
    inquirySoService.linkSoToInquiries(created.SoID, inquiryIds, ctx)
  }

  const snapshot = exports.getSOById(created.SoID)

  soAuditLogService.recordSOAction({
    action: AUDIT_ACTIONS.CREATE,
    soId: created.SoID,
    before: null,
    after: snapshot,
    ctx,
  })

  return created
}

/**
 * Read model for "how much has actually been collected" on a sales order.
 * Delivery is derived, never stored: each reserved allocation (SoTyreStorage
 * Allocation) is the unit a customer collects against, so remaining-collectable
 * is allocation.Qty minus the quantities already handed over for it. Lines that
 * are still to order have no allocation and therefore remain collectable = 0.
 */
exports.getDeliveryProgress = (soId) => {
  const normalizedSoId = normalizeSOId(soId)
  const so = soRepo.getSOById(normalizedSoId)

  if (!so) {
    throw new Error("SO not found")
  }

  const isBattery = (so.Category || "tyre") === "battery"

  // Ensure any stock that arrived on the linked PO is allocated to this SO
  const po = poRepo.getPOBySoId(normalizedSoId)
  if (po && !isBattery) {
    poService.allocateArrivedStockToSo(normalizedSoId, po.ID)
  }

  const allocations = isBattery
    ? soBatteryAllocationRepo.getAllocationsBySoId(normalizedSoId)
    : soAllocationRepo.getAllocationsBySoId(normalizedSoId)

  const deliveredByAllocation = new Map(
    soDeliveryLineRepo
      .getAllocationDeliverySummary(normalizedSoId)
      .map((row) => [row.AllocationID, row.DeliveredQty])
  )

  const allocationsByLineId = new Map()

  const allocationDetails = allocations.map((allocation) => {
    const deliveredQty = deliveredByAllocation.get(allocation.AllocationID) || 0
    const remainingQty = Math.max(0, allocation.Qty - deliveredQty)
    const lineId = isBattery ? allocation.SoBatteryID : allocation.SoTyreID

    const detail = {
      AllocationID: allocation.AllocationID,
      StorageManagerID: isBattery ? allocation.BatteryStorageManagerID : allocation.StorageManagerID,
      StorageManagerBatchID: isBattery ? allocation.BatteryStorageManagerBatchID : allocation.StorageManagerBatchID,
      LocationName: allocation.LocationName,
      DOT: allocation.BatchCode || allocation.DOT || "-",
      BatchCode: allocation.BatchCode,
      ExpiryDate: allocation.ExpiryDate,
      Price: allocation.Price,
      Discount: allocation.Discount,
      Qty: allocation.Qty,
      DeliveredQty: deliveredQty,
      RemainingQty: remainingQty,
    }

    if (!allocationsByLineId.has(lineId)) {
      allocationsByLineId.set(lineId, [])
    }
    allocationsByLineId.get(lineId).push(detail)

    return { SoTyreID: lineId, SoBatteryID: lineId, ...detail }
  })

  const rawLines = isBattery
    ? soBatteriesRepo.getSoBatteriesBySoId(normalizedSoId)
    : soTyresRepo.getSoTyresBySoId(normalizedSoId)

  const lines = rawLines.map((line) => {
    const lineAllocations = allocationsByLineId.get(line.ID) || []
    const allocatedQty = lineAllocations.reduce((sum, a) => sum + a.Qty, 0)
    const deliveredQty = lineAllocations.reduce((sum, a) => sum + a.DeliveredQty, 0)

    const remainingToOrder = Math.max(0, line.Qty - allocatedQty)

    return {
      SoTyreID: line.ID,
      SoBatteryID: isBattery ? line.ID : null,
      TyreID: isBattery ? null : line.TyreID,
      BatteryID: isBattery ? line.BatteryID : null,
      Brand: line.Brand,
      Size: isBattery ? line.Model : line.Size,
      Pattern: isBattery ? `${line.Capacity || ""} ${line.Voltage || ""}`.trim() : line.Pattern,
      Model: isBattery ? line.Model : null,
      Capacity: isBattery ? line.Capacity : null,
      Voltage: isBattery ? line.Voltage : null,
      OrderedQty: line.Qty,
      DeliveredQty: deliveredQty,
      RemainingToCollect: Math.max(0, line.Qty - deliveredQty),
      AllocatedQty: allocatedQty,
      RemainingCollectable: Math.max(0, allocatedQty - deliveredQty),
      ToOrderQty: Math.min(line.NeedToOrderQty, remainingToOrder),
      IsFullyDelivered: line.Qty > 0 && deliveredQty >= line.Qty,
      Allocations: lineAllocations,
    }
  })

  const totals = lines.reduce(
    (acc, line) => {
      acc.OrderedQty += line.OrderedQty
      acc.DeliveredQty += line.DeliveredQty
      acc.RemainingToCollect += line.RemainingToCollect
      acc.RemainingCollectable += line.RemainingCollectable
      acc.ToOrderQty += line.ToOrderQty
      return acc
    },
    {
      OrderedQty: 0,
      DeliveredQty: 0,
      RemainingToCollect: 0,
      RemainingCollectable: 0,
      ToOrderQty: 0,
    }
  )

  const isFullyDelivered = lines.length > 0 && lines.every((line) => line.IsFullyDelivered)

  return {
    SoID: normalizedSoId,
    Lines: lines,
    Allocations: allocationDetails,
    Totals: totals,
    IsFullyDelivered: isFullyDelivered,
  }
}

exports.getDeliveries = (soId) => {
  const normalizedSoId = normalizeSOId(soId)
  const so = soRepo.getSOById(normalizedSoId)

  if (!so) {
    throw new Error("SO not found")
  }

  return decorateDeliveriesWithGatePass(normalizedSoId)
}

exports.getDeliveryById = (deliveryId) => {
  const normalizedId = normalizePositiveId(deliveryId, "DeliveryID")
  return soDeliveryRepo.getDeliveryWithLinesById(normalizedId)
}

exports.getSOGatePasses = () => {
  return soDeliveryRepo.getSOGatePassDeliveries().map((delivery) => {
    const so = soRepo.getSOById(delivery.SoID)
    return {
      ...delivery,
      Date: so?.Date || delivery.DeliveryDate,
      CustomerName: so?.CustomerName || "",
      CustomerCode: so?.CustomerCode || "",
      Lines: soDeliveryRepo.getDeliveryWithLinesById(delivery.ID)?.Lines || [],
    }
  })
}

/**
 * Deliveries that were handed over but whose gate pass is still withheld
 * because the customer has not paid for them yet.
 */
exports.getPendingSOGatePasses = () => {
  const pending = soDeliveryRepo.getPendingGatePassDeliveries()

  // Decorate once per sales order instead of once per delivery.
  const eligibilityBySo = new Map()
  pending.forEach((delivery) => {
    if (eligibilityBySo.has(delivery.SoID)) return

    eligibilityBySo.set(
      delivery.SoID,
      new Map(
        decorateDeliveriesWithGatePass(delivery.SoID).map((row) => [row.ID, row]),
      ),
    )
  })

  return pending.map((delivery) => {
    const so = soRepo.getSOById(delivery.SoID)
    const decorated = eligibilityBySo.get(delivery.SoID)?.get(delivery.ID)

    return {
      ...delivery,
      Date: so?.Date || delivery.DeliveryDate,
      CustomerName: so?.CustomerName || "",
      CustomerCode: so?.CustomerCode || "",
      Lines: soDeliveryRepo.getDeliveryWithLinesById(delivery.ID)?.Lines || [],
      GatePass: decorated?.GatePass ?? null,
    }
  })
}

exports.getGatePassEligibility = (soId, deliveryId) => {
  const normalizedSoId = normalizeSOId(soId)
  const normalizedDeliveryId = normalizePositiveId(deliveryId, "DeliveryID")
  const delivery = decorateDeliveryWithGatePass(normalizedSoId, normalizedDeliveryId)

  if (!delivery) {
    throw new Error("Delivery not found for this sales order")
  }

  return delivery.GatePass
}

/**
 * Releases every pending gate pass whose hand-over is now covered by settled
 * payments. Runs after any payment lands so the cashier never has to issue the
 * pass by hand.
 */
exports.tryIssuePendingGatePasses = (soId, ctx) => {
  const normalizedSoId = normalizeSOId(soId)

  const ready = decorateDeliveriesWithGatePass(normalizedSoId)
    .filter((delivery) => !delivery.GatePass?.Issued && delivery.GatePass?.CanIssue)
    .sort((a, b) => a.ID - b.ID)

  return ready.map((delivery) => issueSOGatePass(delivery, ctx))
}

exports.issueDeliveryGatePass = (soId, deliveryId, optionsOrCtx, suppliedCtx) => {
  const options = optionsOrCtx?.overridePaymentIncomplete !== undefined ? optionsOrCtx : {}
  const ctx = suppliedCtx ?? (optionsOrCtx?.user ? optionsOrCtx : undefined)
  const paymentOverride = options.overridePaymentIncomplete === true
  const normalizedSoId = normalizeSOId(soId)
  const normalizedDeliveryId = normalizePositiveId(deliveryId, "DeliveryID")
  const issueTransaction = db.transaction(() => {
    const delivery = soDeliveryRepo.getDeliveryById(normalizedDeliveryId)
    if (!delivery || delivery.SoID !== normalizedSoId) {
      throw new Error("Delivery not found for this sales order")
    }

    const eligibility = exports.getGatePassEligibility(normalizedSoId, normalizedDeliveryId)

    if (!eligibility.CanIssue && !paymentOverride) {
      throw new Error(
        `Gate pass cannot be issued: LKR ${formatMoney(eligibility.Shortfall)} of the deliveries handed over so far is still unpaid.`,
      )
    }

    if (!eligibility.Issued) {
      const before = exports.getSOById(normalizedSoId)
      const isPaymentOverride = paymentOverride && !eligibility.CanIssue
      const issuedDelivery = issueSOGatePass(
        delivery,
        ctx,
        isPaymentOverride,
        isPaymentOverride ? eligibility.Shortfall : 0,
      )
      const after = exports.getSOById(normalizedSoId)
      soAuditLogService.recordSOAction({
        action: AUDIT_ACTIONS.UPDATE,
        soId: normalizedSoId,
        eventData: {
          Action: paymentOverride && !eligibility.CanIssue
            ? "GATE_PASS_ISSUED_WITH_PAYMENT_OVERRIDE"
            : "GATE_PASS_ISSUED",
          DeliveryID: normalizedDeliveryId,
          GatePassNo: issuedDelivery.GatePassNo,
          PaymentOverride: paymentOverride && !eligibility.CanIssue,
          SettledAmount: eligibility.SettledAmount,
          RequiredCoverage: eligibility.RequiredCoverage,
          Shortfall: eligibility.Shortfall,
        },
        before,
        after,
        ctx,
      })
    }

    return (
      decorateDeliveryWithGatePass(normalizedSoId, normalizedDeliveryId) ??
      soDeliveryRepo.getDeliveryWithLinesById(normalizedDeliveryId)
    )
  })
  return issueTransaction()
}

/**
 * Records a later hand-over: the customer collects some of the tyres still
 * reserved against their order. Stock was already removed when the SO was
 * created, so this only writes the delivery event and consumes the reservation -
 * it never moves stock again. Payment is intentionally out of scope here.
 */
exports.recordDelivery = (soId, payload, ctx) => {
  const recordDeliveryTransaction = db.transaction(() => {
    const normalizedSoId = normalizeSOId(soId)
    const so = soRepo.getSOById(normalizedSoId)

    if (!so) {
      throw new Error("SO not found")
    }

    const rawLines = Array.isArray(payload?.Lines) ? payload.Lines : []

    if (rawLines.length === 0) {
      throw new Error("At least one delivery line is required")
    }

    const deliveryDate = normalizeDate(
      payload?.DeliveryDate || getLocalDateString(),
      "DeliveryDate"
    )
    const deliveredBy = payload?.DeliveredBy
      ? normalizePositiveId(payload.DeliveredBy, "DeliveredBy")
      : null
    const notes = normalizeText(payload?.Notes)

    const isBattery = (so.Category || "tyre") === "battery"
    const allocationsList = isBattery
      ? soBatteryAllocationRepo.getAllocationsBySoId(normalizedSoId)
      : soAllocationRepo.getAllocationsBySoId(normalizedSoId)

    const allocationsById = new Map(
      allocationsList.map((allocation) => [allocation.AllocationID, allocation])
    )

    const deliveredByAllocation = new Map(
      soDeliveryLineRepo
        .getAllocationDeliverySummary(normalizedSoId)
        .map((row) => [row.AllocationID, row.DeliveredQty])
    )

    const requestedByAllocation = new Map()

    rawLines.forEach((rawLine) => {
      const allocationId = normalizePositiveId(
        rawLine?.SoTyreStorageAllocationID ?? rawLine?.SoBatteryStorageAllocationID ?? rawLine?.AllocationID,
        "AllocationID"
      )
      const qty = normalizeInteger(rawLine?.Qty, "Qty")

      if (qty <= 0) {
        throw new Error("Delivery quantity must be a positive integer.")
      }

      const allocation = allocationsById.get(allocationId)

      if (!allocation) {
        throw new Error(`Allocation #${allocationId} does not belong to this sales order.`)
      }

      const alreadyDelivered = deliveredByAllocation.get(allocationId) || 0
      const alreadyRequested = requestedByAllocation.get(allocationId) || 0
      const remainingQty = Math.max(0, allocation.Qty - alreadyDelivered)

      if (alreadyRequested + qty > remainingQty) {
        throw new Error(
          `Delivery quantity exceeds the ${remainingQty} still to collect on the selected lot.`
        )
      }

      requestedByAllocation.set(allocationId, alreadyRequested + qty)
    })

    // The delivery is always recorded. The gate pass is a separate decision
    // taken below, once the payment position is known.
    let delivery = soDeliveryRepo.createDelivery({
      SoID: normalizedSoId,
      DeliveryDate: deliveryDate,
      DeliveredBy: deliveredBy,
      GatePassNo: null,
      Notes: notes,
    })

    for (const [allocationId, qty] of requestedByAllocation.entries()) {
      const allocation = allocationsById.get(allocationId)

      if (isBattery) {
        soDeliveryLineRepo.createDeliveryLine({
          SODeliveryID: delivery.ID,
          SoBatteryID: allocation.SoBatteryID,
          BatteryID: allocation.BatteryID,
          SoBatteryStorageAllocationID: allocationId,
          BatteryStorageManagerID: allocation.BatteryStorageManagerID,
          BatteryStorageManagerBatchID: allocation.BatteryStorageManagerBatchID,
          Qty: qty,
          Amount: calculateDeliveredLineAmount(allocation, qty),
        })
      } else {
        soDeliveryLineRepo.createDeliveryLine({
          SODeliveryID: delivery.ID,
          SoTyreID: allocation.SoTyreID,
          TyreID: allocation.TyreID,
          SoTyreStorageAllocationID: allocationId,
          StorageManagerID: allocation.StorageManagerID,
          StorageManagerBatchID: allocation.StorageManagerBatchID,
          Qty: qty,
          Amount: calculateDeliveredLineAmount(allocation, qty),
        })
      }
    }

    delivery = maybeIssueGatePass(delivery, ctx)

    const before = exports.getSOById(normalizedSoId)
    const progress = exports.getDeliveryProgress(normalizedSoId)
    const after = exports.getSOById(normalizedSoId)

    soAuditLogService.recordSOAction({
      action: AUDIT_ACTIONS.DELIVER,
      soId: normalizedSoId,
      eventData: {
        DeliveryID: delivery.ID,
        DeliveryDate: deliveryDate,
        GatePassNo: delivery.GatePassNo,
        Lines: Array.from(requestedByAllocation.entries()).map(([allocationId, qty]) => ({
          AllocationID: allocationId,
          Qty: qty,
        })),
      },
      before,
      after,
      ctx,
    })

    const decorated =
      decorateDeliveryWithGatePass(normalizedSoId, delivery.ID) ??
      soDeliveryRepo.getDeliveryWithLinesById(delivery.ID)

    return {
      ...decorated,
      Progress: progress,
    }
  })

  return recordDeliveryTransaction()
}


/**
 * Detects lines whose discount exceeds the tyre's maximum discount offered.
 * Returns a Map keyed by line index -> violation details. Unlike the old
 * blocking validator, it does not throw: the order is allowed through and the
 * over-discount is recorded as a policy violation for later review.
 */
const detectLineDiscountViolations = (lines) => {
  const violations = new Map()

  lines.forEach((line, index) => {
    const row = index + 1
    if (line.BatteryID) {
      const battery = batteryRepo.getBatteryById(line.BatteryID)
      if (!battery) {
        throw new Error(`Battery not found on line ${row}`)
      }
      return
    }

    const tyre = tyreRepo.getTyreById(line.TyreID)

    if (!tyre) {
      throw new Error(`Tyre not found on line ${row}`)
    }

    if (
      tyre.DiscountOffered !== null &&
      tyre.DiscountOffered !== undefined &&
      line.Discount > tyre.DiscountOffered
    ) {
      violations.set(index, {
        MaxDiscountAllowed: tyre.DiscountOffered,
        AppliedDiscount: line.Discount,
        DiscountExcess: line.Discount - tyre.DiscountOffered,
      })
    }
  })

  return violations
}

const recordDiscountViolation = ({ so, soTyre, line, violation, ctx }) => {
  const { user, changedBy } = ctx ?? {}
  const responsibleUser = user?.displayName || user?.username || changedBy || null

  soPolicyViolationRepo.insertSOPolicyViolation({
    SoID: so.SoID,
    SoTyreID: soTyre.ID || soTyre.Id,
    TyreID: line.TyreID,
    ViolationTypeCode: POLICY_VIOLATION_CODES.OVER_MAX_DISCOUNT,
    Qty: line.Qty,
    Price: line.Price,
    MaxDiscountAllowed: violation.MaxDiscountAllowed,
    AppliedDiscount: violation.AppliedDiscount,
    DiscountExcess: violation.DiscountExcess,
    ResponsibleUser: responsibleUser,
  })
}

/**
 * Ranks a DOT (WWYY) so batches can be compared oldest-first. Mirrors the
 * renderer ranking in salesOrderCalculations.ts and the SQL ordering used by
 * storageManagerBatchRepository: a missing/invalid DOT ranks as newest.
 */
const rankDot = (dot) => {
  const normalized = dot === null || dot === undefined ? "" : String(dot).trim()

  if (!/^\d{4}$/.test(normalized)) {
    return { year: Number.MAX_SAFE_INTEGER, week: Number.MAX_SAFE_INTEGER }
  }

  const week = Number(normalized.slice(0, 2))
  const year = 2000 + Number(normalized.slice(2, 4))

  if (week < 1 || week > 53) {
    return { year: Number.MAX_SAFE_INTEGER, week: Number.MAX_SAFE_INTEGER }
  }

  return { year, week }
}

const isOlderDot = (candidate, reference) => {
  const a = rankDot(candidate)
  const b = rankDot(reference)

  if (a.year !== b.year) {
    return a.year < b.year
  }

  return a.week < b.week
}

/**
 * Tracks the sellable stock of a tyre's DOT batches so FIFO compliance can be
 * judged while the order is being fulfilled.
 *
 * The baseline is the same set the Auto (FIFO) path drains from - only default
 * location stock with Qty > 0 - which keeps the check consistent with what the
 * automatic allocation would have done. Remaining quantities are decremented as
 * the order consumes them, so a violation is only recorded when genuinely
 * older stock was still available at the moment the newer batch was sold.
 */
const createFifoTracker = (tyreId) => {
  const batches = storageManagerBatchRepo.getBatchesByTyreIdOrderedByDOT(tyreId)
  const remaining = new Map()

  for (const batch of batches) {
    remaining.set(batch.Id, Number(batch.Qty ?? 0))
  }

  // Ensures an explicitly picked batch is tracked even when it sits outside the
  // default-location baseline (for example a non-default lot).
  const ensureTracked = (batch) => {
    if (!remaining.has(batch.Id)) {
      remaining.set(batch.Id, Number(batch.Qty ?? 0))
    }
  }

  return {
    /**
     * Returns the oldest DOT that is still available while excluding the batch
     * being sold, or null when no older stock remains.
     */
    oldestAvailableDotExcluding: (excludedBatchId) => {
      let oldest = null

      for (const [batchId, qty] of remaining) {
        if (batchId === excludedBatchId) continue
        if (qty <= 0) continue

        const batch = batches.find((candidate) => candidate.Id === batchId)

        if (!batch) continue

        const dot = batch.DOT === null || batch.DOT === undefined ? "" : String(batch.DOT).trim()

        // Unknown DOT cannot be proven older, so it never triggers a violation.
        if (!dot) continue

        if (oldest === null || isOlderDot(dot, oldest)) {
          oldest = dot
        }
      }

      return oldest
    },

    consume: (batchId, qty) => {
      if (!remaining.has(batchId)) return

      const left = Number(remaining.get(batchId) ?? 0)

      remaining.set(batchId, Math.max(left - qty, 0))
    },

    track: ensureTracked,
  }
}

const recordSkippedOldStockViolation = ({ so, soTyre, line, violations, ctx }) => {
  if (!violations || violations.length === 0) return

  const { user, changedBy } = ctx ?? {}
  const responsibleUser = user?.displayName || user?.username || changedBy || null

  const DOTS = violations.map((violation) => ({
    DOT: violation.DOT,
    OldestAvailableDOT: violation.OldestAvailableDOT,
    StorageManagerID: violation.StorageManagerID,
    StorageManagerBatchID: violation.StorageManagerBatchID,
    Qty: violation.Qty,
  }))

  soPolicyViolationRepo.insertSOPolicyViolation({
    SoID: so.SoID,
    SoTyreID: soTyre.ID || soTyre.Id,
    TyreID: line.TyreID,
    ViolationTypeCode: POLICY_VIOLATION_CODES.SKIPPED_OLD_STOCK,
    Qty: DOTS.reduce((total, dot) => total + (dot.Qty ?? 0), 0),
    Price: line.Price,
    Details: JSON.stringify({
      OffendingBatchCount: DOTS.length,
      AvailableBatches: violations[0].AvailableBatches,
    }),
    ResponsibleUser: responsibleUser,
    DOTs: DOTS,
  })
}

exports.createSOWithAutoPO = (payload, ctx) => {
  const data = toSalesOrderCreatePayload(payload)
  const isBattery = data.Category === "battery"
  const isPaymentCompleted = deriveIsPaymentCompleted(data.Lines, data.Payment)

  const discountViolations = detectLineDiscountViolations(data.Lines)

  const createTransaction = db.transaction(() => {
    const so = soRepo.createSO({
      Date: data.Date,
      Category: data.Category || "tyre",
      IsAdminApproved: data.IsAdminApproved,
      IsCompleted: data.IsCompleted,
      IsPaymentCompleted: isPaymentCompleted,
    })

    const customerLink = data.CustomerID
      ? soCustomerRepo.createSoCustomer(so.SoID, data.CustomerID)
      : (() => { const wc = walkinCustomerRepo.createWalkinCustomer(data.WalkinCustomer); return soWalkinLinkRepo.linkSoToWalkinCustomer(so.SoID, wc.ID); })()

    const inquiryIds = collectInquiryIds(payload)
    if (inquiryIds.length > 0) {
      inquirySoService.linkSoToInquiries(so.SoID, inquiryIds, ctx)
    }

    processSOPayment(so.SoID, data.Payment)

    // Lines the customer is collecting at creation time become the SO's first
    // delivery record (no payment here). Later hand-overs are separate events.
    const initialDeliveryLines = []

    const lineItems = data.Lines.map((line, index) => {
      const rowNumber = index + 1
      let remainingToAllocate = line.Qty
      let fulfilledFromStock = 0
      const drainedAllocations = []

      if (isBattery) {
        let hasPerLotTakeNow = false

        for (const allocation of line.Allocations) {
          if (allocation.StorageManagerID === null) continue
          if (remainingToAllocate <= 0) break

          const row = batteryStorageManagerRepo.getBatteryStorageManagerById(allocation.StorageManagerID)

          if (!row) {
            throw new Error(`Battery storage lot #${allocation.StorageManagerID} not found on line ${rowNumber}`)
          }

          if (row.BatteryId !== line.BatteryID) {
            throw new Error(
              `Battery storage lot #${allocation.StorageManagerID} does not belong to the battery on line ${rowNumber}`,
            )
          }

          const deductQty = Math.min(allocation.Qty, Number(row.Qty ?? 0), remainingToAllocate)
          if (deductQty <= 0) continue

          const lotTakeNowRaw = allocation.TakeNowQty
          const lotTakeNow =
            lotTakeNowRaw === null || lotTakeNowRaw === undefined
              ? null
              : Math.min(lotTakeNowRaw, deductQty)
          if (lotTakeNow !== null) hasPerLotTakeNow = true

          const drainedForLot = []

          if (allocation.StorageManagerBatchID !== null) {
            const pickedBatch = batteryStorageManagerBatchRepo.getBatchById(allocation.StorageManagerBatchID)

            if (!pickedBatch || pickedBatch.BatteryStorageManagerID !== row.Id) {
              throw new Error(
                `Battery storage batch #${allocation.StorageManagerBatchID} not found on line ${rowNumber}`,
              )
            }

            const batchDeductQty = Math.min(deductQty, Number(pickedBatch.Qty ?? 0))
            if (batchDeductQty > 0) {
              const remainingBatchQty = Math.max(0, Number(pickedBatch.Qty ?? 0) - batchDeductQty)
              batteryStorageManagerBatchRepo.updateBatteryStorageManagerBatch(pickedBatch.Id, {
                BatchCode: pickedBatch.BatchCode,
                MfgDate: pickedBatch.MfgDate,
                ExpiryDate: pickedBatch.ExpiryDate,
                Qty: remainingBatchQty,
              })
              drainedForLot.push({
                StorageManagerBatchID: pickedBatch.Id,
                Qty: batchDeductQty,
              })
            }
          } else {
            const lotBatches = batteryStorageManagerBatchRepo.getBatchesByStorageManagerIdOrderedByExpiry(row.Id)
            let drainedFromBatches = 0

            for (const batch of lotBatches) {
              if (drainedFromBatches >= deductQty) break

              const batchDeductQty = Math.min(batch.Qty, deductQty - drainedFromBatches)
              if (batchDeductQty <= 0) continue

              const remainingBatchQty = Math.max(0, Number(batch.Qty ?? 0) - batchDeductQty)
              batteryStorageManagerBatchRepo.updateBatteryStorageManagerBatch(batch.Id, {
                BatchCode: batch.BatchCode,
                MfgDate: batch.MfgDate,
                ExpiryDate: batch.ExpiryDate,
                Qty: remainingBatchQty,
              })
              drainedFromBatches += batchDeductQty

              drainedForLot.push({
                StorageManagerBatchID: batch.Id,
                Qty: batchDeductQty,
              })
            }
          }

          batteryStorageManagerRepo.updateBatteryStorageManager(row.Id, {
            ...row,
            Qty: Number(row.Qty ?? 0) - deductQty,
          })

          remainingToAllocate -= deductQty
          fulfilledFromStock += deductQty

          const drainedThroughBatches = drainedForLot.reduce((sum, d) => sum + d.Qty, 0)
          const lotOnlyQty = deductQty - drainedThroughBatches

          if (lotOnlyQty > 0) {
            drainedForLot.push({
              StorageManagerBatchID: null,
              Qty: lotOnlyQty,
            })
          }

          let lotTakeNowRemaining = lotTakeNow

          drainedAllocations.push(
            ...drainedForLot.map((drained) => {
              const takenNowQty =
                lotTakeNow === null
                  ? null
                  : Math.min(Math.max(lotTakeNowRemaining, 0), drained.Qty)
              if (lotTakeNow !== null) lotTakeNowRemaining -= takenNowQty

              return {
                StorageManagerID: row.Id,
                StorageManagerBatchID: drained.StorageManagerBatchID,
                Qty: drained.Qty,
                TakeNowQty: takenNowQty,
              }
            }),
          )
        }

        const autoRequested = line.Allocations
          .filter((allocation) => allocation.StorageManagerID === null)
          .reduce((sum, allocation) => sum + allocation.Qty, 0)
        let remainingAuto = Math.min(autoRequested, remainingToAllocate)

        if (remainingAuto > 0) {
          const batchRows = batteryStorageManagerBatchRepo.getBatchesByBatteryIdOrderedByExpiry(line.BatteryID)

          for (const batch of batchRows) {
            if (remainingAuto <= 0) break

            const deductQty = Math.min(remainingAuto, Number(batch.Qty ?? 0))
            if (deductQty <= 0) continue

            const lot = batteryStorageManagerRepo.getBatteryStorageManagerById(batch.BatteryStorageManagerID)
            if (!lot) continue

            const remainingBatchQty = Math.max(0, Number(batch.Qty ?? 0) - deductQty)
            batteryStorageManagerBatchRepo.updateBatteryStorageManagerBatch(batch.Id, {
              BatchCode: batch.BatchCode,
              MfgDate: batch.MfgDate,
              ExpiryDate: batch.ExpiryDate,
              Qty: remainingBatchQty,
            })

            batteryStorageManagerRepo.updateBatteryStorageManager(batch.BatteryStorageManagerID, {
              ...lot,
              Qty: Number(lot.Qty ?? 0) - deductQty,
            })

            remainingAuto -= deductQty
            fulfilledFromStock += deductQty
            drainedAllocations.push({
              StorageManagerID: batch.BatteryStorageManagerID,
              StorageManagerBatchID: batch.Id,
              Qty: deductQty,
              TakeNowQty: null,
            })
          }

          if (remainingAuto > 0) {
            const legacyRows = batteryStorageManagerRepo.getBatteryStorageManagersByBatteryIdWithoutBatches(line.BatteryID)

            for (const row of legacyRows) {
              if (remainingAuto <= 0) break

              const deductQty = Math.min(remainingAuto, Number(row.Qty ?? 0))
              if (deductQty <= 0) continue

              batteryStorageManagerRepo.updateBatteryStorageManager(row.Id, {
                ...row,
                Qty: Number(row.Qty ?? 0) - deductQty,
              })

              remainingAuto -= deductQty
              fulfilledFromStock += deductQty
              drainedAllocations.push({
                StorageManagerID: row.Id,
                StorageManagerBatchID: null,
                Qty: deductQty,
              })
            }
          }
        }

        const realNeedToOrderQty = line.Qty - fulfilledFromStock

        const createdSoBattery = soBatteriesRepo.createSoBattery({
          SoID: so.SoID,
          BatteryID: line.BatteryID,
          Price: line.Price,
          Discount: line.Discount,
          Qty: line.Qty,
          NeedToOrderQty: realNeedToOrderQty,
          IsAdminApproved: line.IsAdminApproved,
        })

        const createdAllocations = []
        for (const allocation of drainedAllocations) {
          const createdAllocation = soBatteryAllocationRepo.createAllocation({
            SoBatteryID: createdSoBattery.ID || createdSoBattery.Id,
            BatteryStorageManagerID: allocation.StorageManagerID,
            BatteryStorageManagerBatchID: allocation.StorageManagerBatchID,
            Qty: allocation.Qty,
          })
          createdAllocations.push({
            ...createdAllocation,
            TakeNowQty: allocation.TakeNowQty ?? null,
          })
        }

        const collectableQty = createdAllocations.reduce((sum, allocation) => sum + allocation.Qty, 0)
        const takeNowQty = line.TakeNowQty === null ? collectableQty : line.TakeNowQty

        if (takeNowQty > collectableQty) {
          throw new Error(
            `Take now qty (${takeNowQty}) exceeds the ${collectableQty} in stock on line ${rowNumber}`,
          )
        }

        let takeNowRemaining = takeNowQty
        for (const allocation of createdAllocations) {
          const takenQty =
            allocation.TakeNowQty === null
              ? hasPerLotTakeNow
                ? 0
                : Math.min(Math.max(takeNowRemaining, 0), allocation.Qty)
              : allocation.TakeNowQty

          if (allocation.TakeNowQty === null && !hasPerLotTakeNow) takeNowRemaining -= takenQty
          if (takenQty <= 0) continue

          initialDeliveryLines.push({
            SoBatteryID: createdSoBattery.ID || createdSoBattery.Id,
            BatteryID: line.BatteryID,
            SoBatteryStorageAllocationID: allocation.Id,
            BatteryStorageManagerID: allocation.BatteryStorageManagerID,
            BatteryStorageManagerBatchID: allocation.BatteryStorageManagerBatchID,
            Qty: takenQty,
            Amount: calculateDeliveredLineAmount(line, takenQty),
          })
        }

        return createdSoBattery
      }

      const fifoTracker = createFifoTracker(line.TyreID)
      const fifoViolations = []
      let hasPerLotTakeNow = false

      // Explicit lot picks reduce stock only from those storage manager lots.
      // A picked batch drains exactly that batch; otherwise the lot's batches
      // are drained oldest-DOT-first.
      for (const allocation of line.Allocations) {
        if (allocation.StorageManagerID === null) continue
        if (remainingToAllocate <= 0) break

        const row = storageManagerRepo.getStorageManagerById(allocation.StorageManagerID)

        if (!row) {
          throw new Error(`Storage lot #${allocation.StorageManagerID} not found on line ${rowNumber}`)
        }

        if (row.TyreId !== line.TyreID) {
          throw new Error(
            `Storage lot #${allocation.StorageManagerID} does not belong to the tyre on line ${rowNumber}`,
          )
        }

        const deductQty = Math.min(allocation.Qty, Number(row.Qty ?? 0), remainingToAllocate)
        if (deductQty <= 0) continue

        // null = not specified for this lot (line-level rule applies later).
        const lotTakeNowRaw = allocation.TakeNowQty
        const lotTakeNow =
          lotTakeNowRaw === null || lotTakeNowRaw === undefined
            ? null
            : Math.min(lotTakeNowRaw, deductQty)
        if (lotTakeNow !== null) hasPerLotTakeNow = true

        const drainedForLot = []

        if (allocation.StorageManagerBatchID !== null) {
          const pickedBatch = storageManagerBatchRepo.getBatchById(allocation.StorageManagerBatchID)

          if (!pickedBatch || pickedBatch.StorageManagerID !== row.Id) {
            throw new Error(
              `Storage batch #${allocation.StorageManagerBatchID} not found on line ${rowNumber}`,
            )
          }

          const batchDeductQty = Math.min(deductQty, Number(pickedBatch.Qty ?? 0))
          if (batchDeductQty <= 0) continue

          fifoTracker.track(pickedBatch)

          // Selling an explicitly picked batch while an older DOT batch is
          // still on hand breaks the old-stock-first policy.
          const oldestAvailableDot = fifoTracker.oldestAvailableDotExcluding(pickedBatch.Id)
          const pickedDot = pickedBatch.DOT === null || pickedBatch.DOT === undefined ? "" : String(pickedBatch.DOT).trim()

          if (pickedDot && oldestAvailableDot && isOlderDot(oldestAvailableDot, pickedDot)) {
            fifoViolations.push({
              DOT: pickedDot,
              OldestAvailableDOT: oldestAvailableDot,
              StorageManagerID: row.Id,
              StorageManagerBatchID: pickedBatch.Id,
              Qty: batchDeductQty,
              AvailableBatches: storageManagerBatchRepo
                .getBatchesByTyreIdOrderedByDOT(line.TyreID)
                .map((batch) => ({ BatchID: batch.Id, DOT: batch.DOT, Qty: batch.Qty })),
            })
          }

          const survivingBatchId = deductBatchQty(pickedBatch, batchDeductQty)
          fifoTracker.consume(pickedBatch.Id, batchDeductQty)
          drainedForLot.push({
            StorageManagerBatchID: survivingBatchId,
            Qty: batchDeductQty,
          })
        } else {
          const lotBatches = storageManagerBatchRepo.getBatchesByStorageManagerIdOrderedByDOT(row.Id)
          let drainedFromBatches = 0

          for (const batch of lotBatches) {
            if (drainedFromBatches >= deductQty) break

            const batchDeductQty = Math.min(batch.Qty, deductQty - drainedFromBatches)
            if (batchDeductQty <= 0) continue

            const survivingBatchId = deductBatchQty(batch, batchDeductQty)
            drainedFromBatches += batchDeductQty
            fifoTracker.consume(batch.Id, batchDeductQty)

            drainedForLot.push({
              StorageManagerBatchID: survivingBatchId,
              Qty: batchDeductQty,
            })
          }
        }

        storageManagerRepo.updateStorageManager(row.Id, {
          ...row,
          Qty: Number(row.Qty ?? 0) - deductQty,
        })

        remainingToAllocate -= deductQty
        fulfilledFromStock += deductQty

        const drainedThroughBatches = drainedForLot.reduce((sum, d) => sum + d.Qty, 0)
        const lotOnlyQty = deductQty - drainedThroughBatches

        if (lotOnlyQty > 0) {
          drainedForLot.push({
            StorageManagerBatchID: null,
            Qty: lotOnlyQty,
          })
        }

        // Spread this lot's take-now across its drained entries, oldest-drained
        // first, so the delivery lines inherit the exact tyres taken now.
        let lotTakeNowRemaining = lotTakeNow

        drainedAllocations.push(
          ...drainedForLot.map((drained) => {
            const takenNowQty =
              lotTakeNow === null
                ? null
                : Math.min(Math.max(lotTakeNowRemaining, 0), drained.Qty)
            if (lotTakeNow !== null) lotTakeNowRemaining -= takenNowQty

            return {
              StorageManagerID: row.Id,
              StorageManagerBatchID: drained.StorageManagerBatchID,
              Qty: drained.Qty,
              TakeNowQty: takenNowQty,
            }
          }),
        )
      }

      // Auto buckets (no lot picked) drain the remaining requested qty FIFO by DOT,
      // oldest to newest, across all of the tyre's batches.
      const autoRequested = line.Allocations
        .filter((allocation) => allocation.StorageManagerID === null)
        .reduce((sum, allocation) => sum + allocation.Qty, 0)
      let remainingAuto = Math.min(autoRequested, remainingToAllocate)

      if (remainingAuto > 0) {
        const batchRows = storageManagerBatchRepo.getBatchesByTyreIdOrderedByDOT(line.TyreID)

        for (const batch of batchRows) {
          if (remainingAuto <= 0) break

          const deductQty = Math.min(remainingAuto, Number(batch.Qty ?? 0))
          if (deductQty <= 0) continue

          const lot = storageManagerRepo.getStorageManagerById(batch.StorageManagerID)
          if (!lot) continue

          const survivingBatchId = deductBatchQty(batch, deductQty)
          fifoTracker.consume(batch.Id, deductQty)

          storageManagerRepo.updateStorageManager(batch.StorageManagerID, {
            ...lot,
            Qty: Number(lot.Qty ?? 0) - deductQty,
          })

          remainingAuto -= deductQty
          fulfilledFromStock += deductQty
          drainedAllocations.push({
            StorageManagerID: batch.StorageManagerID,
            StorageManagerBatchID: survivingBatchId,
            Qty: deductQty,
            TakeNowQty: null,
          })
        }

        // Legacy lots that have no batch rows yet (pre-batch stock) are drained
        // oldest-first by lot, so their stock is not left stranded.
        if (remainingAuto > 0) {
          const legacyRows = storageManagerRepo.getStorageManagersByTyreIdWithoutBatches(line.TyreID)

          for (const row of legacyRows) {
            if (remainingAuto <= 0) break

            const deductQty = Math.min(remainingAuto, Number(row.Qty ?? 0))
            if (deductQty <= 0) continue

            storageManagerRepo.updateStorageManager(row.Id, {
              ...row,
              Qty: Number(row.Qty ?? 0) - deductQty,
            })

            remainingAuto -= deductQty
            fulfilledFromStock += deductQty
            drainedAllocations.push({
              StorageManagerID: row.Id,
              StorageManagerBatchID: null,
              Qty: deductQty,
            })
          }
        }
      }

      const realNeedToOrderQty = line.Qty - fulfilledFromStock


      const createdSoTyre = soTyresRepo.createSoTyre({
        SoID: so.SoID,
        TyreID: line.TyreID,
        Price: line.Price,
        Discount: line.Discount,
        Qty: line.Qty,
        NeedToOrderQty: realNeedToOrderQty,
        IsAdminApproved: line.IsAdminApproved,
      })

      const discountViolation = discountViolations.get(index)
      if (discountViolation) {
        recordDiscountViolation({
          so,
          soTyre: createdSoTyre,
          line,
          violation: discountViolation,
          ctx,
        })
      }

      recordSkippedOldStockViolation({
        so,
        soTyre: createdSoTyre,
        line,
        violations: fifoViolations,
        ctx,
      })

      const createdAllocations = []
      for (const allocation of drainedAllocations) {
        const createdAllocation = soAllocationRepo.createAllocation({
          SoTyreID: createdSoTyre.ID || createdSoTyre.Id,
          StorageManagerID: allocation.StorageManagerID,
          StorageManagerBatchID: allocation.StorageManagerBatchID,
          Qty: allocation.Qty
        })
        createdAllocations.push({
          ...createdAllocation,
          TakeNowQty: allocation.TakeNowQty ?? null,
        })
      }

      // Take-now: null means "auto" (everything fulfilled from stock leaves at
      // creation); anything to-order stays reserved for a later hand-over.
      const collectableQty = createdAllocations.reduce((sum, allocation) => sum + allocation.Qty, 0)
      const takeNowQty = line.TakeNowQty === null ? collectableQty : line.TakeNowQty

      if (takeNowQty > collectableQty) {
        throw new Error(
          `Take now qty (${takeNowQty}) exceeds the ${collectableQty} in stock on line ${rowNumber}`,
        )
      }

      // Per-lot take-now wins when the caller tagged allocations explicitly;
      // otherwise fall back to the line-level greedy walk (oldest allocation
      // first) so existing callers keep working unchanged. Mixed tagging is
      // treated as "per-lot mode": untagged lots take nothing.
      let takeNowRemaining = takeNowQty
      for (const allocation of createdAllocations) {
        const takenQty =
          allocation.TakeNowQty === null
            ? hasPerLotTakeNow
              ? 0
              : Math.min(Math.max(takeNowRemaining, 0), allocation.Qty)
            : allocation.TakeNowQty

        if (allocation.TakeNowQty === null && !hasPerLotTakeNow) takeNowRemaining -= takenQty
        if (takenQty <= 0) continue

        initialDeliveryLines.push({
          SoTyreID: createdSoTyre.ID || createdSoTyre.Id,
          TyreID: line.TyreID,
          SoTyreStorageAllocationID: allocation.Id,
          StorageManagerID: allocation.StorageManagerID,
          StorageManagerBatchID: allocation.StorageManagerBatchID,
          Qty: takenQty,
          Amount: calculateDeliveredLineAmount(line, takenQty),
        })
      }

      return createdSoTyre
    })

    const linesToOrder = lineItems.filter((line) => line.NeedToOrderQty > 0)
    let po = null
    let poTyres = []
    let poBatteries = []

    if (linesToOrder.length > 0) {
      const poStatusId = getStatusId('PENDING')

      po = poRepo.createPO({
        SoID: so.SoID,
        Category: isBattery ? "battery" : "tyre",
        StatusID: poStatusId,
        IsAdminApproved: 0,
        IsSupplierApproved: 0,
        Date: so.Date,
      })

      if (isBattery) {
        poBatteries = linesToOrder.map((line) =>
          poBatteriesRepo.createPoBattery({
            POID: po.ID,
            BatteryID: line.BatteryID,
            Price: line.Price,
            Discount: line.Discount,
            Qty: line.NeedToOrderQty,
            IsAdminApproved: 0,
            StatusID: poStatusId,
          }),
        )
      } else {
        poTyres = linesToOrder.map((line) =>
          poTyresRepo.createPoTyre({
            POID: po.ID,
            TyreID: line.TyreID,
            Price: line.Price,
            Discount: line.Discount,
            Qty: line.NeedToOrderQty,
            IsAdminApproved: 0,
            StatusID: poStatusId,
          }),
        )
      }
    }

    let delivery = null
    if (initialDeliveryLines.length > 0) {
      delivery = soDeliveryRepo.createDelivery({
        SoID: so.SoID,
        DeliveryDate: so.Date,
        GatePassNo: null,
        Notes: null,
      })

      for (const line of initialDeliveryLines) {
        soDeliveryLineRepo.createDeliveryLine({ ...line, SODeliveryID: delivery.ID })
      }
      delivery = maybeIssueGatePass(delivery, ctx)
    }

    const snapshot = exports.getSOById(so.SoID)

    soAuditLogService.recordSOAction({
      action: AUDIT_ACTIONS.CREATE,
      soId: so.SoID,
      before: null,
      after: snapshot,
      ctx,
    })

    return {
      so,
      customerLink,
      lineItems,
      po,
      poTyres,
      poBatteries,
      delivery: delivery
        ? decorateDeliveryWithGatePass(so.SoID, delivery.ID)
        : null,
    }
  })

  return createTransaction()
}

exports.recomputeSoPaymentStatus = (soId) => {
  const normalizedSoId = normalizeSOId(soId)
  const existingSo = soRepo.getSOById(normalizedSoId)
  if (!existingSo) throw new Error("Sales Order not found")

  const updatedSoDetails = exports.getSOById(normalizedSoId)
  const isBattery = (updatedSoDetails.Category || "tyre") === "battery"
  const payableTotal = calculatePayableTotal(isBattery ? updatedSoDetails.Batteries : updatedSoDetails.Tyres)
  const settledAmount = calculateSettledAmountFromAggregatedPaymentsArray(updatedSoDetails.Payments)
  const newIsPaymentCompleted = settledAmount >= payableTotal - 0.01 ? 1 : 0

  if (existingSo.IsPaymentCompleted !== newIsPaymentCompleted) {
    soRepo.updateSO(normalizedSoId, {
      ...existingSo,
      IsPaymentCompleted: newIsPaymentCompleted,
    })
  }

  return exports.getSOById(normalizedSoId)
}

exports.makeAPaymentForSo = (soId, paymentPayload, ctx) => {
  const makePaymentTransaction = db.transaction(() => {
    const normalizedSoId = normalizeSOId(soId);
    const existingSo = soRepo.getSOById(normalizedSoId);

    if (!existingSo) {
      throw new Error("Sales Order not found");
    }

    const before = exports.getSOById(normalizedSoId);
    const normalizedPayment = normalizePaymentPayload(paymentPayload);
    if (!normalizedPayment) {
      throw new Error("Payment payload is required.");
    }

    // Process the new payment (creates generic Payment, SOPayment link, and specific detail)
    processSOPayment(normalizedSoId, normalizedPayment);

    // Synchronize invoice settlements with newly added payments for this SO
    invoiceSettlementService.syncInvoiceSettlementsForSO(normalizedSoId);

    // Re-fetch SO details to get all payments and lines, including the newly added one
    const updatedSoDetails = exports.getSOById(normalizedSoId); // Call the service's own method

    // Recalculate IsPaymentCompleted
    const isBattery = (updatedSoDetails.Category || "tyre") === "battery"
    const payableTotal = calculatePayableTotal(isBattery ? updatedSoDetails.Batteries : updatedSoDetails.Tyres);
    const currentSettledAmount = calculateSettledAmountFromAggregatedPaymentsArray(updatedSoDetails.Payments);
    const newIsPaymentCompleted = (currentSettledAmount >= (payableTotal - 0.01)) ? 1 : 0;

    // Update the SO's IsPaymentCompleted status
    if (existingSo.IsPaymentCompleted !== newIsPaymentCompleted) {
      soRepo.updateSO(normalizedSoId, {
        ...existingSo, // Keep existing fields
        IsPaymentCompleted: newIsPaymentCompleted,
      });
    } else {
      existingSo.IsPaymentCompleted = newIsPaymentCompleted
    }

    const after = exports.getSOById(normalizedSoId);

    soAuditLogService.recordSOAction({
      action: AUDIT_ACTIONS.PAYMENT,
      soId: normalizedSoId,
      eventData: normalizedPayment,
      before,
      after,
      ctx,
    });

    // A settled payment can complete the coverage for hand-overs that are
    // already recorded, so release their gate passes in the same transaction.
    exports.tryIssuePendingGatePasses(normalizedSoId, ctx);

    return { success: true, soId: normalizedSoId, isPaymentCompleted: newIsPaymentCompleted };
  });

  return makePaymentTransaction();
};

/**
 * Marks a specific cheque payment as collected and updates the SO's overall payment status.
 */
exports.completeChequePayment = (soId, paymentId, ctx) => {
  const completePaymentTransaction = db.transaction(() => {
    const normalizedSoId = normalizeSOId(soId);
    const normalizedPaymentId = normalizePositiveId(paymentId, "PaymentID");

    // Ensure Sales Order exists
    const existingSo = soRepo.getSOById(normalizedSoId);
    if (!existingSo) {
      throw new Error("Sales Order not found");
    }

    // Verify the payment belongs to this Sales Order via the SOPayments link table
    const soPayments = soPaymentRepo.getSOPaymentsBySoId(normalizedSoId);
    const isLinked = soPayments.some((p) => p.PaymentID === normalizedPaymentId);
    if (!isLinked) {
      throw new Error("Cheque payment not found for this Sales Order");
    }

    // Ensure it is a cheque payment and retrieve current details
    const chequePayment = chequePaymentRepo.getChequePaymentByPaymentId(normalizedPaymentId);
    if (!chequePayment) {
      throw new Error("Cheque payment details not found");
    }

    const before = exports.getSOById(normalizedSoId);

    // Mark as collected if not already done
    if (chequePayment.Collected !== 1) {
      chequePaymentRepo.updateChequePaymentByPaymentId(normalizedPaymentId, {
        ...chequePayment,
        Collected: 1,
      });
    }

    // Synchronize invoice settlements for this now-collected cheque payment
    invoiceSettlementService.syncInvoiceSettlementsForSO(normalizedSoId);

    // Re-fetch fully aggregated SO details to leverage existing calculation logic
    const updatedSoDetails = exports.getSOById(normalizedSoId);

    // Recalculate if the SO is now fully paid including the newly collected cheque
    const isBattery = (updatedSoDetails.Category || "tyre") === "battery"
    const payableTotal = calculatePayableTotal(isBattery ? updatedSoDetails.Batteries : updatedSoDetails.Tyres);
    const settledAmount = calculateSettledAmountFromAggregatedPaymentsArray(updatedSoDetails.Payments);
    const newIsPaymentCompleted = settledAmount >= payableTotal - 0.01 ? 1 : 0;

    // Update the SO record if the payment status has changed
    if (existingSo.IsPaymentCompleted !== newIsPaymentCompleted) {
      soRepo.updateSO(normalizedSoId, {
        ...existingSo,
        IsPaymentCompleted: newIsPaymentCompleted,
      });
    } else {
      existingSo.IsPaymentCompleted = newIsPaymentCompleted
    }

    // A collected cheque is settled money, so it can release withheld passes.
    exports.tryIssuePendingGatePasses(normalizedSoId, ctx);

    const after = exports.getSOById(normalizedSoId);

    soAuditLogService.recordSOAction({
      action: AUDIT_ACTIONS.CHEQUE_COLLECTED,
      soId: normalizedSoId,
      eventData: {
        PaymentID: normalizedPaymentId,
        ChequeNumber: chequePayment.ChequeNumber,
        Amount: chequePayment.Amount,
        Collected: 1,
      },
      before,
      after,
      ctx,
    });

    return {
      success: true,
      soId: normalizedSoId,
      paymentId: normalizedPaymentId,
      isPaymentCompleted: newIsPaymentCompleted,
      remainingAmount: updatedSoDetails.RemainingAmount,
    };
  });

  return completePaymentTransaction();
};

/**
 * Marks a Sales Order as completed by setting IsCompleted to 1.
 */
exports.completeSO = (soId, ctx) => {
  const normalizedSoId = normalizeSOId(soId);

  const completeTransaction = db.transaction(() => {
    const existingSo = soRepo.getSOById(normalizedSoId);

    if (!existingSo) {
      throw new Error("SO not found");
    }

    const before = exports.getSOById(normalizedSoId);

    const updated = soRepo.updateSO(normalizedSoId, {
      ...existingSo,
      IsCompleted: 1,
    });

    if (!updated) {
      throw new Error("Failed to mark SO as completed");
    }

    const after = exports.getSOById(normalizedSoId);

    soAuditLogService.recordSOAction({
      action: AUDIT_ACTIONS.COMPLETE,
      soId: normalizedSoId,
      eventData: { IsCompleted: 1 },
      before,
      after,
      ctx,
    });

    return { success: true, soId: normalizedSoId, isCompleted: 1 };
  });

  const result = completeTransaction();

  try {
    invoiceService.generateInvoiceFromSO(normalizedSoId, ctx);
  } catch (invoiceError) {
    console.error(
      `Failed to auto-generate invoice for SO ${normalizedSoId}:`,
      invoiceError
    );
  }

  return result;
};

exports.updateSO = (soId, payload, ctx) => {
  const normalizedId = normalizeSOId(soId)
  const before = exports.getSOById(normalizedId)
  const so = toSOPayload(payload)
  const updatedSO = soRepo.updateSO(normalizedId, so)

  if (!updatedSO) {
    throw new Error("SO not found")
  }

  const after = exports.getSOById(normalizedId)

  soAuditLogService.recordSOAction({
    action: AUDIT_ACTIONS.UPDATE,
    soId: normalizedId,
    before,
    after,
    ctx,
  })

  return updatedSO
}

exports.deleteSO = (soId, ctx) => {
  const normalizedId = normalizeSOId(soId)

  const deleteTransaction = db.transaction(() => {
    const before = exports.getSOById(normalizedId)
    const isBattery = (before?.Category || "tyre") === "battery"

    if (isBattery) {
      const soBatteries = soBatteriesRepo.getSoBatteriesBySoId?.(normalizedId) || []

      soBatteries.forEach((soBattery) => {
        const allocations = soBatteryAllocationRepo.getAllocationsBySoBatteryId(soBattery.ID)

        allocations.forEach((allocation) => {
          if (allocation.BatteryStorageManagerID) {
            const lot = batteryStorageManagerRepo.getBatteryStorageManagerById(allocation.BatteryStorageManagerID)
            if (lot) {
              batteryStorageManagerRepo.updateBatteryStorageManager(lot.Id, {
                ...lot,
                Qty: Number(lot.Qty ?? 0) + allocation.Qty,
              })
            }
          }
          if (allocation.BatteryStorageManagerBatchID) {
            const batch = batteryStorageManagerBatchRepo.getBatchById(allocation.BatteryStorageManagerBatchID)
            if (batch) {
              batteryStorageManagerBatchRepo.updateBatteryStorageManagerBatch(batch.Id, {
                ...batch,
                Qty: Number(batch.Qty ?? 0) + allocation.Qty,
              })
            }
          }
        })

        soBatteryAllocationRepo.deleteAllocation(soBattery.ID)
      })
    } else {
      const soTyres = soTyresRepo.getSoTyresBySoId?.(normalizedId) || []

      soTyres.forEach((soTyre) => {
        const allocations = soAllocationRepo.getAllocationsBySoTyreId(soTyre.ID)

        allocations.forEach((allocation) => {
          storageManagerService.restoreTyreStockToStorage(soTyre.TyreID, allocation.Qty, {
            storageManagerId: allocation.StorageManagerID,
            storageManagerBatchId: allocation.StorageManagerBatchID,
          })
        })

        soAllocationRepo.deleteAllocationsBySoTyreId(soTyre.ID)
      })
    }

    const po = poRepo.getPOBySoId(normalizedId)

    if (po) {
      // Fix: Delete supplier allocations before deleting the PO tyre lines
      const poTyres = poTyresRepo.getPoTyresByPoId(po.ID)
      poTyres.forEach((t) => {
        poTyresSuppliersRepo.deletePoTyresSuppliersByPoTyresId(t.ID || t.Id)
        poTyreAllocationsRepo.deleteAllocationsByPoTyresId(t.ID || t.Id)
      })
      poTyreAllocationsRepo.deleteAllocationsByPoId(po.ID)
      poTyresRepo.deletePoTyresByPoId(po.ID)
      poRepo.deletePOBySoId(normalizedId)
    }

    const payments = soPaymentRepo.getSOPaymentsBySoId(normalizedId)
    payments.forEach((payment) => {
      const cheque = chequePaymentRepo.getChequePaymentByPaymentId(payment.PaymentID)
      if (cheque) {
        const chequeReceipts = chequePaymentReceiptRepo.getChequePaymentReceiptsByChequePaymentId(cheque.ID)
        chequeReceipts.forEach((receipt) => {
          if (receipt.ReceiptPath) {
            paymentReceiptService.deleteReceipt({
              ReceiptPath: receipt.ReceiptPath,
              ReceiptEncIV: receipt.ReceiptEncIV,
              ReceiptEncAuthTag: receipt.ReceiptEncAuthTag,
              ReceiptEncKey: receipt.ReceiptEncKey,
            })
          }
        })
        chequePaymentReceiptRepo.deleteChequePaymentReceiptsByChequePaymentId(cheque.ID)
        const chequeReminders = chequePaymentRepo.getChequeReminderByChequeId(cheque.ID)
        chequePaymentRepo.deleteChequeReminderByChequeId(cheque.ID)
        chequeReminders.forEach((cr) => {
          if (cr.ReminderID) {
            reminderRepo.deleteReminder(cr.ReminderID)
          }
        })
      }
      chequePaymentRepo.deleteChequePaymentByPaymentId(payment.PaymentID)
      const cashRow = cashPaymentRepo.getCashPaymentByPaymentId(payment.PaymentID)
      if (cashRow && cashRow.ReceiptPath) {
        paymentReceiptService.deleteReceipt({
          ReceiptPath: cashRow.ReceiptPath,
          ReceiptEncIV: cashRow.ReceiptEncIV,
          ReceiptEncAuthTag: cashRow.ReceiptEncAuthTag,
          ReceiptEncKey: cashRow.ReceiptEncKey,
        })
      }
      cashPaymentRepo.deleteCashPaymentByPaymentId(payment.PaymentID)
      const bankTransferRow = bankTransferPaymentService.getBankTransferPaymentByPaymentId(payment.PaymentID)
      if (bankTransferRow && bankTransferRow.ReceiptPath) {
        paymentReceiptService.deleteReceipt({
          ReceiptPath: bankTransferRow.ReceiptPath,
          ReceiptEncIV: bankTransferRow.ReceiptEncIV,
          ReceiptEncAuthTag: bankTransferRow.ReceiptEncAuthTag,
          ReceiptEncKey: bankTransferRow.ReceiptEncKey,
        })
      }
      bankTransferPaymentService.deleteBankTransferPaymentByPaymentId(payment.PaymentID)
    })

    soPaymentRepo.deleteSOPaymentsBySoId(normalizedId)

    payments.forEach((payment) => {
      if (payment.PaymentID) {
        paymentRepo.deletePaymentById(payment.PaymentID);
      }
    });

    manufactureOrderRepo.deleteManufactureOrdersBySoId(normalizedId)
    soReminderRepo.deleteSORemindersBySoId(normalizedId)
    inquiryRepo.clearConvertedSOIDBySoId(normalizedId)
    soCustomerRepo.deleteSoCustomersBySoId(normalizedId)
    soWalkinLinkRepo.unlinkSoWalkin(normalizedId)
    soTyreReturnRepo.deleteReturnsBySoId(normalizedId)
    soTyresRepo.deleteSoTyresBySoId(normalizedId)

    soAuditLogService.recordSOAction({
      action: AUDIT_ACTIONS.DELETE,
      soId: normalizedId,
      before,
      after: null,
      ctx,
    })

    return soRepo.deleteSO(normalizedId)
  })

  const result = deleteTransaction()

  if (result.changes === 0) {
    throw new Error("SO not found")
  }

  return { success: true }
}

exports.createSoTyreReturn = (soId, payload, ctx) => {
  return salesReturnService.createLegacyRequest(soId, payload, ctx)
}

exports.getReturnsBySoId = (soId) => {
  const normalizedSoId = normalizeSOId(soId)
  return soTyreReturnRepo.getReturnsBySoId(normalizedSoId)
}
