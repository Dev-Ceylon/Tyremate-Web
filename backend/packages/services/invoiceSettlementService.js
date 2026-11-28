const invoiceRepo = require("../repositories/invoiceRepository")
const invoiceLinkRepo = require("../repositories/invoicePaymentLinkRepository")
const chequePaymentRepo = require("../repositories/chequePaymentRepository")
const soDeliveryRepo = require("../repositories/soDeliveryRepository")
const soPaymentRepo = require("../repositories/soPaymentRepository")
const dagPaymentRepo = require("../repositories/dagPaymentRepository")
const paymentProcessingService = require("./paymentProcessingService")
const { PAYMENT_TYPE_CODES } = require("../constants/paymentTypeConstants")
const {
  INVOICE_STATUS_CODES,
  INVOICE_SOURCE_CODES,
  getInvoiceStatusIdByCode,
  getInvoiceSourceIdByCode,
} = require("../constants/invoiceConstants")

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100

// Status is derived, never client-supplied: unpaid -> issued, full -> paid,
// anything in between -> partially paid. Overdue is computed on read from the
// due date so it stays correct without a scheduled job.
const deriveStatus = (total, amountPaid, isCreditNote) => {
  if (isCreditNote) return INVOICE_STATUS_CODES.ISSUED
  const t = round2(total)
  const a = round2(amountPaid)
  if (a <= 0) return INVOICE_STATUS_CODES.ISSUED
  if (a + 0.005 >= t) return INVOICE_STATUS_CODES.PAID
  return INVOICE_STATUS_CODES.PARTIALLY_PAID
}

// The live (non-credit-note) invoice raised against a source document
// (SO / other service / delivery). Returns null when none exists.
const findInvoiceBySource = (sourceTypeCode, sourceId) => {
  if (!sourceId) return null
  const sourceTypeId = getInvoiceSourceIdByCode(sourceTypeCode)
  if (!sourceTypeId) return null
  return invoiceRepo.getInvoiceBySource(sourceTypeId, sourceId) || null
}

/**
 * Recomputes and updates AmountPaid, BalanceDue, and Status for an invoice
 * based on all settled payments linked to it.
 * A payment link is considered settled if:
 * - Cash or Bank Transfer
 * - Cheque with Collected === 1
 */
const recomputeInvoiceSettlement = (invoiceId) => {
  const invoice = invoiceRepo.getInvoiceById(invoiceId)
  if (!invoice) return null
  if (invoice.IsCreditNote === 1) return null
  if (invoice.StatusId === getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED)) return null

  const links = invoiceLinkRepo.getLinksByInvoiceId(invoiceId) || []
  let totalSettled = 0

  for (const link of links) {
    const summary = paymentProcessingService.getPaymentSummaryById(link.PaymentID)
    if (!summary) continue

    const isSettled =
      summary.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
      summary.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER ||
      (summary.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE && summary.Collected === 1)

    if (isSettled) {
      const linkSettled = Math.min(
        round2(link.AmountApplied || 0),
        round2(summary.Amount || 0)
      )
      totalSettled = round2(totalSettled + Math.max(0, linkSettled))
    }
  }

  const amountPaid = Math.min(round2(invoice.Total ?? 0), round2(totalSettled))
  const balanceDue = Math.max(0, round2((invoice.Total ?? 0) - amountPaid))
  const statusId = getInvoiceStatusIdByCode(
    deriveStatus(invoice.Total ?? 0, amountPaid, false)
  )

  invoiceRepo.updateInvoiceSettlement(invoiceId, {
    AmountPaid: amountPaid,
    BalanceDue: balanceDue,
    StatusId: statusId,
  })

  return invoiceRepo.getInvoiceById(invoiceId)
}

/**
 * Synchronizes all invoice settlements for a Sales Order:
 * 1. Recomputes settlement for all invoices currently linked to any payment belonging to this SO.
 * 2. Gathers all settled payments for this SO and allocates any unallocated settled amounts
 *    to unpaid delivery or SO invoices for this sales order.
 */
