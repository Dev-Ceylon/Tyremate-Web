const db = require("../database/connection")
const invoiceRepo = require("../repositories/invoiceRepository")
const invoiceLineRepo = require("../repositories/invoiceLineRepository")
const invoiceLinkRepo = require("../repositories/invoicePaymentLinkRepository")
const invoiceCounterRepo = require("../repositories/invoiceCounterRepository")
const customerRepo = require("../repositories/customerRepository")
const soService = require("./soService")
const otherServiceService = require("./otherServiceService")
const paymentProcessingService = require("./paymentProcessingService")
const soPaymentRepo = require("../repositories/soPaymentRepository")
const soDeliveryRepo = require("../repositories/soDeliveryRepository")
const { PAYMENT_TYPE_CODES } = require("../constants/paymentTypeConstants")
const { round2, deriveStatus, findInvoiceBySource, settleInvoicePayment } = require("./invoiceSettlementService")
const {
  INVOICE_STATUS_CODES,
  INVOICE_SOURCE_CODES,
  getInvoiceStatusIdByCode,
  getInvoiceSourceIdByCode,
} = require("../constants/invoiceConstants")

const SOURCE_TYPES = INVOICE_SOURCE_CODES

const INVOICE_STATUS = INVOICE_STATUS_CODES

const localToday = () => {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
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

const normalizeQty = (value, fieldName) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be greater than 0`)
  }
  return parsed
}

const normalizeText = (value) => {
  if (value === undefined || value === null) return null
  const normalized = String(value).trim()
  return normalized === "" ? null : normalized
}

const normalizeDate = (value, fieldName) => {
  const normalized = normalizeText(value)
  if (!normalized) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} must be in YYYY-MM-DD format`)
  }
  return normalized
}

const isOverdue = (invoice, today) => {
  if (!invoice.DueDate) return false
  if (invoice.Status === INVOICE_STATUS.PAID || invoice.Status === INVOICE_STATUS.CANCELLED) {
    return false
  }
  return invoice.DueDate < today
}

const withOverdue = (invoice, today) => ({
  ...invoice,
  IsOverdue: isOverdue(invoice, today) ? 1 : 0,
})

// Creates the header with an allocated number and derived financials. Must run
// inside a transaction so the per-year counter read/write stays atomic.
const insertInvoiceHeader = ({
  invoiceDate,
  dueDate,
  sourceType,
  sourceId,
  customer,
  subtotal,
  discountTotal,
  taxLabel,
  taxAmount,
  total,
  amountPaid,
  notes,
  isCreditNote,
  creditNoteOf,
  createdBy,
}) => {
  const year = Number((invoiceDate || localToday()).slice(0, 4))
  const prefix = isCreditNote ? "CRN" : "INV"
  const invoiceNumber = invoiceCounterRepo.nextInvoiceNumber(year, prefix)
  const status = deriveStatus(total, amountPaid, isCreditNote)
  const balanceDue = round2(total - amountPaid)

  const sourceTypeId = getInvoiceSourceIdByCode(sourceType)
  if (!sourceTypeId) {
    throw new Error(`Unknown invoice source type: ${sourceType}`)
  }
  const statusId = getInvoiceStatusIdByCode(status)
  if (!statusId) {
    throw new Error(`Unknown invoice status: ${status}`)
  }

  return invoiceRepo.createInvoice({
    InvoiceNumber: invoiceNumber,
    InvoiceDate: invoiceDate || localToday(),
    DueDate: dueDate ?? null,
    SourceTypeId: sourceTypeId,
    SourceID: sourceId ?? null,
    CustomerID: customer?.CustomerID ?? null,
    WalkinCustomerID: customer?.WalkinCustomerID ?? null,
    CustomerName: customer?.CustomerName ?? null,
    CustomerAddress: customer?.CustomerAddress ?? null,
    CustomerPhone: customer?.CustomerPhone ?? null,
    CustomerVatNo: customer?.CustomerVatNo ?? null,
    Subtotal: round2(subtotal),
    DiscountTotal: round2(discountTotal),
    TaxLabel: taxLabel ?? null,
    TaxAmount: round2(taxAmount),
    Total: round2(total),
    AmountPaid: round2(amountPaid),
    BalanceDue: balanceDue,
    StatusId: statusId,
    IsCreditNote: isCreditNote ? 1 : 0,
    CreditNoteOf: creditNoteOf ?? null,
    Notes: notes ?? null,
    CreatedBy: createdBy ?? null,
  })
}

