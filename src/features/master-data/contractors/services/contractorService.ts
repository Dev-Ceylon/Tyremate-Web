import type { ContractorPayload } from "../models/contractor"
import { contractorClient } from "./contractorClient"

export const contractorService = {
  suggest(field: string, query: string) {
    return contractorClient.suggest(field, query)
  },

  getContractors() {
    return contractorClient.getAll()
  },

  getContractorById(contractorId: number) {
    return contractorClient.getById(contractorId)
  },

  createContractor(data: ContractorPayload) {
    return contractorClient.create(data)
  },

  updateContractor(contractorId: number, data: ContractorPayload) {
    return contractorClient.update(contractorId, data)
  },

  deleteContractor(contractorId: number) {
    return contractorClient.remove(contractorId)
  },
}
