import type {
  OtherServicePayload,
  OtherServiceRecord,
  OtherServiceDetailedRecord,
  OtherServicePaymentPayload,
  CompleteChequePaymentResult,
  CompleteOtherServiceResult,
  MakeOSPaymentResult,
} from "../models/otherService"

export const otherServiceClient = {
  getAll(): Promise<OtherServiceRecord[]> {
    return window.api.otherServices.getOtherServices()
  },

  getById(id: number): Promise<OtherServiceDetailedRecord> {
    return window.api.otherServices.getOtherServiceById(id)
  },

  create(data: OtherServicePayload): Promise<OtherServiceRecord> {
    return window.api.otherServices.createOtherService(data)
  },

  update(id: number, data: OtherServicePayload): Promise<OtherServiceRecord> {
    return window.api.otherServices.updateOtherService(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.otherServices.deleteOtherService(id)
  },

  makeAPayment(
    osId: number,
    payload: OtherServicePaymentPayload
  ): Promise<MakeOSPaymentResult> {
    return window.api.otherServices.makeAPaymentForOS(osId, payload)
  },

  completeChequePayment(
    osId: number,
    paymentId: number
  ): Promise<CompleteChequePaymentResult> {
    return window.api.otherServices.completeChequePayment(osId, paymentId)
  },

  complete(osId: number): Promise<CompleteOtherServiceResult> {
    return window.api.otherServices.completeOtherService(osId)
  },
}