const buildTyreLineFromPortable = (line, index) => {
  const qty = normalizeQty(line?.Qty, `Qty on line ${index + 1}`)
  const unitPrice = normalizeNumber(line?.UnitPrice, `Unit price on line ${index + 1}`)
  const discount = normalizeNumber(line?.Discount, `Discount on line ${index + 1}`)
  const gross = unitPrice * qty
  const lineTotal = round2(gross * (1 - discount / 100.0))

  return {
    LineType: line?.TyreID ? "tyre" : "other",
    TyreID: line?.TyreID ?? null,
    SerialNo: normalizeText(line?.SerialNo),
    Description: normalizeText(line?.Description),
    Size: normalizeText(line?.Size),
    Pattern: normalizeText(line?.Pattern),
    Brand: normalizeText(line?.Brand),
    Qty: qty,
    UnitPrice: unitPrice,
    Discount: discount,
    LineTotal: lineTotal,
    Gross: gross,
    DiscountAmount: round2(gross - lineTotal),
  }
}

// ─────────────────────────────────────────────
// SOURCE: Sales Order
// ─────────────────────────────────────────────
const buildCustomerFromSO = (so) => {
  const customer = so?.Customer ?? {}
  let customerId = null
  let address = customer.CustomerAddress ?? null
  let phone = customer.CustomerPhone ?? null
  let vatNo = customer.VatNo ?? null

  if (!customer.IsWalkinCustomer && so?.CustomerCode) {
    const record = customerRepo.getCustomerByCode(so.CustomerCode)
    if (record) {
      customerId = record.CustomerID
      vatNo = record.VatNo ?? vatNo
      const addresses = customerRepo.getCustomerAddressesByCustomerId(record.CustomerID) || []
      if (addresses.length > 0) {
        const primary = addresses.find((a) => a.IsPrimary) || addresses[0]
        const parts = [
          primary.AddressLine1,
          primary.AddressLine2,
          primary.City,
          primary.State,
          primary.PostalCode,
        ].filter(Boolean)
        if (parts.length > 0) address = parts.join(", ")
      }
      const contacts = customerRepo.getCustomerContactsByCustomerId(record.CustomerID) || []
      if (contacts.length > 0) {
        const primary = contacts.find((c) => c.IsPrimary) || contacts[0]
        phone = primary.PhoneNumber ?? phone
      }
    }
  }

  return {
    CustomerID: customerId,
    WalkinCustomerID: null,
    CustomerName: customer.CustomerName ?? so?.CustomerName ?? null,
    CustomerAddress: address,
    CustomerPhone: phone,
    CustomerVatNo: vatNo,
  }
}

