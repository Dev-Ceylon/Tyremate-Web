import type {
  OtherServicePayload,
  OtherServiceRecord,
  OtherServiceDetailedRecord,
  OtherServicePaymentPayload,
  CompleteChequePaymentResult,
  CompleteOtherServiceResult,
  MakeOSPaymentResult,
} from "../models/otherService"
import { otherServiceClient } from "./otherServiceClient"

export const otherServiceService = {
  getAll(): Promise<OtherServiceRecord[]> {
    return otherServiceClient.getAll()
  },

  getById(id: number): Promise<OtherServiceDetailedRecord> {
    return otherServiceClient.getById(id)
  },

  create(data: OtherServicePayload): Promise<OtherServiceRecord> {
    return otherServiceClient.create(data)
  },

  update(id: number, data: OtherServicePayload): Promise<OtherServiceRecord> {
    return otherServiceClient.update(id, data)
  },

  delete(id: number): Promise<{ success: true }> {
    return otherServiceClient.remove(id)
  },

  makeAPayment(
    osId: number,
    payload: OtherServicePaymentPayload
  ): Promise<MakeOSPaymentResult> {
    return otherServiceClient.makeAPayment(osId, payload)
  },

  completeChequePayment(
    osId: number,
    paymentId: number
  ): Promise<CompleteChequePaymentResult> {
    return otherServiceClient.completeChequePayment(osId, paymentId)
  },

  complete(osId: number): Promise<CompleteOtherServiceResult> {
    return otherServiceClient.complete(osId)
  },
}
