import type { LinkedSoRecord, SoLinkedInquiryRecord } from "../models/inquirySo"

export const inquirySoClient = {
  getByInquiryId(inquiryId: number): Promise<LinkedSoRecord[]> {
    return window.api.inquirySo.getByInquiryId(inquiryId)
  },

  getBySoId(soId: number): Promise<SoLinkedInquiryRecord[]> {
    return window.api.inquirySo.getBySoId(soId)
  },

  link(inquiryId: number, soId: number): Promise<LinkedSoRecord[]> {
    return window.api.inquirySo.link(inquiryId, soId)
  },

  unlink(inquiryId: number, soId: number): Promise<LinkedSoRecord[]> {
    return window.api.inquirySo.unlink(inquiryId, soId)
  },
}