exports.generateInvoiceFromSO = (soId, ctx) => {
  const normalizedId = normalizeId(soId, "Sales order id")

  const existing = invoiceRepo.getInvoiceBySource(
    getInvoiceSourceIdByCode(SOURCE_TYPES.SO),
    normalizedId
  )
  if (existing) {
    return exports.getInvoiceById(existing.InvoiceID)
  }

  // If this SO already has delivery-level invoices, do not generate a duplicate whole-SO invoice.
  const deliveries = soDeliveryRepo.getDeliveriesBySoId(normalizedId) || []
  const hasDeliveryInvoice = deliveries.some((d) =>
    Boolean(
      invoiceRepo.getInvoiceBySource(
        getInvoiceSourceIdByCode(SOURCE_TYPES.DELIVERY),
        d.ID
      )
    )
  )
  if (hasDeliveryInvoice) {
    return null
  }

  const so = soService.getSOById(normalizedId)
  const isBattery = (so.Category || "tyre") === "battery"
  const items = isBattery
    ? (Array.isArray(so.Batteries) ? so.Batteries : [])
    : (Array.isArray(so.Tyres) ? so.Tyres : [])
  if (items.length === 0) {
    throw new Error(`Cannot invoice a sales order with no ${isBattery ? "battery" : "tyre"} lines`)
  }

  const customer = buildCustomerFromSO(so)
  const discountTotal = round2(so.TotalDiscount ?? 0)
  const netTotal = round2(so.TotalSale ?? 0)
  const subtotal = round2(netTotal + discountTotal)
  const amountPaid = round2(Math.max(0, netTotal - (so.RemainingAmount ?? 0)))
  const payments = Array.isArray(so.Payments) ? so.Payments : []

  const createTransaction = db.transaction(() => {
    const invoiceId = insertInvoiceHeader({
      invoiceDate: localToday(),
      dueDate: null,
      sourceType: SOURCE_TYPES.SO,
      sourceId: normalizedId,
      customer,
      subtotal,
      discountTotal,
      taxLabel: null,
      taxAmount: 0,
      total: netTotal,
      amountPaid,
      notes: null,
      isCreditNote: 0,
      creditNoteOf: null,
      createdBy: ctx?.user?.id ?? null,
    })

    if (isBattery) {
      items.forEach((battery) => {
        const desc = `${battery.Brand || ""} ${battery.Model || ""} (${battery.Capacity || ""} ${battery.Voltage || ""})`.trim()
        invoiceLineRepo.createInvoiceLine({
          InvoiceID: invoiceId,
          LineType: "battery",
          BatteryID: battery.BatteryID,
          SerialNo: null,
          Description: desc,
          Brand: battery.Brand,
          Model: battery.Model,
          Capacity: battery.Capacity,
          Voltage: battery.Voltage,
          Qty: battery.Qty,
          UnitPrice: battery.Price,
          Discount: battery.Discount ?? 0,
          LineTotal: round2(
            (battery.Price || 0) * (battery.Qty || 0) * (1 - (battery.Discount || 0) / 100.0)
          ),
        })
      })
    } else {
      items.forEach((tyre) => {
        invoiceLineRepo.createInvoiceLine({
          InvoiceID: invoiceId,
          LineType: "tyre",
          TyreID: tyre.TyreID,
          SerialNo: null,
          Description: null,
          Size: tyre.Size,
          Pattern: tyre.Pattern,
          Brand: tyre.Brand,
          Qty: tyre.Qty,
          UnitPrice: tyre.Price,
          Discount: tyre.Discount ?? 0,
          LineTotal: round2(
            (tyre.Price || 0) * (tyre.Qty || 0) * (1 - (tyre.Discount || 0) / 100.0)
          ),
        })
      })
    }

    payments.forEach((payment) => {
      if (payment?.PaymentID) {
        invoiceLinkRepo.createInvoicePaymentLink({
          InvoiceID: invoiceId,
          PaymentID: payment.PaymentID,
          AmountApplied: round2(payment.Amount ?? 0),
        })
      }
    })

    return invoiceId
  })

  const invoiceId = createTransaction()
  return exports.getInvoiceById(invoiceId)
}

// ─────────────────────────────────────────────
// SOURCE: Delivery
// ─────────────────────────────────────────────
/**
 * Calculates unallocated advance payments on the parent sales order and
 * allocates them to cover as much of this delivery invoice as possible.
 */
