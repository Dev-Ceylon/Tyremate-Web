const db = require("../database/connection")
const creditNoteRepo = require("../repositories/creditNoteRepository")
const refundRepo = require("../repositories/refundRepository")
const customerCreditRepo = require("../repositories/customerCreditRepository")
const invoiceRepo = require("../repositories/invoiceRepository")
const salesReturnRepo = require("../repositories/salesReturnRepository")
const salesReturnLineRepo = require("../repositories/salesReturnLineRepository")
const soRepo = require("../repositories/soRepository")
const soTyresRepo = require("../repositories/soTyresRepository")
const invoiceService = require("./invoiceService")
const srRepo = require("../repositories/salesReturnRepository")
const { getSalesReturnStatusIdByCode, SALES_RETURN_STATUS_CODES } = require("../constants/salesReturnConstants")
const {
  CREDIT_NOTE_STATUS_CODES,
  CREDIT_NOTE_REASON_CODES,
  CREDIT_NOTE_SOURCE_CODES,
  REFUND_METHOD_CODES,
  REFUND_STATUS_CODES,
  getCreditNoteStatusIdByCode,
  getCreditNoteReasonIdByCode,
  getCreditNoteSourceIdByCode,
  getRefundMethodIdByCode,
  getRefundStatusIdByCode,
} = require("../constants/creditNoteConstants")
const { getInvoiceStatusIdByCode } = require("../constants/invoiceConstants")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }
  return parsed
}

