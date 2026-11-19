import type { DAGGatePassPayload, DAGGatePassRecord } from "../models/dagGatePass"
import type { StatusRecord } from "../../../../shared/models/common/status"
import type { DagRecord } from "../../../dag/models/dag"

export const dagGatePassClient = {
  getAll(): Promise<DAGGatePassRecord[]> {
    return window.api.dagGatePass.getDAGGatePasses()
  },

  getById(id: number): Promise<DAGGatePassRecord> {
    return window.api.dagGatePass.getDAGGatePassById(id)
  },

  getByDAGId(dagId: number): Promise<DAGGatePassRecord> {
    return window.api.dagGatePass.getDAGGatePassByDAGId(dagId)
  },

  create(data: DAGGatePassPayload): Promise<DAGGatePassRecord> {
    return window.api.dagGatePass.createDAGGatePass(data)
  },

  update(id: number, data: DAGGatePassPayload): Promise<DAGGatePassRecord> {
    return window.api.dagGatePass.updateDAGGatePass(id, data)
  },

  remove(id: number): Promise<{ success: boolean }> {
    return window.api.dagGatePass.deleteDAGGatePass(id)
  },

  // Status methods
  getStatuses(): Promise<StatusRecord[]> {
    return window.api.statuses.getStatuses()
  },

  getStatusById(id: number): Promise<StatusRecord> {
    return window.api.statuses.getStatusById(id)
  },

  getStatusByCode(statusCode: string): Promise<StatusRecord> {
    return window.api.statuses.getStatusByCode(statusCode)
  },

  // DAG Status update method
  updateDAGStatus(id: number, statusCode: string): Promise<DagRecord> {
    return window.api.dag.updateDAGStatus(id, statusCode)
  },

  // Marks the DAG as arrived, returning its tyres to the branch quarantine.
  markDAGArrived(id: number): Promise<DagRecord> {
    return window.api.dag.markDAGArrived(id)
  },
}