const allocateAdvancePaymentsForDelivery = (so, invoiceTotal) => {
  const allocations = []
  let remainingNeeded = round2(invoiceTotal)

  const payments = Array.isArray(so?.Payments) ? so.Payments : []
  for (const payment of payments) {
    if (remainingNeeded <= 0) break

    const isSettled =
      payment.PaymentTypeCode === PAYMENT_TYPE_CODES.CASH ||
      payment.PaymentTypeCode === PAYMENT_TYPE_CODES.BANK_TRANSFER ||
      (payment.PaymentTypeCode === PAYMENT_TYPE_CODES.CHEQUE && payment.Collected === 1)

    if (!isSettled) continue

    const paymentAmount = round2(payment.Amount || 0)
    if (paymentAmount <= 0) continue

    const links = invoiceLinkRepo.getLinksByPaymentId(payment.PaymentID) || []
    const alreadyApplied = links.reduce((sum, link) => {
      const inv = invoiceRepo.getInvoiceById(link.InvoiceID)
      if (inv && inv.StatusId !== getInvoiceStatusIdByCode(INVOICE_STATUS_CODES.CANCELLED)) {
        return sum + (Number(link.AmountApplied) || 0)
      }
      return sum
    }, 0)

    const unallocated = Math.max(0, round2(paymentAmount - alreadyApplied))
    if (unallocated <= 0) continue

    const toApply = round2(Math.min(unallocated, remainingNeeded))
    if (toApply > 0) {
      allocations.push({
        paymentId: payment.PaymentID,
        amountApplied: toApply,
      })
      remainingNeeded = round2(remainingNeeded - toApply)
    }
  }

  const initialAmountPaid = round2(invoiceTotal - remainingNeeded)
  return { allocations, initialAmountPaid }
}

/**
 * Invoices a single hand-over. The delivery source type + id pair makes this
 * idempotent: re-invoicing the same delivery returns the existing invoice.
 * Only the tyres handed over in that delivery are billed.
 * Automatically consumes unallocated advance payments on the parent sales order.
 */
exports.generateInvoiceFromDelivery = (deliveryId, ctx) => {
  const normalizedId = normalizeId(deliveryId, "DeliveryID")
  const delivery = soService.getDeliveryById(normalizedId)

  if (!delivery) {
    throw new Error("Delivery not found")
  }

  const existing = invoiceRepo.getInvoiceBySource(
    getInvoiceSourceIdByCode(SOURCE_TYPES.DELIVERY),
    normalizedId
  )
  if (existing) {
    return exports.getInvoiceById(existing.InvoiceID)
  }

  const so = soService.getSOById(delivery.SoID)
  if (!so) {
    throw new Error("Sales order not found")
  }

  const lines = Array.isArray(delivery.Lines) ? delivery.Lines : []
  if (lines.length === 0) {
    throw new Error("Delivery has no lines to invoice")
  }

  const customer = buildCustomerFromSO(so)
  const total = round2(lines.reduce((sum, line) => sum + (Number(line.Amount) || 0), 0))

  const { allocations: advanceAllocations, initialAmountPaid } =
    allocateAdvancePaymentsForDelivery(so, total)

  const createTransaction = db.transaction(() => {
    const invoiceId = insertInvoiceHeader({
      invoiceDate: delivery.DeliveryDate || localToday(),
      dueDate: null,
      sourceType: SOURCE_TYPES.DELIVERY,
      sourceId: delivery.ID,
      customer,
      subtotal: total,
      discountTotal: 0,
      taxLabel: null,
      taxAmount: 0,
      total,
      amountPaid: initialAmountPaid,
      notes: null,
      isCreditNote: 0,
      creditNoteOf: null,
      createdBy: ctx?.user?.id ?? null,
    })

    lines.forEach((line) => {
      const qty = Number(line.Qty) || 0
      const amount = round2(line.Amount ?? 0)
      const isBat = Boolean(line.BatteryID || line.SoBatteryID)

      if (isBat) {
        const desc = `${line.Brand || ""} ${line.Model || ""} (${line.Capacity || ""} ${line.Voltage || ""})`.trim()
        invoiceLineRepo.createInvoiceLine({
          InvoiceID: invoiceId,
          LineType: "battery",
          BatteryID: line.BatteryID ?? null,
          SerialNo: null,
          Description: desc,
          Brand: line.Brand,
          Model: line.Model,
          Capacity: line.Capacity,
          Voltage: line.Voltage,
          Qty: qty,
          UnitPrice: qty > 0 ? round2(amount / qty) : amount,
          Discount: 0,
          LineTotal: amount,
        })
      } else {
        invoiceLineRepo.createInvoiceLine({
          InvoiceID: invoiceId,
          LineType: "tyre",
          TyreID: line.TyreID ?? null,
          SerialNo: null,
          Description: null,
          Size: line.Size,
          Pattern: line.Pattern,
          Brand: line.Brand,
          Qty: qty,
          UnitPrice: qty > 0 ? round2(amount / qty) : amount,
          Discount: 0,
          LineTotal: amount,
        })
      }
    })

    advanceAllocations.forEach((alloc) => {
      invoiceLinkRepo.createInvoicePaymentLink({
        InvoiceID: invoiceId,
        PaymentID: alloc.paymentId,
        AmountApplied: alloc.amountApplied,
      })
    })

    return invoiceId
  })

  const invoiceId = createTransaction()
  return exports.getInvoiceById(invoiceId)
}

