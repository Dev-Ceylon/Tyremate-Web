import type {
  ActiveTargetsMap,
  SalesRepUser,
  SalesTargetFilter,
  SalesTargetPayload,
  SalesTargetRecord,
  SalesTargetUpdatePayload,
} from "../models/salesTarget"

export const salesTargetClient = {
  getAll(filter?: SalesTargetFilter): Promise<SalesTargetRecord[]> {
    return window.api.salesTarget.getAll(filter)
  },

  getById(id: number): Promise<SalesTargetRecord> {
    return window.api.salesTarget.getById(id)
  },

  getMyActiveTargets(): Promise<ActiveTargetsMap> {
    return window.api.salesTarget.getMyActiveTargets()
  },

  create(payload: SalesTargetPayload): Promise<SalesTargetRecord> {
    return window.api.salesTarget.create(payload)
  },

  update(id: number, payload: SalesTargetUpdatePayload): Promise<SalesTargetRecord> {
    return window.api.salesTarget.update(id, payload)
  },

  delete(id: number): Promise<{ success: boolean; message?: string }> {
    return window.api.salesTarget.delete(id)
  },

  getSalesReps(): Promise<SalesRepUser[]> {
    return window.api.salesTarget.getSalesReps()
  },
}
