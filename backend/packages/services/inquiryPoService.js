const db = require("../database/connection")
const inquiryPoRepo = require("../repositories/inquiryPoRepository")
const inquiryRepo = require("../repositories/inquiryRepository")
const poRepo = require("../repositories/poRepository")

const normalizeId = (value, fieldName) => {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a valid positive integer`)
  }

  return parsed
}

const normalizeInquiryIds = (inquiryIds) => {
  const raw = Array.isArray(inquiryIds) ? inquiryIds : [inquiryIds]
  const ids = raw
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => normalizeId(value, "InquiryID"))

  return [...new Set(ids)]
}

exports.getLinkedPosByInquiryId = (inquiryId) => {
  return inquiryPoRepo.getLinkedPosByInquiryId(normalizeId(inquiryId, "InquiryID"))
}

exports.getLinkedInquiriesByPoId = (poId) => {
  return inquiryPoRepo.getLinkedInquiriesByPoId(normalizeId(poId, "POID"))
}

exports.linkInquiryToPo = (inquiryId, poId, ctx) => {
  const normalizedInquiryId = normalizeId(inquiryId, "InquiryID")
  const normalizedPoId = normalizeId(poId, "POID")

  if (!inquiryRepo.getInquiryById(normalizedInquiryId)) {
    throw new Error("Inquiry not found")
  }

  if (!poRepo.getPOById(normalizedPoId)) {
    throw new Error("Purchase order not found")
  }

  inquiryPoRepo.linkInquiryToPo({
    InquiryID: normalizedInquiryId,
    POID: normalizedPoId,
    CreatedBy: ctx && ctx.changedBy ? ctx.changedBy : null,
  })

  return inquiryPoRepo.getLinkedPosByInquiryId(normalizedInquiryId)
}

exports.unlinkInquiryFromPo = (inquiryId, poId) => {
  const normalizedInquiryId = normalizeId(inquiryId, "InquiryID")
  const normalizedPoId = normalizeId(poId, "POID")

  inquiryPoRepo.unlinkInquiryFromPo(normalizedInquiryId, normalizedPoId)

  return inquiryPoRepo.getLinkedPosByInquiryId(normalizedInquiryId)
}

// Used when a PO is created with one or more inquiry references so the links
// are written in the same transaction as the PO.
exports.linkPoToInquiries = (poId, inquiryIds, ctx) => {
  const normalizedPoId = normalizeId(poId, "POID")
  const ids = normalizeInquiryIds(inquiryIds)
  const changedBy = ctx && ctx.changedBy ? ctx.changedBy : null

  const linkMany = db.transaction(() => {
    ids.forEach((inquiryId) => {
      if (!inquiryRepo.getInquiryById(inquiryId)) {
        throw new Error(`Inquiry #${inquiryId} not found`)
      }

      inquiryPoRepo.linkInquiryToPo({
        InquiryID: inquiryId,
        POID: normalizedPoId,
        CreatedBy: changedBy,
      })
    })
  })

  linkMany()

  return inquiryPoRepo.getLinkedInquiriesByPoId(normalizedPoId)
}
