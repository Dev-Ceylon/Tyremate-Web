import type { DAGGatePassPayload } from "../models/dagGatePass"
import { dagGatePassClient } from "./dagGatePassClient"

export const dagGatePassService = {
  getDAGGatePasses() {
    return dagGatePassClient.getAll()
  },

  getDAGGatePassById(id: number) {
    return dagGatePassClient.getById(id)
  },

  getDAGGatePassByDAGId(dagId: number) {
    return dagGatePassClient.getByDAGId(dagId)
  },

  createDAGGatePass(data: DAGGatePassPayload) {
    return dagGatePassClient.create(data)
  },

  updateDAGGatePass(id: number, data: DAGGatePassPayload) {
    return dagGatePassClient.update(id, data)
  },

  deleteDAGGatePass(id: number) {
    return dagGatePassClient.remove(id)
  },

  updateDAGStatus(id: number, statusCode: string) {
    return dagGatePassClient.updateDAGStatus(id, statusCode)
  },

  markDAGArrived(id: number) {
    return dagGatePassClient.markDAGArrived(id)
  },
}