const normalizeAmount = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`)
  }
  return parsed
}

const getActorId = (actor) => {
  const value = actor && typeof actor === "object" ? (actor.user?.id ?? actor.changedBy) : actor
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * Generate credit note number
 */
const generateCreditNoteNo = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `CN-${year}-${random}`
}

/**
 * Generate refund number
 */
const generateRefundNo = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `RF-${year}-${random}`
}

/**
 * Build credit note payload from sales return (synchronous - better-sqlite3 is sync)
 */
const buildCreditNoteFromSalesReturn = (salesReturnId) => {
  const salesReturn = salesReturnRepo.getSalesReturnById(salesReturnId)
  if (!salesReturn) {
    throw new Error(`Sales Return with ID ${salesReturnId} not found`)
  }

  if (!salesReturn.InvoiceID) {
    throw new Error(`Sales Return ${salesReturnId} is not linked to an invoice`)
  }

  const invoice = invoiceRepo.getInvoiceById(salesReturn.InvoiceID)
  if (!invoice) {
    throw new Error(`Invoice ${salesReturn.InvoiceID} not found`)
  }

  const lines = salesReturnLineRepo.getSalesReturnLinesBySalesReturnId(salesReturnId)
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error(`No lines found for Sales Return ${salesReturnId}`)
  }

  // Get lookup IDs
  const statusRequestedId = getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.REQUESTED)
  if (!statusRequestedId) throw new Error('CreditNoteStatus REQUESTED not initialized')

  const reasonCode = salesReturn.ReasonCode || CREDIT_NOTE_REASON_CODES.RETURN_UNUSED
  const reasonId = getCreditNoteReasonIdByCode(reasonCode)
  if (!reasonId) throw new Error(`CreditNoteReason ${reasonCode} not initialized`)

  const sourceId = getCreditNoteSourceIdByCode(CREDIT_NOTE_SOURCE_CODES.SALES_RETURN)
  if (!sourceId) throw new Error('CreditNoteSource SALES_RETURN not initialized')

  // Calculate amounts
  let subTotal = 0
  let taxAmount = 0
  const creditNoteLines = []

  for (const line of lines) {
    if (line.Approved !== 1) continue
    const qty = line.ReturnedQty || line.Qty || 0
    if (qty <= 0) continue

    const unitPrice = line.UnitPrice || line.Price || 0
    const discount = line.Discount || 0
    const lineSubTotal = qty * unitPrice * (1 - discount / 100)

    // Invoice stores aggregate tax, so derive an effective rate when no explicit
    // rate is available and apply it to the approved returned line value.
    const taxableInvoiceBase = Math.max(0, Number(invoice.Subtotal || 0) - Number(invoice.DiscountTotal || 0))
    const taxRate = Number(invoice.TaxRate ?? (taxableInvoiceBase > 0 ? (Number(invoice.TaxAmount || 0) / taxableInvoiceBase) * 100 : 0))
    const lineTaxAmount = lineSubTotal * (taxRate / 100)

    subTotal += lineSubTotal
    taxAmount += lineTaxAmount

    creditNoteLines.push({
      TyreID: line.TyreID,
      Description: line.Description || `${line.Brand || ''} ${line.Size || ''} ${line.Pattern || ''}`.trim(),
      Qty: qty,
      UnitPrice: unitPrice,
      Discount: discount,
      TaxRate: taxRate,
      TaxAmount: lineTaxAmount,
      LineAmount: lineSubTotal + lineTaxAmount,
      TyreSerialNo: line.SerialNo || null,
      AllocationId: line.AllocationId || null,
    })
  }

  if (creditNoteLines.length === 0) {
    throw new Error('No valid lines to create credit note')
  }

  const totalAmount = subTotal + taxAmount

  return {
    CreditNoteNo: generateCreditNoteNo(),
    InvoiceID: salesReturn.InvoiceID,
    SalesReturnID: salesReturnId,
    CustomerID: invoice.CustomerID,
    SourceTypeId: getCreditNoteSourceIdByCode(CREDIT_NOTE_SOURCE_CODES.SALES_RETURN),
    ReasonId: getCreditNoteReasonIdByCode(salesReturn.ReasonCode || CREDIT_NOTE_REASON_CODES.RETURN_UNUSED),
    StatusId: getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.REQUESTED),
    SubTotal: subTotal,
    TaxAmount: taxAmount,
    TotalAmount: totalAmount,
    CurrencyCode: 'LKR',
    ExchangeRate: 1,
    Notes: `Auto-generated from Sales Return ${salesReturn.ReturnNo}`,
    RequestedBy: null, // will be set by caller
    Lines: creditNoteLines,
  }
}

/**
 * Create credit note from sales return
 */
exports.createCreditNoteFromSalesReturn = (salesReturnId, requestedBy = null) => {
  requestedBy = getActorId(requestedBy)
  const existing = creditNoteRepo.getCreditNotesBySalesReturnId(salesReturnId)
  if (existing.length > 0) return existing[0]

  const tx = db.transaction(() => {
    const createdDuringRetry = creditNoteRepo.getCreditNotesBySalesReturnId(salesReturnId)
    if (createdDuringRetry.length > 0) return createdDuringRetry[0]
    const cnPayload = buildCreditNoteFromSalesReturn(salesReturnId)
    cnPayload.RequestedBy = requestedBy

    // Create credit note header
    const creditNote = creditNoteRepo.createCreditNote(cnPayload)

    // Create lines
    for (const line of cnPayload.Lines) {
      creditNoteRepo.createCreditNoteLine({
        CreditNoteID: creditNote.CreditNoteID,
        TyreID: line.TyreID,
        Description: line.Description,
        Qty: line.Qty,
        UnitPrice: line.UnitPrice,
        Discount: line.Discount,
        TaxRate: line.TaxRate,
        TaxAmount: line.TaxAmount,
        LineAmount: line.LineAmount,
        TyreSerialNo: line.TyreSerialNo,
        AllocationId: line.AllocationId,
      })
    }

    return creditNoteRepo.getCreditNoteById(creditNote.CreditNoteID)
  })

  return tx()
}

/**
 * Create manual credit note (not from sales return)
 */
exports.createCreditNote = (payload) => {
  const tx = db.transaction(() => {
    // Validate required fields
    if (!payload.InvoiceID) throw new Error('InvoiceID is required')
    if (!payload.CustomerID) throw new Error('CustomerID is required')
    if (!payload.SourceTypeId) throw new Error('SourceTypeId is required')
    if (!payload.ReasonId) throw new Error('ReasonId is required')

    const statusRequestedId = getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.REQUESTED)
    if (!statusRequestedId) throw new Error('CreditNoteStatus REQUESTED not initialized')

    const creditNote = creditNoteRepo.createCreditNote({
      CreditNoteNo: generateCreditNoteNo(),
      InvoiceID: payload.InvoiceID,
      SalesReturnID: payload.SalesReturnID ?? null,
      CustomerID: payload.CustomerID,
      SourceTypeId: payload.SourceTypeId,
      ReasonId: payload.ReasonId,
      StatusId: getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.REQUESTED),
      SubTotal: payload.SubTotal ?? 0,
      TaxAmount: payload.TaxAmount ?? 0,
      TotalAmount: payload.TotalAmount ?? 0,
      CurrencyCode: payload.CurrencyCode ?? 'LKR',
      ExchangeRate: payload.ExchangeRate ?? 1,
      Notes: payload.Notes ?? null,
      RequestedBy: payload.RequestedBy ?? null,
    })

    if (Array.isArray(payload.Lines)) {
      for (const line of payload.Lines) {
        creditNoteRepo.createCreditNoteLine({
          CreditNoteID: creditNote.CreditNoteID,
          TyreID: line.TyreID ?? null,
          Description: line.Description,
          Qty: line.Qty,
          UnitPrice: line.UnitPrice ?? 0,
          Discount: line.Discount ?? 0,
          TaxRate: line.TaxRate ?? 0,
          TaxAmount: line.TaxAmount ?? 0,
          LineAmount: line.LineAmount ?? 0,
          TyreSerialNo: line.TyreSerialNo ?? null,
          AllocationId: line.AllocationId ?? null,
        })
      }
    }

    return creditNoteRepo.getCreditNoteById(creditNote.CreditNoteID)
  })

  return tx()
}

/**
 * Get credit note with lines
 */
exports.getCreditNoteWithLines = (creditNoteId) => {
  const creditNote = creditNoteRepo.getCreditNoteById(creditNoteId)
  if (!creditNote) return null

  const lines = creditNoteRepo.getCreditNoteLines(creditNoteId)
  return { ...creditNote, Lines: lines }
}

/**
 * Get credit notes by invoice
 */
exports.getCreditNotesByInvoiceId = (invoiceId) => {
  return creditNoteRepo.getCreditNotesByInvoiceId(invoiceId)
}

/**
 * Get credit notes by sales return
 */
exports.getCreditNotesBySalesReturnId = (salesReturnId) => {
  return creditNoteRepo.getCreditNotesBySalesReturnId(salesReturnId)
}

/**
 * Update credit note status
 */
exports.updateCreditNoteStatus = (creditNoteId, statusCode, payload = {}) => {
  const statusId = getCreditNoteStatusIdByCode(statusCode)
  if (!statusId) throw new Error(`CreditNoteStatus ${statusCode} not initialized`)

  return creditNoteRepo.updateCreditNoteStatus(creditNoteId, statusId, payload)
}

/**
 * Approve credit note - triggers financial impact
 */
exports.approveCreditNote = async (creditNoteId, approvedBy = null) => {
  approvedBy = getActorId(approvedBy)
  const tx = db.transaction(() => {
    const creditNote = creditNoteRepo.getCreditNoteById(creditNoteId)
    if (!creditNote) throw new Error(`Credit Note ${creditNoteId} not found`)

    const currentStatus = creditNote.StatusCode
    if (currentStatus === CREDIT_NOTE_STATUS_CODES.APPROVED) {
      throw new Error('Credit note already approved')
    }
    if (currentStatus === CREDIT_NOTE_STATUS_CODES.CANCELLED) {
      throw new Error('Cannot approve cancelled credit note')
    }
    if (currentStatus !== CREDIT_NOTE_STATUS_CODES.REQUESTED) {
      throw new Error(`Cannot approve credit note in ${currentStatus} status`)
    }

    // 1. Update credit note status
    creditNoteRepo.updateCreditNoteStatus(creditNote.CreditNoteID, getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.APPROVED), {
      ApprovedBy: approvedBy,
      setApprovedDate: true,
    })

    // 2. Update Invoice - reduce balance
    const invoice = invoiceRepo.getInvoiceById(creditNote.InvoiceID)
    if (invoice) {
      const newBalance = Math.max(0, (invoice.BalanceDue || 0) - creditNote.TotalAmount)
      const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid'

      invoiceRepo.updateInvoiceSettlement(creditNote.InvoiceID, {
        AmountPaid: invoice.AmountPaid || 0,
        BalanceDue: newBalance,
        StatusId: getInvoiceStatusIdByCode(newStatus),
      })
    }

    // Approval adjusts the invoice. It does not itself issue a cash refund or store credit.
    if (creditNote.SalesReturnID) {
      const creditIssuedId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.CREDIT_ISSUED)
      if (creditIssuedId) srRepo.updateSalesReturnStatus(creditNote.SalesReturnID, creditIssuedId)
    }

    return creditNoteRepo.getCreditNoteById(creditNote.CreditNoteID)
  })

  return tx()
}

/**
 * Cancel credit note (only if REQUESTED)
 */
exports.cancelCreditNote = (creditNoteId, cancelledBy, reason) => {
  const tx = db.transaction(() => {
    const creditNote = creditNoteRepo.getCreditNoteById(creditNoteId)
    if (!creditNote) throw new Error(`Credit Note ${creditNoteId} not found`)

    if (creditNote.StatusCode !== CREDIT_NOTE_STATUS_CODES.REQUESTED) {
      throw new Error(`Can only cancel credit notes in REQUESTED status, current: ${creditNote.StatusCode}`)
    }

    creditNoteRepo.updateCreditNoteStatus(creditNote.CreditNoteID, getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.CANCELLED), {
      CancelledBy: cancelledBy,
      setCancelledDate: true,
      CancellationReason: reason,
    })

    return creditNoteRepo.getCreditNoteById(creditNote.CreditNoteID)
  })

  return tx()
}

/**
 * Create refund for credit note
 */
exports.createRefund = (payload) => {
  const tx = db.transaction(() => {
    const creditNote = creditNoteRepo.getCreditNoteById(payload.CreditNoteID)
    if (!creditNote) throw new Error(`Credit Note ${payload.CreditNoteID} not found`)

    if (creditNote.StatusCode !== CREDIT_NOTE_STATUS_CODES.APPROVED) {
      throw new Error('Can only create refund for APPROVED credit notes')
    }

    // Check if already fully refunded
    const existingRefunds = refundRepo.getRefundsByCreditNoteId(creditNote.CreditNoteID)
    const totalRefunded = existingRefunds
      .filter(r => r.StatusCode !== REFUND_STATUS_CODES.CANCELLED && r.StatusCode !== REFUND_STATUS_CODES.FAILED)
      .reduce((sum, r) => sum + Number(r.Amount), 0)

    const availableAmount = creditNote.TotalAmount - totalRefunded
    if (payload.Amount > availableAmount + 0.01) { // small tolerance
      throw new Error(`Refund amount ${payload.Amount} exceeds available ${availableAmount}`)
    }

    const pendingStatusId = getRefundStatusIdByCode(REFUND_STATUS_CODES.PENDING)
    const completedStatusId = getRefundStatusIdByCode(REFUND_STATUS_CODES.COMPLETED)
    if (!pendingStatusId || !completedStatusId) throw new Error('RefundStatus PENDING/COMPLETED not initialized')

    // Cash, Card, Bank Transfer, Store Credit = COMPLETED immediately
    // Cheque = PENDING (requires manual completion when cleared)
    const isCheque = payload.MethodId === getRefundMethodIdByCode(REFUND_METHOD_CODES.CHEQUE)
    const initialStatusId = isCheque ? pendingStatusId : completedStatusId

    const refund = refundRepo.createRefund({
      RefundNo: generateRefundNo(),
      CreditNoteID: payload.CreditNoteID,
      SalesReturnID: creditNote.SalesReturnID ?? null,
      CustomerID: creditNote.CustomerID,
      Amount: payload.Amount,
      MethodId: payload.MethodId,
      ReferenceNo: payload.ReferenceNo ?? null,
      StatusId: initialStatusId,
      BankAccountId: payload.BankAccountId ?? null,
      ChequeNo: payload.ChequeNo ?? null,
      ChequeDate: payload.ChequeDate ?? null,
      Notes: payload.Notes ?? null,
    })

    // If refund is completed immediately (non-cheque), update credit note and sales return status
    if (!isCheque) {
      const allRefunds = refundRepo.getRefundsByCreditNoteId(creditNote.CreditNoteID)
      const totalRefunded = allRefunds
        .filter(r => r.StatusCode === REFUND_STATUS_CODES.COMPLETED)
        .reduce((sum, r) => sum + Number(r.Amount), 0)

      if (totalRefunded >= creditNote.TotalAmount - 0.01) {
        creditNoteRepo.updateCreditNoteStatus(creditNote.CreditNoteID, getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.REFUNDED))
        if (creditNote.SalesReturnID) {
          const refundedId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.REFUNDED)
          if (refundedId) srRepo.updateSalesReturnStatus(creditNote.SalesReturnID, refundedId)
        }
      }
    }

    return refundRepo.getRefundById(refund.RefundID)
  })

  return tx()
}

/**
 * Complete refund (mark as completed)
 */
exports.completeRefund = (refundId, processedBy, referenceNo = null) => {
  processedBy = getActorId(processedBy)
  const tx = db.transaction(() => {
    const refund = refundRepo.getRefundById(refundId)
    if (!refund) throw new Error(`Refund ${refundId} not found`)

    if (refund.StatusCode === REFUND_STATUS_CODES.COMPLETED) {
      throw new Error('Refund already completed')
    }
    if (refund.StatusCode === REFUND_STATUS_CODES.CANCELLED || refund.StatusCode === REFUND_STATUS_CODES.FAILED) {
      throw new Error(`Cannot complete refund in ${refund.StatusCode} status`)
    }

    const completedStatusId = getRefundStatusIdByCode(REFUND_STATUS_CODES.COMPLETED)
    if (!completedStatusId) throw new Error('RefundStatus COMPLETED not initialized')

    refundRepo.updateRefundStatus(refund.RefundID, completedStatusId, {
      ProcessedBy: processedBy,
      setProcessedDate: true,
      ReferenceNo: referenceNo,
    })

    // Update credit note status if fully refunded
    const creditNote = creditNoteRepo.getCreditNoteById(refund.CreditNoteID)
    const allRefunds = refundRepo.getRefundsByCreditNoteId(creditNote.CreditNoteID)
    const totalRefunded = allRefunds
      .filter(r => r.StatusCode === REFUND_STATUS_CODES.COMPLETED)
      .reduce((sum, r) => sum + Number(r.Amount), 0)

    if (totalRefunded >= creditNote.TotalAmount - 0.01) {
      creditNoteRepo.updateCreditNoteStatus(creditNote.CreditNoteID, getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.REFUNDED))
      if (creditNote.SalesReturnID) {
        const refundedId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.REFUNDED)
        if (refundedId) srRepo.updateSalesReturnStatus(creditNote.SalesReturnID, refundedId)
      }
    }

    return refundRepo.getRefundById(refund.RefundID)
  })

  return tx()
}

/**
 * Fail refund
 */
exports.failRefund = (refundId, reason) => {
  const failedStatusId = getRefundStatusIdByCode(REFUND_STATUS_CODES.FAILED)
  if (!failedStatusId) throw new Error('RefundStatus FAILED not initialized')

  return refundRepo.updateRefundStatus(refundId, failedStatusId, { Notes: reason })
}

/**
 * Cancel refund (only if PENDING)
 */
exports.cancelRefund = (refundId, reason) => {
  const refund = refundRepo.getRefundById(refundId)
  if (!refund) throw new Error(`Refund ${refundId} not found`)

  if (refund.StatusCode !== REFUND_STATUS_CODES.PENDING) {
    throw new Error(`Can only cancel refunds in PENDING status, current: ${refund.StatusCode}`)
  }

  const cancelledStatusId = getRefundStatusIdByCode(REFUND_STATUS_CODES.CANCELLED)
  if (!cancelledStatusId) throw new Error('RefundStatus CANCELLED not initialized')

  return refundRepo.updateRefundStatus(refundId, cancelledStatusId, { Notes: reason })
}

/**
 * Issue store credit (instead of refund)
 */
exports.issueStoreCredit = async (creditNoteId, issuedBy = null) => {
  issuedBy = getActorId(issuedBy)
  const creditNote = creditNoteRepo.getCreditNoteById(creditNoteId)
  if (!creditNote) throw new Error(`Credit Note ${creditNoteId} not found`)

  if (creditNote.StatusCode !== CREDIT_NOTE_STATUS_CODES.APPROVED) {
    throw new Error('Can only issue store credit for APPROVED credit notes')
  }

  if (!creditNote.CustomerID) throw new Error('Credit note has no customer')

  // Calculate remaining amount after refunds
  const existingRefunds = refundRepo.getRefundsByCreditNoteId(creditNote.CreditNoteID)
  const totalRefunded = existingRefunds
    .filter(r => r.StatusCode !== REFUND_STATUS_CODES.CANCELLED && r.StatusCode !== REFUND_STATUS_CODES.FAILED)
    .reduce((sum, r) => sum + Number(r.Amount), 0)

  const availableAmount = creditNote.TotalAmount - totalRefunded
  if (availableAmount <= 0) {
    throw new Error('No remaining amount to issue as store credit (fully refunded)')
  }

  customerCreditRepo.adjustCustomerCredit(creditNote.CustomerID, availableAmount, 'ISSUED', {
    CreditNoteID: creditNote.CreditNoteID,
    Reference: `Store Credit from ${creditNote.CreditNoteNo}`,
    CreatedBy: issuedBy,
  })

  // Update credit note status
  creditNoteRepo.updateCreditNoteStatus(creditNote.CreditNoteID, getCreditNoteStatusIdByCode(CREDIT_NOTE_STATUS_CODES.CREDITED))
  if (creditNote.SalesReturnID) {
    const refundedId = getSalesReturnStatusIdByCode(SALES_RETURN_STATUS_CODES.REFUNDED)
    if (refundedId) srRepo.updateSalesReturnStatus(creditNote.SalesReturnID, refundedId)
  }

  return customerCreditRepo.getCustomerCredit(creditNote.CustomerID)
}

/**
 * Apply customer credit to invoice
 */
exports.applyCustomerCredit = async (customerId, invoiceId, amount, appliedBy) => {
  const invoice = invoiceRepo.getInvoiceById(invoiceId)
  if (!invoice) throw new Error(`Invoice ${invoiceId} not found`)

  if (invoice.CustomerID !== customerId) {
    throw new Error('Invoice does not belong to this customer')
  }

  const credit = customerCreditRepo.getCustomerCredit(customerId)
  if (!credit || credit.AvailableAmount < amount) {
    throw new Error(`Insufficient credit. Available: ${credit?.AvailableAmount || 0}`)
  }

  const tx = db.transaction(() => {
    // Reduce credit
    customerCreditRepo.adjustCustomerCredit(customerId, amount, 'USED', {
      Reference: `Applied to Invoice ${invoice.InvoiceNumber}`,
      CreatedBy: appliedBy,
    })

    // Update invoice balance
    const newBalance = Math.max(0, (invoice.BalanceDue || 0) - amount)
    const newStatus = newBalance <= 0 ? 'paid' : 'partially_paid'

    invoiceRepo.updateInvoiceSettlement(invoiceId, {
        AmountPaid: invoice.AmountPaid || 0,
        BalanceDue: newBalance,
        StatusId: getInvoiceStatusIdByCode(newStatus),
      })

    return { invoice: invoiceRepo.getInvoiceById(invoiceId), credit: customerCreditRepo.getCustomerCredit(customerId) }
  })

  return tx()
}

/**
 * Get customer credit balance
 */
exports.getCustomerCredit = (customerId) => {
  return customerCreditRepo.getCustomerCredit(customerId)
}

/**
 * Get customer credit transactions
 */
exports.getCustomerCreditTransactions = (customerId, limit = 100) => {
  return customerCreditRepo.getCustomerCreditTransactions(customerId, limit)
}

/**
 * Get refunds by credit note
 */
exports.getRefundsByCreditNoteId = (creditNoteId) => {
  return refundRepo.getRefundsByCreditNoteId(creditNoteId)
}

/**
 * Get refunds by sales return
 */
exports.getRefundsBySalesReturnId = (salesReturnId) => {
  return refundRepo.getRefundsBySalesReturnId(salesReturnId)
}

exports.getRefundMethods = () => db.prepare(`
  SELECT Id AS MethodId, MethodCode, MethodName FROM RefundMethodM WHERE IsActive = 1 ORDER BY SortOrder, Id
`).all()

/**
 * Get pending refunds
 */
exports.getPendingRefunds = () => {
  return refundRepo.getPendingRefunds()
}

/**
 * Get customer credit transactions
 */
exports.getCustomerCreditTransactions = (customerId, limit = 100) => {
  return customerCreditRepo.getCustomerCreditTransactions(customerId, limit)
}
