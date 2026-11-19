const db = require("../database/connection")
const inquirySoRepo = require("../repositories/inquirySoRepository")
const inquiryRepo = require("../repositories/inquiryRepository")
const soRepo = require("../repositories/soRepository")

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

exports.getLinkedSosByInquiryId = (inquiryId) => {
  return inquirySoRepo.getLinkedSosByInquiryId(normalizeId(inquiryId, "InquiryID"))
}

exports.getLinkedInquiriesBySoId = (soId) => {
  return inquirySoRepo.getLinkedInquiriesBySoId(normalizeId(soId, "SOID"))
}

exports.linkInquiryToSo = (inquiryId, soId, ctx) => {
  const normalizedInquiryId = normalizeId(inquiryId, "InquiryID")
  const normalizedSoId = normalizeId(soId, "SOID")

  if (!inquiryRepo.getInquiryById(normalizedInquiryId)) {
    throw new Error("Inquiry not found")
  }

  if (!soRepo.getSOById(normalizedSoId)) {
    throw new Error("Sales order not found")
  }

  inquirySoRepo.linkInquiryToSo({
    InquiryID: normalizedInquiryId,
    SOID: normalizedSoId,
    CreatedBy: ctx && ctx.changedBy ? ctx.changedBy : null,
  })

  return inquirySoRepo.getLinkedSosByInquiryId(normalizedInquiryId)
}

exports.unlinkInquiryFromSo = (inquiryId, soId) => {
  const normalizedInquiryId = normalizeId(inquiryId, "InquiryID")
  const normalizedSoId = normalizeId(soId, "SOID")

  inquirySoRepo.unlinkInquiryFromSo(normalizedInquiryId, normalizedSoId)

  return inquirySoRepo.getLinkedSosByInquiryId(normalizedInquiryId)
}

exports.linkSoToInquiries = (soId, inquiryIds, ctx) => {
  const normalizedSoId = normalizeId(soId, "SOID")
  const ids = normalizeInquiryIds(inquiryIds)
  const changedBy = ctx && ctx.changedBy ? ctx.changedBy : null

  const linkMany = db.transaction(() => {
    ids.forEach((inquiryId) => {
      if (!inquiryRepo.getInquiryById(inquiryId)) {
        throw new Error(`Inquiry #${inquiryId} not found`)
      }

      inquirySoRepo.linkInquiryToSo({
        InquiryID: inquiryId,
        SOID: normalizedSoId,
        CreatedBy: changedBy,
      })
    })
  })

  linkMany()

  return inquirySoRepo.getLinkedInquiriesBySoId(normalizedSoId)
}