// ─────────────────────────────────────────────
// SOURCE: Other Service
// ─────────────────────────────────────────────
const buildCustomerFromOtherService = (os) => {
  let vatNo = null
  let address = null

  if (os?.CustomerID) {
    const record = customerRepo.getCustomerById(os.CustomerID)
    if (record) {
      vatNo = record.VatNo ?? null
    }
    const addresses = customerRepo.getCustomerAddressesByCustomerId(os.CustomerID) || []
    if (addresses.length > 0) {
      const primary = addresses.find((a) => a.IsPrimary) || addresses[0]
      address = [
        primary.AddressLine1,
        primary.AddressLine2,
        primary.City,
        primary.State,
        primary.PostalCode,
      ]
        .filter(Boolean)
        .join(", ") || null
    }
  }

  return {
    CustomerID: os?.CustomerID ?? null,
    WalkinCustomerID: null,
    CustomerName: os?.CustomerName ?? os?.AdHocCustomerName ?? null,
    CustomerAddress: address,
    CustomerPhone: os?.AdHocCustomerPhone ?? null,
    CustomerVatNo: vatNo,
  }
}

exports.generateInvoiceFromOtherService = (osId, ctx) => {
  const normalizedId = normalizeId(osId, "Other service id")

  const existing = invoiceRepo.getInvoiceBySource(
    getInvoiceSourceIdByCode(SOURCE_TYPES.OTHER_SERVICE),
    normalizedId
  )
  if (existing) {
    return exports.getInvoiceById(existing.InvoiceID)
  }

  const os = otherServiceService.getOtherServiceById(normalizedId)
  const consumables = Array.isArray(os.Consumables) ? os.Consumables : []
  if (consumables.length === 0) {
    throw new Error("Cannot invoice an other service with no lines")
  }

  const customer = buildCustomerFromOtherService(os)
  const subtotal = round2(os.TotalAmount ?? 0)
  const total = subtotal
  const amountPaid = round2(Math.max(0, total - (os.RemainingAmount ?? 0)))
  const payments = Array.isArray(os.Payments) ? os.Payments : []

  const createTransaction = db.transaction(() => {
    const invoiceId = insertInvoiceHeader({
      invoiceDate: localToday(),
      dueDate: null,
      sourceType: SOURCE_TYPES.OTHER_SERVICE,
      sourceId: normalizedId,
      customer,
      subtotal,
      discountTotal: 0,
      taxLabel: null,
      taxAmount: 0,
      total,
      amountPaid,
      notes: null,
      isCreditNote: 0,
      creditNoteOf: null,
      createdBy: ctx?.user?.id ?? null,
    })

    consumables.forEach((line) => {
      invoiceLineRepo.createInvoiceLine({
        InvoiceID: invoiceId,
        LineType: "consumable",
        TyreID: null,
        SerialNo: null,
        Description: line.ConsumableName ?? null,
        Size: null,
        Pattern: null,
        Brand: null,
        Qty: line.Qty,
        UnitPrice: line.Price,
        Discount: 0,
        LineTotal: round2((line.Price || 0) * (line.Qty || 0)),
      })
    })

    payments.forEach((payment) => {
      if (payment?.PaymentID) {
        invoiceLinkRepo.createInvoicePaymentLink({
          InvoiceID: invoiceId,
          PaymentID: payment.PaymentID,
          AmountApplied: round2(payment.Amount ?? 0),
        })
      }
    })

    return invoiceId
  })

  const invoiceId = createTransaction()
  return exports.getInvoiceById(invoiceId)
}

