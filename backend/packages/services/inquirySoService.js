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

  const existingInquiry = inquiryRepo.getInquiryById(normalizedInquiryId)
  if (!existingInquiry) {
    throw new Error("Inquiry not found")
  }

  const so = soRepo.getSOById(normalizedSoId)
  if (!so) {
    throw new Error("Sales order not found")
  }

  inquirySoRepo.linkInquiryToSo({
    InquiryID: normalizedInquiryId,
    SOID: normalizedSoId,
    CreatedBy: ctx && ctx.changedBy ? ctx.changedBy : null,
  })

  // Auto-cascade approval and completion if SO is already approved or completed
  if (so.IsAdminApproved === 1) {
    inquiryRepo.updateApprovalStatus(normalizedInquiryId, 1)
    inquiryRepo.approveAllTyresForInquiry(normalizedInquiryId)
    inquiryRepo.approveAllBatteriesForInquiry(normalizedInquiryId)
  }

  if (so.IsCompleted === 1) {
    inquiryRepo.updateCompletionStatus(normalizedInquiryId, 1)
    inquiryRepo.updateApprovalStatus(normalizedInquiryId, 1)
    inquiryRepo.approveAllTyresForInquiry(normalizedInquiryId)
    inquiryRepo.approveAllBatteriesForInquiry(normalizedInquiryId)
  }

  if (!existingInquiry.ConvertedSOID) {
    inquiryRepo.updateInquiry(normalizedInquiryId, {
      ...existingInquiry,
      ConvertedSOID: normalizedSoId,
      IsAdminApproved: so.IsAdminApproved === 1 ? 1 : existingInquiry.IsAdminApproved,
      IsCompleted: so.IsCompleted === 1 ? 1 : (existingInquiry.IsCompleted || 0),
    })
  }

  return inquirySoRepo.getLinkedSosByInquiryId(normalizedInquiryId)
}

exports.unlinkInquiryFromSo = (inquiryId, soId) => {
  const normalizedInquiryId = normalizeId(inquiryId, "InquiryID")
  const normalizedSoId = normalizeId(soId, "SOID")

  inquirySoRepo.unlinkInquiryFromSo(normalizedInquiryId, normalizedSoId)

  const existingInquiry = inquiryRepo.getInquiryById(normalizedInquiryId)
  if (existingInquiry) {
    const remainingLinkedSos = inquirySoRepo.getLinkedSosByInquiryId(normalizedInquiryId)
    const anyCompleted = remainingLinkedSos.some((s) => s.IsCompleted === 1)
    const nextCompleted = anyCompleted ? 1 : 0
    let nextConvertedSoId = existingInquiry.ConvertedSOID
    if (existingInquiry.ConvertedSOID === normalizedSoId) {
      nextConvertedSoId = remainingLinkedSos.length > 0 ? remainingLinkedSos[0].SoID : null
    }
    inquiryRepo.updateInquiry(normalizedInquiryId, {
      ...existingInquiry,
      ConvertedSOID: nextConvertedSoId,
      IsCompleted: nextCompleted,
    })
  }

  return inquirySoRepo.getLinkedSosByInquiryId(normalizedInquiryId)
}

exports.linkSoToInquiries = (soId, inquiryIds, ctx) => {
  const normalizedSoId = normalizeId(soId, "SOID")
  const ids = normalizeInquiryIds(inquiryIds)
  const changedBy = ctx && ctx.changedBy ? ctx.changedBy : null
  const so = soRepo.getSOById(normalizedSoId)

  const linkMany = db.transaction(() => {
    ids.forEach((inquiryId) => {
      const existingInquiry = inquiryRepo.getInquiryById(inquiryId)
      if (!existingInquiry) {
        throw new Error(`Inquiry #${inquiryId} not found`)
      }

      inquirySoRepo.linkInquiryToSo({
        InquiryID: inquiryId,
        SOID: normalizedSoId,
        CreatedBy: changedBy,
      })

      // Auto-cascade approval if the SO is approved or converted to SO
      if (so && so.IsAdminApproved === 1) {
        inquiryRepo.updateApprovalStatus(inquiryId, 1)
        inquiryRepo.approveAllTyresForInquiry(inquiryId)
        inquiryRepo.approveAllBatteriesForInquiry(inquiryId)
      }

      if (so && so.IsCompleted === 1) {
        inquiryRepo.updateCompletionStatus(inquiryId, 1)
        inquiryRepo.updateApprovalStatus(inquiryId, 1)
        inquiryRepo.approveAllTyresForInquiry(inquiryId)
        inquiryRepo.approveAllBatteriesForInquiry(inquiryId)
      }

      if (!existingInquiry.ConvertedSOID) {
        inquiryRepo.updateInquiry(inquiryId, {
          ...existingInquiry,
          ConvertedSOID: normalizedSoId,
          IsAdminApproved: so && so.IsAdminApproved === 1 ? 1 : existingInquiry.IsAdminApproved,
          IsCompleted: so && so.IsCompleted === 1 ? 1 : (existingInquiry.IsCompleted || 0),
        })
      }
    })
  })

  linkMany()

  return inquirySoRepo.getLinkedInquiriesBySoId(normalizedSoId)
}
