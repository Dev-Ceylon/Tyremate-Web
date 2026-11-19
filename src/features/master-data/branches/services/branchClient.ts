import type { BranchPayload, BranchRecord } from "../models/branch"

export const branchClient = {
  suggest(field: string, query: string): Promise<string[]> {
    return window.api.branches.suggest(field, query)
  },

  getAll(): Promise<BranchRecord[]> {
    return window.api.branches.getBranches()
  },

  getById(id: number): Promise<BranchRecord> {
    return window.api.branches.getBranchById(id)
  },

  create(data: BranchPayload): Promise<BranchRecord> {
    return window.api.branches.createBranch(data)
  },

  update(id: number, data: BranchPayload): Promise<BranchRecord> {
    return window.api.branches.updateBranch(id, data)
  },

  remove(id: number): Promise<{ success: true }> {
    return window.api.branches.deleteBranch(id)
  },
}