// ─────────────────────────────────────────────
// SOURCE: Direct / counter sale
// ─────────────────────────────────────────────
exports.createDirectInvoice = (payload = {}, ctx) => {
  const linesInput = Array.isArray(payload.Lines) ? payload.Lines : []
  if (linesInput.length === 0) {
    throw new Error("At least one invoice line is required")
  }

  const builtLines = linesInput.map((line, index) => buildTyreLineFromPortable(line, index))

  const subtotal = round2(builtLines.reduce((sum, line) => sum + line.Gross, 0))
  const discountTotal = round2(
    builtLines.reduce((sum, line) => sum + line.DiscountAmount, 0)
  )
  const net = round2(subtotal - discountTotal)
  const taxAmount = normalizeNumber(payload.TaxAmount, "Tax amount")
  const total = round2(net + taxAmount)
  const amountPaid = round2(normalizeNumber(payload.AmountPaid, "Amount paid"))

  const customer = {
    CustomerID: payload.CustomerID ? normalizeId(payload.CustomerID, "Customer id") : null,
    WalkinCustomerID: null,
    CustomerName: normalizeText(payload.CustomerName),
    CustomerAddress: normalizeText(payload.CustomerAddress),
    CustomerPhone: normalizeText(payload.CustomerPhone),
    CustomerVatNo: normalizeText(payload.CustomerVatNo),
  }

  const createTransaction = db.transaction(() => {
    const invoiceId = insertInvoiceHeader({
      invoiceDate: normalizeDate(payload.InvoiceDate, "Invoice date") || localToday(),
      dueDate: normalizeDate(payload.DueDate, "Due date"),
      sourceType: SOURCE_TYPES.DIRECT,
      sourceId: null,
      customer,
      subtotal,
      discountTotal,
      taxLabel: normalizeText(payload.TaxLabel),
      taxAmount,
      total,
      amountPaid,
      notes: normalizeText(payload.Notes),
      isCreditNote: 0,
      creditNoteOf: null,
      createdBy: ctx?.user?.id ?? null,
    })

    builtLines.forEach((line) => {
      invoiceLineRepo.createInvoiceLine({
        InvoiceID: invoiceId,
        LineType: line.LineType,
        TyreID: line.TyreID,
        SerialNo: line.SerialNo,
        Description: line.Description,
        Size: line.Size,
        Pattern: line.Pattern,
        Brand: line.Brand,
        Qty: line.Qty,
        UnitPrice: line.UnitPrice,
        Discount: line.Discount,
        LineTotal: line.LineTotal,
      })
    })

    return invoiceId
  })

  const invoiceId = createTransaction()
  return exports.getInvoiceById(invoiceId)
}

// ─────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────
exports.getInvoices = () => {
  const today = localToday()
  return invoiceRepo.getAllInvoices().map((invoice) => withOverdue(invoice, today))
}

exports.getOutstandingInvoices = () => {
  const today = localToday()
  const excludedStatusIds = [
    getInvoiceStatusIdByCode(INVOICE_STATUS.PAID),
    getInvoiceStatusIdByCode(INVOICE_STATUS.CANCELLED),
  ].filter((id) => id != null)
  return invoiceRepo.getOutstandingInvoices(excludedStatusIds).map((invoice) => withOverdue(invoice, today))
}

