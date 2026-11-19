import type {
  CreateDagWithTyresPayload,
  CreateDagWithTyresResult,
  DagContractorApprovalRecord,
  DagContractorApprovalStatus,
  DagContractorAssignmentPayload,
  DagDetailedRecord,
  DagPayload,
  DagRecord,
  SellDagTyresPayload,
  SellDagTyresResult,
  UpdateDagTyreSerialCostResult,
  CompleteDagChequePaymentResult,
} from "../models/dag"
import type { DagPaymentPayload } from "../models/payment"

export const dagClient = {
  getAll(): Promise<DagRecord[]> {
    return window.api.dag.getDAGs()
  },

  getById(id: number): Promise<DagRecord> {
    return window.api.dag.getDAGById(id)
  },

  getDetailedById(id: number): Promise<DagDetailedRecord> {
    return window.api.dag.getDetailedDAGById(id)
  },

  create(data: DagPayload): Promise<DagRecord> {
    return window.api.dag.createDAG(data)
  },

  createWithTyres(data: CreateDagWithTyresPayload): Promise<CreateDagWithTyresResult> {
    return window.api.dag.createDAGWithTyres(data)
  },

  processPayments(id: number, payments: DagPaymentPayload): Promise<void> {
    return window.api.dag.processPayments(id, payments)
  },

  sellTyres(id: number, payload: SellDagTyresPayload): Promise<SellDagTyresResult> {
    return window.api.dag.sellTyres(id, payload)
  },

  update(id: number, data: DagPayload): Promise<DagRecord> {
    return window.api.dag.updateDAG(id, data)
  },

  updateDAGTyreSerialCost(id: number, cost: number | null): Promise<UpdateDagTyreSerialCostResult> {
    return window.api.dag.updateDAGTyreSerialCost(id, cost)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.dag.deleteDAG(id)
  },

  issueGatePass(id: number): Promise<DagRecord> {
    return window.api.dag.issueGatePass(id)
  },

  updateDAGStatus(id: number, statusCode: string): Promise<DagRecord> {
    return window.api.dag.updateDAGStatus(id, statusCode)
  },

  markDAGArrived(id: number): Promise<DagRecord> {
    return window.api.dag.markDAGArrived(id)
  },

  markDAGArriving(id: number, deliveryDate: string): Promise<DagRecord> {
    return window.api.dag.markDAGArriving(id, deliveryDate)
  },

  updateDAGDeliveryDate(id: number, deliveryDate: string): Promise<DagRecord> {
    return window.api.dag.updateDAGDeliveryDate(id, deliveryDate)
  },

  assignContractor(id: number, payload: DagContractorAssignmentPayload): Promise<DagContractorApprovalRecord> {
    return window.api.dag.assignContractor(id, payload)
  },

  updateContractorApproval(approvalId: number, approvalStatus: DagContractorApprovalStatus): Promise<DagContractorApprovalRecord> {
    return window.api.dag.updateContractorApproval(approvalId, approvalStatus)
  },

  getContractorApprovals(id: number): Promise<DagContractorApprovalRecord[]> {
    return window.api.dag.getContractorApprovals(id)
  },

  completeChequePayment(id: number, paymentId: number): Promise<CompleteDagChequePaymentResult> {
    return window.api.dag.completeChequePayment(id, paymentId)
  },
}
