import { inquirySoClient } from "./inquirySoClient"
import type { LinkedSoRecord, SoLinkedInquiryRecord } from "../models/inquirySo"

export const inquirySoService = {
  getLinkedSosByInquiryId(inquiryId: number) {
    return inquirySoClient.getByInquiryId(inquiryId)
  },

  getLinkedInquiriesBySoId(soId: number) {
    return inquirySoClient.getBySoId(soId)
  },

  linkSo(inquiryId: number, soId: number) {
    return inquirySoClient.link(inquiryId, soId)
  },

  unlinkSo(inquiryId: number, soId: number) {
    return inquirySoClient.unlink(inquiryId, soId)
  },
}

export type { LinkedSoRecord }
export type { SoLinkedInquiryRecord }