const syncInvoiceSettlementsForSO = (soId) => {
  const normalizedSoId = Number(soId)
  if (!normalizedSoId) return

  const soPayments = soPaymentRepo.getSOPaymentsBySoId(normalizedSoId) || []
  if (soPayments.length === 0) return

  // First, recompute settlement on all invoices already linked to any SO payment
  for (const soPayment of soPayments) {
    const links = invoiceLinkRepo.getLinksByPaymentId(soPayment.PaymentID) || []
    for (const link of links) {
      recomputeInvoiceSettlement(link.InvoiceID)
    }
  }

  // Next, identify unpaid invoices for this SO: delivery invoices first, then SO invoice
  const deliverySourceTypeId = getInvoiceSourceIdByCode(INVOICE_SOURCE_CODES.DELIVERY)
  const soSourceTypeId = getInvoiceSourceIdByCode(INVOICE_SOURCE_CODES.SO)
  const deliveries = soDeliveryRepo.getDeliveriesBySoId(normalizedSoId) || []

  const unpaidInvoices = []
  for (const delivery of deliveries) {
    const inv = invoiceRepo.getInvoiceBySource(deliverySourceTypeId, delivery.ID)
    if (
      inv &&
      inv.IsCreditNote === 0 &&
      inv.StatusId !== getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED) &&
      (inv.BalanceDue ?? 0) > 0
    ) {
      unpaidInvoices.push(inv)
    }
  }

  const soInv = invoiceRepo.getInvoiceBySource(soSourceTypeId, normalizedSoId)
  if (
    soInv &&
    soInv.IsCreditNote === 0 &&
    soInv.StatusId !== getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED) &&
    (soInv.BalanceDue ?? 0) > 0
  ) {
    unpaidInvoices.push(soInv)
  }

  if (unpaidInvoices.length === 0) return

  // For each settled payment on this SO, allocate unallocated funds to unpaid invoices
  for (const soPayment of soPayments) {
    const summary = paymentProcessingService.getPaymentSummaryById(soPayment.PaymentID)
    if (!summary) continue

    const isSettled =
      summary.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
      summary.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER ||
      (summary.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE && summary.Collected === 1)

    if (!isSettled) continue

    const paymentAmount = round2(summary.Amount || 0)
    if (paymentAmount <= 0) continue

    const existingLinks = invoiceLinkRepo.getLinksByPaymentId(soPayment.PaymentID) || []
    const alreadyAllocated = existingLinks.reduce((sum, link) => {
      const inv = invoiceRepo.getInvoiceById(link.InvoiceID)
      if (inv && inv.StatusId !== getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED)) {
        return sum + (Number(link.AmountApplied) || 0)
      }
      return sum
    }, 0)

    let unallocated = Math.max(0, round2(paymentAmount - alreadyAllocated))
    if (unallocated <= 0) continue

    for (const targetInvoice of unpaidInvoices) {
      if (unallocated <= 0) break

      const currentInvoice = invoiceRepo.getInvoiceById(targetInvoice.InvoiceID)
      if (!currentInvoice || (currentInvoice.BalanceDue ?? 0) <= 0) continue

      const toApply = round2(Math.min(unallocated, currentInvoice.BalanceDue))
      if (toApply > 0) {
        invoiceLinkRepo.linkPaymentToInvoice({
          InvoiceID: currentInvoice.InvoiceID,
          PaymentID: soPayment.PaymentID,
          AmountApplied: toApply,
        })
        recomputeInvoiceSettlement(currentInvoice.InvoiceID)
        unallocated = round2(unallocated - toApply)
      }
    }
  }
}

/**
 * Synchronizes all invoice settlements for a DAG:
 * 1. Recomputes settlement for all invoices currently linked to any payment belonging to this DAG.
 * 2. Gathers all settled payments for this DAG and allocates any unallocated settled amounts
 *    to an unpaid DAG invoice.
 */