exports.getInvoiceById = (invoiceId) => {
  const normalizedId = normalizeId(invoiceId, "Invoice id")
  const invoice = invoiceRepo.getInvoiceById(normalizedId)

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  const today = localToday()
  const paymentLinks = invoiceLinkRepo.getLinksByInvoiceId(normalizedId)

  // Hydrate each linked generic Payment into the shape the payment cards show
  // (type, settled amount, cheque/bank references, receipts).
  const payments = paymentLinks
    .map((link) => {
      const summary = paymentProcessingService.getPaymentSummaryById(link.PaymentID)
      return summary ? { ...summary, AmountApplied: round2(link.AmountApplied ?? 0) } : null
    })
    .filter(Boolean)

  return {
    ...withOverdue(invoice, today),
    Lines: invoiceLineRepo.getInvoiceLinesByInvoiceId(normalizedId),
    PaymentLinks: paymentLinks,
    Payments: payments,
    CreditNotes: invoiceRepo.getCreditNotesByInvoiceId(normalizedId),
  }
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────
exports.updateInvoice = (invoiceId, payload = {}, ctx) => {
  const normalizedId = normalizeId(invoiceId, "Invoice id")
  const existing = invoiceRepo.getInvoiceById(normalizedId)
  if (!existing) {
    throw new Error("Invoice not found")
  }
  if (existing.Status === INVOICE_STATUS.CANCELLED) {
    throw new Error("Cannot edit a cancelled invoice")
  }

  const taxAmount = normalizeNumber(payload.TaxAmount, "Tax amount")
  const net = round2((existing.Subtotal ?? 0) - (existing.DiscountTotal ?? 0))
  const total = round2(net + taxAmount)
  const amountPaid = round2(existing.AmountPaid ?? 0)

  invoiceRepo.updateInvoiceMeta(normalizedId, {
    DueDate: normalizeDate(payload.DueDate, "Due date"),
    Notes: normalizeText(payload.Notes),
    TaxLabel: normalizeText(payload.TaxLabel),
    TaxAmount: taxAmount,
    Total: total,
  })

  invoiceRepo.updateInvoiceSettlement(normalizedId, {
    AmountPaid: amountPaid,
    BalanceDue: round2(total - amountPaid),
    StatusId: getInvoiceStatusIdByCode(deriveStatus(total, amountPaid, existing.IsCreditNote === 1)),
  })

  return exports.getInvoiceById(normalizedId)
}

exports.cancelInvoice = (invoiceId, payload = {}, ctx) => {
  const normalizedId = normalizeId(invoiceId, "Invoice id")
  const existing = invoiceRepo.getInvoiceById(normalizedId)
  if (!existing) {
    throw new Error("Invoice not found")
  }
  if (existing.Status === INVOICE_STATUS.CANCELLED) {
    return exports.getInvoiceById(normalizedId)
  }

  invoiceRepo.cancelInvoice(
    normalizedId,
    normalizeText(payload.Reason),
    getInvoiceStatusIdByCode(INVOICE_STATUS.CANCELLED)
  )
  return exports.getInvoiceById(normalizedId)
}

/**
 * Records a customer payment against an invoice. One generic Payment is
 * created per payment method, linked via InvoicePaymentLink, and the invoice
 * settlement (AmountPaid / BalanceDue / status) moves by the settled amount
 * (cheques only once collected). For SO- and delivery-sourced invoices the
 * payment is also linked to the parent sales order so both views of the
 * customer's balance stay in step.
 */
exports.recordPaymentForInvoice = (invoiceId, payload = {}, ctx) => {
  const normalizedId = normalizeId(invoiceId, "Invoice id")

  const createTransaction = db.transaction(() => {
    const invoice = invoiceRepo.getInvoiceById(normalizedId)
    if (!invoice) {
      throw new Error("Invoice not found")
    }
    if (invoice.IsCreditNote === 1) {
      throw new Error("Cannot record a payment against a credit note")
    }
    if (invoice.StatusId === getInvoiceStatusIdByCode(INVOICE_STATUS.CANCELLED)) {
      throw new Error("Cannot record a payment against a cancelled invoice")
    }
    if ((invoice.BalanceDue ?? 0) <= 0) {
      throw new Error("Invoice is already fully paid")
    }

    const normalizedPayment = paymentProcessingService.normalizePaymentPayload(payload.Payment)
    if (!normalizedPayment) {
      throw new Error("Payment payload is required")
    }

    // Payments on SO- and delivery-sourced invoices also count towards the
    // parent sales order's balance.
    let soId = null
    if (invoice.SourceTypeId === getInvoiceSourceIdByCode(SOURCE_TYPES.SO)) {
      soId = invoice.SourceID
    } else if (invoice.SourceTypeId === getInvoiceSourceIdByCode(SOURCE_TYPES.DELIVERY)) {
      const delivery = soService.getDeliveryById(invoice.SourceID)
      soId = delivery?.SoID ?? null
    }

    const createdPayments = paymentProcessingService.createPaymentsForPaymentData(
      normalizedPayment,
      (payment) => {
        invoiceLinkRepo.createInvoicePaymentLink({
          InvoiceID: normalizedId,
          PaymentID: payment.PaymentID,
          AmountApplied: round2(payment.Nominal),
        })
        if (soId) {
          soPaymentRepo.createSOPayment({
            SoID: soId,
            PaymentID: payment.PaymentID,
            IsAdvance: 0,
          })
        }
      }
    )

    const totalSettled = createdPayments.reduce((sum, payment) => sum + payment.Settled, 0)
    settleInvoicePayment(normalizedId, { settledDelta: totalSettled })

    if (soId) {
      soService.recomputeSoPaymentStatus(soId)
      // Invoice payments settle the parent SO too, so they can release a
      // gate pass that was withheld when the delivery was recorded.
      soService.tryIssuePendingGatePasses(soId, ctx)
    }

    return exports.getInvoiceById(normalizedId)
  })

  const updated = createTransaction()
  // ctx is the operator context from the IPC layer; reserved for future
  // invoice payment audit trails.
  void ctx
  return updated
}

// A credit note is a mirror document (positive amounts) flagged as a reversal,
// linked back to the original via CreditNoteOf. It keeps its own number so the
// money trail remains auditable.
exports.createCreditNote = (invoiceId, payload = {}, ctx) => {
  const normalizedId = normalizeId(invoiceId, "Invoice id")
  const original = invoiceRepo.getInvoiceById(normalizedId)
  if (!original) {
    throw new Error("Invoice not found")
  }
  if (original.IsCreditNote === 1) {
    throw new Error("Cannot raise a credit note against another credit note")
  }
  if (original.Status === INVOICE_STATUS.CANCELLED) {
    throw new Error("Cannot credit a cancelled invoice")
  }

  const lines = invoiceLineRepo.getInvoiceLinesByInvoiceId(normalizedId)
  if (lines.length === 0) {
    throw new Error("Cannot credit an invoice with no lines")
  }

  const createTransaction = db.transaction(() => {
    const creditNoteId = insertInvoiceHeader({
      invoiceDate: normalizeDate(payload.InvoiceDate, "Credit note date") || localToday(),
      dueDate: null,
      sourceType: original.SourceType,
      sourceId: original.SourceID,
      customer: {
        CustomerID: original.CustomerID,
        WalkinCustomerID: original.WalkinCustomerID,
        CustomerName: original.CustomerName,
        CustomerAddress: original.CustomerAddress,
        CustomerPhone: original.CustomerPhone,
        CustomerVatNo: original.CustomerVatNo,
      },
      subtotal: original.Subtotal,
      discountTotal: original.DiscountTotal,
      taxLabel: original.TaxLabel,
      taxAmount: original.TaxAmount,
      total: original.Total,
      amountPaid: 0,
      notes: normalizeText(payload.Notes),
      isCreditNote: 1,
      creditNoteOf: normalizedId,
      createdBy: ctx?.user?.id ?? null,
    })

    lines.forEach((line) => {
      invoiceLineRepo.createInvoiceLine({
        InvoiceID: creditNoteId,
        LineType: line.LineType,
        TyreID: line.TyreID,
        SerialNo: line.SerialNo,
        Description: line.Description,
        Size: line.Size,
        Pattern: line.Pattern,
        Brand: line.Brand,
        Qty: line.Qty,
        UnitPrice: line.UnitPrice,
        Discount: line.Discount,
        LineTotal: line.LineTotal,
      })
    })

    return creditNoteId
  })

  const creditNoteId = createTransaction()
  return exports.getInvoiceById(creditNoteId)
}

exports.SOURCE_TYPES = SOURCE_TYPES
exports.INVOICE_STATUS = INVOICE_STATUS
