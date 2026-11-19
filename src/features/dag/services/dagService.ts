import type {
  CreateDagWithTyresPayload,
  DagContractorApprovalStatus,
  DagContractorAssignmentPayload,
  DagPayload,
  SellDagTyresPayload,
} from "../models/dag"
import type { DagPaymentPayload } from "../models/payment"
import { dagClient } from "./dagClient"

export const dagService = {
  getDAGs() {
    return dagClient.getAll()
  },

  getDAGById(id: number) {
    return dagClient.getById(id)
  },

  getDetailedDAGById(id: number) {
    return dagClient.getDetailedById(id)
  },

  createDAG(data: DagPayload) {
    return dagClient.create(data)
  },

  createDAGWithTyres(data: CreateDagWithTyresPayload) {
    return dagClient.createWithTyres(data)
  },

  processPayments(id: number, payments: DagPaymentPayload) {
    return dagClient.processPayments(id, payments)
  },

  sellTyres(id: number, payload: SellDagTyresPayload) {
    return dagClient.sellTyres(id, payload)
  },

  updateDAG(id: number, data: DagPayload) {
    return dagClient.update(id, data)
  },

  updateDAGTyreSerialCost(id: number, cost: number | null) {
    return dagClient.updateDAGTyreSerialCost(id, cost)
  },

  deleteDAG(id: number) {
    return dagClient.remove(id)
  },

  issueGatePass(id: number) {
    return dagClient.issueGatePass(id)
  },

  updateDAGStatus(id: number, statusCode: string) {
    return dagClient.updateDAGStatus(id, statusCode)
  },

  markDAGArrived(id: number) {
    return dagClient.markDAGArrived(id)
  },

  markDAGArriving(id: number, deliveryDate: string) {
    return dagClient.markDAGArriving(id, deliveryDate)
  },

  updateDAGDeliveryDate(id: number, deliveryDate: string) {
    return dagClient.updateDAGDeliveryDate(id, deliveryDate)
  },

  assignContractor(id: number, payload: DagContractorAssignmentPayload) {
    return dagClient.assignContractor(id, payload)
  },

  updateContractorApproval(approvalId: number, approvalStatus: DagContractorApprovalStatus) {
    return dagClient.updateContractorApproval(approvalId, approvalStatus)
  },

  getContractorApprovals(id: number) {
    return dagClient.getContractorApprovals(id)
  },

  completeChequePayment(id: number, paymentId: number) {
    return dagClient.completeChequePayment(id, paymentId)
  },
}