const syncInvoiceSettlementsForDAG = (dagId) => {
  const normalizedDagId = Number(dagId)
  if (!normalizedDagId) return

  const dagPayments = dagPaymentRepo.getDAGPaymentsByDAGId(normalizedDagId) || []
  if (dagPayments.length === 0) return

  for (const dagPayment of dagPayments) {
    const links = invoiceLinkRepo.getLinksByPaymentId(dagPayment.PaymentID) || []
    for (const link of links) {
      recomputeInvoiceSettlement(link.InvoiceID)
    }
  }

  const dagSourceTypeId = getInvoiceSourceIdByCode(INVOICE_SOURCE_CODES.DAG)
  const invoice = invoiceRepo.getInvoiceBySource(dagSourceTypeId, normalizedDagId)
  if (
    !invoice ||
    invoice.IsCreditNote === 1 ||
    invoice.StatusId === getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED) ||
    (invoice.BalanceDue ?? 0) <= 0
  ) {
    return
  }

  let remainingDue = round2(invoice.BalanceDue)
  for (const dagPayment of dagPayments) {
    if (remainingDue <= 0) break

    const summary = paymentProcessingService.getPaymentSummaryById(dagPayment.PaymentID)
    if (!summary) continue

    const isSettled =
      summary.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
      summary.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER ||
      (summary.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE && summary.Collected === 1)

    if (!isSettled) continue

    const totalAmount = round2(summary.Amount || 0)
    const links = invoiceLinkRepo.getLinksByPaymentId(dagPayment.PaymentID) || []
    const alreadyApplied = links.reduce((sum, l) => sum + (Number(l.AmountApplied) || 0), 0)
    const unallocated = Math.max(0, round2(totalAmount - alreadyApplied))

    if (unallocated > 0) {
      const toApply = round2(Math.min(unallocated, remainingDue))
      invoiceLinkRepo.linkPaymentToInvoice({
        InvoiceID: invoice.InvoiceID,
        PaymentID: dagPayment.PaymentID,
        AmountApplied: toApply,
      })
      remainingDue = round2(remainingDue - toApply)
    }
  }

  recomputeInvoiceSettlement(invoice.InvoiceID)
}

/**
 * Synchronizes invoice settlements when a cheque payment is marked as collected.
 * 1. Recomputes settlement for all invoices already linked to this payment.
 * 2. If soId is provided, also synchronizes all SO invoices with any unallocated settled funds.
 * 3. If dagId is provided, also synchronizes DAG invoice with any unallocated settled funds.
 */
const syncInvoiceSettlementOnChequeCollected = (paymentId, soId = null, dagId = null) => {
  const normalizedPaymentId = Number(paymentId)
  if (!normalizedPaymentId) return

  // 1. Recompute all existing linked invoices
  const existingLinks = invoiceLinkRepo.getLinksByPaymentId(normalizedPaymentId) || []
  for (const link of existingLinks) {
    recomputeInvoiceSettlement(link.InvoiceID)
  }

  // 2. If soId is provided, also synchronize all SO invoices with any unallocated settled funds
  if (soId) {
    syncInvoiceSettlementsForSO(soId)
  }

  // 3. If dagId is provided, also synchronize DAG invoices with any unallocated settled funds
  if (dagId) {
    syncInvoiceSettlementsForDAG(dagId)
  }
}

/**
 * Applies one payment to an invoice: records the InvoicePaymentLink and moves
 * AmountPaid by settled payments. Callers must run this inside their own transaction.
 *
 * Cancelled invoices and credit notes are skipped silently so an upstream
 * payment never fails because its invoice was reversed.
 */
const settleInvoicePayment = (invoiceId, { paymentId, nominalAmount = 0, settledDelta = 0 }) => {
  const invoice = invoiceRepo.getInvoiceById(invoiceId)
  if (!invoice) return null
  if (invoice.IsCreditNote === 1) return null
  if (invoice.StatusId === getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED)) return null

  if (paymentId) {
    invoiceLinkRepo.linkPaymentToInvoice({
      InvoiceID: invoiceId,
      PaymentID: paymentId,
      AmountApplied: round2(nominalAmount),
    })
  }

  return recomputeInvoiceSettlement(invoiceId)
}

module.exports = {
  round2,
  deriveStatus,
  findInvoiceBySource,
  recomputeInvoiceSettlement,
  syncInvoiceSettlementsForSO,
  syncInvoiceSettlementsForDAG,
  syncInvoiceSettlementOnChequeCollected,
  settleInvoicePayment,
}
