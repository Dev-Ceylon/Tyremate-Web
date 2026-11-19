import type { BranchPayload } from "../models/branch"
import { branchClient } from "./branchClient"

export const branchService = {
  suggest(field: string, query: string) {
    return branchClient.suggest(field, query)
  },

  getBranches() {
    return branchClient.getAll()
  },

  getBranchById(id: number) {
    return branchClient.getById(id)
  },

  createBranch(data: BranchPayload) {
    return branchClient.create(data)
  },

  updateBranch(id: number, data: BranchPayload) {
    return branchClient.update(id, data)
  },

  deleteBranch(id: number) {
    return branchClient.remove(id)
  },
}
